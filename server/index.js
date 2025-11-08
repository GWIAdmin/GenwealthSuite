const fetch = require('node-fetch');
global.fetch = fetch;
const express = require('express');
const path    = require('path');
const { calculateMultiple, startSession, closeSession, writeStateDeductions, writeStateAGI, locateStateSection, SHEET_URL, refreshWorkbook, fetchStateSection, upsertStateInputsAndRead, upsertStateInputsAndReadFlex } = require('./taxGraph');

require('dotenv').config({ path: __dirname + '/.env' });   // load server/.env for LOCAL_XLSX_PATH
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs/promises');

const app = express();
app.use(express.json());

// ─── STATIC FILE SERVING ──────────────────────────────────────────────────────
// Serve any file in the parent folder (your project root),
app.use(express.static(path.join(__dirname, '..')));

// Optional: explicit GET / to send index.html
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'index.html'))
);
// ───────────────────────────────────────────────────────────────────────────────

// === helper: coerce possibly-formatted strings to number ===
function asNumber(x) {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    const cleaned = x.replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

app.post('/api/sheetData', async (req, res) => {
  const { writes, readCells } = req.body;
  try {
    const results = await calculateMultiple(writes, readCells);
    res.json({ results });
  } catch (err) {
    console.error('SheetData error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calculateStateTaxes', async (req, res) => {
  const { writes, state } = req.body;
  const agi      = asNumber(req.body.agi);
  const taxableIncome    = asNumber(req.body.taxableIncome);
  const w2Income         = asNumber(req.body.w2Income);
  let headers;

  if (!state || !writes) {
    return res.status(400).json({ error: 'State and writes payload are required.' });
  }

  try {
    console.log(`[calculateStateTaxes] ${state}: AGI=${agi}, Taxable=${taxableIncome}, W2=${w2Income}`);

    headers = await startSession(false);
    const { rows, leadKind, leadLabel } = await locateStateSection(state, headers);

    const leadValue =
      leadKind === 'taxableIncome'
        ? (typeof taxableIncome === 'number' ? taxableIncome : agi)
        : (typeof agi === 'number' ? agi : taxableIncome);

    if (typeof leadValue === 'number') {
      const leadCell = `B${rows.agi}`;
      console.log(`[calculateStateTaxes] lead label "${leadLabel}" => writing ${leadValue} to ${leadCell}`);
      await fetch(`${SHEET_URL}/range(address='${leadCell}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ leadValue ]] })
      });
      await refreshWorkbook(headers);
    }

    const readRange = [
      `B${rows.agi}`,
      `B${rows.additions}`,
      `B${rows.deductions}`,
      `B${rows.taxableIncome}`,
      `B${rows.taxesDue}`,
      `B${rows.credits}`,
      `B${rows.afterTaxDed}`,
      `B${rows.totalStateTax}`
    ];

    const results = await calculateMultiple(writes, readRange);
    const keys = ['agi','additions','deductions','stateTaxableIncomeInput','stateTaxesDue','credits','afterTaxDeductions','totalStateTax'];
    const data = results.reduce((acc, { cell, value }, i) => {
      acc[keys[i]] = value;
      return acc;
    }, {});
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (typeof headers !== 'undefined') {
      await closeSession(headers);
    }
  }
});

// ── Fetch-only State-Section endpoint ───────────────────────────────────────
app.get('/api/stateSection', async (req, res) => {
  const { state } = req.query;
  if (!state?.trim()) {
    return res.status(400).json({ error: 'State parameter is required.' });
  }
  try {
    const data = await fetchStateSection(state.trim());
    return res.json(data);
  } catch (err) {
    console.error('FetchStateSection error:', err);
      if (err.message.includes('temporarily unavailable')) {
        return res
          .status(503)
          .json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
  }
});

// ─── Write-only endpoint for user-edited state deductions ─────────────
app.post('/api/stateDeductions', async (req, res) => {
  const { state, deductions, agi, year, filingStatus } = req.body;

  if (!state?.trim()) {
    return res.status(400).json({ error: 'State parameter is required.' });
  }
  if (typeof deductions !== 'number' || deductions < 0) {
    return res.status(400).json({ error: 'Deductions must be a non-negative number.' });
  }

  try {
    // Write deduction (and AGI if provided), then read the whole block in one go
    const data = await upsertStateInputsAndRead(state.trim(), {
      deductions,
      agi: (typeof agi === 'number') ? agi : undefined,
      year: (typeof year === 'number') ? year : undefined,
      filingStatus
    });
    return res.json(data);
  } catch (err) {
    console.error(err);
    if (err.message.includes('temporarily unavailable')) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stateInputs', async (req, res) => {
  const {
    state,
    agi,
    taxableIncome,
    year,
    filingStatus,
    additions,
    deductions,
    credits,
    afterTaxDeductions
  } = req.body;

  if (!state?.trim()) {
    return res.status(400).json({ error: 'State parameter is required.' });
  }

  try {
    const data = await upsertStateInputsAndRead(state.trim(), {
      agi: (typeof agi === 'number') ? agi : undefined,
      taxableIncome: (typeof taxableIncome === 'number') ? taxableIncome : undefined,  // <— NEW
      year: (typeof year === 'number') ? year : undefined,
      filingStatus: (typeof filingStatus === 'string') ? filingStatus : undefined,
      additions: (typeof additions === 'number') ? additions : undefined,
      deductions: (typeof deductions === 'number') ? deductions : undefined,
      credits: (typeof credits === 'number') ? credits : undefined,
      afterTaxDeductions: (typeof afterTaxDeductions === 'number') ? afterTaxDeductions : undefined
    });
    return res.json(data);
  } catch (err) {
    console.error('stateInputs error:', err);
    if (err.message.includes('temporarily unavailable')) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stateAGI', async (req, res) => {
  const { state, agi } = req.body;
  if (!state?.trim()) {
    return res.status(400).json({ error: 'State is required.' });
  }
  try {
    await writeStateAGI(state.trim(), agi);
    res.sendStatus(204);
  } catch (err) {
    console.error('stateAGI error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calculateStateTaxes2', async (req, res) => {
  const { writes, state } = req.body;
  const agi      = asNumber(req.body.agi);
  const taxableIncome  = asNumber(req.body.taxableIncome);
  const w2Income = asNumber(req.body.w2Income);
  let headers;

  if (!state || !writes) {
    return res.status(400).json({ error: 'State and writes payload are required.' });
  }

  try {
    console.log(`[calculateStateTaxes2] ${state}: AGI=${agi}, Taxable=${taxableIncome}, W2=${w2Income}`);
    headers = await startSession(false);

    const { rows, leadKind, leadLabel } = await locateStateSection(state, headers);
      
    // STRICT: if the sheet expects "Taxable Income", require taxableIncome;
    // if it expec
    // ts "AGI", require agi. No implicit fallback.
    let leadValue;
    if (leadKind === 'taxableIncome') {
      if (typeof taxableIncome !== 'number' || Number.isNaN(taxableIncome)) {
        throw new Error(`Sheet expects "Taxable Income" but request did not include a valid taxableIncome number.`);
      }
      leadValue = taxableIncome;
    } else if (leadKind === 'agi') {
      if (typeof agi !== 'number' || Number.isNaN(agi)) {
        throw new Error(`Sheet expects "AGI" but request did not include a valid agi number.`);
      }
      leadValue = agi;
    } else {
      throw new Error(`Unrecognized lead label "${leadLabel}" — expected AGI or Taxable Income.`);
    }
    
    const leadCell = `B${rows.agi}`;
    console.log(`[calculateStateTaxes2] lead label "${leadLabel}" => writing ${leadValue} to ${leadCell}`);
    await fetch(`${SHEET_URL}/range(address='${leadCell}')`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ values: [[ leadValue ]] })
    });

    // Write all other inputs in one pass
    for (let { cell, value } of writes) {
      await fetch(`${SHEET_URL}/range(address='${cell}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ value ]] })
      });
    }

    // Recalc then read back the block
    await refreshWorkbook(headers);
    const readRange = [
      `B${rows.agi}`,
      `B${rows.additions}`,
      `B${rows.deductions}`,
      `B${rows.taxableIncome}`,
      `B${rows.taxesDue}`,
      `B${rows.credits}`,
      `B${rows.afterTaxDed}`,
      `B${rows.totalStateTax}`
    ];

    const results = [];
    for (let address of readRange) {
      const rjson = await fetch(`${SHEET_URL}/range(address='${address}')`, { method: 'GET', headers })
        .then(r => r.json());
      const [[ value ]] = rjson.values;
      results.push({ cell: address, value });
    }

    const keys = ['agi','additions','deductions','stateTaxableIncomeInput','stateTaxesDue','credits','afterTaxDeductions','totalStateTax'];
    const data = results.reduce((acc, { cell, value }, i) => {
      acc[keys[i]] = value;
      return acc;
    }, {});

    // Update the totalTax field with totalStateTax included
    const totalTax = parseFloat(req.body.totalTax || 0) + parseFloat(data.totalStateTax || 0);
    data.totalTax = totalTax;

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (typeof headers !== 'undefined') {
      await closeSession(headers);
    }
  }
});

// NEW: flexible upsert + read for outlier states
app.post('/api/stateInputsFlex', async (req, res) => {
  try {
    const {
      state, year, filingStatus, agi, taxableIncome,
      inputs = {}, schema
    } = req.body;

    if (!state?.trim()) return res.status(400).json({ error: 'State is required.' });
    if (!schema || !schema.labels || !Object.keys(schema.labels).length) {
      return res.status(400).json({ error: 'Schema with labels is required.' });
    }

    const reqId = `SIF-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    console.log(`[${reqId}] /api/stateInputsFlex start`, { state, year, filingStatus, agi, taxableIncome });


    const data = await upsertStateInputsAndReadFlex(state.trim(), {
      year: (typeof year === 'number') ? year : undefined,
      filingStatus: (typeof filingStatus === 'string') ? filingStatus.trim() : undefined,
      leadKey: schema.leadKey,
      labels: schema.labels,        // { key -> label in Column A }
      readKeys: schema.readKeys,
      ioByKey:  schema.ioByKey
    }, {
      agi: (typeof agi === 'number') ? agi : undefined,
      taxableIncome: (typeof taxableIncome === 'number') ? taxableIncome : undefined,
      ...inputs
    });

    res.json(data);
  } catch (err) {
    console.error('stateInputsFlex error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN-AWARE SUBMIT that persists a “Year Type” run into the correct column
// Header row (labels like “2024 Draft”) lives on row 24.
// We scan B..J for an existing match or the first empty cell, then write there.
// ─────────────────────────────────────────────────────────────────────────────

// Excel columns: 1=A, 2=B, ..., 26=Z, 27=AA...
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function colNumber(letter) {
  let n = 0;
  for (const ch of letter.toUpperCase()) {
    if (ch < 'A' || ch > 'Z') break;
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}
function swapToColumn(cellAddr, targetColLetter) {
  const m = /^([A-Z]+)(\d+)$/.exec(cellAddr);
  if (!m) return cellAddr;
  return `${targetColLetter}${m[2]}`;
}

/**
 * Find the column to write based on "YYYY <Type>" marker on row 24.
 * If an exact label already exists, update that column; otherwise use the
 * first empty cell to the right of B24. Writes the label and returns the letter.
 *
 * @param {object} headers Graph workbook-session headers
 * @param {number} year
 * @param {string} analysisType
 * @param {string} [scanRightmost='J'] last column to scan, inclusive
 * @returns {Promise<string>} column letter (e.g., 'B', 'C', ...)
 */
async function resolveColumnForRun(headers, year, analysisType, scanRightmost='J') {
  const headerRow = 24;
  const label = `${year} ${analysisType}`;
  const startColLetter = 'B';
  const range = `B${headerRow}:${scanRightmost}${headerRow}`;

  const values2D = await fetch(`${SHEET_URL}/range(address='${range}')`, {
    method: 'GET',
    headers
  }).then(r => r.json()).then(j => j.values || []);

  // GET /range returns a 2D array; normalize to a flat row array
  const rowVals = (values2D[0] ? values2D[0] : values2D).map(v => (v ?? '').toString());

  // 1) Exact match?
  let idx = rowVals.findIndex(v => v === label);
  if (idx >= 0) {
    return colLetter(colNumber(startColLetter) + idx);
  }

  // 2) First empty cell?
  idx = rowVals.findIndex(v => v === '' || v === null || v === undefined);
  if (idx === -1) {
    throw new Error(`No free column found between B${headerRow} and ${scanRightmost}${headerRow}`);
  }
  const targetCol = colLetter(colNumber(startColLetter) + idx);

  // Write the label into the chosen header cell
  const address = `${targetCol}${headerRow}`;
  await fetch(`${SHEET_URL}/range(address='${address}')`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ values: [[ label ]] })
  });

  return targetCol;
}

/**
 * Persist the mapped writes into the resolved column and recalc.
 * Body: { year, analysisType, writes:[{cell:'B1', value:…}, …] }
 *
 * All cells are specified relative to column B; the server shifts them to
 * the chosen column (B/C/D/…) based on the header decision.
 */
app.post('/api/submitRun', async (req, res) => {
  // basic sanitizer for numeric-like values
  function asNumber(x) {
    if (typeof x === 'number') return x;
    if (typeof x === 'string') {
      const cleaned = x.replace(/[^0-9.-]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  }

  const year = asNumber(req.body.year);
  const analysisType = (req.body.analysisType || '').toString().trim();
  const writes = Array.isArray(req.body.writes) ? req.body.writes : [];

  if (!year || !analysisType) {
    return res.status(400).json({ error: 'year and analysisType are required.' });
  }
  if (!writes.length) {
    return res.status(400).json({ error: 'writes[] is required.' });
  }

  // Use a persisting session so changes are committed to the workbook.
  const headers = await startSession(true);
  try {
    // 1) Find the target column letter, writing the header if new.
    const targetCol = await resolveColumnForRun(headers, year, analysisType, 'J'); // widen to 'Z' if you want

    // 2) Translate "Brow" → "{targetCol}row" for every write and PATCH.
    for (const w of writes) {
      if (!w || !w.cell) continue;
      const address = swapToColumn(w.cell, targetCol);

      // keep strings as-is, coerce numeric-like values
      const val = (typeof w.value === 'string')
        ? w.value
        : (Number.isFinite(w.value) ? w.value : null);

      if (val === null || val === undefined) continue;

      await fetch(`${SHEET_URL}/range(address='${address}')`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ values: [[ val ]] })
      });
    }

    // 3) Recalc and return info
    await refreshWorkbook(headers);
    res.json({ ok: true, column: targetCol, label: `${year} ${analysisType}` });
  } catch (err) {
    console.error('submitRun error:', err);
    res.status(500).json({ error: err.message || String(err) });
  } finally {
    // commit (discard=false)
    await closeSession(headers, false);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL FILE SUBMIT — writes to a client-named copy (template remains intact)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/submitRunLocal', async (req, res) => {
  const filePath = process.env.LOCAL_XLSX_PATH;
  const sheetName = process.env.LOCAL_WORKSHEET || process.env.WORKSHEET;
  if (!filePath) {
    return res.status(400).json({
      error: 'LOCAL_XLSX_PATH is not set. Add it to server/.env (absolute path to your local .xlsx).'
    });
  }
  if (!sheetName) {
    return res.status(400).json({
      error: 'Set LOCAL_WORKSHEET or WORKSHEET in .env so we know which tab to write.'
    });
  }

  function asNumber(x) {
    if (typeof x === 'number') return x;
    if (typeof x === 'string') {
      const cleaned = x.replace(/[^0-9.-]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  }
  const year         = asNumber(req.body.year);
  const analysisType = (req.body.analysisType || '').toString().trim();
  const writes       = Array.isArray(req.body.writes) ? req.body.writes : [];

  // NEW: names provided by the client
  const clientFirstName = (req.body.clientFirstName || '').toString().trim();
  const clientLastName  = (req.body.clientLastName  || '').toString().trim();

  if (!year || !analysisType) {
    return res.status(400).json({ error: 'year and analysisType are required.' });
  }
  if (!writes.length) {
    return res.status(400).json({ error: 'writes[] is required.' });
  }

  // Verify the template exists
  try { await fs.access(filePath); }
  catch {
    return res.status(404).json({
      error: `Template Excel not found at ${filePath}. Create/copy your template and set LOCAL_XLSX_PATH.`
    });
  }

  // NEW: compute the client-named destination path in LOCAL_OUTPUT_DIR or alongside template
  const outDir  = process.env.LOCAL_OUTPUT_DIR || path.dirname(filePath);
  const slug = s => s
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const namePart = [clientLastName, clientFirstName].filter(Boolean).map(slug).join('_') || 'Client';
  const baseFile = `${namePart}.xlsm`;
  const targetPath = path.join(outDir, baseFile);

  // Copy once (first submit). If file already exists, reuse it (no duplicate copies).
  let createdCopy = false;
  try {
    await fs.access(targetPath); // exists → reuse
  } catch {
    await fs.copyFile(filePath, targetPath);
    createdCopy = true;
  }

  try {
    const wb  = await XlsxPopulate.fromFileAsync(targetPath);
    const sht = wb.sheet(sheetName);
    if (!sht) {
      return res.status(400).json({ error: `Worksheet "${sheetName}" not found in ${targetPath}.` });
    }

    // Helper: B..J header row logic (unchanged)
    const headerRow       = 24;
    const startColLetter  = 'B';
    const scanRightmost   = 'J';
    const rng             = sht.range(`${startColLetter}${headerRow}:${scanRightmost}${headerRow}`);
    const values          = rng.value();
    const rowVals         = Array.isArray(values) && values.length ? values[0].map(v => (v ?? '').toString()) : [];
    const label           = `${year} ${analysisType}`;

    // Find existing column for this exact label or first empty slot
    let idx = rowVals.findIndex(v => v === label);
    if (idx < 0) {
      idx = rowVals.findIndex(v => v === '' || v == null);
      if (idx < 0) {
        return res.status(400).json({
          error: `No free column found between ${startColLetter}${headerRow} and ${scanRightmost}${headerRow}.`
        });
      }
      const targetCol = String.fromCharCode(startColLetter.charCodeAt(0) + idx);
      sht.cell(`${targetCol}${headerRow}`).value(label);

      for (const w of writes) {
        if (!w || !w.cell) continue;
        const address = swapToColumn(w.cell, targetCol);
        sht.cell(address).value(w.value);
      }
    } else {
      const targetCol = String.fromCharCode(startColLetter.charCodeAt(0) + idx);
      for (const w of writes) {
        if (!w || !w.cell) continue;
        const address = swapToColumn(w.cell, targetCol);
        sht.cell(address).value(w.value);
      }
    }

    await wb.toFileAsync(targetPath);
    return res.json({
      ok: true,
      mode: 'local-copy',
      createdCopy,
      column: String.fromCharCode(startColLetter.charCodeAt(0) + idx),
      label,
      filePath: targetPath,
      worksheet: sheetName,
      template: filePath
    });
  } catch (err) {
    console.error('submitRunLocal error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// --- AI Suggestions Proxy ---
const OpenAI = require('openai');
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { snapshot } = req.body || {};
    if (!snapshot) return res.status(400).json({ error: 'Missing snapshot' });

    const system = `You are a seasoned US strategic tax planner.
    Return ONLY valid JSON with top-level key "suggestions".
    Produce between 8 and 10 strategies, aiming for 10 when plausible for the facts provided.
    Each suggestion: title, rationale, impact, category, type, tags(array), confidence(0..1), references(array of {title,url}).
    Be concise (each field ≤ 60 words). Tailor to the snapshot. No prose outside JSON.`;

    const user = `CLIENT SNAPSHOT (JSON):
${JSON.stringify(snapshot, null, 2)}

Return exactly:
{
  "suggestions":[
    {
      "title":"string",
      "rationale":"string",
      "impact":"string",
      "category":"string",
      "type":"string",
      "tags":["string"],
      "confidence":0.8,
      "references":[{"title":"string","url":"string"}]
    }
  ]
}`;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const resp = await ai.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });

    const content = resp?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    res.json({ suggestions });
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
