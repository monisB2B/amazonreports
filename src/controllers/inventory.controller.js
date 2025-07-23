const reportService = require('../services/report.service');
const dateUtils = require('../utils/date-utils');
const logger = require('../utils/logger');

class InventoryController {
  async getInventoryReport(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get inventory report
      const inventoryReport = await reportService.getInventoryReport(dateRange.startDate, dateRange.endDate);
      
      return res.status(200).json({
        success: true,
        report: inventoryReport
      });
    } catch (error) {
      logger.error('Error getting inventory report', error);
      return res.status(500).json({
        error: 'Failed to get inventory report',
        message: error.message
      });
    }
  }

  async getInventorySummary(req, res) {
    try {
      // Get inventory report
      const inventoryReport = await reportService.getInventoryReport();
      const summary = inventoryReport.summary;
      
      return res.status(200).json({
        success: true,
        summary
      });
    } catch (error) {
      logger.error('Error getting inventory summary', error);
      return res.status(500).json({
        error: 'Failed to get inventory summary',
        message: error.message
      });
    }
  }

  async getLowStockItems(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 5;
      
      // Get inventory report
      const inventoryReport = await reportService.getInventoryReport();
      const lowStockItems = inventoryReport.data
        .filter(item => parseInt(item['Quantity Available'] || 0) <= threshold)
        .map(item => ({
          sku: item.SKU,
          asin: item.ASIN,
          title: item['product-name'],
          quantity: parseInt(item['Quantity Available'] || 0),
          price: parseFloat(item['Your Price'] || 0)
        }));
      
      return res.status(200).json({
        success: true,
        lowStockItems,
        threshold
      });
    } catch (error) {
      logger.error('Error getting low stock items', error);
      return res.status(500).json({
        error: 'Failed to get low stock items',
        message: error.message
      });
    }
  }
}

module.exports = new InventoryController();
