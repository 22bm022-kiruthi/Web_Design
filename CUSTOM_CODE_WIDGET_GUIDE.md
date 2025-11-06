# Custom Code Widget - Complete Guide
## Collaborative Widget Creation Feature

**Date:** November 1, 2025  
**Feature:** Custom Code Widget with Community Library  
**Purpose:** Allow users to write and share custom Python processing widgets

---

## 🎯 Overview

The **Custom Code Widget** is a revolutionary feature that enables:

1. ✅ **Users write custom Python code** in a built-in editor
2. ✅ **Execute code on their data** with real-time results
3. ✅ **Save widgets to database** with name and description
4. ✅ **Browse community library** of user-created widgets
5. ✅ **Load and use** widgets created by other users
6. ✅ **Collaborative growth** - widget library expands as more users contribute

---

## 📋 Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Code Widget UI                                  │ │
│  │  • Code Editor (textarea)                               │ │
│  │  • Widget Name/Description inputs                       │ │
│  │  • Execute, Save, Browse buttons                        │ │
│  │  • Community widget modal                               │ │
│  │  • Output display area                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js Express)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/custom-code/...)                      │ │
│  │  • POST /execute - Run Python code                      │ │
│  │  • POST /save - Save widget to database                 │ │
│  │  • GET /list - List all community widgets               │ │
│  │  • GET /:id - Load specific widget                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────┬──────────────┘
                       │                       │
                       ▼                       ▼
┌─────────────────────────────────┐  ┌────────────────────────┐
│  Python Execution Service       │  │  Supabase Database     │
│  (Port 6003)                    │  │                        │
│  • Sandboxed code execution     │  │  Table:                │
│  • Security restrictions        │  │  custom_widgets        │
│  • NumPy/Pandas available       │  │                        │
│  • Stdout/stderr capture        │  │  • id                  │
└─────────────────────────────────┘  │  • name                │
                                      │  • description         │
                                      │  • python_code         │
                                      │  • author              │
                                      │  • created_at          │
                                      │  • usage_count         │
                                      │  • parameters          │
                                      └────────────────────────┘
```

---

## 🚀 Setup Instructions

### Step 1: Create Database Table

Run this SQL in Supabase SQL Editor:

```sql
-- File: backend/supabase_custom_widgets_schema.sql

CREATE TABLE IF NOT EXISTS custom_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    python_code TEXT NOT NULL,
    author VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    parameters JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100) DEFAULT 'processing',
    is_public BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX idx_custom_widgets_name ON custom_widgets(name);
CREATE INDEX idx_custom_widgets_created_at ON custom_widgets(created_at DESC);
```

### Step 2: Start Python Service

```bash
cd backend
START_CUSTOM_CODE_SERVICE.bat
```

This will:
- Check Python installation
- Install dependencies (flask, flask-cors, numpy, pandas)
- Start service on port 6003

### Step 3: Restart Backend Server

```bash
cd backend
START_SERVER_SMART.bat
```

The backend now includes custom code routes.

### Step 4: Restart Frontend

```bash
npm run dev
```

The Custom Code widget is now available in the sidebar!

---

## 📖 User Guide

### Creating Your First Custom Widget

#### 1. Add Custom Code Widget to Canvas

- Look in the sidebar under "Processing" section
- Drag **"Custom Code"** widget to canvas
- Connect it to a data source (e.g., Supabase → Custom Code)

#### 2. Write Your Python Code

In the code editor, write:

```python
# Input data is available as: input_data
# This is a list of dictionaries (your table data)

# Example: Filter data where intensity > 5000
output_data = [row for row in input_data if row.get('Raman intensity', 0) > 5000]

print(f"Filtered {len(input_data)} rows to {len(output_data)} rows")
```

**Available in code:**
- `input_data` - Your data from connected widget (list of dicts)
- `output_data` - Set this to your processed result
- `np` or `numpy` - NumPy library
- `pd` or `pandas` - Pandas library
- `print()` - Output will be shown in widget

#### 3. Give Your Widget a Name

```
Widget Name: "High Intensity Filter"
Description: "Filters spectrum to keep only high-intensity peaks"
```

#### 4. Execute the Code

- Click **"Execute Code"** button
- Wait for execution (usually <1 second)
- Check output display area for results
- Success: Output data is now in your widget

#### 5. Save to Community Library

- Click **"Save to Library"** button
- Your widget is now saved to database
- Other users can browse and use it!

---

## 🌟 Example Custom Widgets

### Example 1: Peak Detection

```python
# Find peaks in Raman spectrum
import numpy as np

# Assume input_data has 'Raman Shift' and 'Raman intensity' columns
shifts = [row['Raman Shift'] for row in input_data]
intensities = [row['Raman intensity'] for row in input_data]

# Simple peak detection: points higher than neighbors
peaks = []
for i in range(1, len(intensities) - 1):
    if intensities[i] > intensities[i-1] and intensities[i] > intensities[i+1]:
        if intensities[i] > 5000:  # Threshold
            peaks.append({
                'Peak Position': shifts[i],
                'Peak Intensity': intensities[i]
            })

output_data = peaks
print(f"Found {len(peaks)} peaks")
```

**Save as:** "Simple Peak Detector"

---

### Example 2: Derivative Calculation

```python
# Calculate first derivative of spectrum
import numpy as np

shifts = [row['Raman Shift'] for row in input_data]
intensities = [row['Raman intensity'] for row in input_data]

# Calculate derivative
derivative = np.gradient(intensities, shifts)

# Create output with original + derivative
output_data = []
for i in range(len(input_data)):
    output_data.append({
        'Raman Shift': shifts[i],
        'Intensity': intensities[i],
        'Derivative': derivative[i]
    })

print("Derivative calculated successfully")
```

**Save as:** "Spectral Derivative"

---

### Example 3: Statistical Summary

```python
# Calculate statistical summary of intensity values
import numpy as np

intensities = [row.get('Raman intensity', 0) for row in input_data]

stats = [{
    'Metric': 'Mean',
    'Value': np.mean(intensities)
}, {
    'Metric': 'Median',
    'Value': np.median(intensities)
}, {
    'Metric': 'Std Dev',
    'Value': np.std(intensities)
}, {
    'Metric': 'Min',
    'Value': np.min(intensities)
}, {
    'Metric': 'Max',
    'Value': np.max(intensities)
}]

output_data = stats
print("Statistical analysis complete")
```

**Save as:** "Intensity Statistics"

---

### Example 4: Custom Baseline Subtraction

```python
# Custom baseline: subtract polynomial fit
import numpy as np

shifts = np.array([row['Raman Shift'] for row in input_data])
intensities = np.array([row['Raman intensity'] for row in input_data])

# Fit 3rd degree polynomial to data
poly_coeffs = np.polyfit(shifts, intensities, 3)
baseline = np.polyval(poly_coeffs, shifts)

# Subtract baseline
corrected = intensities - baseline

output_data = []
for i in range(len(input_data)):
    output_data.append({
        'Raman Shift': shifts[i],
        'Corrected Intensity': max(0, corrected[i])  # Keep positive
    })

print("Polynomial baseline subtracted")
```

**Save as:** "Polynomial Baseline Correction"

---

## 🔍 Browsing Community Widgets

### How to Find and Use Community Widgets

1. **Click "Browse Community Widgets" button**
   - Opens modal showing all saved widgets
   - Sorted by most recent first

2. **Browse the List**
   - See widget name, description, author
   - See usage count (popularity)
   - Preview creation date

3. **Load a Widget**
   - Click "Load" button on any widget
   - Code, name, and description are loaded into editor
   - You can modify it or run as-is

4. **Execute and Modify**
   - Click "Execute Code" to run on your data
   - Modify the code if needed
   - Save your modified version (will create new widget)

---

## 🔒 Security Features

### Sandboxed Execution

The Python service runs code in a **restricted environment**:

**Allowed:**
- ✅ Basic Python: `len`, `sum`, `max`, `min`, `range`, etc.
- ✅ NumPy operations (np.array, np.mean, etc.)
- ✅ Pandas operations (pd.DataFrame, etc.)
- ✅ Basic data manipulation

**Blocked:**
- ❌ File system access (`open`, `os.remove`, etc.)
- ❌ Network access (`requests`, `urllib`, etc.)
- ❌ System commands (`os.system`, `subprocess`, etc.)
- ❌ Importing arbitrary modules

### Execution Limits

- **Timeout:** 30 seconds maximum
- **Memory:** Limited by Python service
- **CPU:** Runs in subprocess, won't freeze main app

### Input Validation

- Code syntax is validated before execution
- Error messages are captured and displayed
- Malformed code won't crash the service

---

## 🎯 Collaborative Growth

### How the Library Grows

```
Day 1:  User A creates "Peak Detector" → Saves to database
        Library: 1 widget

Day 2:  User B loads "Peak Detector", modifies it, saves as "Advanced Peak Detector"
        Library: 2 widgets

Day 3:  User C creates "Spectral Aligner"
        User D creates "Custom Normalizer"
        Library: 4 widgets

Month 1: 50+ users contribute → 200+ widgets
         Most popular widgets have high usage counts
         Community identifies best practices

Year 1:  1000+ users → Thousands of specialized widgets
         Categories emerge (preprocessing, analysis, visualization)
         Quality ratings and reviews added (future feature)
```

### Benefits of Community Library

1. **Knowledge Sharing**
   - Users learn from each other's code
   - Best practices emerge naturally
   - Advanced algorithms become accessible

2. **Productivity**
   - Don't reinvent the wheel
   - Load existing widget and modify
   - Focus on analysis, not coding

3. **Specialization**
   - Experts create domain-specific widgets
   - Niche algorithms available to all
   - Research reproducibility improved

4. **Innovation**
   - Users build on each other's work
   - New analysis methods emerge
   - Platform capabilities expand organically

---

## 📊 API Reference

### Execute Code

```http
POST /api/custom-code/execute
Content-Type: application/json

{
  "code": "output_data = input_data\nprint('Hello')",
  "input_data": [{"col1": 1, "col2": 2}]
}

Response:
{
  "success": true,
  "output_data": [{"col1": 1, "col2": 2}],
  "stdout": "Hello\n",
  "stderr": "",
  "error": null
}
```

### Save Widget

```http
POST /api/custom-code/save
Content-Type: application/json

{
  "name": "My Widget",
  "description": "Does something cool",
  "python_code": "output_data = input_data",
  "author": "user-123",
  "category": "processing",
  "tags": ["custom", "filter"]
}

Response:
{
  "success": true,
  "widget": {
    "id": "uuid-here",
    "name": "My Widget",
    ...
  }
}
```

### List Widgets

```http
GET /api/custom-code/list?limit=50&category=processing

Response:
{
  "success": true,
  "widgets": [
    {
      "id": "uuid-1",
      "name": "Peak Detector",
      "description": "Finds peaks",
      "author": "user-123",
      "usage_count": 45,
      "created_at": "2025-11-01T..."
    },
    ...
  ],
  "count": 50
}
```

### Load Widget

```http
GET /api/custom-code/:id

Response:
{
  "success": true,
  "widget": {
    "id": "uuid-1",
    "name": "Peak Detector",
    "python_code": "# code here",
    "description": "...",
    "usage_count": 46  # Incremented automatically
  }
}
```

---

## 🐛 Troubleshooting

### Problem: "Custom code execution service is not available"

**Solution:**
1. Check if Python service is running on port 6003
2. Run: `backend\START_CUSTOM_CODE_SERVICE.bat`
3. Check console for errors

### Problem: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```bash
pip install flask flask-cors numpy pandas
```

### Problem: Code executes but no output_data

**Solution:**
- Make sure you set `output_data = ...` in your code
- Check if variable name is exactly `output_data`
- Print debug info: `print("output length:", len(output_data))`

### Problem: "SyntaxError" in code

**Solution:**
- Check Python syntax (indentation, colons, etc.)
- Test code in local Python first
- Use "Validate" button (future feature) before executing

### Problem: Can't save widget - database error

**Solution:**
1. Check Supabase connection
2. Verify `custom_widgets` table exists
3. Run SQL schema file if needed
4. Check browser console for errors

---

## 🔮 Future Enhancements

**Planned Features:**

1. **Code Templates**
   - Predefined templates for common tasks
   - Click to insert template code
   - Examples: "Filter by threshold", "Calculate mean", etc.

2. **Syntax Highlighting**
   - Use CodeMirror or Monaco editor
   - Better code editing experience
   - Auto-completion for Python

3. **Widget Parameters**
   - Define parameters in UI (e.g., "threshold")
   - Users can adjust without editing code
   - More user-friendly for non-programmers

4. **Version Control**
   - Track widget versions
   - Roll back to previous versions
   - See change history

5. **Rating & Reviews**
   - Users rate community widgets
   - Leave comments and feedback
   - Sort by rating/popularity

6. **Widget Categories**
   - Organize widgets by type
   - Filter by category
   - Tag-based search

7. **Code Validation**
   - Pre-execution syntax checking
   - Suggest improvements
   - Detect common errors

8. **Collaboration**
   - Multiple authors per widget
   - Fork and improve widgets
   - GitHub-style workflow

---

## 📝 Best Practices

### Writing Good Custom Widgets

1. **Clear Purpose**
   - Widget should do one thing well
   - Name and description should be self-explanatory

2. **Robust Error Handling**
   ```python
   try:
       # Your code
       output_data = process(input_data)
   except Exception as e:
       print(f"Error: {e}")
       output_data = input_data  # Fallback to original
   ```

3. **Helpful Output**
   ```python
   print(f"Processed {len(input_data)} rows")
   print(f"Found {len(peaks)} peaks")
   print("Processing complete!")
   ```

4. **Handle Missing Columns**
   ```python
   intensity = row.get('Raman intensity', 0)  # Default to 0 if missing
   ```

5. **Document Your Code**
   ```python
   # This widget filters high-intensity peaks
   # Threshold: 5000 counts
   # Output: Filtered list of peaks
   ```

---

## 🎓 Educational Value

### Learning Opportunities

1. **Python Programming**
   - Learn by doing
   - See working examples
   - Experiment safely

2. **Data Processing**
   - Understand data structures
   - Learn NumPy/Pandas
   - Algorithm design

3. **Scientific Computing**
   - Apply to real spectroscopy data
   - Understand domain concepts
   - Reproducible research

4. **Collaborative Development**
   - Share knowledge
   - Build on others' work
   - Open-source mindset

---

## 📖 Conclusion

The **Custom Code Widget** transforms your Raman spectroscopy platform into a **collaborative ecosystem** where:

- ✅ Users can create custom processing algorithms
- ✅ Widgets are shared in a community library
- ✅ Platform capabilities grow exponentially with user base
- ✅ Knowledge and best practices spread naturally
- ✅ Advanced analysis becomes accessible to everyone

**This is the future of collaborative scientific software!** 🚀

---

**Next Steps:**

1. ✅ Set up database table (run SQL schema)
2. ✅ Start Python service (port 6003)
3. ✅ Restart backend server (port 5001)
4. ✅ Try creating your first custom widget
5. ✅ Save it to community library
6. ✅ Browse and use others' widgets

**Happy Coding!** 💻

