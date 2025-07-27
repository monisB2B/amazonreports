require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const fs = require('fs');
const path = require('path');

async function getFBAReturns() {
  try {
    console.log('Initializing SP-API client...');
    
    const spApi = new SellingPartnerAPI({
      region: 'na',
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
        use_sandbox: false
      }
    });

    // Get date range for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log('Requesting FBA Returns report...');
    console.log('Date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Create report request
    const createReportResponse = await spApi.callAPI({
      operation: 'createReport',
      endpoint: 'reports',
      body: {
        reportType: 'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
        marketplaceIds: [process.env.MARKETPLACE_ID || 'ATVPDKIKX0DER'],
        dataStartTime: startDate.toISOString(),
        dataEndTime: endDate.toISOString()
      }
    });

    console.log('Report request created:', createReportResponse.reportId);

    // Wait for report to be ready
    let reportId = createReportResponse.reportId;
    let reportStatus;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      attempts++;
      console.log(`Checking report status (attempt ${attempts}/${maxAttempts})...`);
      
      const reportInfo = await spApi.callAPI({
        operation: 'getReport',
        endpoint: 'reports',
        path: {
          reportId: reportId
        }
      });

      reportStatus = reportInfo.processingStatus;
      console.log('Report status:', reportStatus);

      if (reportStatus === 'DONE') {
        // Get report document
        const reportDocument = await spApi.callAPI({
          operation: 'getReportDocument',
          endpoint: 'reports',
          path: {
            reportDocumentId: reportInfo.reportDocumentId
          }
        });

        // Download and save report
        const reportDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportDir)){
          fs.mkdirSync(reportDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(reportDir, `fba-returns-${timestamp}.csv`);

        // Download the report using the URL from reportDocument
        const response = await fetch(reportDocument.url);
        const reportData = await response.text();
        fs.writeFileSync(filename, reportData);

        console.log(`Report saved to ${filename}`);
        break;
      } else if (reportStatus === 'FATAL' || reportStatus === 'CANCELLED') {
        throw new Error(`Report generation failed with status: ${reportStatus}`);
      }

      // Wait 30 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 30000));

    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Report generation timed out');
    }

  } catch (error) {
    console.error('\nError occurred while retrieving FBA returns:');
    console.error('Error:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

getFBAReturns();
