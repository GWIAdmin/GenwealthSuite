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
    const text = await res.text().catch(()=>'');
    throw new Error(`Graph API error [${res.status}]: ${text}`);
  }
}

/**
 * Start a workbook session; returns headers w/ session id.
 */
async function startSession() {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const res = await fetch(`${BASE_URL}/createSession`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ persistChanges: false })
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
 * PATCH a single cell to the given value.
 */
async function patchCell(address, value, headers) {
  const res = await fetch(`${SHEET_URL}/range(address='${address}')`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ values: [[ value ]] })
  });
  await validate(res);
}

/**
 * Force the workbook to recalc everything.
 */
async function refreshWorkbook(headers) {
  await fetch(`${BASE_URL}/application/refreshAll`, { method: 'POST', headers });
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

async function calculateStateSection(state, agi, additions, deductions, credits, afterTaxDeductions) {

  // 1) Start a session for header scan
  const headers = await startSession();

  // 2) Fetch labels in A892:A2325 to locate the “<State> Tax Due” section
  const allA = await fetchRange('A892:A2325', headers);

  // 3) Normalize state and build target label, e.g. "california tax due"
  const normalizedState = String(state)
    .trim()
    // strip any trailing "tax", "taxes", or "tax due"
    .replace(/\s+(?:tax(?:es)?(?:\s+due)?)$/i, '')
    .toLowerCase();
  const targetLabel = `${normalizedState} tax due`;

  // 4) Locate “<State> Tax Due” only when correctly paired with its “Taxable Income” and “AGI”
  let headerRow, agiRow;
  for (let i = 0; i < allA.length; i++) {
    const raw = allA[i][0] || '';
    const txt = raw.toString().toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (txt === targetLabel) {
      // (a) Look immediately above (skipping blanks) for "<State> Taxable Income"
      let k = i - 1;
      while (k >= 0 && !(allA[k][0]||'').toString().trim()) k--;
      const prev = (allA[k] && allA[k][0] || '')
        .toString().toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!/taxable income$/i.test(prev)) {
        console.log(
          `[STATE SECTION] Skipped candidate at row ${892 + i} (“${raw}”), ` +
          `prev label is “${allA[k] ? allA[k][0] : ''}” not ending in “Taxable Income”`
        );
        continue;
      }


      // (b) Look immediately below (skipping blanks) for "AGI"
      let j = i + 1;
      while (j < allA.length && !(allA[j][0]||'').toString().trim()) j++;
      const next = (allA[j][0]||'').toString().toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (next !== 'agi') {
        console.log(
          `[STATE SECTION] Skipped candidate at row ${892 + i} (“${raw}”), ` +
          `next label is “${allA[j][0]||''}” not “AGI”`
        );
        continue;
      }

      // (c) We’re confident this is the real state section
      headerRow = 892 + i;
      agiRow    = 892 + j;
      console.log(
        `[STATE SECTION] Matched header "${raw}" at row ${headerRow}, AGI at row ${agiRow}`
      );
      break;
    }
  }

  if (!headerRow) {
    await closeSession(headers);
    throw new Error(`Could not find a valid “${targetLabel}” section.`);
  }

  // ── 5) Scan the next 20 rows below the header for labels (AGI, Deductions, etc.)
  const sliceStart = headerRow + 1;
  const sliceEnd   = headerRow + 20;
  const belowA     = await fetchRange(`A${sliceStart}:A${sliceEnd}`, headers);

  const needed = {
    agi:                'agi',
    additions:          'additions to income',
    deductions:         'deductions',
    taxableIncome:      'state taxable income',
    taxesDue:           'state taxes due',
    credits:            'credits',
    afterTaxDed:        'after tax deductions',
    totalStateTax:      'total'
  };
  const rows = {};
  belowA.forEach((r, idx) => {
    const raw = (r[0]||'').toString().toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    for (let [key, label] of Object.entries(needed)) {
      if (raw === label) {
        rows[key] = sliceStart + idx;
        console.log(`[STATE SECTION] Found "${label}" at row ${rows[key]}`);
      }
    }
  });
  // ensure we located all required labels
  for (let key of Object.keys(needed)) {
    if (!rows[key]) {
      await closeSession(headers);
      throw new Error(`Could not locate "${needed[key]}" in state section.`);
    }
  }

  // ── 6) Close mapping session & do all writes+reads in one go ──────────
  await closeSession(headers);
  const writesBatch = [
    { cell: `B${rows.agi}`,            value: agi },
    { cell: `B${rows.additions}`,      value: additions },
    { cell: `B${rows.deductions}`,     value: deductions },
    { cell: `B${rows.credits}`,        value: credits },
    { cell: `B${rows.afterTaxDed}`,    value: afterTaxDeductions }
  ];
  const readCells = [
    `B${rows.agi}`,
    `B${rows.taxableIncome}`,
    `B${rows.taxesDue}`,
    `B${rows.totalStateTax}`
  ];
  const [
    { value: adjustedGrossIncome },
    { value: stateTaxableIncomeInput },
    { value: stateTaxesDue },
    { value: totalStateTax }
  ] = await calculateMultiple(writesBatch, readCells);

  return { adjustedGrossIncome, stateTaxableIncomeInput, stateTaxesDue, totalStateTax };
};

module.exports = { calculateMultiple, calculateStateSection };