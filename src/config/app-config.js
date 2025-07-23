require('dotenv').config();

module.exports = {
  amazonApi: {
    // Direct access to process.env variables with amazon-sp-api v2 naming
    region: process.env.SP_API_REGION || 'na',
    marketplaceId: process.env.MARKETPLACE_ID
  },
  server: {
    port: process.env.PORT || 3000
  },
  dateRanges: {
    startDate: '2024-01-01', // Reports start from 2024
    endDate: new Date().toISOString().split('T')[0] // Today's date
  },
  reportTypes: {
    // Order Reports
    GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL: 'All Orders',
    GET_FLAT_FILE_ORDERS_DATA: 'Orders Data',
    
    // Inventory Reports
    GET_FBA_INVENTORY_AGED_DATA: 'FBA Aged Inventory',
    GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA: 'FBA Managed Inventory',
    GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT: 'Restock Recommendations',
    
    // FBA Reports
    GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA: 'FBA Returns',
    GET_FBA_FULFILLMENT_CUSTOMER_SHIPMENT_SALES_DATA: 'FBA Shipments',
    
    // Finances Reports
    GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA: 'Financial Transactions',
    GET_FLAT_FILE_ACTIONABLE_ORDER_DATA_SHIPPING: 'Shipping Data',
    GET_SELLER_FEEDBACK_DATA: 'Seller Feedback',
    
    // Settlement Reports
    GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE: 'Settlement Reports',
    GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2: 'Settlement Reports V2',
    
    // Performance Reports
    GET_V1_SELLER_PERFORMANCE_REPORT: 'Seller Performance',
    
    // Advertising Reports
    GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT: 'Search Terms Analytics',
    
    // FBM Reports
    GET_MERCHANT_LISTINGS_ALL_DATA: 'Merchant Listings',
    GET_MERCHANT_LISTINGS_FBA_TRANSITION_STATUS_DATA: 'FBA Transition Status',
  }
};
