// server/taxGraph.js
require('dotenv').config({ path: __dirname + '/.env' });
const fetch = require('node-fetch');
const { getToken } = require('./auth');

const DRIVE_ID   = process.env.DRIVE_ID;
const ITEM_ID    = process.env.ITEM_ID;
const SHEET_NAME = process.env.WORKSHEET;
const BASE_URL   = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}/workbook`;
const SHEET_URL  = `${BASE_URL}/worksheets('${SHEET_NAME}')`;

async function calculateMultiple(writes, readCells) {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1) start a session to keep changes in memory until close
  let res = await fetch(`${BASE_URL}/createSession`, {
    method: 'POST', headers,
    body: JSON.stringify({ persistChanges: false })
  });
  if (!res.ok) throw new Error(await res.text());
  const { id: sessionId } = await res.json();
  headers['workbook-session-id'] = sessionId;

  // 2) write each value to its cell
  for (let { cell, value } of writes) {
    const body = { values: [[ value ]] };
    res = await fetch(
      `${SHEET_URL}/range(address='${cell}')`,
      { method: 'PATCH', headers, body: JSON.stringify(body) }
    );
    if (!res.ok) throw new Error(await res.text());
  }

  // 3) read back each requested cell
  const results = [];
  for (let cell of readCells) {
    res = await fetch(
      `${SHEET_URL}/range(address='${cell}')`,
      { method: 'GET', headers }
    );
    if (!res.ok) {
  const errorText = await res.text();
  console.error(`Error during ${method} ${cell}: ${errorText}`);
  throw new Error(errorText);
}
    const { values: [[ result ]] } = await res.json();
    results.push({ cell, value: result });
  }

  // 4) close session
  await fetch(`${BASE_URL}/closeSession`, { method: 'POST', headers });

  return results;
}

module.exports = { calculateMultiple };