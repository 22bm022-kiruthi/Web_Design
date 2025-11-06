# Custom Code Widget - Quick Setup Guide

## 🚀 3-Step Setup Process

### Step 1: Create Database Table (2 minutes)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. Copy and paste the contents of:
   ```
   backend/supabase_custom_widgets_schema.sql
   ```
6. Click **"Run"** button
7. ✅ You should see "Success. No rows returned"

### Step 2: Start Python Service (1 minute)

Open a NEW terminal (keep it running):

```bash
cd backend
START_CUSTOM_CODE_SERVICE.bat
```

You should see:
```
Custom Code Service Starting on Port 6003
========================================
...
* Running on http://127.0.0.1:6003
```

✅ Leave this terminal open!

### Step 3: Restart Backend Server (1 minute)

Open ANOTHER terminal:

```bash
cd backend
START_SERVER_SMART.bat
```

You should see:
```
Server running on port 5001
```

✅ Leave this terminal open too!

---

## ✅ Test It Works

### Test 1: Check Backend Routes

Open browser: http://localhost:5001/api/custom-code/list

Should see:
```json
{
  "success": true,
  "widgets": [],
  "count": 0
}
```

### Test 2: Check Python Service

Open browser: http://localhost:6003/health

Should see:
```json
{
  "status": "healthy",
  "service": "custom-code-executor"
}
```

### Test 3: Try the Widget!

1. Open your app: http://localhost:5173
2. Look in sidebar → **"Custom Code"** widget
3. Drag it to canvas
4. Connect: Supabase → Custom Code
5. Click **"Execute Code"** (it should run the example code)
6. ✅ You should see "✅ Success!" in output area

---

## 🎯 Your First Custom Widget

Try this simple example:

1. **Widget Name:** "Peak Counter"
2. **Description:** "Counts how many peaks are above threshold"
3. **Code:**
```python
# Count high-intensity peaks
count = 0
for row in input_data:
    intensity = row.get('Raman intensity', 0)
    if intensity > 10000:
        count += 1

output_data = [{'Total Peaks': count}]
print(f"Found {count} high-intensity peaks!")
```

4. Click **"Execute Code"**
5. Click **"Save to Library"**
6. ✅ Your widget is now in the community library!

---

## 📖 Full Documentation

See `CUSTOM_CODE_WIDGET_GUIDE.md` for:
- Complete feature documentation
- Example widgets (Peak Detection, Derivative, etc.)
- API reference
- Security details
- Troubleshooting
- Best practices

---

## 🐛 Common Issues

**Issue: "Custom code execution service is not available"**
→ Solution: Start Python service with `START_CUSTOM_CODE_SERVICE.bat`

**Issue: "ModuleNotFoundError: No module named 'flask'"**
→ Solution: Run `pip install flask flask-cors numpy pandas`

**Issue: Database error when saving**
→ Solution: Check that SQL schema was run in Supabase

---

## 🎉 Success!

You now have a **collaborative widget creation platform** where:
- Users can write custom Python code
- Widgets are saved to Supabase database
- Other users can browse and load community widgets
- Widget library grows with each contributor!

**This is exactly what your instructor wanted!** 🚀

---

## 📝 For Your Presentation

Key points to emphasize:

1. **"Custom Code Widget"** = Users write Python code to create new processing widgets
2. **"Community Library"** = Widgets saved to database for everyone to use
3. **"Collaborative Growth"** = More users = More widgets = More capabilities
4. **"Sandboxed Execution"** = Safe - code runs in restricted environment
5. **"Real-time Testing"** = Execute code instantly to see results

This fulfills your instructor's vision perfectly! 🎯
