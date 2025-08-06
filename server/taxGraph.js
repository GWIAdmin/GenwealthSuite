// server/taxGraph.js
require('dotenv').config({ path: __dirname + '/.env' });
const fetch = require('node-fetch');
const { getToken } = require('./auth');

const DRIVE_ID   = process.env.DRIVE_ID;
const ITEM_ID    = process.env.DRIVE_ITEM_ID;
const SHEET_NAME = process.env.WORKSHEET;
const BASE_URL   = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}/workbook`;
const SHEET_URL  = `${BASE_URL}/worksheets('${SHEET_NAME}')`;

/**
 * Helper: throw if response not OK
 */
async function validate(res) {
  if (!res.ok) {
    // if we got HTML back instead of JSON, the service is probably down
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      throw new Error('Excel Online service is temporarily unavailable. Please try again in a few minutes.');
    }
    // otherwise bubble up the JSON or plain-text error
    const text = await res.text().catch(()=>'');
    throw new Error(`Graph API error [${res.status}]: ${text}`);
  }
}

/**
 * Start a workbook session.
 * @param {boolean} persistChanges – if true, commits writes to the workbook.
 * @returns {Promise<object>} headers including workbook-session-id
 */
async function startSession(persistChanges = false) {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const res = await fetch(`${BASE_URL}/createSession`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ persistChanges })
  });
  await validate(res);
  const { id: sessionId } = await res.json();
  headers['workbook-session-id'] = sessionId;
  return headers;
}

/**
 * End the workbook session.
 */
async function closeSession(headers) {
  await fetch(`${BASE_URL}/closeSession`, { method: 'POST', headers });
}

/**
 * GET a rectangular range; returns its 2D `values` array.
 */
async function fetchRange(address, headers) {
  const res = await fetch(`${SHEET_URL}/range(address='${address}')`, { method: 'GET', headers });
  await validate(res);
  return (await res.json()).values;
}

/**
 * Force the workbook to recalc everything.
 */
async function refreshWorkbook(headers) {
  await fetch(`${BASE_URL}/application/refreshAll`, { method: 'POST', headers });
}

/**
 * Locate the rows for a given state’s section in the worksheet.
 * It finds “[State] Tax Due” in column A, then the very next non-empty cell
 * (Taxable Income), and computes AGI, additions, deductions, etc. by offset.
 *
 * @param {string} state
 * @param {object} headers  – auth/session headers from startSession()
 * @returns {{rows: {
 *   agi: number,
 *   additions: number,
 *   deductions: number,
 *   taxableIncome: number,
 *   taxesDue: number,
 *   credits: number,
 *   afterTaxDed: number,
 *   totalStateTax: number
 * }}}
 */
async function locateStateSection(state, headers) {
  // 1) Read only the block that contains your state‐section labels
  const startRow = 892;
  const colAValues = await fetchRange(`A${startRow}:A2325`, headers);
  if (!Array.isArray(colAValues)) {
    throw new Error(`Could not read any data in A${startRow}:A2325; check your sheet range.`);
  }
  // Trim off whitespace
  const cells = colAValues.map(r => (r[0] || '').toString().trim());

  // 2) Locate “[State] Tax Due” within that block
  const targetLabel = `${state} Tax Due`;
  const relTaxDueIdx = cells.findIndex(val => val === targetLabel);
  if (relTaxDueIdx === -1) {
    throw new Error(`Could not find “${targetLabel}” between A${startRow} and A2325`);
  }

  // 3) From there, find the very next non-empty row (your “Taxable Income” label)
  const relAgiIdx = cells.findIndex((val, idx) => idx > relTaxDueIdx && val !== '');
  if (relAgiIdx === -1) {
    throw new Error(`Could not find AGI/Taxable Income after A${startRow + relTaxDueIdx}`);
  }

  // 4) Build absolute row numbers by adding our startRow offset
  const rows = {
    agi:                startRow + relAgiIdx,
    additions:          startRow + relAgiIdx + 1,
    deductions:         startRow + relAgiIdx + 2,
    taxableIncome:      startRow + relAgiIdx + 3,
    taxesDue:           startRow + relAgiIdx + 4,
    credits:            startRow + relAgiIdx + 5,
    afterTaxDed:        startRow + relAgiIdx + 6,
    totalStateTax:      startRow + relAgiIdx + 7
  };

  return { rows };
}

/**
 * Fetch all of the state-section values in one call—no writes.
 * @param {string} state – the state name as used in the sheet labels
 * @returns {Promise<{
 *   agi: number,
 *   additions: number,
 *   deductions: number,
 *   credits: number,
 *   afterTaxDeductions: number,
 *   stateTaxableIncomeInput: number,
 *   stateTaxesDue: number,
 *   totalStateTax: number
 * }>}
 */
async function fetchStateSection(state) {
  // 1) open a non-persisting session
  const headers = await startSession();

  try {
    // make sure all formulas (including your state deduction) are recalculated
    await refreshWorkbook(headers);
    // 2) locate the rows
    const { rows } = await locateStateSection(state, headers);

    // 3) read B{agi}:B{totalStateTax} in one call
    const rangeAddr = `B${rows.agi}:B${rows.totalStateTax}`;
    const values = await fetchRange(rangeAddr, headers);

    // 4) pull out each value
    const [
      [agi],
      [additions],
      [deductions],
      [stateTaxableIncomeInput],
      [stateTaxesDue],
      [credits],
      [afterTaxDeductions],
      [totalStateTax]
    ] = values;

    return {
      agi,
      additions,
      deductions,
      credits,
      afterTaxDeductions,
      stateTaxableIncomeInput,
      stateTaxesDue,
      totalStateTax
    };
  } finally {
    // 5) always close the session
    await closeSession(headers);
  }
}

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
  console.error(`Error during GET for cell "${cell}":`, errorText);
  throw new Error(errorText);
}
    const { values: [[ result ]] } = await res.json();
    results.push({ cell, value: result });
  }

  // 4) close session
  await fetch(`${BASE_URL}/closeSession`, { method: 'POST', headers });

  return results;
}

/**
 * Write the user-entered state deduction back into the worksheet.
 * @param {string} state – the state name as used in the sheet labels
 * @param {number} deductions – the new deduction amount
 */
async function writeStateDeductions(state, deductions) {
  // 1) Open a **persisting** session so that PATCH actually commits
  const headers = await startSession(true);                       // :contentReference[oaicite:10]{index=10}
  try {
    // 2) Locate the “deductions” row in column A
    const { rows } = await locateStateSection(state, headers);
    // 3) Single-cell PATCH
    const cell = `B${rows.deductions}`;
    console.log(`[stateDeductions] writing Deduction to ${cell}:`, deductions);
    const body = { values: [[ deductions ]] };
    const res  = await fetch(
      `${SHEET_URL}/range(address='${cell}')`,
      { method: 'PATCH', headers, body: JSON.stringify(body) }
    );
    await validate(res);
  } finally {
    // 4) Always close (and commit) the session
    await closeSession(headers);
  }
}

/**
 * Write the user’s AGI into the “agi” cell of the named state block.
 * @param {string} state       – the state name as used in the sheet labels
 * @param {number} adjustedGrossIncome
 */
async function writeStateAGI(state, adjustedGrossIncome) {
  // open a persisting session so our write actually sticks
  const headers = await startSession(true);

  try {
    // locate the state block’s rows
    const { rows } = await locateStateSection(state, headers);    // uses your existing locate logic :contentReference[oaicite:2]{index=2}

    // PATCH B{agiRow} = adjustedGrossIncome
    const cell = `B${rows.agi}`;
    console.log(`[stateAGI] writing AGI to ${cell}:`, adjustedGrossIncome);
    const res  = await fetch(
      `${SHEET_URL}/range(address='${cell}')`,
      {
        method:  'PATCH',
        headers,
        body:    JSON.stringify({ values: [[ adjustedGrossIncome ]] })
      }
    );
    await validate(res);
  } finally {
    await closeSession(headers);
  }
}

module.exports = {
  refreshWorkbook,
  calculateMultiple,
  fetchStateSection,
  writeStateAGI,
  locateStateSection,
  writeStateDeductions
};