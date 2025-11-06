// Comprehensive test showing rolling_min behavior with different window sizes

const testData = [
  { 'Raman Shift': 100, 'Raman intensity': 1000 },
  { 'Raman Shift': 200, 'Raman intensity': 800 },
  { 'Raman Shift': 300, 'Raman intensity': 500 },  // Local valley
  { 'Raman Shift': 400, 'Raman intensity': 700 },
  { 'Raman Shift': 500, 'Raman intensity': 1200 },
  { 'Raman Shift': 600, 'Raman intensity': 1500 },
  { 'Raman Shift': 700, 'Raman intensity': 1300 },
  { 'Raman Shift': 800, 'Raman intensity': 900 },
  { 'Raman Shift': 900, 'Raman intensity': 600 },
  { 'Raman Shift': 1000, 'Raman intensity': 300 }, // Global minimum
  { 'Raman Shift': 1100, 'Raman intensity': 500 },
  { 'Raman Shift': 1200, 'Raman intensity': 800 },
];

console.log('\n=== ORIGINAL DATA (Simulated curved baseline) ===');
testData.forEach(r => console.log(`  ${r['Raman Shift']}: ${r['Raman intensity']}`));

// Min Subtract
const globalMin = Math.min(...testData.map(r => r['Raman intensity']));
console.log('\n=== MIN SUBTRACT (Global min=' + globalMin + ') ===');
testData.forEach(r => {
  const corrected = r['Raman intensity'] - globalMin;
  console.log(`  ${r['Raman Shift']}: ${r['Raman intensity']} → ${corrected}`);
});

// Rolling Min with window=3
function rollingMin(data, windowSize) {
  const half = Math.floor(windowSize / 2);
  return data.map((r, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(data.length - 1, i + half);
    const window = data.slice(start, end + 1);
    const localMin = Math.min(...window.map(w => w['Raman intensity']));
    return {
      ...r,
      localMin,
      corrected: r['Raman intensity'] - localMin
    };
  });
}

console.log('\n=== ROLLING MIN (window=3) ===');
const rolling3 = rollingMin(testData, 3);
rolling3.forEach(r => {
  console.log(`  ${r['Raman Shift']}: ${r['Raman intensity']} (localMin=${r.localMin}) → ${r.corrected}`);
});

console.log('\n=== ROLLING MIN (window=5) ===');
const rolling5 = rollingMin(testData, 5);
rolling5.forEach(r => {
  console.log(`  ${r['Raman Shift']}: ${r['Raman intensity']} (localMin=${r.localMin}) → ${r.corrected}`);
});

console.log('\n=== ROLLING MIN (window=21) - Large window ===');
const rolling21 = rollingMin(testData, 21);
rolling21.forEach(r => {
  console.log(`  ${r['Raman Shift']}: ${r['Raman intensity']} (localMin=${r.localMin}) → ${r.corrected}`);
});

console.log('\n=== ANALYSIS ===');
console.log('MIN SUBTRACT:');
console.log('  - All values shifted by same amount (' + globalMin + ')');
console.log('  - Maintains relative differences');
console.log('  - Best for flat baseline');
console.log('');
console.log('ROLLING MIN (window=3):');
console.log('  - Each point uses its own local minimum');
console.log('  - Adapts quickly to changes');
console.log('  - Good for removing curved baseline');
console.log('');
console.log('ROLLING MIN (window=21):');
console.log('  - Uses larger neighborhood');
console.log('  - Smoother baseline removal');
console.log('  - Best for slowly varying baseline');
console.log('');
console.log('YOUR CASE:');
console.log('If rolling_min looks like min_subtract, your baseline is probably FLAT!');
console.log('Try increasing the window size (21-51) to see more difference.');
