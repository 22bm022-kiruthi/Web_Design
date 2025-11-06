# 🧪 Custom Code Widget - Step-by-Step Testing Guide

## Test 1: Simplest Possible Code (No Imports)

**Copy this code into the Custom Code Widget:**

```python
# Simplest test - no imports
output_data = [{"test": "success", "value": 123}]
print("Simple test completed!")
```

**Expected Result:**
- ✅ Success message
- Output: "Simple test completed!"
- No errors

---

## Test 2: With NumPy Import (Pre-imported)

**Copy this code:**

```python
# Use pre-imported numpy (available as 'np')
result = np.array([1, 2, 3, 4, 5])
mean_value = np.mean(result)

output_data = [{"mean": float(mean_value), "count": len(result)}]
print(f"Calculated mean: {mean_value}")
```

**Expected Result:**
- ✅ Success
- Output: "Calculated mean: 3.0"

---

## Test 3: With Import Statement

**Copy this code:**

```python
# Explicit import statement
import numpy as np

data = [1, 2, 3, 4, 5]
output_data = [{"value": x * 2} for x in data]
print(f"Processed {len(data)} values")
```

**Expected Result:**
- ✅ Success
- Output: "Processed 5 values"

---

## Test 4: With Connected Data

**Prerequisites:**
1. Drag a **Supabase** widget to canvas
2. Load "Test Polystyrene Full" data (102 instances)
3. Connect Supabase widget → Custom Code widget
4. Use this code:

```python
# Process actual Raman data
import numpy as np

# Get Raman intensity values
intensities = [row.get('Raman intensity', 0) for row in input_data]

# Calculate statistics
stats = {
    'count': len(intensities),
    'mean': float(np.mean(intensities)),
    'max': float(np.max(intensities)),
    'min': float(np.min(intensities))
}

output_data = [stats]
print(f"Analyzed {len(intensities)} Raman data points")
print(f"Mean intensity: {stats['mean']:.2f}")
```

**Expected Result:**
- ✅ Success
- Output shows actual statistics from your data

---

## 🔧 If Tests Fail:

### Check Browser Console (F12)
Press F12 in browser, go to Console tab, and look for error messages.

### Common Issues:

**1. "Failed to fetch"**
- Backend not running
- Solution: Check that port 5001 is listening

**2. "ImportError: __import__ not found"**
- Python service needs restart
- Solution: Already fixed! Service restarted.

**3. "Connection Error"**
- Python service not running
- Solution: Check that port 6003 is listening

**4. "input_data is not defined"**
- No data connected to widget
- Solution: Connect Supabase widget first

---

## ✅ Verification Commands

Run these in terminal to verify services:

```powershell
# Check backend (should show LISTENING)
netstat -ano | findstr "5001.*LISTENING"

# Check Python service (should show LISTENING)
netstat -ano | findstr "6003.*LISTENING"

# Test backend directly
Invoke-RestMethod -Uri http://localhost:5001/api/health

# Test Python service directly
Invoke-RestMethod -Uri http://localhost:6003/health
```

---

## 📸 What to Show Instructor

1. **Widget in Sidebar** - Screenshot showing "Custom Code" in Processing section
2. **Widget on Canvas** - Drag to canvas, show the UI (code editor, name/description fields)
3. **Test 2 Success** - Show successful execution with output
4. **Save Widget** - Fill name "Test Statistics", description, click Save
5. **Browse Community** - Click Browse, show your saved widget in modal
6. **Load Widget** - Click Load, show code populates from database

This demonstrates the complete "collaborative growth" feature!
