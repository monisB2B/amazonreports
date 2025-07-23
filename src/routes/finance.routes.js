const express = require('express');
const financeController = require('../controllers/finance.controller');

const router = express.Router();

// Get profit and loss report
router.get('/profit-loss', financeController.getProfitAndLoss);

// Get returns and reimbursements
router.get('/returns-reimbursements', financeController.getReturnsAndReimbursements);

// Get financial summary
router.get('/summary', financeController.getFinancialSummary);

module.exports = router;
