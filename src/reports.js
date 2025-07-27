import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import SellingPartner from 'amazon-sp-api';
import csv from 'csvtojson';
import { createObjectCsvWriter } from 'csv-writer';
import chalk from 'chalk';

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_DIR = path.join(__dirname, '..', 'reports');

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_SELLING_PARTNER_ROLE,
  MARKETPLACE_ID = 'ATVPDKIKX0DER',
  BASE_URL
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Missing required SP API credentials in environment');
  process.exit(1);
}

const args = parseArgs({
  options: {
    after: { type: 'string' },
    before: { type: 'string' }
  }
}).values;

const now = new Date();
const defaultAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const createdAfter = args.after || defaultAfter.toISOString();
const createdBefore = args.before || now.toISOString();

const sp = new SellingPartner({
  region: 'na',
  refresh_token: REFRESH_TOKEN,
  credentials: {
    SELLING_PARTNER_APP_CLIENT_ID: CLIENT_ID,
    SELLING_PARTNER_APP_CLIENT_SECRET: CLIENT_SECRET,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SELLING_PARTNER_ROLE
  },
  options: {
    base_url: BASE_URL
  }
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, args = [], retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(...args);
    } catch (err) {
      const code = err.statusCode || err.code;
      if (attempt < retries && (code === 429 || code === 503)) {
        const wait = 2 ** attempt * 1000;
        console.warn(chalk.yellow(`Retry ${attempt + 1} after ${wait}ms`));
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

async function fetchOrders() {
  console.log(chalk.cyan('Fetching orders...'));
  let nextToken;
  const orders = [];
  do {
    const query = nextToken
      ? { NextToken: nextToken }
      : {
          MarketplaceIds: [MARKETPLACE_ID],
          CreatedAfter: createdAfter,
          CreatedBefore: createdBefore
        };
    const res = await withRetry(() =>
      sp.callAPI({ operation: 'getOrders', endpoint: 'orders', query })
    );
    const payload = res.payload || {};
    orders.push(...(payload.Orders || []));
    nextToken = payload.NextToken;
  } while (nextToken);
  return orders;
}

async function fetchOrderItems(orderId) {
  const res = await withRetry(() =>
    sp.callAPI({ operation: 'getOrderItems', endpoint: 'orders', path: { orderId } })
  );
  return res.payload?.OrderItems || [];
}

async function fetchOrderDetails(orderId) {
  const rdt = await withRetry(() =>
    sp.callAPI({
      operation: 'createRestrictedDataToken',
      endpoint: 'tokens',
      body: {
        restrictedResources: [
          { method: 'GET', path: `/orders/v0/orders/${orderId}/address` },
          { method: 'GET', path: `/orders/v0/orders/${orderId}/buyerInfo` }
        ]
      }
    })
  );
  const token = rdt.restrictedDataToken;
  const [addrRes, buyerRes] = await Promise.all([
    withRetry(() =>
      sp.callAPI({
        operation: 'getOrderAddress',
        endpoint: 'orders',
        path: { orderId },
        headers: { 'x-amz-access-token': token }
      })
    ),
    withRetry(() =>
      sp.callAPI({
        operation: 'getOrderBuyerInfo',
        endpoint: 'orders',
        path: { orderId },
        headers: { 'x-amz-access-token': token }
      })
    )
  ]);
  return { address: addrRes.payload || {}, buyerInfo: buyerRes.payload || {} };
}

async function writeCsv(pathStr, records) {
  if (!records.length) {
    await fs.writeFile(pathStr, '');
    return;
  }
  const header = Object.keys(records[0]).map(k => ({ id: k, title: k }));
  const writer = createObjectCsvWriter({ path: pathStr, header });
  await writer.writeRecords(records);
}

async function downloadReport(reportType) {
  console.log(chalk.cyan(`Requesting report ${reportType}`));
  const createRes = await withRetry(() =>
    sp.callAPI({
      operation: 'createReport',
      endpoint: 'reports',
      body: { reportType, marketplaceIds: [MARKETPLACE_ID] }
    })
  );
  const reportId = createRes.reportId;

  let report;
  while (true) {
    await delay(30000);
    const res = await withRetry(() =>
      sp.callAPI({
        operation: 'getReport',
        endpoint: 'reports',
        path: { reportId }
      })
    );
    report = res.payload;
    if (report.processingStatus === 'DONE') break;
    if (['CANCELLED', 'FATAL'].includes(report.processingStatus)) {
      throw new Error(`Report ${reportType} ${report.processingStatus}`);
    }
  }

  const docRes = await withRetry(() =>
    sp.callAPI({
      operation: 'getReportDocument',
      endpoint: 'reports',
      path: { reportDocumentId: report.reportDocumentId }
    })
  );

  const data = await withRetry(() => sp.download(docRes.payload));
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const fileName = `${reportType}-${new Date().toISOString()}.csv`;
  const filePath = path.join(REPORT_DIR, fileName);
  await fs.writeFile(filePath, data);
  return filePath;
}

function isOlderThan(dateStr, days) {
  const d = new Date(dateStr);
  return Date.now() - d.getTime() > days * 24 * 60 * 60 * 1000;
}

function isUnreimbursed(row) {
  const keys = ['reimbursementId', 'reimbursement-id', 'reimbursedDate', 'reimbursed-date'];
  return !keys.some(k => row[k]);
}

async function analyzeReturns(file) {
  const rows = await csv().fromFile(file);
  return rows.filter(r => isOlderThan(r.returnDate || r['return-date'], 45) && isUnreimbursed(r));
}

async function analyzeLostInventory(file) {
  const rows = await csv().fromFile(file);
  const reasons = ['Lost', 'WarehouseLost', 'Damaged'];
  return rows.filter(r => reasons.includes((r.reason || r.Reason)) && isUnreimbursed(r));
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const orders = await fetchOrders();
  let orderRows = [];
  let itemCount = 0;
  for (const order of orders) {
    const orderId = order.AmazonOrderId;
    const items = await fetchOrderItems(orderId);
    const { address, buyerInfo } = await fetchOrderDetails(orderId);
    for (const item of items) {
      itemCount++;
      orderRows.push({
        orderId,
        purchaseDate: order.PurchaseDate,
        orderStatus: order.OrderStatus,
        sku: item.SellerSKU,
        asin: item.ASIN,
        quantity: item.QuantityOrdered,
        buyerName: buyerInfo.BuyerName,
        shipCity: address.City,
        shipState: address.StateOrRegion
      });
    }
  }
  await writeCsv(path.join(REPORT_DIR, 'orders.csv'), orderRows);

  const returnsFile = await downloadReport('GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA');
  const adjustFile = await downloadReport('GET_FBA_FULFILLMENT_INVENTORY_ADJUSTMENTS_DATA');

  const claimableReturns = await analyzeReturns(returnsFile);
  const lostInventory = await analyzeLostInventory(adjustFile);

  await writeCsv(path.join(REPORT_DIR, 'claimable_returns.csv'), claimableReturns);
  await writeCsv(path.join(REPORT_DIR, 'lost_inventory.csv'), lostInventory);

  const claimVal = claimableReturns.reduce((sum, r) => sum + parseFloat(r.amount || r.Amount || 0), 0);
  const lostVal = lostInventory.reduce((sum, r) => sum + parseFloat(r.amount || r.Amount || 0), 0);

  console.log(chalk.green(`✔ Orders fetched:  ${orders.length} (${itemCount} items)`));
  console.log(chalk.green(`✔ Claimable returns: ${claimableReturns.length}  ($${claimVal.toFixed(2)})`));
  console.log(chalk.green(`✔ Lost / damaged FBA units: ${lostInventory.length}  ($${lostVal.toFixed(2)})`));
  console.log(chalk.green(`All done – files saved in ${REPORT_DIR}`));
}

main();
