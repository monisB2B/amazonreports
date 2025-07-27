require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');

async function testConnection() {
  try {
    console.log('Testing Amazon SP-API connection in sandbox mode...');
    console.log('Using credentials:');
    console.log('  Client ID:', process.env.SELLING_PARTNER_APP_CLIENT_ID);
    console.log('  Region:', process.env.SP_API_REGION);
    console.log('  Role ARN:', process.env.AWS_SELLING_PARTNER_ROLE);
    console.log('  Application ID:', process.env.APPLICATION_ID);
    
    // Hide sensitive information
    const maskedRefreshToken = process.env.SELLING_PARTNER_REFRESH_TOKEN ? 
      `${process.env.SELLING_PARTNER_REFRESH_TOKEN.substring(0, 10)}...` : 'undefined';
    const maskedClientSecret = process.env.SELLING_PARTNER_APP_CLIENT_SECRET ?
      `${process.env.SELLING_PARTNER_APP_CLIENT_SECRET.substring(0, 10)}...` : 'undefined';
    const maskedAwsSecret = process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY ?
      `${process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY.substring(0, 10)}...` : 'undefined';
      
    console.log('  Refresh Token:', maskedRefreshToken);
    console.log('  Client Secret:', maskedClientSecret);
    console.log('  AWS Access Key:', process.env.AWS_SELLING_PARTNER_ACCESS_KEY_ID);
    console.log('  AWS Secret:', maskedAwsSecret);

    const spApi = new SellingPartnerAPI({
      region: process.env.SP_API_REGION?.toLowerCase() || 'na',
      refresh_token: process.env.SELLING_PARTNER_REFRESH_TOKEN,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: process.env.SELLING_PARTNER_APP_CLIENT_ID,
        SELLING_PARTNER_APP_CLIENT_SECRET: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
        AWS_ACCESS_KEY_ID: process.env.AWS_SELLING_PARTNER_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY,
        ROLE_ARN: process.env.AWS_SELLING_PARTNER_ROLE
      },
      options: {
        debug_log: true,
        use_sandbox: true  // Enable sandbox mode
      }
    });

    console.log('Initialized SP-API client, attempting to get marketplace participations...');
    const response = await spApi.callAPI({
      operation: 'getMarketplaceParticipations',
      endpoint: 'sellers'
    });

    console.log('Success! API response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('API connection test failed:', error.message);
    if (error.details) {
      console.error('Error details:', error.details);
    }
    return null;
  }
}

testConnection();
