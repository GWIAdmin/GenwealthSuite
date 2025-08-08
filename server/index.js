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
  const { writes, state, w2Income, agi } = req.body;
  let headers;
  
  if (!state || !writes) {
    return res.status(400).json({ error: 'State and writes payload are required.' });
  }
  
  try {
    console.log(`[calculateStateTaxes] Processing request for state: ${state}, AGI: ${agi}, W2: ${w2Income}`);
    
    // Extract AGI if provided in the request
    const userAGI = typeof agi === 'number' ? agi : 
                   (writes.find(w => w.cell === 'B60')?.value || null);
    
    // 1) open a session and get back the headers object
    headers = await startSession(false);

    // 2) pass those *exactly* into locateStateSection so it uses your token
    const { rows } = await locateStateSection(state, headers);
    
    // 3) If AGI was provided, explicitly write it to the state section first
    if (userAGI !== null) {
      const agiCell = `B${rows.agi}`;
      console.log(`[calculateStateTaxes] Explicitly setting state AGI to ${agiCell}:`, userAGI);
      
      await fetch(
        `${SHEET_URL}/range(address='${agiCell}')`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ values: [[ userAGI ]] })
        }
      );
      
      // Force a recalculation after writing AGI
      await refreshWorkbook(headers);
    }

    // 4) Define what cells we want to read back
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

    // 2) Map back into structured JSON
    const keys = ['agi','additions','deductions','stateTaxableIncomeInput','stateTaxesDue','credits','afterTaxDeductions','totalStateTax'];
    const data = results.reduce((acc, {cell,value}, i) => {
      acc[keys[i]] = value;
      return acc;
    }, {});

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
   } finally {
    // 3) always close the session when you’re done
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

// New generalized write+read endpoint for all state inputs in one round-trip
app.post('/api/stateInputs', async (req, res) => {
  const {
    state,
    agi,
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

// New improved endpoint for state tax calculation with better session handling
app.post('/api/calculateStateTaxes2', async (req, res) => {
  const { writes, state, w2Income, agi } = req.body;
  let headers;
  
  if (!state || !writes) {
    return res.status(400).json({ error: 'State and writes payload are required.' });
  }
  
  try {
    console.log(`[calculateStateTaxes2] Processing request for state: ${state}, AGI: ${agi}, W2: ${w2Income}`);
    
    // 1) Open a session that does NOT persist changes
    headers = await startSession(false);
    
    // 2) Locate the state section
    const { rows } = await locateStateSection(state, headers);
    
    // 3) If AGI was provided, explicitly write it to the state section first
    if (typeof agi === 'number') {
      const agiCell = `B${rows.agi}`;
      console.log(`[calculateStateTaxes2] Setting state AGI to ${agiCell}:`, agi);
      
      await fetch(
        `${SHEET_URL}/range(address='${agiCell}')`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ values: [[ agi ]] })
        }
      );
    }
    
    // 4) Write all inputs from the form
    for (let { cell, value } of writes) {
      await fetch(
        `${SHEET_URL}/range(address='${cell}')`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ values: [[ value ]] })
        }
      );
    }
    
    // 5) Force a recalculation after writing all inputs
    await refreshWorkbook(headers);
    
    // 6) Read back the state section values
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
      const rjson = await fetch(
        `${SHEET_URL}/range(address='${address}')`,
        { method: 'GET', headers }
      ).then(r => r.json());
      const [[ value ]] = rjson.values;
      results.push({ cell: address, value });
    }
    
    // 7) Map back into structured JSON
    const keys = ['agi','additions','deductions','stateTaxableIncomeInput','stateTaxesDue','credits','afterTaxDeductions','totalStateTax'];
    const data = results.reduce((acc, {cell,value}, i) => {
      acc[keys[i]] = value;
      return acc;
    }, {});
    
    console.log(`[calculateStateTaxes2] Returning data with AGI: ${data.agi}, deductions: ${data.deductions}`);
    return res.json(data);
  } catch (err) {
    console.error('[calculateStateTaxes2] Error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    // 8) ALWAYS close and discard changes to prevent persistence between users
    if (headers) {
      try {
        await closeSession(headers, true);
        console.log('[calculateStateTaxes2] Session closed with changes discarded');
      } catch (closeErr) {
        console.error('[calculateStateTaxes2] Error closing session:', closeErr);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
