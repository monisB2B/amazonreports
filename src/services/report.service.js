const AmazonApiService = require('./amazon-api.service');
const config = require('../config/app-config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const moment = require('moment');

const amazonApiService = new AmazonApiService();

class ReportService {
  constructor() {
    this.reportsDirectory = path.join(__dirname, '../../reports');
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportsDirectory)) {
      fs.mkdirSync(this.reportsDirectory, { recursive: true });
    }
  }

  async generateReport(reportType, startDate = config.dateRanges.startDate, endDate = config.dateRanges.endDate) {
    try {
      logger.info(`Initiating ${reportType} report generation from ${startDate} to ${endDate}`);
      
      // Step 1: Create the report request
      const reportResponse = await amazonApiService.createReport(reportType, startDate, endDate);
      const reportId = reportResponse.reportId;
      
      // Step 2: Wait for the report to be completed
      let report = await this.waitForReportCompletion(reportId);
      
      // Step 3: Get the report document
      const reportDocumentId = report.reportDocumentId;
      const reportDocument = await amazonApiService.getReportDocument(reportDocumentId);
      
      // Step 4: Download the report document
      const reportData = await amazonApiService.downloadReportDocument(reportDocument.url);
      
      // Step 5: Save the report locally
      const filename = `${reportType}_${startDate}_to_${endDate}_${Date.now()}.csv`;
      const filePath = path.join(this.reportsDirectory, filename);
      
      fs.writeFileSync(filePath, reportData);
      
      logger.info(`Report ${reportType} saved to ${filePath}`);
      
      return {
        reportId,
        reportType,
        startDate,
        endDate,
        filePath,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to generate report ${reportType}`, error);
      throw error;
    }
  }

  async waitForReportCompletion(reportId, maxAttempts = 30, delaySeconds = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const report = await amazonApiService.getReport(reportId);
      
      if (report.processingStatus === 'DONE') {
        return report;
      } else if (report.processingStatus === 'CANCELLED' || report.processingStatus === 'FATAL') {
        throw new Error(`Report generation failed with status: ${report.processingStatus}`);
      }
      
      logger.info(`Report ${reportId} still processing. Status: ${report.processingStatus}. Attempt: ${attempt + 1}/${maxAttempts}`);
      
      // Wait before the next attempt
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }
    
    throw new Error(`Report generation timed out after ${maxAttempts} attempts`);
  }

  async parseReportFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async generateAllReports(startDate, endDate) {
    const reports = [];
    const reportTypes = Object.keys(config.reportTypes);
    
    for (const reportType of reportTypes) {
      try {
        const report = await this.generateReport(reportType, startDate, endDate);
        reports.push(report);
      } catch (error) {
        logger.error(`Failed to generate report ${reportType}`, error);
        // Continue with other reports
      }
    }
    
    return reports;
  }

  async getInventoryReport(startDate, endDate) {
    try {
      const report = await this.generateReport('GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA', startDate, endDate);
      const parsedData = await this.parseReportFile(report.filePath);
      
      return {
        ...report,
        data: parsedData,
        summary: this.calculateInventorySummary(parsedData)
      };
    } catch (error) {
      logger.error('Failed to get inventory report', error);
      throw error;
    }
  }

  calculateInventorySummary(inventoryData) {
    // Calculate inventory summary metrics
    let totalUnits = 0;
    let totalValue = 0;
    const skuCount = new Set();
    const asinCount = new Set();
    
    for (const item of inventoryData) {
      const units = parseInt(item['Quantity Available'] || 0);
      const price = parseFloat(item['Your Price'] || 0);
      
      totalUnits += units;
      totalValue += units * price;
      
      if (item.SKU) skuCount.add(item.SKU);
      if (item.ASIN) asinCount.add(item.ASIN);
    }
    
    return {
      totalUnits,
      totalValue: totalValue.toFixed(2),
      uniqueSkus: skuCount.size,
      uniqueAsins: asinCount.size
    };
  }

  async getSalesReport(startDate, endDate) {
    try {
      const report = await this.generateReport('GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL', startDate, endDate);
      const parsedData = await this.parseReportFile(report.filePath);
      
      return {
        ...report,
        data: parsedData,
        summary: this.calculateSalesSummary(parsedData)
      };
    } catch (error) {
      logger.error('Failed to get sales report', error);
      throw error;
    }
  }

  calculateSalesSummary(salesData) {
    let totalOrders = salesData.length;
    let totalRevenue = 0;
    let totalUnits = 0;
    const ordersByDate = {};
    const productSales = {};
    
    for (const order of salesData) {
      const price = parseFloat(order['item-price'] || 0);
      const quantity = parseInt(order['quantity-purchased'] || 1);
      const date = moment(order['purchase-date']).format('YYYY-MM-DD');
      const sku = order['seller-sku'];
      
      totalRevenue += price * quantity;
      totalUnits += quantity;
      
      // Group by date
      if (!ordersByDate[date]) {
        ordersByDate[date] = {
          orders: 0,
          units: 0,
          revenue: 0
        };
      }
      
      ordersByDate[date].orders++;
      ordersByDate[date].units += quantity;
      ordersByDate[date].revenue += price * quantity;
      
      // Group by product
      if (!productSales[sku]) {
        productSales[sku] = {
          sku,
          title: order['product-name'],
          units: 0,
          revenue: 0
        };
      }
      
      productSales[sku].units += quantity;
      productSales[sku].revenue += price * quantity;
    }
    
    // Convert to arrays for easier frontend processing
    const dailySales = Object.keys(ordersByDate).map(date => ({
      date,
      ...ordersByDate[date]
    }));
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      totalOrders,
      totalUnits,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: totalOrders ? (totalRevenue / totalOrders).toFixed(2) : '0.00',
      dailySales,
      topProducts
    };
  }

  async getReturnsAndReimbursements(startDate, endDate) {
    try {
      const returnsReport = await this.generateReport('GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA', startDate, endDate);
      const parsedReturns = await this.parseReportFile(returnsReport.filePath);
      
      // Also get financial events for reimbursements
      const financialEvents = await amazonApiService.getFinancialEvents(startDate, endDate);
      
      return {
        ...returnsReport,
        data: parsedReturns,
        financialEvents,
        summary: this.calculateReturnsSummary(parsedReturns, financialEvents)
      };
    } catch (error) {
      logger.error('Failed to get returns and reimbursements report', error);
      throw error;
    }
  }

  calculateReturnsSummary(returnsData, financialEvents) {
    let totalReturns = returnsData.length;
    let totalReturnValue = 0;
    let totalReimbursements = 0;
    let totalReimbursementValue = 0;
    
    // Calculate returns value
    for (const item of returnsData) {
      const price = parseFloat(item['item-price'] || 0);
      totalReturnValue += price;
    }
    
    // Count reimbursements from financial events
    if (financialEvents.FinancialEvents && financialEvents.FinancialEvents.ShipmentEventList) {
      for (const event of financialEvents.FinancialEvents.ShipmentEventList) {
        if (event.ShipmentItemAdjustmentList) {
          for (const adjustment of event.ShipmentItemAdjustmentList) {
            if (adjustment.ItemChargeAdjustmentList) {
              for (const charge of adjustment.ItemChargeAdjustmentList) {
                if (charge.ChargeType === 'Reimbursement') {
                  totalReimbursements++;
                  totalReimbursementValue += parseFloat(charge.ChargeAmount.CurrencyAmount || 0);
                }
              }
            }
          }
        }
      }
    }
    
    return {
      totalReturns,
      totalReturnValue: totalReturnValue.toFixed(2),
      totalReimbursements,
      totalReimbursementValue: totalReimbursementValue.toFixed(2),
      netLoss: (totalReturnValue - totalReimbursementValue).toFixed(2)
    };
  }

  async getProfitAndLoss(startDate, endDate) {
    try {
      // Get settlement reports
      const settlementReport = await this.generateReport('GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2', startDate, endDate);
      const parsedSettlements = await this.parseReportFile(settlementReport.filePath);
      
      return {
        ...settlementReport,
        data: parsedSettlements,
        summary: this.calculateProfitAndLoss(parsedSettlements)
      };
    } catch (error) {
      logger.error('Failed to get profit and loss report', error);
      throw error;
    }
  }

  calculateProfitAndLoss(settlementData) {
    let totalRevenue = 0;
    let totalFees = 0;
    let totalRefunds = 0;
    let totalOtherTransactions = 0;
    
    // Transaction type mapping
    const transactionTypes = {
      'Order': 'revenue',
      'Refund': 'refund',
      'FBA Inventory Fee': 'fee',
      'Service Fee': 'fee',
      'Adjustment': 'other',
      'Transfer': 'other'
    };
    
    const categorySummary = {
      revenue: 0,
      refund: 0,
      fee: 0,
      other: 0
    };
    
    for (const transaction of settlementData) {
      const amount = parseFloat(transaction['amount'] || 0);
      const type = transaction['transaction-type'] || '';
      const category = transactionTypes[type] || 'other';
      
      categorySummary[category] += amount;
      
      if (category === 'revenue') {
        totalRevenue += amount;
      } else if (category === 'fee') {
        totalFees += amount;
      } else if (category === 'refund') {
        totalRefunds += amount;
      } else {
        totalOtherTransactions += amount;
      }
    }
    
    const netProfit = totalRevenue - totalFees - totalRefunds + totalOtherTransactions;
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalFees: totalFees.toFixed(2),
      totalRefunds: totalRefunds.toFixed(2),
      totalOtherTransactions: totalOtherTransactions.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) + '%' : '0.00%',
      categorySummary
    };
  }
}

module.exports = new ReportService();
