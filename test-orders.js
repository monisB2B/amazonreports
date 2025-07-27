require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const fs = require('fs');
const path = require('path');

async function saveOrdersToCSV(orders, filename) {
  if (!orders || !orders.Orders || orders.Orders.length === 0) {
    console.log('No orders to save');
    return;
  }

  const headers = [
    'AmazonOrderId',
    'PurchaseDate',
    'OrderStatus',
    'OrderTotal.Amount',
    'OrderTotal.CurrencyCode',
    'ShipServiceLevel',
    'NumberOfItemsShipped',
    'ShippingAddress.City',
    'ShippingAddress.StateOrRegion',
    'ShippingAddress.PostalCode'
  ];

  const rows = [headers.join(',')];

  orders.Orders.forEach(order => {
    const row = [
      order.AmazonOrderId,
      order.PurchaseDate,
      order.OrderStatus,
      order.OrderTotal ? order.OrderTotal.Amount : '',
      order.OrderTotal ? order.OrderTotal.CurrencyCode : '',
      order.ShipServiceLevel,
      order.NumberOfItemsShipped,
      order.ShippingAddress ? order.ShippingAddress.City.replace(/,/g, '') : '',
      order.ShippingAddress ? order.ShippingAddress.StateOrRegion : '',
      order.ShippingAddress ? order.ShippingAddress.PostalCode : ''
    ];
    rows.push(row.join(','));
  });

  fs.writeFileSync(filename, rows.join('\n'));
  console.log(`Orders saved to ${filename}`);
}

async function testOrders() {
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
        use_sandbox: false  // Production mode
      }
    });

    // Get the current date (minus 2 minutes to account for SP-API delay) and 30 days ago
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() - 2); // Set to 2 minutes ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('Getting orders...');
    console.log('Date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Default to North American marketplace if not specified
    const marketplaceId = process.env.MARKETPLACE_ID || 'ATVPDKIKX0DER'; // US marketplace
    
    // Use the Orders API
    const orders = await spApi.callAPI({
      operation: 'getOrders',
      endpoint: 'orders',
      query: {
        MarketplaceIds: [marketplaceId],
        LastUpdatedAfter: startDate.toISOString(),
        LastUpdatedBefore: endDate.toISOString()
      }
    })

    console.log(`Total orders retrieved: ${orders.Orders.length}`);
    
    // Save orders to CSV file
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)){
      fs.mkdirSync(reportDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(reportDir, `orders-${timestamp}.csv`);
    await saveOrdersToCSV(orders, filename);

    // Print sample of orders (first 5)
    console.log('\nSample of retrieved orders:');
    orders.Orders.slice(0, 5).forEach(order => {
      console.log(`\nOrder ID: ${order.AmazonOrderId}`);
      console.log(`Status: ${order.OrderStatus}`);
      console.log(`Purchase Date: ${order.PurchaseDate}`);
      if (order.OrderTotal) {
        console.log(`Total: ${order.OrderTotal.CurrencyCode} ${order.OrderTotal.Amount}`);
      }
    });

  } catch (error) {
    console.error('\nError occurred while retrieving orders:');
    console.error('Error:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

testOrders();
