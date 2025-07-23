require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const logger = require('./src/utils/logger');

async function testConnection() {
  try {
    logger.info('Testing Amazon SP-API connection with v2 environment variables...');
    
    // The library will automatically pick up these environment variables:
    // - SELLING_PARTNER_APP_CLIENT_ID
    // - SELLING_PARTNER_APP_CLIENT_SECRET
    // - SELLING_PARTNER_REFRESH_TOKEN
    // - AWS_SELLING_PARTNER_ACCESS_KEY_ID
    // - AWS_SELLING_PARTNER_SECRET_ACCESS_KEY
    // - AWS_SELLING_PARTNER_ROLE
    
    const spApi = new SellingPartnerAPI({
      region: process.env.SP_API_REGION?.toLowerCase() || 'na',
      options: {
        debug_log: true
      }
    });

    logger.info('Initialized SP-API client, attempting to get marketplace participations...');
    const response = await spApi.callAPI({
      operation: 'getMarketplaceParticipations',
      endpoint: 'sellers'
    });

    logger.info('Success! API connection successful');
    logger.info(`Found ${response.length} marketplace participations`);
    return true;
  } catch (error) {
    logger.error('API connection test failed:', error.message);
    logger.error('Error details:', error.details || error.code);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
