require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const { calculateTax } = require('./taxGraph');
const app = express();

app.use(express.json());

app.post('/api/calculateTax', async (req, res) => {
  console.log('▶️  Incoming body:', req.body);               // log the parsed body
  try {
    const tax = await calculateTax(req.body.a, req.body.b);
    console.log('✅  Calculation result:', tax);
    res.json({ tax });
  } catch (err) {
    console.error('❌ Calculation error:', err);
    // return the actual error message so we can see it in PowerShell
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
