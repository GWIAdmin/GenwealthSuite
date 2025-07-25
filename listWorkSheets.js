// listWorksheets.js
require('dotenv').config({ path: __dirname + '/server/.env' });
const { ConfidentialClientApplication } = require('@azure/msal-node');
const fetch = global.fetch || require('node-fetch');

const cca = new ConfidentialClientApplication({
  auth: {
    clientId:     process.env.CLIENT_ID,
    authority:    `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET
  }
});

async function getToken() {
  const r = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });
  return r.accessToken;
}

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const wb = `https://graph.microsoft.com/v1.0/drives/${process.env.DRIVE_ID}/items/${process.env.DRIVE_ITEM_ID}/workbook`;

  const res = await fetch(`${wb}/worksheets`, { headers });
  const js = await res.json();
  console.log('🗒️  Worksheets in your workbook:\n', JSON.stringify(js, null, 2));
}

main().catch(e => console.error(e));
