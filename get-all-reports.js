require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const fs = require('fs');
const path = require('path');

// List of all available report types
const REPORT_TYPES = [
    'GET_FLAT_FILE_OPEN_LISTINGS_DATA',
    'GET_MERCHANT_LISTINGS_DATA',
    'GET_MERCHANT_LISTINGS_DATA_BACK_COMPAT',
    'GET_MERCHANT_LISTINGS_DATA_LITE',
    'GET_MERCHANT_LISTINGS_DATA_LITER',
    'GET_MERCHANT_CANCELLED_LISTINGS_DATA',
    'GET_MERCHANTS_LISTINGS_FYP_REPORT',
    'GET_MERCHANT_LISTINGS_DEFECT_DATA',
    'GET_PAN_EU_OFFER_STATUS',
    'GET_FLAT_FILE_ORDERS_DATA',
    'GET_ORDERS_DATA',
    'GET_FLAT_FILE_ORDER_REPORT_DATA',
    'GET_ORDER_REPORT_DATA_SHIPPING',
    'GET_AMAZON_FULFILLED_SHIPMENTS_DATA',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE',
    'GET_XML_ALL_ORDERS_DATA_BY_ORDER_DATE',
    'GET_XML_ALL_ORDERS_DATA_BY_LAST_UPDATE',
    'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_SALES_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_PROMOTION_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_TAXES_DATA',
    'GET_AFN_INVENTORY_DATA',
    'GET_AFN_INVENTORY_DATA_BY_COUNTRY',
    'GET_FBA_FULFILLMENT_CURRENT_INVENTORY_DATA',
    'GET_FBA_FULFILLMENT_MONTHLY_INVENTORY_DATA',
    'GET_FBA_FULFILLMENT_INVENTORY_RECEIPTS_DATA',
    'GET_FBA_FULFILLMENT_INVENTORY_ADJUSTMENTS_DATA',
    'GET_FBA_FULFILLMENT_INVENTORY_HEALTH_DATA',
    'GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA',
    'GET_FBA_FULFILLMENT_CROSS_BORDER_INVENTORY_MOVEMENT_DATA',
    'GET_FBA_FULFILLMENT_INBOUND_GUIDANCE_DATA',
    'GET_FBA_FULFILLMENT_REMOVAL_ORDER_DETAIL_DATA',
    'GET_FBA_FULFILLMENT_REMOVAL_SHIPMENT_DETAIL_DATA',
    'GET_FBA_RECOMMENDED_REMOVAL_DATA',
    'GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT',
    'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
    'GET_VENDOR_INVENTORY_REPORT',
    'GET_VENDOR_SALES_REPORT',
    'GET_VENDOR_TRAFFIC_REPORT',
    'GET_BROWSE_TREE_DATA'
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForReport(spApi, reportId) {
    let attempts = 0;
    const maxAttempts = 30; // 15 minutes total (30 attempts * 30 seconds)
    
    while (attempts < maxAttempts) {
        const reportInfo = await spApi.callAPI({
            operation: 'getReport',
            endpoint: 'reports',
            path: {
                reportId: reportId
            }
        });

        console.log(`Report ${reportId} status: ${reportInfo.processingStatus}`);

        if (reportInfo.processingStatus === 'DONE') {
            return reportInfo;
        }

        if (['CANCELLED', 'FATAL'].includes(reportInfo.processingStatus)) {
            throw new Error(`Report generation failed with status: ${reportInfo.processingStatus}`);
        }

        attempts++;
        await sleep(30000); // Wait 30 seconds between checks
    }

    throw new Error('Report generation timed out');
}

async function downloadReport(spApi, reportDocumentId, reportType) {
    const document = await spApi.callAPI({
        operation: 'getReportDocument',
        endpoint: 'reports',
        path: {
            reportDocumentId: reportDocumentId
        }
    });

    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir);
    }

    // Use native fetch as it's now available in Node.js
    const response = await fetch(document.url);
    const reportData = await response.text();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(reportDir, `${reportType}-${timestamp}.csv`);
    fs.writeFileSync(filename, reportData);
    
    console.log(`Report saved to ${filename}`);
    return filename;
}

async function requestAndDownloadReport(spApi, reportType, startDate, endDate) {
    try {
        console.log(`\nRequesting report: ${reportType}`);
        
        const createReportResponse = await spApi.callAPI({
            operation: 'createReport',
            endpoint: 'reports',
            body: {
                reportType: reportType,
                marketplaceIds: [process.env.MARKETPLACE_ID || 'ATVPDKIKX0DER'],
                dataStartTime: startDate.toISOString(),
                dataEndTime: endDate.toISOString()
            }
        });

        console.log(`Report request created: ${createReportResponse.reportId}`);

        const reportInfo = await waitForReport(spApi, createReportResponse.reportId);
        
        if (reportInfo.reportDocumentId) {
            const filename = await downloadReport(spApi, reportInfo.reportDocumentId, reportType);
            console.log(`Successfully generated and downloaded ${reportType}`);
            return { success: true, filename };
        }
    } catch (error) {
        console.error(`Error generating ${reportType}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function getAllReports() {
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
                debug_log: false,
                use_sandbox: false
            }
        });

        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        console.log('Date range:', {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });

        const results = {
            successful: [],
            failed: []
        };

        // Process reports sequentially to avoid API throttling
        for (const reportType of REPORT_TYPES) {
            const result = await requestAndDownloadReport(spApi, reportType, startDate, endDate);
            if (result.success) {
                results.successful.push({ reportType, filename: result.filename });
            } else {
                results.failed.push({ reportType, error: result.error });
            }
        }

        // Save summary report
        const summaryFile = path.join(__dirname, 'reports', 'report_generation_summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
        console.log('\nReport generation summary:');
        console.log(`Successfully generated: ${results.successful.length} reports`);
        console.log(`Failed: ${results.failed.length} reports`);
        console.log(`Summary saved to: ${summaryFile}`);

    } catch (error) {
        console.error('\nError occurred during report generation:');
        console.error('Error:', error.message);
        if (error.body) {
            console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        process.exit(1);
    }
}

// Start the report generation process
getAllReports();
