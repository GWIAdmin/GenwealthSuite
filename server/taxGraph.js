// server/taxGraph.js
require('dotenv').config({ path: __dirname + '/.env' });
const { getToken } = require('./auth');

// Constants from .env
const DRIVE_ID    = process.env.DRIVE_ID;
const ITEM_ID     = process.env.DRIVE_ITEM_ID;
const SHEET       = process.env.WORKSHEET;

const WORKBOOK    = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}/workbook`;
const SHEET_PATH  = `${WORKBOOK}/worksheets('${SHEET}')`;

async function calculateTax(a, b) {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // diagnostic: print the filename you’re about to open
  const metaRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}`,
    { method: 'GET', headers }
  );
  const meta = await metaRes.json();
  console.log('📄 Using file:', meta.name, `(id: ${ITEM_ID})`);


  // 1) create session
  let res = await fetch(`${WORKBOOK}/createSession`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ persistChanges: true })
  });
  if (!res.ok) throw new Error(`createSession failed: ${res.status} ${await res.text()}`);
  const { id: sessionId } = await res.json();
  headers['workbook-session-id'] = sessionId;

  // 2) write inputs
  res = await fetch(`${SHEET_PATH}/range(address='A1:B1')`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ values: [[ a, b ]] })
  });
  if (!res.ok) throw new Error(`write inputs failed: ${res.status} ${await res.text()}`);

  // 3) read result
  res = await fetch(`${SHEET_PATH}/range(address='C1')`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`read result failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!Array.isArray(data.values) || data.values.length === 0) {
    throw new Error(`empty or unexpected data: ${JSON.stringify(data)}`);
  }
  const tax = data.values[0][0];

  // 4) close session
  await fetch(`${WORKBOOK}/closeSession`, { method: 'POST', headers });

  return tax;
}

module.exports = { calculateTax };
