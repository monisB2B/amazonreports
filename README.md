# Amazon Seller Central Reports

A comprehensive reporting application that connects to Amazon Seller Central API and provides detailed reports about your sales, inventory, fulfillment, returns, reimbursements, and more.

## Features

- Connect to Amazon Selling Partner API
- **Comprehensive report generation with 70+ report types**
- **Organized by categories: Orders, Inventory, FBA, Financial, Returns, etc.**
- **Enhanced error handling and automatic retries**
- **API rate limiting and throttling protection**
- **Parallel and sequential processing modes**
- **Detailed progress tracking and logging**
- Generate reports for FBA and FBM orders
- Inventory management and analysis
- Sales performance metrics
- Returns and reimbursements tracking
- Profit and loss analysis
- Claims and disputes monitoring
- **CSV export with file management**
- **RESTful API endpoints for web integration**
- **CLI interface with flexible options**
- Custom date range selection (from 2024 to present)

## Setup Instructions

### Prerequisites

1. Node.js (v16+)
2. Amazon Seller Central account
3. Amazon Selling Partner API credentials

### API Credentials Setup

1. Register for Amazon Selling Partner API access at [Amazon Seller Central](https://sellercentral.amazon.com/)
2. Create an IAM user and application in AWS
3. Generate the following credentials (for amazon-sp-api v2):
   - SELLING_PARTNER_APP_CLIENT_ID (from Seller Central LWA application)
   - SELLING_PARTNER_APP_CLIENT_SECRET (from Seller Central LWA application)
   - SELLING_PARTNER_REFRESH_TOKEN (from OAuth process with your seller account)
   - AWS_SELLING_PARTNER_ACCESS_KEY_ID (from AWS IAM user)
   - AWS_SELLING_PARTNER_SECRET_ACCESS_KEY (from AWS IAM user)
   - AWS_SELLING_PARTNER_ROLE (ARN of the IAM role with SP-API permissions)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/amazonreports.git
cd amazonreports

# Install dependencies
npm install

# Create and configure the .env file (see .env.example)

# Start the application
npm start
```

## Environment Configuration

Create a `.env` file in the project root with the following variables (new naming
used by `amazon-sp-api` v2):

```
# Amazon SP-API Credentials
SELLING_PARTNER_APP_CLIENT_ID=your_client_id
SELLING_PARTNER_APP_CLIENT_SECRET=your_client_secret
SELLING_PARTNER_REFRESH_TOKEN=your_refresh_token
AWS_SELLING_PARTNER_ACCESS_KEY_ID=your_aws_access_key
AWS_SELLING_PARTNER_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SELLING_PARTNER_ROLE=your_role_arn

# Region settings
SP_API_REGION=NA # NA, EU, FE
MARKETPLACE_ID=your_marketplace_id

# App settings
PORT=3000
```

The application also falls back to the older environment variable names
(`SP_API_CLIENT_ID`, `SP_API_CLIENT_SECRET`, etc.) for backward compatibility.

## Usage

### Web Application
1. Start the application with `npm start`
2. Navigate to `http://localhost:3000` in your browser
3. Authenticate with your Amazon credentials if required
4. Use the dashboard to generate and view reports

### Comprehensive Report Generation

#### CLI Usage
Generate all available reports:
```bash
node get-all-reports.js
```

Generate reports for last 7 days:
```bash
node get-all-reports.js --days 7
```

Generate specific category reports:
```bash
node get-all-reports.js --categories ORDERS,INVENTORY
```

Use parallel processing for faster generation:
```bash
node get-all-reports.js --parallel --batch-size 3
```

Combined options:
```bash
node get-all-reports.js --days 14 --categories FINANCIAL --parallel
```

#### API Endpoints

**Generate All Reports:**
```bash
POST /api/comprehensive-reports/generate/all
{
  "days": 30,
  "parallel": false,
  "batchSize": 5
}
```

**Generate Category Reports:**
```bash
POST /api/comprehensive-reports/generate/categories
{
  "categories": ["ORDERS", "INVENTORY"],
  "days": 7,
  "parallel": true
}
```

**Get Available Categories:**
```bash
GET /api/comprehensive-reports/categories
```

**Get Report Types:**
```bash
GET /api/comprehensive-reports/types
```

**Get Latest Reports:**
```bash
GET /api/comprehensive-reports/latest?category=ORDERS&limit=10
```

**Get Recent Summaries:**
```bash
GET /api/comprehensive-reports/summaries?days=7
```

**Download Report:**
```bash
GET /api/comprehensive-reports/download/{filename}
```

#### Service Integration
```javascript
const comprehensiveReportService = require('./src/services/comprehensive-report.service');

// Generate all reports
const result = await comprehensiveReportService.generateAllReports({
  dateRange: 7,
  parallel: true,
  batchSize: 3
});

// Generate specific categories
const categoryResult = await comprehensiveReportService.generateCategoryReports(
  ['ORDERS', 'INVENTORY'],
  { dateRange: 14 }
);

// Get storage statistics
const stats = comprehensiveReportService.getStorageStats();
```

## Available Reports

The application supports comprehensive report generation across multiple categories:

### 📋 Report Categories (70+ Types)

**LISTING (11 reports):**
- Open Listings Data
- Merchant Listings Data (various formats)
- Cancelled Listings Data
- Listing Defect Data
- PAN EU Offer Status

**ORDERS (12 reports):**
- All Orders Data (various formats and date ranges)
- Order Reports with shipping information
- Amazon Fulfilled Shipments Data
- Actionable Order Data

**FBA_SALES (4 reports):**
- Customer Shipment Sales Data
- Customer Shipment Promotion Data
- Customer Taxes Data
- Customer Shipment Replacement Data

**INVENTORY (14 reports):**
- AFN Inventory Data
- FBA Current Inventory Data
- Monthly Inventory Data
- Inventory Receipts and Adjustments
- Inventory Health Data
- Aged Inventory Data
- Stranded Inventory Data

**RETURNS (5 reports):**
- Customer Returns Data
- Removal Order Detail Data
- Removal Shipment Detail Data
- Recommended Removal Data
- Storage Fee Charges Data

**FINANCIAL (5 reports):**
- Settlement Report Data (V1 & V2)
- Date Range Financial Transaction Data
- Financial Events Data

**PERFORMANCE (7 reports):**
- Seller Performance Report
- Seller Feedback Data
- Brand Analytics Reports (Market Basket, Search Terms, etc.)

**VENDOR (5 reports):**
- Vendor Inventory Report
- Vendor Sales Report
- Vendor Traffic Report
- Vendor Forecasting Report

**TAX (4 reports):**
- GST MTR Reports
- Amazon VAT Invoice and Transaction Data

**OTHER (5 reports):**
- Restock Inventory Recommendations
- Browse Tree Data
- EasyShip Documents
- FBA SNS Performance Data

### 🚀 Key Features

- **Comprehensive Coverage:** 70+ different Amazon SP-API report types
- **Smart Organization:** Reports grouped into logical categories
- **Flexible Processing:** Sequential or parallel processing modes
- **Error Resilience:** Automatic retries with exponential backoff
- **Rate Limiting:** Built-in API throttling protection
- **Progress Tracking:** Real-time status updates and detailed logging
- **File Management:** Automatic CSV export with organized storage
- **Background Processing:** API endpoints support async generation
- **CLI Interface:** Command-line tool with flexible options