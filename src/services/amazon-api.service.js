const SellingPartnerAPI = require('amazon-sp-api');
const config = require('../config/app-config');
const logger = require('../utils/logger');

class AmazonApiService {
  constructor() {
    this.spApi = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const credentials = {
        appClientId:
          process.env.SELLING_PARTNER_APP_CLIENT_ID ||
          process.env.SP_API_CLIENT_ID,
        appClientSecret:
          process.env.SELLING_PARTNER_APP_CLIENT_SECRET ||
          process.env.SP_API_CLIENT_SECRET,
        refreshToken:
          process.env.SELLING_PARTNER_REFRESH_TOKEN ||
          process.env.SP_API_REFRESH_TOKEN,
        accessKeyId:
          process.env.AWS_SELLING_PARTNER_ACCESS_KEY_ID ||
          process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:
          process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY ||
          process.env.AWS_SECRET_ACCESS_KEY,
        roleArn: process.env.AWS_SELLING_PARTNER_ROLE
      };

      const missing = Object.entries(credentials)
        .filter(([key, value]) => !value && key !== 'refreshToken')
        .map(([key]) => key);

      if (missing.length) {
        throw new Error(
          `Missing SP-API credentials: ${missing.join(', ')}`
        );
      }

      this.spApi = new SellingPartnerAPI({
        region: process.env.SP_API_REGION?.toLowerCase() || 'na',
        refresh_token: credentials.refreshToken,
        credentials: {
          SELLING_PARTNER_APP_CLIENT_ID: credentials.appClientId,
          SELLING_PARTNER_APP_CLIENT_SECRET: credentials.appClientSecret,
          AWS_ACCESS_KEY_ID: credentials.accessKeyId,
          AWS_SECRET_ACCESS_KEY: credentials.secretAccessKey,
          AWS_SELLING_PARTNER_ROLE: credentials.roleArn
        },
        options: {
          auto_request_tokens: true,
          use_sandbox: true,  // Using sandbox mode for testing
          debug_log: true
        }
      });

      this.isInitialized = true;
      logger.info('Amazon SP-API client initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Amazon SP-API client', error);
      throw error;
    }
  }

  async testConnection() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      });
      
      logger.info(`API connection test successful`);
      return response;
    } catch (error) {
      logger.error('API connection test failed', error);
      throw error;
    }
  }

  async createReport(reportType, startDate, endDate) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'createReport',
        endpoint: 'reports',
        body: {
          reportType,
          marketplaceIds: [config.amazonApi.marketplaceId],
          dataStartTime: new Date(startDate).toISOString(),
          dataEndTime: new Date(endDate).toISOString()
        }
      });

      logger.info(`Report creation initiated: ${reportType}`);
      return response;
    } catch (error) {
      logger.error(`Failed to create report ${reportType}`, error);
      throw error;
    }
  }

  async getReport(reportId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'getReport',
        endpoint: 'reports',
        path: {
          reportId
        }
      });

      return response;
    } catch (error) {
      logger.error(`Failed to get report ${reportId}`, error);
      throw error;
    }
  }

  async getReportDocument(reportDocumentId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'getReportDocument',
        endpoint: 'reports',
        path: {
          reportDocumentId
        }
      });

      return response;
    } catch (error) {
      logger.error(`Failed to get report document ${reportDocumentId}`, error);
      throw error;
    }
  }

  async downloadReportDocument(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error(`Failed to download report document from ${url}`, error);
      throw error;
    }
  }

  async getOrders(startDate, endDate, orderStatuses = ['Shipped']) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: {
          MarketplaceIds: [config.amazonApi.marketplaceId],
          CreatedAfter: new Date(startDate).toISOString(),
          CreatedBefore: new Date(endDate).toISOString(),
          OrderStatuses: orderStatuses
        }
      });

      return response.Orders;
    } catch (error) {
      logger.error('Failed to get orders', error);
      throw error;
    }
  }

  async getInventory() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fba-inventory',
        query: {
          marketplaceIds: [config.amazonApi.marketplaceId],
          granularityType: 'Marketplace',
          granularityId: config.amazonApi.marketplaceId
        }
      });

      return response;
    } catch (error) {
      logger.error('Failed to get inventory summary', error);
      throw error;
    }
  }

  async getFinancialEvents(startDate, endDate) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.spApi.callAPI({
        operation: 'listFinancialEvents',
        endpoint: 'finances',
        query: {
          PostedAfter: new Date(startDate).toISOString(),
          PostedBefore: new Date(endDate).toISOString()
        }
      });

      return response;
    } catch (error) {
      logger.error('Failed to get financial events', error);
      throw error;
    }
  }
}

module.exports = AmazonApiService;
