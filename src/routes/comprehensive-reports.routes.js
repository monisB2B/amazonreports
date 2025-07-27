const express = require('express');
const router = express.Router();
const comprehensiveReportController = require('../controllers/comprehensive-report.controller');

// Generate all reports
router.post('/generate/all', comprehensiveReportController.generateAllReports);

// Generate reports for specific categories
router.post('/generate/categories', comprehensiveReportController.generateCategoryReports);

// Get available categories
router.get('/categories', comprehensiveReportController.getCategories);

// Get available report types
router.get('/types', comprehensiveReportController.getReportTypes);

// Get recent report summaries
router.get('/summaries', comprehensiveReportController.getRecentSummaries);

// Get latest report files
router.get('/latest', comprehensiveReportController.getLatestReports);

// Get storage statistics
router.get('/storage/stats', comprehensiveReportController.getStorageStats);

// Clean up old reports
router.post('/cleanup', comprehensiveReportController.cleanupReports);

// Download specific report file
router.get('/download/:filename', comprehensiveReportController.downloadReport);

module.exports = router;