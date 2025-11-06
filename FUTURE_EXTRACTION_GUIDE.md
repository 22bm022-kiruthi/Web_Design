# 🚀 Future Extraction Widget - Complete Guide

## Overview
The Future Extraction widget now includes **8 powerful methods** divided into two categories:

---

## 📈 **FORECASTING METHODS** (5 methods)

### 1. **Naive (Last Value)**
- **Purpose**: Simplest forecast - repeats the last value
- **Best for**: Quick baseline, stable data
- **Parameters**: Horizon (steps to forecast)

### 2. **Moving Average**
- **Purpose**: Averages recent values for smooth prediction
- **Best for**: Noisy data, short-term trends
- **Parameters**: Horizon

### 3. **Linear Trend**
- **Purpose**: Fits a trend line to predict future
- **Best for**: Clear upward/downward trends
- **Parameters**: Horizon, Lookback (points to analyze)

### 4. **Exponential Smoothing**
- **Purpose**: Weighted average with adaptive trend
- **Best for**: Balanced forecasting, adapts to recent changes
- **Parameters**: Horizon, Lookback, Alpha (0.1-1.0 smoothing factor)

### 5. **Pattern Detection**
- **Purpose**: Detects periodic patterns and repeats them
- **Best for**: Cyclical/periodic data
- **Parameters**: Horizon, Lookback

---

## 🔍 **FEATURE EXTRACTION METHODS** (3 methods)

### 6. **Peak Detection**
- **Purpose**: Finds all significant peaks in spectrum
- **Output**: List of peaks with position and intensity
- **Parameters**:
  - **Threshold**: Minimum intensity to be considered a peak (0-1)
  - **Min Distance**: Minimum points between peaks (1-20)
- **Use Case**: Identify characteristic peaks in Raman spectra

### 7. **Statistical Features**
- **Purpose**: Extracts comprehensive statistical metrics
- **Output**: 17 statistical features including:
  - Mean, Median, Std Dev, Variance
  - Min, Max, Range, IQR
  - Percentiles (25th, 75th)
  - Skewness, Kurtosis
  - Total Area, Data Density
- **Parameters**: None (automatic)
- **Use Case**: Quantitative analysis, comparison, ML input

### 8. **Spectral Fingerprinting**
- **Purpose**: Creates unique signature from top peaks
- **Output**: Fingerprint ID and top N characteristic peaks
- **Parameters**:
  - **Top Peaks**: Number of peaks to include (1-10)
  - **Min Distance**: Minimum points between peaks (1-20)
- **Use Case**: Chemical identification, spectrum comparison

---

## 🎯 **HOW TO USE**

### **Step 1: Connect Data**
```
Supabase → Baseline → Noise → Normalization → Future Extraction
```

### **Step 2: Select Method**
Open the dropdown and choose from:
- **📈 Forecasting** section (top 5 options)
- **🔍 Feature Extraction** section (bottom 3 options)

### **Step 3: Configure Parameters**
Parameters change automatically based on selected method:

**Forecasting**: Horizon, Lookback, Alpha  
**Peak Detection**: Threshold, Min Distance  
**Statistical Features**: No parameters (automatic)  
**Spectral Fingerprinting**: Top Peaks, Min Distance

### **Step 4: Execute**
- **Green button** for Feature Extraction
- **Purple button** for Forecasting

### **Step 5: View Results**
Connect to appropriate visualization:
- **Forecasting** → Line Chart (shows actual + forecast)
- **Peak Detection** → Data Table or Bar Chart
- **Statistical Features** → Data Table
- **Spectral Fingerprinting** → Data Table

---

## 📊 **COMPLETE PIPELINE EXAMPLES**

### **Example 1: Peak Analysis**
```
Supabase (Raw Data)
    ↓
Baseline Correction
    ↓
Noise Filter
    ↓
Normalization
    ↓
Future Extraction [Peak Detection]
    ↓
Data Table (View peaks)
```

### **Example 2: Statistical Characterization**
```
Supabase → Processing → Future Extraction [Statistical Features] → Data Table
```

### **Example 3: Chemical Fingerprinting**
```
Supabase → Processing → Future Extraction [Spectral Fingerprint] → Data Table
```

### **Example 4: Trend Forecasting**
```
Supabase → Processing → Future Extraction [Linear Trend] → Line Chart
```

---

## 🎓 **RECOMMENDED SETTINGS**

### **Peak Detection**
- Normalized data (0-1): Threshold = 0.3, Min Distance = 5
- Raw data: Threshold = 5000, Min Distance = 5

### **Spectral Fingerprinting**
- Polystyrene: Top Peaks = 5-7
- Simple compounds: Top Peaks = 3-5
- Complex mixtures: Top Peaks = 8-10

### **Linear Trend Forecasting**
- Short-term: Horizon = 5-10, Lookback = 10-20
- Long-term: Horizon = 20-50, Lookback = 30-100

### **Exponential Smoothing**
- More weight on recent data: Alpha = 0.7-0.9
- Balanced: Alpha = 0.3-0.5
- More weight on history: Alpha = 0.1-0.3

---

## 💡 **TIPS & BEST PRACTICES**

1. **Always normalize data** before feature extraction for consistent thresholds
2. **Peak Detection**: Adjust Min Distance if too many/few peaks detected
3. **Statistical Features**: Use for ML input or quantitative comparison
4. **Fingerprinting**: Compare fingerprint IDs to match similar spectra
5. **Forecasting**: Use processed data (after noise filtering) for better predictions

---

## 🚀 **QUICK START**

**Test Peak Detection (1 minute):**
1. Drag Future Extraction widget
2. Connect: Supabase → Normalization → Future Extraction
3. Select: "Peak Detection"
4. Set: Threshold = 0.3, Min Distance = 5
5. Click: "Extract Features"
6. Connect to Data Table to see peaks!

---

## 📝 **OUTPUT FORMATS**

### Peak Detection Output:
```javascript
[
  { peak_number: 1, position: 1001.5, intensity: 0.9234, index: 523 },
  { peak_number: 2, position: 1583.2, intensity: 0.8521, index: 892 },
  ...
]
```

### Statistical Features Output:
```javascript
[
  { feature: "mean_intensity", value: 0.4523, category: "statistics" },
  { feature: "std_intensity", value: 0.2341, category: "statistics" },
  ...
]
```

### Spectral Fingerprint Output:
```javascript
[
  { rank: 1, position: 621.0, intensity: 0.7234, relative_intensity: 0.8, percentage: 80 },
  { rank: 2, position: 1001.5, intensity: 0.9234, relative_intensity: 1.0, percentage: 100 },
  ...,
  { fingerprint_id: "621-1001-1583-1602-3054", num_peaks: 5, type: "summary" }
]
```

---

## 🎉 **YOU NOW HAVE 8 METHODS IN ONE WIDGET!**

**Refresh your browser and try it out!** 🚀
