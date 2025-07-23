const reportService = require('../services/report.service');
const dateUtils = require('../utils/date-utils');
const logger = require('../utils/logger');

class SalesController {
  async getSalesReport(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get sales report
      const salesReport = await reportService.getSalesReport(dateRange.startDate, dateRange.endDate);
      
      return res.status(200).json({
        success: true,
        report: salesReport
      });
    } catch (error) {
      logger.error('Error getting sales report', error);
      return res.status(500).json({
        error: 'Failed to get sales report',
        message: error.message
      });
    }
  }

  async getSalesByProduct(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get sales report
      const salesReport = await reportService.getSalesReport(dateRange.startDate, dateRange.endDate);
      const productData = salesReport.summary.topProducts;
      
      return res.status(200).json({
        success: true,
        products: productData,
        dateRange
      });
    } catch (error) {
      logger.error('Error getting sales by product', error);
      return res.status(500).json({
        error: 'Failed to get sales by product',
        message: error.message
      });
    }
  }

  async getSalesByDay(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Get sales report
      const salesReport = await reportService.getSalesReport(dateRange.startDate, dateRange.endDate);
      const dailySales = salesReport.summary.dailySales;
      
      return res.status(200).json({
        success: true,
        dailySales,
        dateRange
      });
    } catch (error) {
      logger.error('Error getting sales by day', error);
      return res.status(500).json({
        error: 'Failed to get sales by day',
        message: error.message
      });
    }
  }
}

module.exports = new SalesController();
