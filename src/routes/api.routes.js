const express = require('express');
const AmazonApiService = require('../services/amazon-api.service');
const logger = require('../utils/logger');
const config = require('../config/app-config');

const router = express.Router();

// Test API connection
router.get('/test-connection', async (req, res) => {
  try {
    const api = new AmazonApiService();
    const result = await api.testConnection();
    res.json({
      success: true,
      message: 'API connection test successful',
      data: result
    });
  } catch (error) {
    logger.error('API connection test failed', error);
    res.status(500).json({
      error: 'API connection test failed',
      message: error.message,
      details: error.details || error.code
    });
  }
});

// Get report types
router.get('/report-types', async (req, res) => {
  try {
    const api = new AmazonApiService();
    await api.initialize();
    
    const result = await api.spApi.callAPI({
      operation: 'getReports',
      endpoint: 'reports'
    });
    
    res.json({
      success: true,
      message: 'Got available report types',
      data: result
    });
  } catch (error) {
    logger.error('Failed to get report types', error);
    res.status(500).json({
      error: 'Failed to get report types',
      message: error.message,
      details: error.details || error.code
    });
  }
});

// Get catalog items
router.get('/catalog-items', async (req, res) => {
  try {
    const api = new AmazonApiService();
    await api.initialize();
    
    const result = await api.spApi.callAPI({
      operation: 'getCatalogItem',
      endpoint: 'catalogItems',
      path: {
        asin: 'B07FZ8S74R'  // Example ASIN
      },
      query: {
        marketplaceIds: [config.amazonApi.marketplaceId]
      }
    });
    
    res.json({
      success: true,
      message: 'Got catalog item details',
      data: result
    });
  } catch (error) {
    logger.error('Failed to get catalog item', error);
    res.status(500).json({
      error: 'Failed to get catalog item',
      message: error.message,
      details: error.details || error.code
    });
  }
});

module.exports = router;
