# 🚀 Custom Code Widget - Quick Start Guide

## ✨ How to Use Custom Code Widget

### **Step 1: Add Custom Code Widget**
1. Look at the **left sidebar** (blue panel)
2. Find the **"Custom Code"** widget (has a `</>` icon)
3. **Drag and drop** it onto the canvas

### **Step 2: Connect Data Source**
You need data before running code:

**Option A: Use Supabase Data**
1. Drag **"Supabase"** widget to canvas
2. Configure it with your database table
3. **Draw a line** from Supabase widget → Custom Code widget

**Option B: Upload CSV File**
1. Drag **"File Upload"** widget to canvas
2. Upload your Raman spectroscopy CSV file
3. **Draw a line** from File Upload → Custom Code widget

### **Step 3: Write or Use Default Code**
The widget comes with **2 built-in examples**:

#### 🔍 **Peak Detector** (Default)
- Automatically detects peaks in your Raman data
- Shows total peaks found
- Displays intensity statistics
- Lists individual peak details

#### 📊 **Data Smoother**
Replace the default code with:
```python
# Data Smoother - Smooths Raman spectroscopy data
import numpy as np
from scipy.signal import savgol_filter

if input_data and len(input_data) > 0:
    # Auto-detects your data columns
    # Applies Savitzky-Golay smoothing
    # Shows before/after comparison
```

### **Step 4: Execute**
1. Click the **"Execute"** button
2. Widget auto-expands to show results
3. View output in the table inside the widget

---

## 📝 **Write Your Own Code**

### Available Libraries:
- ✅ **numpy** (as `np`)
- ✅ **pandas** (as `pd`)
- ✅ **scipy** (signal processing, stats, etc.)

### Input/Output:
```python
# Your data is in: input_data
# It's a list of dictionaries (rows)

# Example: Get intensity column
intensities = [row['Intensity y axis'] for row in input_data]

# Set your output:
output_data = [
    {'Result': 'My Analysis', 'Value': 123},
    {'Result': 'Peak Count', 'Value': 5}
]
```

---

## 🎯 **Common Use Cases**

### 1. **Peak Detection**
```python
from scipy.signal import find_peaks
peaks, _ = find_peaks(intensities, prominence=100)
```

### 2. **Baseline Correction**
```python
from scipy.signal import savgol_filter
baseline = savgol_filter(intensities, window_length=51, polyorder=2)
corrected = intensities - baseline
```

### 3. **Normalization**
```python
normalized = (intensities - np.min(intensities)) / (np.max(intensities) - np.min(intensities))
```

### 4. **Statistics**
```python
mean = np.mean(intensities)
std = np.std(intensities)
max_val = np.max(intensities)
```

---

## 🔧 **Troubleshooting**

### ❌ "No input data provided"
- **Solution:** Connect a data source widget (Supabase or File Upload)

### ❌ "Failed to fetch"
- **Solution:** Make sure backend server is running on port 5003
- Run: `cd backend && node server.js`

### ❌ "Column not found"
- **Solution:** Your data column names might be different
- Use the diagnostic code to see actual column names:
```python
if input_data:
    columns = list(input_data[0].keys())
    output_data = [{'Column Name': col} for col in columns]
```

---

## 💡 **Tips**

1. **Auto-Execute:** Widget automatically runs when you connect new data
2. **Re-run:** Click "Re-run" after editing code
3. **Multiple Widgets:** Create multiple Custom Code widgets for different analyses
4. **Chain Widgets:** Connect output of one Custom Code to input of another

---

## 📺 **Video Demo**
[Coming Soon - Screen recording of Custom Code widget in action]

---

## 🆘 **Need Help?**
Contact the development team or check:
- `CUSTOM_WIDGETS_DOCUMENTATION.md` for detailed API
- `TEST_CUSTOM_CODE.md` for testing procedures
