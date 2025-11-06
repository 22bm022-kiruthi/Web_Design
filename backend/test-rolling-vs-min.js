// Test to demonstrate difference between min_subtract and rolling_min

const testData = [
  { 'Raman Shift': 500, 'Raman intensity': 1000 },
  { 'Raman Shift': 600, 'Raman intensity': 500 },   // Local minimum
  { 'Raman Shift': 700, 'Raman intensity': 800 },
  { 'Raman Shift': 800, 'Raman intensity': 1200 },
  { 'Raman Shift': 900, 'Raman intensity': 300 },   // Global minimum
  { 'Raman Shift': 1000, 'Raman intensity': 600 },
  { 'Raman Shift': 1100, 'Raman intensity': 900 },
  { 'Raman Shift': 1200, 'Raman intensity': 1100 },
];

console.log('\n=== ORIGINAL DATA ===');
testData.forEach(r => {
  console.log(`Shift: ${r['Raman Shift']}, Intensity: ${r['Raman intensity']}`);
});

// MIN SUBTRACT (Global minimum)
const globalMin = Math.min(...testData.map(r => r['Raman intensity']));
console.log('\n=== MIN SUBTRACT (Global minimum: ' + globalMin + ') ===');
testData.forEach(r => {
  const corrected = r['Raman intensity'] - globalMin;
  console.log(`Shift: ${r['Raman Shift']}, Original: ${r['Raman intensity']}, Corrected: ${corrected}`);
});

// ROLLING MIN (Local minimum with window=3)
const windowSize = 3;
const half = Math.floor(windowSize / 2);
console.log('\n=== ROLLING MIN (Window size: ' + windowSize + ') ===');
testData.forEach((r, i) => {
  const start = Math.max(0, i - half);
  const end = Math.min(testData.length - 1, i + half);
  const window = testData.slice(start, end + 1);
  const localMin = Math.min(...window.map(w => w['Raman intensity']));
  const corrected = r['Raman intensity'] - localMin;
  console.log(`Shift: ${r['Raman Shift']}, Original: ${r['Raman intensity']}, LocalMin: ${localMin}, Corrected: ${corrected}`);
});

console.log('\n=== KEY DIFFERENCES ===');
console.log('MIN SUBTRACT:');
console.log('  - Finds ONE global minimum (300)');
console.log('  - Subtracts the SAME value from all points');
console.log('  - Result: Shifts entire spectrum down by 300');
console.log('  - Best for: Constant baseline offset');
console.log('');
console.log('ROLLING MIN:');
console.log('  - Finds DIFFERENT local minimum for each point');
console.log('  - Subtracts DIFFERENT values from each point');
console.log('  - Result: Adaptive baseline removal');
console.log('  - Best for: Varying baseline (curved/drifting)');
console.log('');
console.log('If your data has a FLAT baseline, both methods give similar results!');
console.log('Rolling min shines when baseline CURVES or DRIFTS across the spectrum.');
