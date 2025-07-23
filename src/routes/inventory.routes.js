const express = require('express');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// Get inventory report
router.get('/report', inventoryController.getInventoryReport);

// Get inventory summary
router.get('/summary', inventoryController.getInventorySummary);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

module.exports = router;
