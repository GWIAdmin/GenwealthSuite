// server/index.js
require('dotenv').config({ path: __dirname + '/.env' });
const fetch = require('node-fetch');
global.fetch = fetch;
const express = require('express');
const path    = require('path');
const { calculateMultiple } = require('./taxGraph');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
