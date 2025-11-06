/**
 * Test script to demonstrate different noise filtering methods
 * Run: node backend/test-noise-methods.js
 */

// Sample Raman spectroscopy data with added noise
const sampleData = [
  { 'S.No': 1, 'Raman Shift': 500, 'Raman intensity': 1000 + Math.random() * 200 },
  { 'S.No': 2, 'Raman Shift': 550, 'Raman intensity': 1200 + Math.random() * 200 },
  { 'S.No': 3, 'Raman Shift': 600, 'Raman intensity': 1500 + Math.random() * 200 },
  { 'S.No': 4, 'Raman Shift': 650, 'Raman intensity': 2000 + Math.random() * 200 },
  { 'S.No': 5, 'Raman Shift': 700, 'Raman intensity': 3000 + Math.random() * 200 }, // Peak
  { 'S.No': 6, 'Raman Shift': 750, 'Raman intensity': 2000 + Math.random() * 200 },
  { 'S.No': 7, 'Raman Shift': 800, 'Raman intensity': 1500 + Math.random() * 200 },
  { 'S.No': 8, 'Raman Shift': 850, 'Raman intensity': 1200 + Math.random() * 200 },
  { 'S.No': 9, 'Raman Shift': 900, 'Raman intensity': 1000 + Math.random() * 200 },
];

const methods = [
  { method: 'moving_average', params: { window: 5 } },
  { method: 'savitzky_golay', params: { window: 5, order: 2 } },
  { method: 'median', params: { window: 5 } },
  { method: 'gaussian', params: { window: 5, sigma: 1.0 } }
];

async function testNoiseFilter(method, params) {
  try {
    const response = await fetch('http://127.0.0.1:5001/api/noise-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableData: sampleData,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error testing ${method}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n=== Noise Filter Methods Comparison ===\n');
  console.log('Original Data (with random noise):');
  sampleData.forEach(row => {
    console.log(`  Shift: ${row['Raman Shift']}, Intensity: ${row['Raman intensity'].toFixed(2)}`);
  });

  for (const { method, params } of methods) {
    console.log(`\n--- ${method.toUpperCase()} (window=${params.window}) ---`);
    const result = await testNoiseFilter(method, params);
    
    if (result && result.data) {
      result.data.forEach((row, idx) => {
        const original = sampleData[idx]['Raman intensity'];
        const filtered = row['Raman intensity'];
        const change = ((filtered - original) / original * 100).toFixed(1);
        console.log(`  Shift: ${row['Raman Shift']}, Intensity: ${filtered.toFixed(2)} (${change}% change)`);
      });
    }
  }

  console.log('\n=== Key Differences ===');
  console.log('Moving Average: Simple average, fast but can blur peaks');
  console.log('Savitzky-Golay: Polynomial fit, preserves peak shapes best');
  console.log('Median Filter: Best for removing outliers/spikes');
  console.log('Gaussian: Weighted average, smoother transitions');
  console.log('');
}

main();
