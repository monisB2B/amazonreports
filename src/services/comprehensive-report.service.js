const { getAllReports, REPORT_CATEGORIES, REPORT_TYPES } = require('../../get-all-reports');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ComprehensiveReportService {
    constructor() {
        this.reportsDirectory = path.join(__dirname, '../../reports');
        this.ensureReportDirectory();
    }

    ensureReportDirectory() {
        if (!fs.existsSync(this.reportsDirectory)) {
            fs.mkdirSync(this.reportsDirectory, { recursive: true });
        }
    }

    /**
     * Generate all available reports
     */
    async generateAllReports(options = {}) {
        logger.info('Starting comprehensive report generation via service');
        return await getAllReports(options);
    }

    /**
     * Generate reports for specific categories
     */
    async generateCategoryReports(categories, options = {}) {
        if (!Array.isArray(categories)) {
            categories = [categories];
        }

        const validCategories = categories.filter(cat => REPORT_CATEGORIES[cat.toUpperCase()]);
        if (validCategories.length === 0) {
            throw new Error(`No valid categories found. Available: ${Object.keys(REPORT_CATEGORIES).join(', ')}`);
        }

        logger.info(`Generating reports for categories: ${validCategories.join(', ')}`);
        
        return await getAllReports({
            ...options,
            specificCategories: validCategories.map(c => c.toUpperCase())
        });
    }

    /**
     * Get available report categories
     */
    getAvailableCategories() {
        return Object.keys(REPORT_CATEGORIES).map(category => ({
            category,
            reportTypes: REPORT_CATEGORIES[category],
            count: REPORT_CATEGORIES[category].length
        }));
    }

    /**
     * Get all available report types
     */
    getAvailableReportTypes() {
        return REPORT_TYPES.map(type => ({
            type,
            category: this.getCategoryForReportType(type)
        }));
    }

    /**
     * Find which category a report type belongs to
     */
    getCategoryForReportType(reportType) {
        for (const [category, types] of Object.entries(REPORT_CATEGORIES)) {
            if (types.includes(reportType)) {
                return category;
            }
        }
        return 'OTHER';
    }

    /**
     * Get recent report summaries
     */
    getRecentReportSummaries(days = 7) {
        const summaryFiles = [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        if (!fs.existsSync(this.reportsDirectory)) {
            return [];
        }

        const files = fs.readdirSync(this.reportsDirectory);
        
        files.forEach(filename => {
            if (filename.startsWith('report_generation_summary_') && filename.endsWith('.json')) {
                const filePath = path.join(this.reportsDirectory, filename);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime >= cutoffDate) {
                    try {
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        summaryFiles.push({
                            filename,
                            path: filePath,
                            createdAt: stats.mtime,
                            summary: content.progress?.summary,
                            configuration: content.configuration
                        });
                    } catch (error) {
                        logger.warn(`Failed to parse summary file ${filename}: ${error.message}`);
                    }
                }
            }
        });

        return summaryFiles.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get latest report files
     */
    getLatestReportFiles(category = null, limit = 10) {
        const reportFiles = [];

        if (!fs.existsSync(this.reportsDirectory)) {
            return [];
        }

        const files = fs.readdirSync(this.reportsDirectory);
        
        files.forEach(filename => {
            if (filename.endsWith('.csv') && !filename.includes('summary')) {
                const filePath = path.join(this.reportsDirectory, filename);
                const stats = fs.statSync(filePath);
                
                // Extract report type from filename
                const reportType = filename.split('-')[0];
                const reportCategory = this.getCategoryForReportType(reportType);
                
                if (!category || reportCategory === category.toUpperCase()) {
                    reportFiles.push({
                        filename,
                        path: filePath,
                        reportType,
                        category: reportCategory,
                        size: stats.size,
                        createdAt: stats.mtime
                    });
                }
            }
        });

        return reportFiles
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    /**
     * Clean up old report files
     */
    cleanupOldReports(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        if (!fs.existsSync(this.reportsDirectory)) {
            return { deleted: 0, errors: [] };
        }

        const files = fs.readdirSync(this.reportsDirectory);
        let deleted = 0;
        const errors = [];

        files.forEach(filename => {
            const filePath = path.join(this.reportsDirectory, filename);
            
            try {
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate && !filename.includes('summary')) {
                    fs.unlinkSync(filePath);
                    deleted++;
                    logger.info(`Deleted old report file: ${filename}`);
                }
            } catch (error) {
                errors.push(`Failed to delete ${filename}: ${error.message}`);
                logger.error(`Failed to delete file ${filename}:`, error);
            }
        });

        logger.info(`Cleanup completed: ${deleted} files deleted, ${errors.length} errors`);
        return { deleted, errors };
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
        if (!fs.existsSync(this.reportsDirectory)) {
            return {
                totalFiles: 0,
                totalSize: 0,
                reportFiles: 0,
                summaryFiles: 0,
                oldestFile: null,
                newestFile: null
            };
        }

        const files = fs.readdirSync(this.reportsDirectory);
        let totalSize = 0;
        let reportFiles = 0;
        let summaryFiles = 0;
        let oldestDate = null;
        let newestDate = null;

        files.forEach(filename => {
            const filePath = path.join(this.reportsDirectory, filename);
            const stats = fs.statSync(filePath);
            
            totalSize += stats.size;
            
            if (filename.endsWith('.csv')) {
                reportFiles++;
            } else if (filename.includes('summary')) {
                summaryFiles++;
            }

            if (!oldestDate || stats.mtime < oldestDate) {
                oldestDate = stats.mtime;
            }
            if (!newestDate || stats.mtime > newestDate) {
                newestDate = stats.mtime;
            }
        });

        return {
            totalFiles: files.length,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            reportFiles,
            summaryFiles,
            oldestFile: oldestDate,
            newestFile: newestDate
        };
    }
}

module.exports = new ComprehensiveReportService();