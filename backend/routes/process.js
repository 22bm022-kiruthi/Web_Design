const express = require('express');
const router = express.Router();

// Calculate mean of numeric columns
router.post('/mean', (req, res) => {
  const data = req.body.data;
  if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Invalid data' });

  const columns = Object.keys(data[0]);
  const sums = {};
  const counts = {};

  columns.forEach(col => { sums[col] = 0; counts[col] = 0; });

  data.forEach(row => {
    columns.forEach(col => {
      const val = parseFloat(row[col]);
      if (!isNaN(val)) {
        sums[col] += val;
        counts[col] += 1;
      }
    });
  });

  const means = {};
  columns.forEach(col => {
    means[col] = counts[col] ? sums[col] / counts[col] : null;
  });

  res.json({ means });
});

// Remove blanks by replacing with "nill"
router.post('/blank-remover', async (req, res) => {
  try {
    const { tableData } = req.body;
    if (!Array.isArray(tableData)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    // Replace blanks with "NIL"
    const processed = tableData.map(row =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, (v === '' || v === null || v === undefined) ? 'NIL' : v])
      )
    );
    res.json({ processed });
  } catch (err) {
    res.status(500).json({ error: 'Processing failed' });
  }
});

module.exports = router;
