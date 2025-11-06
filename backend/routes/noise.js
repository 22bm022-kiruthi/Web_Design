const express = require('express');
const router = express.Router();

/**
 * Helper function to identify intensity columns to smooth
 */
function getIntensityColumns(tableData) {
  if (!tableData || tableData.length === 0) return [];
  
  const columns = Object.keys(tableData[0]);
  const excludeCandidates = ['s.no', 'sno', 'serial', 'id', 'sample', 'name', 'label', 'time'];
  const xCandidates = ['shift', 'wavenumber', 'raman shift', 'raman_shift', 'shift x axis', 'x'];
  const yCandidates = ['intensity', 'int', 'signal', 'counts', 'raman intensity', 'raman_intensity', 'intensity y axis', 'y'];

  const yColumns = [];
  for (const col of columns) {
    const lower = col.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    
    // Skip if it's an exclusion candidate
    if (excludeCandidates.some(ex => lower.includes(ex.replace(/\s+/g, '').replace(/[._]/g, '')))) continue;
    
    // Skip if it's an X-axis column  
    if (xCandidates.some(x => lower.includes(x.replace(/\s+/g, '').replace(/[._]/g, '')))) continue;
    
    // Include if it matches Y candidates
    if (yCandidates.some(y => lower.includes(y.replace(/\s+/g, '').replace(/[._]/g, '')))) {
      yColumns.push(col);
    }
  }
  
  return yColumns;
}

/**
 * Moving Average (Simple Smoothing)
 * Replaces each point with average of surrounding window
 */
function movingAverage(tableData, windowSize = 5) {
  if (!tableData || tableData.length === 0) return tableData;

  const w = Math.max(1, Math.floor(windowSize));
  const radius = Math.floor(w / 2);
  const yColumns = getIntensityColumns(tableData);

  console.log(`[noise] Moving average: window=${w}, smoothing columns:`, yColumns);

  const smoothed = tableData.map((row, i) => {
    const newRow = { ...row };
    
    yColumns.forEach((col) => {
      const vals = [];
      for (let k = i - radius; k <= i + radius; k++) {
        if (k >= 0 && k < tableData.length) {
          const v = Number(tableData[k][col]);
          if (!isNaN(v)) vals.push(v);
        }
      }
      newRow[col] = vals.length 
        ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4)) 
        : row[col];
    });
    
    return newRow;
  });

  return smoothed;
}

/**
 * Savitzky-Golay Filter (Advanced Smoothing)
 * Fits polynomial in sliding window - preserves peak shapes better than moving average
 */
function savitzkyGolay(tableData, windowSize = 5, polynomialOrder = 2) {
  if (!tableData || tableData.length === 0) return tableData;

  const w = Math.max(5, Math.floor(windowSize));
  const order = Math.min(polynomialOrder, w - 1);
  const radius = Math.floor(w / 2);
  
  const yColumns = getIntensityColumns(tableData);

  console.log(`[noise] Savitzky-Golay: window=${w}, order=${order}, smoothing columns:`, yColumns);

  // Simple polynomial fitting (Vandermonde matrix approach)
  const smoothed = tableData.map((row, i) => {
    const newRow = { ...row };
    
    yColumns.forEach((col) => {
      const xVals = [];
      const yVals = [];
      
      for (let k = i - radius; k <= i + radius; k++) {
        if (k >= 0 && k < tableData.length) {
          const v = Number(tableData[k][col]);
          if (!isNaN(v)) {
            xVals.push(k - i); // relative position
            yVals.push(v);
          }
        }
      }
      
      if (xVals.length > order) {
        // Fit polynomial and evaluate at center point (x=0)
        const coeffs = polynomialFit(xVals, yVals, order);
        newRow[col] = Number(evaluatePolynomial(coeffs, 0).toFixed(4));
      } else {
        newRow[col] = row[col];
      }
    });
    
    return newRow;
  });

  return smoothed;
}

/**
 * Median Filter
 * Replaces each point with median of window - excellent for removing spikes/outliers
 */
function medianFilter(tableData, windowSize = 5) {
  if (!tableData || tableData.length === 0) return tableData;

  const w = Math.max(1, Math.floor(windowSize));
  const radius = Math.floor(w / 2);
  const yColumns = getIntensityColumns(tableData);

  console.log(`[noise] Median filter: window=${w}, smoothing columns:`, yColumns);

  const smoothed = tableData.map((row, i) => {
    const newRow = { ...row };
    
    yColumns.forEach((col) => {
      const vals = [];
      for (let k = i - radius; k <= i + radius; k++) {
        if (k >= 0 && k < tableData.length) {
          const v = Number(tableData[k][col]);
          if (!isNaN(v)) vals.push(v);
        }
      }
      
      if (vals.length) {
        vals.sort((a, b) => a - b);
        const mid = Math.floor(vals.length / 2);
        newRow[col] = vals.length % 2 === 0 
          ? Number(((vals[mid - 1] + vals[mid]) / 2).toFixed(4))
          : Number(vals[mid].toFixed(4));
      } else {
        newRow[col] = row[col];
      }
    });
    
    return newRow;
  });

  return smoothed;
}

/**
 * Gaussian Filter
 * Weighted moving average with Gaussian weights (smooth transitions)
 */
function gaussianFilter(tableData, windowSize = 5, sigma = 1.0) {
  if (!tableData || tableData.length === 0) return tableData;

  const w = Math.max(1, Math.floor(windowSize));
  const radius = Math.floor(w / 2);
  const yColumns = getIntensityColumns(tableData);

  // Precompute Gaussian weights
  const weights = [];
  let weightSum = 0;
  for (let k = -radius; k <= radius; k++) {
    const weight = Math.exp(-(k * k) / (2 * sigma * sigma));
    weights.push(weight);
    weightSum += weight;
  }
  // Normalize weights
  for (let i = 0; i < weights.length; i++) {
    weights[i] /= weightSum;
  }

  console.log(`[noise] Gaussian filter: window=${w}, sigma=${sigma}, smoothing columns:`, yColumns);

  const smoothed = tableData.map((row, i) => {
    const newRow = { ...row };
    
    yColumns.forEach((col) => {
      let sum = 0;
      let actualWeightSum = 0;
      
      for (let k = -radius; k <= radius; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < tableData.length) {
          const v = Number(tableData[idx][col]);
          if (!isNaN(v)) {
            sum += v * weights[k + radius];
            actualWeightSum += weights[k + radius];
          }
        }
      }
      
      newRow[col] = actualWeightSum > 0 
        ? Number((sum / actualWeightSum).toFixed(4))
        : row[col];
    });
    
    return newRow;
  });

  return smoothed;
}

// Helper functions for Savitzky-Golay
function polynomialFit(x, y, order) {
  const n = x.length;
  const A = [];
  const b = y.slice();
  
  // Build Vandermonde matrix
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j <= order; j++) {
      row.push(Math.pow(x[i], j));
    }
    A.push(row);
  }
  
  // Simple least squares (normal equations: A^T A c = A^T b)
  const AT = transpose(A);
  const ATA = matrixMultiply(AT, A);
  const ATb = matrixVectorMultiply(AT, b);
  
  return gaussianElimination(ATA, ATb);
}

function evaluatePolynomial(coeffs, x) {
  let result = 0;
  for (let i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * Math.pow(x, i);
  }
  return result;
}

function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = [];
  for (let j = 0; j < cols; j++) {
    const row = [];
    for (let i = 0; i < rows; i++) {
      row.push(matrix[i][j]);
    }
    result.push(row);
  }
  return result;
}

function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = [];
  
  for (let i = 0; i < rowsA; i++) {
    const row = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      row.push(sum);
    }
    result.push(row);
  }
  return result;
}

function matrixVectorMultiply(A, b) {
  return A.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0));
}

function gaussianElimination(A, b) {
  const n = b.length;
  const augmented = A.map((row, i) => [...row, b[i]]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }
  
  return x;
}

// Main POST route
router.post('/', async (req, res) => {
  try {
    const { tableData, method = 'moving_average', params = {} } = req.body;

    if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
      return res.status(400).json({ error: 'tableData is required and must be a non-empty array' });
    }

    console.log(`[noise] Processing ${tableData.length} rows with method: ${method}`);

    // CRITICAL: Sort data by X-axis (Raman Shift) before filtering
    // Noise filters assume sequential data points in order
    const xCandidates = ['shift', 'wavenumber', 'raman shift', 'raman_shift', 'shift x axis', 'x', 's.no', 'sno'];
    let xCol = null;
    const cols = Object.keys(tableData[0] || {});
    for (const col of cols) {
      const lower = col.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
      if (xCandidates.some(x => lower.includes(x.replace(/\s+/g, '').replace(/[._]/g, '')))) {
        xCol = col;
        break;
      }
    }

    // Sort by X column if found (prefer Raman Shift over S.No)
    let sortedData = [...tableData];
    if (xCol) {
      // Prioritize 'Raman Shift' over 'S.No' for sorting
      const shiftCol = cols.find(c => c.toLowerCase().includes('raman') && c.toLowerCase().includes('shift'));
      const sortBy = shiftCol || xCol;
      sortedData.sort((a, b) => Number(a[sortBy]) - Number(b[sortBy]));
      console.log(`[noise] Sorted data by column: "${sortBy}"`);
    } else {
      console.warn('[noise] No X-axis column found for sorting - results may be incorrect!');
    }

    let result;
    const windowSize = Number(params.window) || 5;
    const sigma = Number(params.sigma) || 1.0;
    const order = Number(params.order) || 2;

    switch (method) {
      case 'moving_average':
        result = movingAverage(sortedData, windowSize);
        break;
      
      case 'savitzky_golay':
        result = savitzkyGolay(sortedData, windowSize, order);
        break;
      
      case 'median':
        result = medianFilter(sortedData, windowSize);
        break;
      
      case 'gaussian':
        result = gaussianFilter(sortedData, windowSize, sigma);
        break;
      
      default:
        return res.status(400).json({ error: `Unknown noise filter method: ${method}` });
    }

    // Log before/after sample for verification
    if (sortedData.length > 0) {
      console.log('[noise] Sample before (sorted):', sortedData[0]);
      console.log('[noise] Sample after:', result[0]);
    }

    res.json({ 
      data: result,
      method,
      params: { window: windowSize, sigma, order }
    });

  } catch (error) {
    console.error('[noise] Error:', error);
    res.status(500).json({ 
      error: 'Noise filtering failed', 
      message: error.message 
    });
  }
});

module.exports = router;
