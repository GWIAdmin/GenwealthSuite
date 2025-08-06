// server/index.js
require('dotenv').config({ path: __dirname + '/.env' });
const fetch = require('node-fetch');
global.fetch = fetch;
const express = require('express');
const path    = require('path');
const { calculateMultiple, fetchStateSection, writeStateDeductions, writeStateAGI } = require('./taxGraph');

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
  const { state, deductions } = req.body;
  // 1) Validate inputs
  if (!state?.trim()) {
    return res.status(400).json({ error: 'State parameter is required.' });
  }
  if (typeof deductions !== 'number' || deductions < 0) {
    return res.status(400).json({ error: 'Deductions must be a non-negative number.' });
  }
  try {
    await writeStateDeductions(state.trim(), deductions);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    const message = err.message.includes('Could not find')
      ? `Could not locate deduction row for state "${state}".`
      : 'Error writing state deductions.';
      if (err.message.includes('temporarily unavailable')) {
        return res
          .status(503)
          .json({ error: err.message });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
