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
 * Decide whether the sheet expects AGI or Taxable Income for the first row
 * of the state section. We treat anything containing "taxable" as taxable
 * income; otherwise we accept "AGI" or "Adjusted Gross" as AGI.
 * @param {string} label
 * @returns {'agi'|'taxableIncome'|'unknown'}
 */
function classifyLeadLabel(label) {
  const s = (label || '').toLowerCase();
  if (s.includes('taxable')) return 'taxableIncome';
  if (s.includes('agi') || s.includes('adjusted gross')) return 'agi';
  return 'unknown';
}

/**
 * Locate the rows for a given state’s section in the worksheet.
 * Finds “[State] Tax Due”, then the very next non-empty label (AGI/Taxable Income),
 * and returns row numbers plus that label and a classification.
 * @returns {{rows: {
 *   agi:number, additions:number, deductions:number, taxableIncome:number,
 *   taxesDue:number, credits:number, afterTaxDed:number, totalStateTax:number
 * }, leadLabel:string, leadKind:'agi'|'taxableIncome'|'unknown'}}
 */
async function locateStateSection(state, headers) {
  const startRow = 892;
  const colAValues = await fetchRange(`A${startRow}:A2465`, headers);
  if (!Array.isArray(colAValues)) {
    throw new Error(`Could not read any data in A${startRow}:A2465; check your sheet range.`);
  }
  const cells = colAValues.map(r => (r[0] || '').toString().trim());

  const targetLabel = `${state} Tax Due`;
  const relTaxDueIdx = cells.findIndex(val => val === targetLabel);
  if (relTaxDueIdx === -1) {
    throw new Error(`Could not find “${targetLabel}” between A${startRow} and A2465`);
  }

  const relAgiIdx = cells.findIndex((val, idx) => idx > relTaxDueIdx && val !== '');
  if (relAgiIdx === -1) {
    throw new Error(`Could not find AGI/Taxable Income after A${startRow + relTaxDueIdx}`);
  }

  const rows = {
    agi:           startRow + relAgiIdx,
    additions:     startRow + relAgiIdx + 1,
    deductions:    startRow + relAgiIdx + 2,
    taxableIncome: startRow + relAgiIdx + 3,
    taxesDue:      startRow + relAgiIdx + 4,
    credits:       startRow + relAgiIdx + 5,
    afterTaxDed:   startRow + relAgiIdx + 6,
    totalStateTax: startRow + relAgiIdx + 7
  };

  const leadLabel = cells[relAgiIdx];
  const leadKind  = classifyLeadLabel(leadLabel);
  console.log(`[DEBUG] State block lead label "${leadLabel}" at A${startRow + relAgiIdx} → kind=${leadKind}`);

  return { rows, leadLabel, leadKind };
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
 * Write (optional) AGI/Taxable Income + any user-edited state inputs, then
 * read the 8 outputs — all in one non-persisting session.
 *
 * Accepts any subset of:
 *   { agi, taxableIncome, additions, deductions, credits, afterTaxDeductions, year, filingStatus }
 *
 * Returns: { agi, additions, deductions, stateTaxableIncomeInput, stateTaxesDue,
 *            credits, afterTaxDeductions, totalStateTax }
 */
async function upsertStateInputsAndRead(state, inputs = {}) {
  const headers = await startSession(false);
  try {
    const { rows, leadKind, leadLabel } = await locateStateSection(state, headers);

    // Ensure state/year/status context is set for this session
    const prePatches = [{ address: 'B3', value: `${state} Taxes` }];
    if (typeof inputs.year === 'number') {
      prePatches.push({ address: 'B1', value: inputs.year });
    }
    if (typeof inputs.filingStatus === 'string' && inputs.filingStatus.trim() !== '') {
      prePatches.push({ address: 'B2', value: inputs.filingStatus.trim() });
    }
    for (const { address, value } of prePatches) {
      const res = await fetch(`${SHEET_URL}/range(address='${address}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ value ]] })
      });
      await validate(res);
    }

    let leadValue;
    if (leadKind === 'taxableIncome') {
      if (typeof inputs.taxableIncome !== 'number' || Number.isNaN(inputs.taxableIncome)) {
        throw new Error(`Sheet expects "Taxable Income" but no taxableIncome was provided.`);
      }
      leadValue = inputs.taxableIncome;
    } else if (leadKind === 'agi') {
      if (typeof inputs.agi !== 'number' || Number.isNaN(inputs.agi)) {
        throw new Error(`Sheet expects "AGI" but no agi was provided.`);
      }
      leadValue = inputs.agi;
    } else {
      throw new Error(`Unrecognized lead label "${leadLabel}" — expected AGI or Taxable Income.`);
    }

    const patches = [];
    if (typeof leadValue === 'number')            patches.push({ address: `B${rows.agi}`,        value: leadValue });
    if (typeof inputs.additions === 'number')     patches.push({ address: `B${rows.additions}`,  value: inputs.additions });
    if (typeof inputs.deductions === 'number')    patches.push({ address: `B${rows.deductions}`, value: inputs.deductions });
    if (typeof inputs.credits === 'number')       patches.push({ address: `B${rows.credits}`,    value: inputs.credits });
    if (typeof inputs.afterTaxDeductions === 'number')
                                                  patches.push({ address: `B${rows.afterTaxDed}`,value: inputs.afterTaxDeductions });

    if (patches.length) {
      for (const { address, value } of patches) {
        const res = await fetch(`${SHEET_URL}/range(address='${address}')`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ values: [[ value ]] })
        });
        await validate(res);
      }
    }

    // Recalc once, then read the contiguous 8-row block
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
    await closeSession(headers, true);
  }
}

function norm(s) {
  return (s ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
}

async function findRowsByLabels(state, labels, headers) {
  const startRow = 892;
  const colAValues = await fetchRange(`A${startRow}:A2465`, headers);
  const cells = colAValues.map(r => (r[0] || '').toString().trim());

  const anchor      = `${state} Tax Due`;
  const anchorIdx   = cells.findIndex(v => norm(v) === norm(anchor));
  if (anchorIdx === -1) throw new Error(`Could not find “${anchor}” between A${startRow} and A2465`);

  const rowsByKey = {};
  for (const [key, label] of Object.entries(labels)) {
    const want = norm(label);
    let idx = -1;

    // exact anchor match (top "Tax Due" line)
    if (want === norm(anchor)) idx = anchorIdx;

    // prefer matches below the anchor
    if (idx === -1) {
      idx = cells.findIndex((val, i) => i >= (anchorIdx + 1) && norm(val) === want);
    }

    // fall back to scanning upward
    if (idx === -1) {
      for (let i = anchorIdx - 1; i >= 0; i--) {
        if (norm(cells[i]) === want) { idx = i; break; }
      }
    }

    if (idx === -1) {
      throw new Error(`Could not find label “${label}” for key “${key}” around A${startRow + anchorIdx}`);
    }
    rowsByKey[key] = startRow + idx;
  }

  return rowsByKey;
}

/**
 * Flexible upsert + read for outlier schemas.
 * opts: { year?, filingStatus?, leadKey?, labels:{key->label}, readKeys?:string[] }
 * vals: { agi?, taxableIncome?, ...any inputs keyed by schema keys... }
 */
async function upsertStateInputsAndReadFlex(state, opts, vals) {
  const headers = await startSession(false);
  try {
    const { labels, readKeys = Object.keys(labels), leadKey, ioByKey = {} } = opts || {};
    if (!labels || !Object.keys(labels).length) {
      throw new Error('Schema labels are required.');
    }

    // Set sheet context
    const pre = [{ address: 'B3', value: `${state} Taxes` }];
    if (typeof opts.year === 'number')        pre.push({ address: 'B1', value: opts.year });
    if (typeof opts.filingStatus === 'string' && opts.filingStatus.trim() !== '') {
      pre.push({ address: 'B2', value: opts.filingStatus.trim() });
    }
    for (const p of pre) {
      await fetch(`${SHEET_URL}/range(address='${p.address}')`, {
        method: 'PATCH', headers, body: JSON.stringify({ values: [[ p.value ]] })
      }).then(validate);
    }

    const rowsByKey = await findRowsByLabels(state, labels, headers);

    // Choose a safe write target (prefer AGI; never write to formula-only outputs)
    const valByKey = { agi: vals.agi, taxableIncome: vals.taxableIncome };

    function pickWriteKey() {
      // 1) Prefer AGI when present and numeric
      if (rowsByKey.agi != null && typeof valByKey.agi === 'number') return 'agi';
    
      // 2) Otherwise use the provided leadKey if it exists and is not flagged as an output
      if (leadKey && rowsByKey[leadKey] != null) {
        const io = ioByKey[leadKey];
        if (io !== 'output' && typeof valByKey[leadKey] === 'number') return leadKey;
      }
    
      // 3) Otherwise fall back to Taxable Income only if it's not flagged as output
      if (rowsByKey.taxableIncome != null && typeof valByKey.taxableIncome === 'number') {
        const io = ioByKey.taxableIncome;
        if (io !== 'output') return 'taxableIncome';
      }
    
      throw new Error('Unable to choose a safe write key (AGI/Taxable Income). Check your template labels and io flags.');
    }

    const writeKey = pickWriteKey();
    const leadVal  = (writeKey === 'agi') ? vals.agi : vals.taxableIncome;
    if (typeof leadVal !== 'number' || Number.isNaN(leadVal)) {
      throw new Error(`Sheet expects "${writeKey.toUpperCase()}" but no valid number was provided.`);
    }

    // Build patches (lead first)
    const patches = [{ address: `B${rowsByKey[writeKey]}`, value: leadVal }];

    // Add numeric user inputs (front end only sends inputs for io:'input')
    for (const [key, row] of Object.entries(rowsByKey)) {
      if (key === writeKey) continue; // lead already handled
      if (Object.prototype.hasOwnProperty.call(vals, key) && typeof vals[key] === 'number') {
        patches.push({ address: `B${row}`, value: vals[key] });
      }
    }

    // Safety: fail early if an address is malformed
    for (const { address, value } of patches) {
      if (!/^B\d+$/.test(address)) {
        throw new Error(`Invalid cell address computed: ${address}. Check your template labels.`);
      }
      await fetch(`${SHEET_URL}/range(address='${address}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ value ]] })
      }).then(validate);
    }

    // Recalc workbook once, then read only requested keys
    await refreshWorkbook(headers);
    const out = {};
    for (const key of readKeys) {
      const row = rowsByKey[key];
      if (!row) continue;
      const [[val]] = await fetchRange(`B${row}:B${row}`, headers);
      out[key] = val;
    }

    return out;
  } finally {
    await closeSession(headers, true);
  }
}

module.exports = {
  // graph/session helpers
  startSession,
  closeSession,
  validate,
  fetchRange,
  refreshWorkbook,
  SHEET_URL,
  // state block helpers
  locateStateSection,
  fetchStateSection,
  writeStateAGI,
  writeStateDeductions,
  calculateMultiple,
  // classic 8-row flow (32 states)
  upsertStateInputsAndRead,
  // outlier schema flow (the 11 states)
  upsertStateInputsAndReadFlex,
  findRowsByLabels
};