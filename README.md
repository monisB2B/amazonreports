# Amazon Seller Central Reports

A comprehensive reporting application that connects to Amazon Seller Central API and provides detailed reports about your sales, inventory, fulfillment, returns, reimbursements, and more.

## Features

- Connect to Amazon Selling Partner API
- Generate reports for FBA and FBM orders
- Inventory management and analysis
- Sales performance metrics
- Returns and reimbursements tracking
- Profit and loss analysis
- Claims and disputes monitoring
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

1. Start the application with `npm start`
2. Navigate to `http://localhost:3000` in your browser
3. Authenticate with your Amazon credentials if required
4. Use the dashboard to generate and view reports

## Available Reports

- **Sales Reports**: Daily, weekly, and monthly sales data
- **Inventory Reports**: Current stock levels, inventory age, and valuation
- **Fulfillment Reports**: FBA and FBM order status and metrics
- **Returns & Reimbursements**: Tracking returns, refunds, and reimbursements
- **Financial Reports**: Profit/loss statements, fee breakdowns
- **Customer Service**: A-to-Z claims, feedback, and reviews