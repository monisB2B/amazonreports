const express = require('express');
const dotenv = require('dotenv');
const fetch = global.fetch;

dotenv.config();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  BASE_URL = 'https://sellingpartnerapi-na.amazon.com',
  PORT = 3000
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Missing CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN in environment');
  process.exit(1);
}

async function getAccessToken() {
  const url = 'https://api.amazon.com/auth/o2/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', REFRESH_TOKEN);
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return { access_token: data.access_token, expires_in: data.expires_in };
  } catch (err) {
    console.error('Error fetching access token:', err);
    throw err;
  }
}

async function getMarketplaceParticipations(accessToken) {
  const url = `${BASE_URL}/sellers/v1/marketplaceParticipations`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Marketplace request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.payload || [];
  } catch (err) {
    console.error('Error fetching marketplace participations:', err);
    throw err;
  }
}

const app = express();

app.get('/', async (req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const participations = await getMarketplaceParticipations(access_token);
    const rows = participations.map(p => `<tr><td>${p.marketplace.id}</td><td>${p.marketplace.name}</td></tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <title>Marketplace Participations</title>
</head>
<body class="p-4">
  <h1 class="mb-4">Marketplace Participations</h1>
  <table class="table table-bordered">
    <thead><tr><th>ID</th><th>Name</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
    res.send(html);
  } catch (err) {
    console.error('Failed to handle request:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = { getAccessToken, getMarketplaceParticipations };
