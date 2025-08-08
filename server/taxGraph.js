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
 * @param {object} headers - Auth/session headers including workbook-session-id
 * @param {boolean} discard - If true, forcibly discard changes even for persist=true sessions
 */
async function closeSession(headers, discard = false) {
  try {
    if (discard) {
      // Add the discardChanges=true parameter to force-discard changes
      await fetch(`${BASE_URL}/closeSession`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ discardChanges: true }) 
      });
    } else {
      await fetch(`${BASE_URL}/closeSession`, { method: 'POST', headers });
    }
    console.log('[Session] Successfully closed session');
  } catch (err) {
    console.error('[Session] Error closing session:', err);
    // Don't rethrow - we want to continue even if close fails
  }
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
  console.log(`[DEBUG] Looking for "${targetLabel}" in column A...`);
  console.log(`[DEBUG] Found at relative index: ${relTaxDueIdx}`);
  console.log(`[DEBUG] Preview nearby labels:`, cells.slice(relTaxDueIdx - 3, relTaxDueIdx + 5));

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
  console.log(`[DEBUG] After finding "${targetLabel}" at A${startRow + relTaxDueIdx}, the first non-empty label is at A${startRow + relAgiIdx}: "${cells[relAgiIdx]}"`);

  return { rows };
}

async function fetchStateSection(state, headers = null) {
  let ownSession = false;
  if (!headers) {
    headers = await startSession(false);
    ownSession = true;
  }
  try {
    await refreshWorkbook(headers);
    const { rows } = await locateStateSection(state, headers);
    const rangeAddr = `B${rows.agi}:B${rows.totalStateTax}`;
    const [[agi],[additions],[deductions],[stateTaxableIncomeInput],[stateTaxesDue],[credits],[afterTaxDeductions],[totalStateTax]]
      = await fetchRange(rangeAddr, headers);
    return { agi, additions, deductions, stateTaxableIncomeInput, stateTaxesDue, credits, afterTaxDeductions, totalStateTax };
  } finally {
    if (ownSession) await closeSession(headers, true);
  }
}

/**
 * Batch-write inputs, refresh formulas, then read outputs—
 * all in one non-persisting session.
 * @param {{cell:string,value:any}[]} writes 
 * @param {string[]}             readCells 
 * @returns {Promise<Array<{cell:string, value:any}>>}
 */
async function calculateMultiple(writes, readCells = []) {
  // 1) Open a session that does NOT commit changes
  const headers = await startSession(false);
  try {
    // 2) Write all inputs
    for (let { cell, value } of writes) {
      const body = { values: [[ value ]] };
      const res  = await fetch(
        `${SHEET_URL}/range(address='${cell}')`,
        { method: 'PATCH', headers, body: JSON.stringify(body) }
      );
      await validate(res);
    }

    // 3) Recalculate every formula in the workbook
    if (readCells.length) {
      await refreshWorkbook(headers);
    }

    // 4) Read back requested cells
    const results = [];
    for (let address of readCells) {
      const rjson = await fetch(
        `${SHEET_URL}/range(address='${address}')`,
        { method: 'GET', headers }
      ).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
      const [[ value ]] = rjson.values;
      results.push({ cell: address, value });
    }
    return results;
  } finally {
    // 5) ALWAYS discard changes when closing the session
    await closeSession(headers, true);
  }
}

/**
 * Write the user-entered state deduction back into the worksheet.
 * @param {string} state – the state name as used in the sheet labels
 * @param {number} deductions – the new deduction amount
 */
async function writeStateDeductions(state, deductions) {
  const headers = await startSession(false);
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
    // 4) CRITICAL: Always discard changes from the session
    await closeSession(headers, true);
  }
}

/**
 * Write the user’s AGI into the “agi” cell of the named state block.
 * @param {string} state       – the state name as used in the sheet labels
 * @param {number} adjustedGrossIncome
 */
async function writeStateAGI(state, adjustedGrossIncome) {
  const headers = await startSession(false);

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
    // Always discard changes when closing the session
    await closeSession(headers, true);
  }
}

/**
 * Write (optional) AGI and/or deductions to the state's block
 * and read back the 8 output cells — all inside one non‑persisting session.
 *
 * @param {string} state
 * @param {{ agi?: number, deductions?: number }} inputs
 * @returns {Promise<{
 *   agi:number, additions:number, deductions:number,
 *   stateTaxableIncomeInput:number, stateTaxesDue:number,
 *   credits:number, afterTaxDeductions:number, totalStateTax:number
 * }>}
 */
async function upsertStateInputsAndRead(state, inputs = {}) {
  const headers = await startSession(false);
  try {
    const { rows } = await locateStateSection(state, headers);

    // Batch the two patches we care about for this flow
    const patches = [];
    if (typeof inputs.agi === 'number') {
      patches.push({ address: `B${rows.agi}`, value: inputs.agi });
    }
    if (typeof inputs.deductions === 'number') {
      patches.push({ address: `B${rows.deductions}`, value: inputs.deductions });
    }

    for (const { address, value } of patches) {
      const res = await fetch(`${SHEET_URL}/range(address='${address}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ value ]] })
      });
      await validate(res);
    }

    // Recalc and read back the 8 values in one range fetch
    await refreshWorkbook(headers);
    const range = `B${rows.agi}:B${rows.totalStateTax}`;
    const [
      [agi],
      [additions],
      [deductions],
      [stateTaxableIncomeInput],
      [stateTaxesDue],
      [credits],
      [afterTaxDeductions],
      [totalStateTax]
    ] = await fetchRange(range, headers);

    return { agi, additions, deductions, stateTaxableIncomeInput, stateTaxesDue, credits, afterTaxDeductions, totalStateTax };
  } finally {
    // Discard to keep the workbook clean for everyone
    await closeSession(headers, true);
  }
}

module.exports = {
  refreshWorkbook,
  calculateMultiple,
  fetchStateSection,
  writeStateAGI,
  locateStateSection,
  writeStateDeductions,
  startSession,
  closeSession,
  SHEET_URL,
  refreshWorkbook,
  upsertStateInputsAndRead
};