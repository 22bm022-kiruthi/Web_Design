const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Helper: simple min_subtract implementation in JS (server-side fallback)
function minSubtract(tableData) {
  if (!Array.isArray(tableData) || tableData.length === 0) return tableData || [];
  const cols = Object.keys(tableData[0]);
  const numericCols = cols.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));
  
  // Exclude x-axis AND serial number/index columns
  const xCandidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'wavenumber_cm', 'raman_shift', 's.no', 'sno', 'id', 'sample'];
  let yCols = numericCols.filter((c) => !xCandidates.some((x) => c.toLowerCase().replace(/[^a-z]/g, '').includes(x.replace(/[^a-z]/g, ''))));
  
  // Additional filter: only include columns with "intensity" or "counts" or "int" or "y" in name
  const yCandidates = ['intensity', 'int', 'y', 'signal', 'counts'];
  const yColsFiltered = yCols.filter((c) => yCandidates.some((y) => c.toLowerCase().includes(y)));
  
  // Use filtered if found, otherwise use all non-x columns
  if (yColsFiltered.length > 0) yCols = yColsFiltered;
  if (yCols.length === 0) return tableData; // No y columns found, return unchanged

  const minima = {};
  yCols.forEach((col) => {
    const vals = tableData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    minima[col] = vals.length ? Math.min(...vals) : 0;
  });

  return tableData.map((row) => {
    const newRow = { ...row };
    yCols.forEach((col) => {
      const v = Number(row[col]);
      newRow[col] = !isNaN(v) ? Number((v - minima[col]).toFixed(6)) : row[col];
    });
    return newRow;
  });
}

// rolling minimum baseline subtraction: for each point subtract the minimum within a sliding window
function rollingMinSubtract(tableData, windowSize = 5) {
  if (!Array.isArray(tableData) || tableData.length === 0) return tableData || [];
  const n = tableData.length;
  const cols = Object.keys(tableData[0]);
  const numericCols = cols.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));
  
  // Exclude x-axis AND serial number/index columns
  const xCandidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'wavenumber_cm', 'raman_shift', 's.no', 'sno', 'id', 'sample'];
  let yCols = numericCols.filter((c) => !xCandidates.some((x) => c.toLowerCase().replace(/[^a-z]/g, '').includes(x.replace(/[^a-z]/g, ''))));
  
  // Additional filter: only include columns with "intensity" or "counts" or "int" or "y" in name
  const yCandidates = ['intensity', 'int', 'y', 'signal', 'counts'];
  const yColsFiltered = yCols.filter((c) => yCandidates.some((y) => c.toLowerCase().includes(y)));
  
  // Use filtered if found, otherwise use all non-x columns
  if (yColsFiltered.length > 0) yCols = yColsFiltered;
  if (yCols.length === 0) return tableData;

  const half = Math.max(0, Math.floor(windowSize / 2));
  const corrected = tableData.map((r) => ({ ...r }));

  yCols.forEach((col) => {
    const vals = tableData.map((r) => Number(r[col]));
    // compute rolling minima
    const baseline = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - half);
      const end = Math.min(n - 1, i + half);
      let m = Infinity;
      for (let j = start; j <= end; j++) {
        const v = vals[j];
        if (!isNaN(v) && v < m) m = v;
      }
      baseline[i] = (m === Infinity) ? 0 : m;
    }
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      corrected[i][col] = !isNaN(v) ? Number((v - baseline[i]).toFixed(6)) : tableData[i][col];
    }
  });

  return corrected;
}

// polynomial baseline subtraction: fit polynomial of given degree to each y series and subtract
function polynomialSubtract(tableData, degree = 2) {
  if (!Array.isArray(tableData) || tableData.length === 0) return tableData || [];
  const n = tableData.length;
  const cols = Object.keys(tableData[0]);
  const numericCols = cols.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));
  const xCandidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'wavenumber_cm', 'raman_shift'];
  // choose x column if present
  let xCol = null;
  for (const c of cols) {
    if (xCandidates.includes(c.toLowerCase())) { xCol = c; break; }
  }
  if (!xCol) {
    // try names containing candidate substrings
    for (const c of cols) {
      const lc = c.toLowerCase();
      if (xCandidates.some((s) => lc.includes(s))) { xCol = c; break; }
    }
  }
  const x = xCol ? tableData.map((r) => Number(r[xCol])) : tableData.map((_, i) => i);
  
  // Exclude x-axis AND serial number/index columns
  const excludeCandidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'wavenumber_cm', 'raman_shift', 's.no', 'sno', 'id', 'sample'];
  let yCols = numericCols.filter((c) => !excludeCandidates.some((x) => c.toLowerCase().replace(/[^a-z]/g, '').includes(x.replace(/[^a-z]/g, ''))));
  
  // Additional filter: only include columns with "intensity" or "counts" or "int" or "y" in name
  const yCandidates = ['intensity', 'int', 'y', 'signal', 'counts'];
  const yColsFiltered = yCols.filter((c) => yCandidates.some((y) => c.toLowerCase().includes(y)));
  
  // Use filtered if found, otherwise use all non-x columns
  if (yColsFiltered.length > 0) yCols = yColsFiltered;
  if (yCols.length === 0) return tableData;

  // build Vandermonde and solve normal equations per y column
  const corrected = tableData.map((r) => ({ ...r }));

  // helper: solve linear system A x = b using Gaussian elimination (A is square)
  function solveLinear(A, b) {
    const m = A.length;
    // build augmented matrix
    const M = new Array(m);
    for (let i = 0; i < m; i++) {
      M[i] = A[i].slice();
      M[i].push(b[i]);
    }
    // forward elimination
    for (let k = 0; k < m; k++) {
      // find pivot
      let iMax = k;
      for (let i = k + 1; i < m; i++) if (Math.abs(M[i][k]) > Math.abs(M[iMax][k])) iMax = i;
      const tmp = M[k]; M[k] = M[iMax]; M[iMax] = tmp;
      const pivot = M[k][k];
      if (Math.abs(pivot) < 1e-12) continue; // singular-ish
      // normalize row
      for (let j = k; j <= m; j++) M[k][j] /= pivot;
      for (let i = 0; i < m; i++) {
        if (i === k) continue;
        const factor = M[i][k];
        for (let j = k; j <= m; j++) M[i][j] -= factor * M[k][j];
      }
    }
    const x = new Array(m).fill(0);
    for (let i = 0; i < m; i++) x[i] = M[i][m];
    return x;
  }

  // build matrix V (n x (degree+1))
  const V = new Array(n);
  for (let i = 0; i < n; i++) {
    V[i] = new Array(degree + 1);
    let xi = Number(x[i]);
    if (isNaN(xi)) xi = i;
    let pow = 1;
    for (let d = 0; d <= degree; d++) {
      V[i][d] = pow;
      pow *= xi;
    }
  }

  // precompute V^T * V (size (deg+1)x(deg+1))
  const m = degree + 1;
  const VtV = new Array(m).fill(0).map(() => new Array(m).fill(0));
  const VtY = new Array(m).fill(0);

  yCols.forEach((col) => {
    // compute V^T * y
    for (let i = 0; i < m; i++) VtY[i] = 0;
    for (let r = 0; r < n; r++) {
      const yi = Number(tableData[r][col]);
      if (isNaN(yi)) continue;
      for (let i = 0; i < m; i++) VtY[i] += V[r][i] * yi;
    }
    // compute V^T * V
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) VtV[i][j] = 0;
    for (let r = 0; r < n; r++) {
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) VtV[i][j] += V[r][i] * V[r][j];
    }

    // solve (V^T V) c = V^T y
    let coeffs = [];
    try {
      coeffs = solveLinear(VtV.map((row) => row.slice()), VtY.slice());
    } catch (e) {
      coeffs = new Array(m).fill(0);
    }

    // compute baseline and subtract
    for (let i = 0; i < n; i++) {
      let baseline = 0;
      let powx = 1;
      for (let d = 0; d < m; d++) {
        baseline += coeffs[d] * powx;
        powx *= Number(x[i]) || i;
      }
      const v = Number(tableData[i][col]);
      corrected[i][col] = !isNaN(v) ? Number((v - baseline).toFixed(6)) : tableData[i][col];
    }
  });

  return corrected;
}

// POST /api/baseline-correction
// Try Python baseline service first; if unreachable, perform server-side min_subtract fallback
router.post('/', async (req, res) => {
  const target = process.env.BASELINE_SERVICE_URL || 'http://127.0.0.1:6001/api/baseline-correction';
  const body = req.body || {};
  console.log('[baseline] received request; body keys=', Object.keys(body));
  try {
    // attempt to proxy to Python service with a short timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('baseline python service returned non-ok', resp.status, txt);
      // fall through to local fallback
    } else {
      const json = await resp.json();
      return res.status(resp.status).json(json);
    }
  } catch (err) {
    console.warn('baseline proxy to python failed, falling back to server-side calc:', String(err));
  }

  // server-side fallback (min_subtract by default)
  try {
    const table = body.tableData || [];
    const params = body.params || {};
    const method = (params.method || 'min_subtract').toString().toLowerCase();
    console.log('[baseline] server-side fallback method=', method, 'params=', params, 'rows=', (table && table.length) || 0);
    let corrected = table;
    if (method === 'min_subtract' || method === 'min-subtract') {
      console.log('[baseline] running min_subtract');
      corrected = minSubtract(table);
    } else if (method === 'rolling_min' || method === 'rolling-min' || method === 'rollingmin') {
      const windowSize = Number(params.window) || Number(params.windowSize) || 5;
      console.log('[baseline] running rolling_min with window=', windowSize);
      corrected = rollingMinSubtract(table, windowSize);
    } else if (method === 'polynomial' || method === 'poly') {
      const degree = Math.max(0, Number(params.degree) || 2);
      console.log('[baseline] running polynomialSubtract with degree=', degree);
      corrected = polynomialSubtract(table, degree);
    } else {
      // unknown method - fallback to minSubtract
      console.log('[baseline] unknown method, falling back to min_subtract');
      corrected = minSubtract(table);
    }
    // log a small sample of before/after for debugging
    if (table && table.length > 0) {
      const sampleBefore = table.slice(0, Math.min(3, table.length));
      const sampleAfter = corrected.slice(0, Math.min(3, corrected.length));
      console.log('[baseline] sample before=', sampleBefore);
      console.log('[baseline] sample after=', sampleAfter);
    }
    return res.json({ tableData: corrected, baselineMethod: method });
  } catch (err) {
    console.error('baseline server-side fallback failed', err);
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
