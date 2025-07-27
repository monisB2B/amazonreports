const comprehensiveReportService = require('../services/comprehensive-report.service');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ComprehensiveReportController {
    /**
     * Generate all reports
     */
    async generateAllReports(req, res) {
        try {
            const { 
                days = 30, 
                parallel = false, 
                batchSize = 5 
            } = req.body;

            logger.info(`API request to generate all reports: days=${days}, parallel=${parallel}`);

            // Start generation in background
            const jobId = Date.now().toString();
            res.json({
                success: true,
                message: 'Report generation started',
                jobId,
                estimatedTime: parallel ? '15-30 minutes' : '45-90 minutes'
            });

            // Run generation asynchronously
            comprehensiveReportService.generateAllReports({
                dateRange: days,
                parallel,
                batchSize
            }).catch(error => {
                logger.error(`Background report generation failed: ${error.message}`);
            });

        } catch (error) {
            logger.error('Error starting report generation:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Generate reports for specific categories
     */
    async generateCategoryReports(req, res) {
        try {
            const { 
                categories, 
                days = 30, 
                parallel = false, 
                batchSize = 3 
            } = req.body;

            if (!categories || !Array.isArray(categories)) {
                return res.status(400).json({
                    success: false,
                    error: 'Categories must be provided as an array'
                });
            }

            logger.info(`API request to generate category reports: ${categories.join(', ')}`);

            const jobId = Date.now().toString();
            res.json({
                success: true,
                message: 'Category report generation started',
                jobId,
                categories,
                estimatedTime: parallel ? '5-15 minutes' : '15-30 minutes'
            });

            // Run generation asynchronously
            comprehensiveReportService.generateCategoryReports(categories, {
                dateRange: days,
                parallel,
                batchSize
            }).catch(error => {
                logger.error(`Background category report generation failed: ${error.message}`);
            });

        } catch (error) {
            logger.error('Error starting category report generation:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get available categories
     */
    async getCategories(req, res) {
        try {
            const categories = comprehensiveReportService.getAvailableCategories();
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            logger.error('Error getting categories:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get available report types
     */
    async getReportTypes(req, res) {
        try {
            const reportTypes = comprehensiveReportService.getAvailableReportTypes();
            res.json({
                success: true,
                data: reportTypes,
                total: reportTypes.length
            });
        } catch (error) {
            logger.error('Error getting report types:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get recent report summaries
     */
    async getRecentSummaries(req, res) {
        try {
            const { days = 7 } = req.query;
            const summaries = comprehensiveReportService.getRecentReportSummaries(parseInt(days));
            
            res.json({
                success: true,
                data: summaries,
                count: summaries.length
            });
        } catch (error) {
            logger.error('Error getting recent summaries:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get latest report files
     */
    async getLatestReports(req, res) {
        try {
            const { category, limit = 10 } = req.query;
            const reports = comprehensiveReportService.getLatestReportFiles(category, parseInt(limit));
            
            res.json({
                success: true,
                data: reports,
                count: reports.length
            });
        } catch (error) {
            logger.error('Error getting latest reports:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats(req, res) {
        try {
            const stats = comprehensiveReportService.getStorageStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting storage stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Clean up old reports
     */
    async cleanupReports(req, res) {
        try {
            const { daysToKeep = 30 } = req.body;
            const result = comprehensiveReportService.cleanupOldReports(parseInt(daysToKeep));
            
            res.json({
                success: true,
                message: `Cleanup completed: ${result.deleted} files deleted`,
                data: result
            });
        } catch (error) {
            logger.error('Error during cleanup:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Download a specific report file
     */
    async downloadReport(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../../reports', filename);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Report file not found'
                });
            }

            res.download(filePath, filename, (error) => {
                if (error) {
                    logger.error(`Error downloading file ${filename}:`, error);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            error: 'Failed to download file'
                        });
                    }
                }
            });

        } catch (error) {
            logger.error('Error in download handler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ComprehensiveReportController();