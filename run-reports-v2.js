require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const fs = require('fs');
const path = require('path');

// Updated report types with latest versions
const REPORT_TYPES = [
  'GET_FLAT_FILE_ORDER_REPORTS_DATA_SHIPPING',  // Latest order report type
  'GET_VENDOR_INVENTORY_REPORT',  // Latest inventory report
  'GET_FBA_INVENTORY_PLANNING_DATA',  // FBA inventory planning
  'GET_FBA_STORAGE_FEE_CHARGES_DATA',  // FBA storage fees
  'GET_FBA_REIMBURSEMENTS_DATA',  // FBA reimbursements
  'GET_SELLER_FEEDBACK_DATA',  // Seller feedback
  'GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT'  // Search terms analytics
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runReports() {
  try {
    console.log('Initializing SP-API client...');
    
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
        use_sandbox: true
      }
    });

    // First, let's check available report types
    console.log('\nChecking available report types...');
    const availableReports = await spApi.callAPI({
      operation: 'getReports',
      endpoint: 'reports',
      query: {
        reportTypes: REPORT_TYPES,
        pageSize: 100
      }
    });

    console.log('Available reports:', JSON.stringify(availableReports, null, 2));

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // Process each report type
    for (const reportType of REPORT_TYPES) {
      try {
        console.log(`\nProcessing report type: ${reportType}`);

        // Create report request
        console.log('Creating report request...');
        const createReportResponse = await spApi.callAPI({
          operation: 'createReport',
          endpoint: 'reports',
          body: {
            reportType,
            marketplaceIds: [process.env.MARKETPLACE_ID],
            dataStartTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dataEndTime: new Date().toISOString()
          }
        });

        console.log('Report requested:', createReportResponse);
        const reportId = createReportResponse.reportId;

        // Wait for report to be ready
        let reportInfo;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          console.log('Checking report status...');
          reportInfo = await spApi.callAPI({
            operation: 'getReport',
            endpoint: 'reports',
            path: {
              reportId
            }
          });
          
          console.log('Report status:', reportInfo.processingStatus);
          
          if (reportInfo.processingStatus === 'FATAL' || reportInfo.processingStatus === 'CANCELLED') {
            throw new Error(`Report processing failed with status: ${reportInfo.processingStatus}`);
          }
          
          if (reportInfo.processingStatus !== 'DONE') {
            if (++attempts >= maxAttempts) {
              throw new Error('Max attempts reached waiting for report');
            }
            console.log('Waiting 30 seconds before checking again...');
            await sleep(30000);
          }
        } while (reportInfo.processingStatus !== 'DONE');

        // Get report document
        console.log('Getting report document...');
        const reportDocResponse = await spApi.callAPI({
          operation: 'getReportDocument',
          endpoint: 'reports',
          path: {
            reportDocumentId: reportInfo.reportDocumentId
          }
        });

        // Download and save report
        console.log('Downloading report...');
        const response = await fetch(reportDocResponse.url);
        const reportData = await response.text();
        
        const filename = path.join(reportsDir, `${reportType}_${Date.now()}.csv`);
        fs.writeFileSync(filename, reportData);
        console.log(`Report saved to: ${filename}`);

      } catch (error) {
        console.error(`Error processing report ${reportType}:`, error.message);
        if (error.body) {
          console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        // Continue with next report type
        continue;
      }
    }

    console.log('\nAll reports processing completed!');

  } catch (error) {
    console.error('Fatal error:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

runReports();
