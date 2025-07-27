require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');
const config = require('./src/config/app-config');

// Comprehensive list of all available Amazon SP-API report types
const REPORT_TYPES = [
    // Listing Reports
    'GET_FLAT_FILE_OPEN_LISTINGS_DATA',
    'GET_MERCHANT_LISTINGS_DATA',
    'GET_MERCHANT_LISTINGS_DATA_BACK_COMPAT',
    'GET_MERCHANT_LISTINGS_DATA_LITE',
    'GET_MERCHANT_LISTINGS_DATA_LITER',
    'GET_MERCHANT_CANCELLED_LISTINGS_DATA',
    'GET_MERCHANTS_LISTINGS_FYP_REPORT',
    'GET_MERCHANT_LISTINGS_DEFECT_DATA',
    'GET_PAN_EU_OFFER_STATUS',
    'GET_MERCHANT_LISTINGS_ALL_DATA',
    'GET_MERCHANT_LISTINGS_INACTIVE_DATA',
    
    // Order Reports
    'GET_FLAT_FILE_ORDERS_DATA',
    'GET_ORDERS_DATA',
    'GET_FLAT_FILE_ORDER_REPORT_DATA',
    'GET_ORDER_REPORT_DATA_SHIPPING',
    'GET_AMAZON_FULFILLED_SHIPMENTS_DATA',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE',
    'GET_XML_ALL_ORDERS_DATA_BY_ORDER_DATE',
    'GET_XML_ALL_ORDERS_DATA_BY_LAST_UPDATE',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
    'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL',
    'GET_FLAT_FILE_ACTIONABLE_ORDER_DATA_SHIPPING',
    
    // FBA Sales Reports
    'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_SALES_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_PROMOTION_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_TAXES_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_REPLACEMENT_DATA',
    
    // Inventory Reports
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
    'GET_FBA_INVENTORY_AGED_DATA',
    'GET_EXCESS_INVENTORY_DATA',
    'GET_FBA_INVENTORY_PLANNING_DATA',
    
    // FBA Removal and Returns
    'GET_FBA_FULFILLMENT_REMOVAL_ORDER_DETAIL_DATA',
    'GET_FBA_FULFILLMENT_REMOVAL_SHIPMENT_DETAIL_DATA',
    'GET_FBA_RECOMMENDED_REMOVAL_DATA',
    'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
    'GET_FBA_STORAGE_FEE_CHARGES_DATA',
    
    // Restock and Recommendations
    'GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT',
    'GET_FBA_SNS_PERFORMANCE_DATA',
    
    // Financial Reports
    'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE',
    'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2',
    'GET_V2_SETTLEMENT_REPORT_DATA_XML',
    'GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA',
    'GET_FINANCIAL_EVENTS_DATA',
    
    // Performance and Analytics
    'GET_V1_SELLER_PERFORMANCE_REPORT',
    'GET_SELLER_FEEDBACK_DATA',
    'GET_BRAND_ANALYTICS_MARKET_BASKET_REPORT',
    'GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT',
    'GET_BRAND_ANALYTICS_REPEAT_PURCHASE_REPORT',
    
    // Advertising Reports
    'GET_BRAND_ANALYTICS_ALTERNATE_PURCHASE_REPORT',
    'GET_BRAND_ANALYTICS_ITEM_COMPARISON_REPORT',
    
    // Vendor Reports (for Vendors)
    'GET_VENDOR_INVENTORY_REPORT',
    'GET_VENDOR_SALES_REPORT',
    'GET_VENDOR_TRAFFIC_REPORT',
    'GET_VENDOR_FORECASTING_REPORT',
    'GET_VENDOR_REAL_TIME_INVENTORY_REPORT',
    
    // Tax Reports
    'GET_GST_MTR_B2B_CUSTOM',
    'GET_GST_MTR_B2C_CUSTOM',
    'GET_AMAZON_VAT_INVOICE_DATA_REPORT',
    'GET_AMAZON_VAT_TRANSACTION_DATA_REPORT',
    
    // Browse Tree and Other
    'GET_BROWSE_TREE_DATA',
    'GET_XML_BROWSE_TREE_DATA',
    'GET_EASYSHIP_DOCUMENTS',
    'GET_STRANDED_INVENTORY_DATA'
];

// Report type categories for better organization
const REPORT_CATEGORIES = {
    'LISTING': [
        'GET_FLAT_FILE_OPEN_LISTINGS_DATA',
        'GET_MERCHANT_LISTINGS_DATA',
        'GET_MERCHANT_LISTINGS_DATA_BACK_COMPAT',
        'GET_MERCHANT_LISTINGS_DATA_LITE',
        'GET_MERCHANT_LISTINGS_DATA_LITER',
        'GET_MERCHANT_CANCELLED_LISTINGS_DATA',
        'GET_MERCHANTS_LISTINGS_FYP_REPORT',
        'GET_MERCHANT_LISTINGS_DEFECT_DATA',
        'GET_PAN_EU_OFFER_STATUS',
        'GET_MERCHANT_LISTINGS_ALL_DATA',
        'GET_MERCHANT_LISTINGS_INACTIVE_DATA'
    ],
    'ORDERS': [
        'GET_FLAT_FILE_ORDERS_DATA',
        'GET_ORDERS_DATA',
        'GET_FLAT_FILE_ORDER_REPORT_DATA',
        'GET_ORDER_REPORT_DATA_SHIPPING',
        'GET_AMAZON_FULFILLED_SHIPMENTS_DATA',
        'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE',
        'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE',
        'GET_XML_ALL_ORDERS_DATA_BY_ORDER_DATE',
        'GET_XML_ALL_ORDERS_DATA_BY_LAST_UPDATE',
        'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
        'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL',
        'GET_FLAT_FILE_ACTIONABLE_ORDER_DATA_SHIPPING'
    ],
    'FBA_SALES': [
        'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_SALES_DATA',
        'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_PROMOTION_DATA',
        'GET_FBA_FULFILLMENT_CUSTOMER_TAXES_DATA',
        'GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_REPLACEMENT_DATA'
    ],
    'INVENTORY': [
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
        'GET_FBA_INVENTORY_AGED_DATA',
        'GET_EXCESS_INVENTORY_DATA',
        'GET_FBA_INVENTORY_PLANNING_DATA',
        'GET_STRANDED_INVENTORY_DATA'
    ],
    'RETURNS': [
        'GET_FBA_FULFILLMENT_REMOVAL_ORDER_DETAIL_DATA',
        'GET_FBA_FULFILLMENT_REMOVAL_SHIPMENT_DETAIL_DATA',
        'GET_FBA_RECOMMENDED_REMOVAL_DATA',
        'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',
        'GET_FBA_STORAGE_FEE_CHARGES_DATA'
    ],
    'FINANCIAL': [
        'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE',
        'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2',
        'GET_V2_SETTLEMENT_REPORT_DATA_XML',
        'GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA',
        'GET_FINANCIAL_EVENTS_DATA'
    ],
    'PERFORMANCE': [
        'GET_V1_SELLER_PERFORMANCE_REPORT',
        'GET_SELLER_FEEDBACK_DATA',
        'GET_BRAND_ANALYTICS_MARKET_BASKET_REPORT',
        'GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT',
        'GET_BRAND_ANALYTICS_REPEAT_PURCHASE_REPORT',
        'GET_BRAND_ANALYTICS_ALTERNATE_PURCHASE_REPORT',
        'GET_BRAND_ANALYTICS_ITEM_COMPARISON_REPORT'
    ],
    'VENDOR': [
        'GET_VENDOR_INVENTORY_REPORT',
        'GET_VENDOR_SALES_REPORT',
        'GET_VENDOR_TRAFFIC_REPORT',
        'GET_VENDOR_FORECASTING_REPORT',
        'GET_VENDOR_REAL_TIME_INVENTORY_REPORT'
    ],
    'TAX': [
        'GET_GST_MTR_B2B_CUSTOM',
        'GET_GST_MTR_B2C_CUSTOM',
        'GET_AMAZON_VAT_INVOICE_DATA_REPORT',
        'GET_AMAZON_VAT_TRANSACTION_DATA_REPORT'
    ],
    'OTHER': [
        'GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT',
        'GET_FBA_SNS_PERFORMANCE_DATA',
        'GET_BROWSE_TREE_DATA',
        'GET_XML_BROWSE_TREE_DATA',
        'GET_EASYSHIP_DOCUMENTS'
    ]
};

// Utility functions
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class RateLimiter {
    constructor(requestsPerSecond = 2) {
        this.requestsPerSecond = requestsPerSecond;
        this.interval = 1000 / requestsPerSecond;
        this.lastRequestTime = 0;
    }

    async throttle() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.interval) {
            const waitTime = this.interval - timeSinceLastRequest;
            await sleep(waitTime);
        }
        
        this.lastRequestTime = Date.now();
    }
}

const rateLimiter = new RateLimiter(0.5); // 1 request per 2 seconds to be safe

async function waitForReport(spApi, reportId, reportType) {
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes total (60 attempts * 30 seconds)
    const checkInterval = 30000; // 30 seconds
    
    logger.info(`Waiting for report ${reportType} (${reportId}) to complete...`);
    
    while (attempts < maxAttempts) {
        try {
            await rateLimiter.throttle();
            
            const reportInfo = await spApi.callAPI({
                operation: 'getReport',
                endpoint: 'reports',
                path: {
                    reportId: reportId
                }
            });

            logger.info(`Report ${reportType} (${reportId}) status: ${reportInfo.processingStatus} (attempt ${attempts + 1}/${maxAttempts})`);

            if (reportInfo.processingStatus === 'DONE') {
                logger.info(`Report ${reportType} completed successfully`);
                return reportInfo;
            }

            if (['CANCELLED', 'FATAL'].includes(reportInfo.processingStatus)) {
                throw new Error(`Report generation failed with status: ${reportInfo.processingStatus}`);
            }

            attempts++;
            await sleep(checkInterval);
        } catch (error) {
            logger.error(`Error checking report status for ${reportType}: ${error.message}`);
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw error;
            }
            
            // Exponential backoff on errors
            const backoffTime = Math.min(60000, checkInterval * Math.pow(2, attempts));
            await sleep(backoffTime);
        }
    }

    throw new Error(`Report generation timed out after ${maxAttempts} attempts (${(maxAttempts * checkInterval / 1000 / 60).toFixed(1)} minutes)`);
}

async function downloadReport(spApi, reportDocumentId, reportType) {
    try {
        logger.info(`Downloading report document for ${reportType}...`);
        
        await rateLimiter.throttle();
        
        const document = await spApi.callAPI({
            operation: 'getReportDocument',
            endpoint: 'reports',
            path: {
                reportDocumentId: reportDocumentId
            }
        });

        const reportDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // Use native fetch as it's now available in Node.js
        const response = await fetch(document.url);
        
        if (!response.ok) {
            throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
        }
        
        const reportData = await response.text();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(reportDir, `${reportType}-${timestamp}.csv`);
        
        // Validate report data
        if (!reportData || reportData.trim().length === 0) {
            logger.warn(`Report ${reportType} appears to be empty`);
            fs.writeFileSync(filename, 'No data available for the specified date range.\n');
        } else {
            fs.writeFileSync(filename, reportData);
        }
        
        const fileSizeKB = (fs.statSync(filename).size / 1024).toFixed(2);
        logger.info(`Report ${reportType} saved to ${filename} (${fileSizeKB} KB)`);
        
        return {
            filename,
            size: fileSizeKB,
            isEmpty: !reportData || reportData.trim().length === 0
        };
    } catch (error) {
        logger.error(`Error downloading report ${reportType}: ${error.message}`);
        throw error;
    }
}

async function requestAndDownloadReport(spApi, reportType, startDate, endDate, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    
    try {
        logger.info(`\n🔄 Requesting report: ${reportType} (${startDate.toDateString()} to ${endDate.toDateString()})`);
        
        await rateLimiter.throttle();
        
        const createReportResponse = await spApi.callAPI({
            operation: 'createReport',
            endpoint: 'reports',
            body: {
                reportType: reportType,
                marketplaceIds: [process.env.MARKETPLACE_ID || config.amazonApi.marketplaceId || 'ATVPDKIKX0DER'],
                dataStartTime: startDate.toISOString(),
                dataEndTime: endDate.toISOString()
            }
        });

        logger.info(`✅ Report request created: ${createReportResponse.reportId}`);

        const reportInfo = await waitForReport(spApi, createReportResponse.reportId, reportType);
        
        if (reportInfo.reportDocumentId) {
            const downloadResult = await downloadReport(spApi, reportInfo.reportDocumentId, reportType);
            logger.info(`🎉 Successfully generated and downloaded ${reportType}`);
            
            return { 
                success: true, 
                reportId: createReportResponse.reportId,
                reportType,
                filename: downloadResult.filename,
                size: downloadResult.size,
                isEmpty: downloadResult.isEmpty,
                processingTime: reportInfo.processingEndTime ? 
                    new Date(reportInfo.processingEndTime) - new Date(reportInfo.processingStartTime) : null
            };
        } else {
            throw new Error('Report completed but no document ID provided');
        }
    } catch (error) {
        logger.error(`❌ Error generating ${reportType}: ${error.message}`);
        
        // Retry logic for transient errors
        if (retryCount < maxRetries && isRetryableError(error)) {
            logger.info(`🔄 Retrying ${reportType} (attempt ${retryCount + 1}/${maxRetries}) in ${retryDelay/1000} seconds...`);
            await sleep(retryDelay);
            return requestAndDownloadReport(spApi, reportType, startDate, endDate, retryCount + 1);
        }
        
        return { 
            success: false, 
            reportType,
            error: error.message,
            retryCount: retryCount,
            isRetryable: isRetryableError(error)
        };
    }
}

function isRetryableError(error) {
    const retryableMessages = [
        'timeout',
        'network',
        'connection',
        'socket',
        'throttle',
        'rate limit',
        'temporarily unavailable',
        'service unavailable'
    ];
    
    const message = error.message.toLowerCase();
    return retryableMessages.some(retryableMsg => message.includes(retryableMsg));
}

function generateProgressReport(results, startTime) {
    const currentTime = new Date();
    const elapsedTime = (currentTime - startTime) / 1000 / 60; // minutes
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const empty = successful.filter(r => r.isEmpty);
    
    const totalSize = successful.reduce((sum, r) => sum + parseFloat(r.size || 0), 0);
    
    return {
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            empty: empty.length,
            elapsedTimeMinutes: elapsedTime.toFixed(2),
            totalSizeKB: totalSize.toFixed(2)
        },
        byCategory: Object.keys(REPORT_CATEGORIES).map(category => {
            const categoryReports = results.filter(r => 
                REPORT_CATEGORIES[category].includes(r.reportType)
            );
            const categorySuccessful = categoryReports.filter(r => r.success);
            
            return {
                category,
                total: categoryReports.length,
                successful: categorySuccessful.length,
                failed: categoryReports.length - categorySuccessful.length,
                reports: categoryReports.map(r => ({
                    type: r.reportType,
                    success: r.success,
                    size: r.size,
                    isEmpty: r.isEmpty,
                    error: r.error
                }))
            };
        }),
        successful,
        failed
    };
}

async function getAllReports(options = {}) {
    const startTime = new Date();
    
    try {
        logger.info('🚀 Starting comprehensive Amazon SP-API report generation...');
        logger.info(`📊 Total report types to process: ${REPORT_TYPES.length}`);
        
        // Configuration
        const {
            dateRange = 30,
            specificCategories = null,
            skipEmptyReports = false,
            parallel = false,
            batchSize = 5
        } = options;
        
        // Initialize SP-API client
        logger.info('🔧 Initializing SP-API client...');
        
        const spApi = new SellingPartnerAPI({
            region: process.env.SP_API_REGION?.toLowerCase() || config.amazonApi.region || 'na',
            refresh_token: process.env.SELLING_PARTNER_REFRESH_TOKEN,
            credentials: {
                SELLING_PARTNER_APP_CLIENT_ID: process.env.SELLING_PARTNER_APP_CLIENT_ID,
                SELLING_PARTNER_APP_CLIENT_SECRET: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
                AWS_ACCESS_KEY_ID: process.env.AWS_SELLING_PARTNER_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY: process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY,
                AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE
            },
            options: {
                debug_log: false,
                use_sandbox: false,
                auto_request_tokens: true,
                auto_request_throttled: true
            }
        });

        // Test connection first
        try {
            await spApi.callAPI({
                operation: 'getMarketplaceParticipations',
                endpoint: 'sellers'
            });
            logger.info('✅ SP-API connection test successful');
        } catch (error) {
            logger.error('❌ SP-API connection test failed');
            throw error;
        }

        // Set date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        logger.info(`📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

        // Filter report types by category if specified
        let reportTypesToProcess = REPORT_TYPES;
        if (specificCategories && Array.isArray(specificCategories)) {
            reportTypesToProcess = [];
            specificCategories.forEach(category => {
                if (REPORT_CATEGORIES[category]) {
                    reportTypesToProcess.push(...REPORT_CATEGORIES[category]);
                }
            });
            logger.info(`🎯 Processing specific categories: ${specificCategories.join(', ')}`);
            logger.info(`📊 Filtered report types: ${reportTypesToProcess.length}`);
        }

        const results = [];
        let processedCount = 0;

        // Process reports
        if (parallel) {
            logger.info(`⚡ Processing reports in parallel batches of ${batchSize}`);
            
            for (let i = 0; i < reportTypesToProcess.length; i += batchSize) {
                const batch = reportTypesToProcess.slice(i, i + batchSize);
                logger.info(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(reportTypesToProcess.length/batchSize)}`);
                
                const batchPromises = batch.map(reportType => 
                    requestAndDownloadReport(spApi, reportType, startDate, endDate)
                );
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        results.push({
                            success: false,
                            reportType: batch[index],
                            error: result.reason.message
                        });
                    }
                });
                
                processedCount += batch.length;
                logger.info(`📈 Progress: ${processedCount}/${reportTypesToProcess.length} (${((processedCount/reportTypesToProcess.length)*100).toFixed(1)}%)`);
                
                // Brief pause between batches
                if (i + batchSize < reportTypesToProcess.length) {
                    await sleep(2000);
                }
            }
        } else {
            logger.info('🔄 Processing reports sequentially to avoid API throttling');
            
            for (const reportType of reportTypesToProcess) {
                const result = await requestAndDownloadReport(spApi, reportType, startDate, endDate);
                results.push(result);
                
                processedCount++;
                
                if (processedCount % 10 === 0 || processedCount === reportTypesToProcess.length) {
                    logger.info(`📈 Progress: ${processedCount}/${reportTypesToProcess.length} (${((processedCount/reportTypesToProcess.length)*100).toFixed(1)}%)`);
                }
                
                // Brief pause between requests for sequential processing
                await sleep(1000);
            }
        }

        // Generate comprehensive summary
        const progressReport = generateProgressReport(results, startTime);
        
        // Save detailed results
        const reportsDir = path.join(__dirname, 'reports');
        const summaryFile = path.join(reportsDir, `report_generation_summary_${new Date().toISOString().split('T')[0]}.json`);
        const detailedSummary = {
            timestamp: new Date().toISOString(),
            configuration: {
                dateRange,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                specificCategories,
                parallel,
                batchSize
            },
            progress: progressReport,
            results
        };
        
        fs.writeFileSync(summaryFile, JSON.stringify(detailedSummary, null, 2));
        
        // Log final summary
        logger.info('\n🎉 Report generation completed!');
        logger.info('📊 SUMMARY:');
        logger.info(`   ✅ Successfully generated: ${progressReport.summary.successful} reports`);
        logger.info(`   ❌ Failed: ${progressReport.summary.failed} reports`);
        logger.info(`   📄 Empty reports: ${progressReport.summary.empty} reports`);
        logger.info(`   💾 Total size: ${progressReport.summary.totalSizeKB} KB`);
        logger.info(`   ⏱️  Total time: ${progressReport.summary.elapsedTimeMinutes} minutes`);
        logger.info(`   📋 Summary saved to: ${summaryFile}`);
        
        // Category breakdown
        logger.info('\n📊 BY CATEGORY:');
        progressReport.byCategory.forEach(category => {
            if (category.total > 0) {
                logger.info(`   ${category.category}: ${category.successful}/${category.total} successful`);
            }
        });
        
        // List failed reports if any
        if (progressReport.summary.failed > 0) {
            logger.info('\n❌ FAILED REPORTS:');
            progressReport.failed.forEach(failed => {
                logger.info(`   ${failed.reportType}: ${failed.error}`);
            });
        }

        return detailedSummary;

    } catch (error) {
        logger.error('\n💥 Critical error occurred during report generation:');
        logger.error('Error:', error.message);
        if (error.stack) {
            logger.error('Stack trace:', error.stack);
        }
        
        const errorSummary = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            elapsedTime: (new Date() - startTime) / 1000 / 60
        };
        
        const errorFile = path.join(__dirname, 'reports', `error_report_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(errorFile, JSON.stringify(errorSummary, null, 2));
        
        throw error;
    }
}

// CLI support and main execution
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--days':
                options.dateRange = parseInt(args[++i]) || 30;
                break;
            case '--categories':
                options.specificCategories = args[++i].split(',').map(c => c.trim().toUpperCase());
                break;
            case '--parallel':
                options.parallel = true;
                break;
            case '--batch-size':
                options.batchSize = parseInt(args[++i]) || 5;
                break;
            case '--help':
                console.log(`
Amazon SP-API Report Generation Tool

Usage: node get-all-reports.js [options]

Options:
  --days <number>           Number of days to look back (default: 30)
  --categories <list>       Comma-separated list of categories to process
                           Available: ${Object.keys(REPORT_CATEGORIES).join(', ')}
  --parallel               Process reports in parallel batches
  --batch-size <number>    Size of parallel batches (default: 5)
  --help                   Show this help message

Examples:
  node get-all-reports.js --days 7
  node get-all-reports.js --categories ORDERS,INVENTORY
  node get-all-reports.js --parallel --batch-size 3
  node get-all-reports.js --days 14 --categories FINANCIAL --parallel
                `);
                process.exit(0);
                break;
        }
    }
    
    logger.info('🚀 Amazon SP-API Comprehensive Report Generator');
    logger.info('='.repeat(50));
    
    if (options.specificCategories) {
        logger.info(`📂 Categories: ${options.specificCategories.join(', ')}`);
    }
    if (options.dateRange) {
        logger.info(`📅 Date range: Last ${options.dateRange} days`);
    }
    if (options.parallel) {
        logger.info(`⚡ Parallel processing: Enabled (batch size: ${options.batchSize})`);
    }
    
    logger.info('='.repeat(50));
    
    try {
        await getAllReports(options);
        logger.info('\n🎉 All done! Check the reports directory for your files.');
        process.exit(0);
    } catch (error) {
        logger.error('\n💥 Process failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    getAllReports,
    requestAndDownloadReport,
    REPORT_TYPES,
    REPORT_CATEGORIES
};

// Run if called directly
if (require.main === module) {
    main();
}
