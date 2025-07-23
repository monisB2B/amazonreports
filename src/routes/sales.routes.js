const express = require('express');
const salesController = require('../controllers/sales.controller');

const router = express.Router();

// Get sales report
router.get('/report', salesController.getSalesReport);

// Get sales by product
router.get('/by-product', salesController.getSalesByProduct);

// Get sales by day
router.get('/by-day', salesController.getSalesByDay);

module.exports = router;
