# Amazon SP-API Demo

Simple Node.js application demonstrating how to obtain an access token and call the Selling Partner API.

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and fill in your Amazon credentials.
   The file should include your SP-API client credentials and AWS keys:
   `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SELLING_PARTNER_ROLE`, and `MARKETPLACE_ID`.

3. Start the server:

```bash
node index.js
```

4. Generate the sample reports (optional):
```bash
npm run reports
```
The command runs `src/reports.js` with a preset date range and writes CSV files to `reports/`.

5. Open [http://localhost:3000/](http://localhost:3000/) in your browser to verify it works.

