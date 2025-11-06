// Quick test of baseline correction min_subtract logic
const baseline = require('./routes/baseline');

// Test data simulating Raman spectrum
const testData = [
  { 'S.No': 1, 'Raman Shift': 1000, 'Raman intensity': 5000, 'Sample name': 'Test' },
  { 'S.No': 2, 'Raman Shift': 1500, 'Raman intensity': 3000, 'Sample name': 'Test' },
  { 'S.No': 3, 'Raman Shift': 2000, 'Raman intensity': 2200, 'Sample name': 'Test' },
  { 'S.No': 4, 'Raman Shift': 2500, 'Raman intensity': 4500, 'Sample name': 'Test' }
];

console.log('\n=== BEFORE min_subtract ===');
console.log('Min intensity:', Math.min(...testData.map(r => r['Raman intensity'])));
console.log('Max intensity:', Math.max(...testData.map(r => r['Raman intensity'])));
testData.forEach(r => {
  console.log(`  Shift: ${r['Raman Shift']}, Intensity: ${r['Raman intensity']}`);
});

// Simulate what min_subtract should do
const intensities = testData.map(r => r['Raman intensity']);
const minIntensity = Math.min(...intensities);

console.log('\n=== AFTER min_subtract (expected) ===');
console.log('Minimum to subtract:', minIntensity);
console.log('New min intensity should be: 0');
console.log('New max intensity should be:', Math.max(...intensities) - minIntensity);

testData.forEach(r => {
  const corrected = r['Raman intensity'] - minIntensity;
  console.log(`  Shift: ${r['Raman Shift']}, Intensity: ${r['Raman intensity']} → ${corrected}`);
});

console.log('\n=== KEY POINTS ===');
console.log('1. S.No should NOT change (it\'s an ID column)');
console.log('2. Raman Shift should NOT change (it\'s the X-axis)');
console.log('3. Raman intensity SHOULD be corrected (minimum becomes 0)');
console.log('4. Sample name should NOT change');
