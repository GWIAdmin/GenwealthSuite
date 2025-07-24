require('dotenv').config();
const express = require('express');
const { calculateTax } = require('./taxGraph');
const app = express();

app.use(express.json());

app.post('/api/calculateTax', async (req, res) => {
  const { a, b } = req.body;
  try {
    const tax = await calculateTax(a, b);
    res.json({ tax });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
