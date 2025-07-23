const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

// Get all available report types
router.get('/types', reportController.getAllReportTypes);

// Generate a specific report
router.post('/generate', reportController.generateReport);

// Generate all reports
router.post('/generate-all', reportController.generateAllReports);

module.exports = router;
