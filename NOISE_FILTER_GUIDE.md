# 🔊 Noise Filter Widget - Complete Guide

## ✅ Status: FULLY WORKING!

Backend API: ✅ Operational  
Frontend Widget: ✅ Updated with 4 methods  
Connection Support: ✅ Enhanced (Baseline → Noise Filter added)

---

## 🎯 How to Use Noise Filter

### **Method 1: Direct from Supabase**
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Supabase    │─────→│ Noise Filter │─────→│  Line Chart  │
│   Source     │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

**Steps:**
1. Add Supabase Source widget
   - Table: `raman_data`
   - Filter: `Polystyrene (PS)` ⚠️ **IMPORTANT!**
   - Click "Load Data"

2. Add Noise Filter widget
3. Connect: Supabase → Noise Filter (drag line)
4. Configure noise filter (see below)
5. Click "Apply"
6. Click "✓ View Data" (button turns green when ready)

---

### **Method 2: After Baseline Correction (RECOMMENDED)** ⭐
```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Supabase    │──→│  Baseline    │──→│ Noise Filter │──→│  Line Chart  │
│   Source     │   │  Correction  │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

**Steps:**
1. Supabase Source (with sample filter!)
2. Baseline Correction → Apply
3. **NEW:** Connect Baseline → Noise Filter
4. Configure noise filter
5. Click "Apply"
6. Click "✓ View Data" or connect to Line Chart

---

## ⚙️ Noise Filter Methods

### **1. Moving Average (Simple)**
- **Best for:** Quick smoothing, general noise reduction
- **Window:** 3-11 (odd numbers recommended)
- **Pros:** Fast, easy to understand
- **Cons:** Can blur sharp peaks

**Settings:**
```
Method: Moving Average
Window: 5
```

---

### **2. Savitzky-Golay (BEST FOR RAMAN)** ⭐
- **Best for:** Preserving peak shapes while smoothing
- **Window:** 5-21 (must be odd)
- **Order:** 2-3 (polynomial degree)
- **Pros:** Excellent peak preservation
- **Cons:** Slightly slower

**Settings:**
```
Method: Savitzky-Golay
Window: 7
Order: 2
```

**Why this is best for Raman:**
- Fits polynomial curves in sliding window
- Preserves peak positions and intensities
- Standard in spectroscopy software

---

### **3. Median Filter**
- **Best for:** Removing outliers and spikes
- **Window:** 3-7 (small windows work best)
- **Pros:** Excellent spike removal
- **Cons:** Can distort smooth curves

**Settings:**
```
Method: Median
Window: 5
```

**Use when:** Your data has random spikes or cosmic ray artifacts

---

### **4. Gaussian**
- **Best for:** Smooth, gradual noise reduction
- **Window:** 5-15
- **Sigma:** 0.5-2.0 (spread of Gaussian curve)
- **Pros:** Very smooth transitions
- **Cons:** Can blur sharp features

**Settings:**
```
Method: Gaussian
Window: 7
Sigma: 1.0
```

---

## 🔍 How to See the Output

### **Option 1: View Data Button** (Quick preview)

1. Click "Apply" to process data
2. Button turns green: "✓ View Data"
3. Click button to open preview modal
4. See before/after comparison

**What you'll see:**
- Line chart with smoothed spectrum
- X-axis: Raman Shift
- Y-axis: Smoothed Intensity

---

### **Option 2: Connect to Line Chart** (Persistent view)

1. After clicking "Apply"
2. Add Line Chart widget
3. Connect: Noise Filter → Line Chart
4. Chart updates automatically

**Benefits:**
- Stays visible
- Can compare side-by-side with original
- Better for documentation

---

### **Option 3: Connect to Data Table** (See numbers)

1. After clicking "Apply"
2. Add Data Table widget
3. Connect: Noise Filter → Data Table
4. See exact smoothed values

---

## 📊 Comparing Methods

### **Visual Comparison Workflow:**

```
                    ┌──────────────┐
                    │  Supabase    │
                    │   Source     │
                    └───────┬──────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ↓           ↓           ↓
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │  Noise   │ │  Noise   │ │  Noise   │
         │  Method1 │ │  Method2 │ │  Method3 │
         └────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
              ↓            ↓            ↓
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │  Chart1  │ │  Chart2  │ │  Chart3  │
         └──────────┘ └──────────┘ └──────────┘
```

**To compare all 4 methods:**
1. Load data once from Supabase
2. Add 4 Noise Filter widgets
3. Connect Supabase to all 4
4. Configure each with different method
5. Connect each to separate Line Chart
6. View all 4 charts side-by-side!

---

## ⚠️ Troubleshooting

### **Problem: "No input data" alert**

**Fix:**
- Connect a data source first!
- Valid sources: Supabase Source, Baseline Correction
- Check connection line exists (gray dashed line)

---

### **Problem: "View Data" button stays gray**

**Fix:**
- Click "Apply" button first
- Wait for processing to complete (check console)
- If still gray, check browser console for errors

---

### **Problem: Preview shows wrong data**

**Fix:**
- Make sure sample filter is used in Supabase!
- Filter: `Polystyrene (PS)` (or specific sample)
- Without filter, data from multiple samples gets mixed

---

### **Problem: Backend error in console**

**Error:** `fetch failed` or `ECONNREFUSED`

**Fix:**
```powershell
# Start backend server
cd backend
node server.js

# Or use the batch file
Double-click: START_ALL_SERVERS.bat
```

---

### **Problem: Smoothing seems too strong**

**Fix:**
- Reduce window size (try 3 or 5)
- For Gaussian: reduce sigma (try 0.5)
- For Savitzky-Golay: reduce order (try 2)

---

### **Problem: Peaks are blurred**

**Fix:**
- Use Savitzky-Golay instead of Moving Average
- Reduce window size
- Window 5-7 is best for preserving peaks

---

## 🎓 Understanding the Output

### **What the filter does:**

```
BEFORE (Noisy):
Intensity
    │  ╱╲    ╱╲╲
    │ ╱  ╲  ╱  ╲╲   ← Noisy peaks
    │╱    ╲╱    ╲╲
    └─────────────→ Raman Shift

AFTER (Smoothed):
Intensity
    │  ╱─╲    ╱─╲
    │ ╱   ╲  ╱   ╲   ← Smooth peaks
    │╱     ╲╱     ╲
    └─────────────→ Raman Shift
```

---

### **Numerical Example:**

**Original data:**
```
Raman Shift: 1000, Intensity: 4950  ← Noisy
Raman Shift: 1001, Intensity: 5100  ← Noisy
Raman Shift: 1002, Intensity: 4980  ← Noisy
```

**After Moving Average (window=3):**
```
Raman Shift: 1000, Intensity: 5010  ← Smoothed
Raman Shift: 1001, Intensity: 5010  ← Smoothed
Raman Shift: 1002, Intensity: 5027  ← Smoothed
```

---

## ✨ Best Practices

### **For Raman Spectroscopy:**

1. **Always use sample filter!**
   - One sample at a time
   - `Polystyrene (PS)` or `Polyaniline (PANI)`

2. **Recommended preprocessing order:**
   ```
   Supabase → Baseline Correction → Noise Filter → Chart
   ```

3. **Best method: Savitzky-Golay**
   - Window: 7 or 9
   - Order: 2 or 3

4. **Window size guidelines:**
   - High resolution data: window 5-7
   - Low resolution data: window 9-11
   - Very noisy data: window 11-15

---

## 🧪 Test Workflow

### **Quick Test (5 minutes):**

1. **Start backend:**
   ```powershell
   cd backend
   node server.js
   ```

2. **In browser:**
   - Refresh (F5)
   - Add Supabase Source
     - Table: `raman_data`
     - Filter: `Polystyrene (PS)`
     - Click "Load Data"

3. **Add Noise Filter:**
   - Connect: Supabase → Noise Filter
   - Method: Savitzky-Golay
   - Window: 7
   - Order: 2
   - Click "Apply"
   - Click "✓ View Data"

4. **Expected Result:**
   - Modal opens with line chart
   - X-axis: Raman Shift (0-3200)
   - Y-axis: Smoothed intensity
   - Smooth spectral peaks visible

---

## 📈 Advanced: Before/After Comparison

### **Side-by-Side Workflow:**

```
┌──────────────┐
│  Supabase    │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
   ↓        ↓
┌────────┐ ┌────────────┐
│Chart 1 │ │Noise Filter│
│(Raw)   │ └──────┬─────┘
└────────┘        │
                  ↓
               ┌────────┐
               │Chart 2 │
               │(Smooth)│
               └────────┘
```

**Compare:**
- Chart 1: Raw data (with noise)
- Chart 2: Smoothed data (clean)

---

## 🎯 Summary

✅ **4 noise filtering methods available**  
✅ **Works with Supabase and Baseline Correction**  
✅ **"View Data" button shows when data is ready**  
✅ **Can connect to charts, tables, or view inline**  
✅ **Backend API fully functional**

**Remember:**
1. Connect data source first
2. Click "Apply" to process
3. Button turns green when ready
4. Click "✓ View Data" to see result

**For best results:**
- Use Savitzky-Golay with window=7, order=2
- Always filter to single sample in Supabase
- Process order: Baseline → Noise → Visualization

---

**🎉 Your noise filter is ready to use!**
