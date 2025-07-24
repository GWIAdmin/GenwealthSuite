const fetch = require('node-fetch');
const { getToken } = require('./auth');

const DRIVE_ITEM_ID = process.env.DRIVE_ITEM_ID;
const WORKSHEET = 'Sheet1';

async function calculateTax(a, b) {
  const token = await getToken();
  const baseUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${DRIVE_ITEM_ID}/workbook/worksheets/${WORKSHEET}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Start session
  let res = await fetch(`${baseUrl}/createSession`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ persistChanges: true })
  });
  const { id: sessionId } = await res.json();
  headers['workbook-session-id'] = sessionId;

  // 2. Write inputs
  await fetch(`${baseUrl}/range(address='A1:B1')/values`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ values: [[a, b]] })
  });

  // 3. Read result
  res = await fetch(`${baseUrl}/range(address='C1')/values`, {
    method: 'GET',
    headers
  });
  const { values } = await res.json();

  // 4. Close session
  await fetch(`${baseUrl}/closeSession`, {
    method: 'POST',
    headers
  });

  return values[0][0];
}

module.exports = { calculateTax };
