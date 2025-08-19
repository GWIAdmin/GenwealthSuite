const fetch = require('node-fetch');
global.fetch = fetch;
const express = require('express');
const path    = require('path');
const { calculateMultiple, startSession, closeSession, writeStateDeductions, writeStateAGI, locateStateSection, SHEET_URL, refreshWorkbook, fetchStateSection, upsertStateInputsAndRead } = require('./taxGraph');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
