const reportService = require('../services/report.service');
const logger = require('../utils/logger');
const dateUtils = require('../utils/date-utils');

class ReportController {
  async generateReport(req, res) {
    try {
      const { reportType, period, startDate, endDate } = req.body;
      
      // Validate required fields
      if (!reportType) {
        return res.status(400).json({ error: 'Report type is required' });
      }
      
      // Get date range based on period or custom dates
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Generate report
      const report = await reportService.generateReport(
        reportType, 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      return res.status(200).json({
        success: true,
        report
      });
    } catch (error) {
      logger.error('Error generating report', error);
      return res.status(500).json({
        error: 'Failed to generate report',
        message: error.message
      });
    }
  }

  async getAllReportTypes(req, res) {
    try {
      const config = require('../config/app-config');
      return res.status(200).json({
        success: true,
        reportTypes: Object.entries(config.reportTypes).map(([id, name]) => ({
          id,
          name
        }))
      });
    } catch (error) {
      logger.error('Error getting report types', error);
      return res.status(500).json({
        error: 'Failed to get report types',
        message: error.message
      });
    }
  }

  async generateAllReports(req, res) {
    try {
      const { period, startDate, endDate } = req.body;
      
      // Get date range
      let dateRange;
      try {
        dateRange = dateUtils.getDateRange(period || 'last30days', startDate, endDate);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Start generation process asynchronously
      res.status(202).json({
        success: true,
        message: 'Report generation started. This may take a while.',
        dateRange
      });
      
      // Continue processing in the background
      reportService.generateAllReports(dateRange.startDate, dateRange.endDate)
        .then(reports => {
          logger.info(`Generated ${reports.length} reports successfully`);
        })
        .catch(error => {
          logger.error('Error generating all reports', error);
        });
    } catch (error) {
      logger.error('Error initiating report generation', error);
      return res.status(500).json({
        error: 'Failed to initiate report generation',
        message: error.message
      });
    }
  }
}

module.exports = new ReportController();
