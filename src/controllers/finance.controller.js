const reportService = require('../services/report.service');
const dateUtils = require('../utils/date-utils');
const logger = require('../utils/logger');

class FinanceController {
  async getProfitAndLoss(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get profit and loss report
      const plReport = await reportService.getProfitAndLoss(dateRange.startDate, dateRange.endDate);
      
      return res.status(200).json({
        success: true,
        report: plReport,
        dateRange
      });
    } catch (error) {
      logger.error('Error getting profit and loss report', error);
      return res.status(500).json({
        error: 'Failed to get profit and loss report',
        message: error.message
      });
    }
  }

  async getReturnsAndReimbursements(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get returns and reimbursements report
      const returnsReport = await reportService.getReturnsAndReimbursements(dateRange.startDate, dateRange.endDate);
      
      return res.status(200).json({
        success: true,
        report: returnsReport,
        dateRange
      });
    } catch (error) {
      logger.error('Error getting returns and reimbursements report', error);
      return res.status(500).json({
        error: 'Failed to get returns and reimbursements report',
        message: error.message
      });
    }
  }

  async getFinancialSummary(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'thisMonth', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get profit and loss report
      const plReport = await reportService.getProfitAndLoss(dateRange.startDate, dateRange.endDate);
      
      // Get returns and reimbursements
      const returnsReport = await reportService.getReturnsAndReimbursements(dateRange.startDate, dateRange.endDate);
      
      const summary = {
        revenue: parseFloat(plReport.summary.totalRevenue),
        fees: parseFloat(plReport.summary.totalFees),
        refunds: parseFloat(plReport.summary.totalRefunds),
        netProfit: parseFloat(plReport.summary.netProfit),
        profitMargin: plReport.summary.profitMargin,
        returns: returnsReport.summary.totalReturns,
        returnValue: parseFloat(returnsReport.summary.totalReturnValue),
        reimbursements: returnsReport.summary.totalReimbursements,
        reimbursementValue: parseFloat(returnsReport.summary.totalReimbursementValue),
        dateRange
      };
      
      return res.status(200).json({
        success: true,
        summary
      });
    } catch (error) {
      logger.error('Error getting financial summary', error);
      return res.status(500).json({
        error: 'Failed to get financial summary',
        message: error.message
      });
    }
  }
}

module.exports = new FinanceController();
