# Custom Code Widget - Verification Checklist

## ✅ Files Created/Modified

### Backend Files
- [x] `backend/supabase_custom_widgets_schema.sql` - Database schema
- [x] `backend/python/custom_code_service.py` - Python execution service
- [x] `backend/routes/customCode.js` - API routes
- [x] `backend/server.js` - Updated to include custom code router
- [x] `backend/START_CUSTOM_CODE_SERVICE.bat` - Startup script

### Frontend Files
- [x] `src/utils/widgetRegistry.ts` - Added custom-code widget
- [x] `src/components/CanvasWidget.tsx` - Added Code icon and custom-code widget UI
- [x] `src/components/Sidebar.tsx` - Added custom-code to widgetTypes array

### Documentation
- [x] `CUSTOM_CODE_WIDGET_GUIDE.md` - Complete guide
- [x] `QUICK_SETUP_CUSTOM_CODE.md` - Quick setup instructions

## 🔍 Verification Steps

### 1. Check Sidebar (Frontend)

**What to do:**
1. Make sure frontend is running: `npm run dev`
2. Open browser: http://localhost:5173
3. Look at the LEFT SIDEBAR
4. Scroll down to "Processing" section

**What you should see:**
```
Processing 🧹
  ├─ Mean Average
  ├─ Noise Filter
  ├─ Baseline Correction
  ├─ Smoothing
  ├─ Normalization
  ├─ Future Extraction
  ├─ Spectral Segmentation
  ├─ Blank Remover
  └─ Custom Code ← THIS IS NEW!
```

**Icon:** Should show a `<Code />` icon (looks like </>)

✅ If you see "Custom Code" in the sidebar, frontend is working!

---

### 2. Check Widget Drag & Drop

**What to do:**
1. Click and drag "Custom Code" from sidebar
2. Drop it onto the canvas
3. Widget should appear

**What you should see:**
- Widget with Code icon
- Text editor (textarea)
- Input fields for "Widget Name" and "Description"
- Buttons: "Execute Code", "Save to Library", "Browse Community Widgets"
- Default Python code in editor

✅ If widget appears with these elements, UI is working!

---

### 3. Check Backend Routes

**What to do:**
1. Make sure backend is running: `cd backend` then `START_SERVER_SMART.bat`
2. Open browser

**Test endpoints:**
```
http://localhost:5001/api/custom-code/list
```

**Expected response:**
```json
{
  "success": true,
  "widgets": [],
  "count": 0
}
```

✅ If you get this JSON response, backend routes are working!

---

### 4. Check Python Service

**What to do:**
1. Open NEW terminal
2. Run: `cd backend` then `START_CUSTOM_CODE_SERVICE.bat`

**What you should see in terminal:**
```
Starting Custom Code Execution Service...
Checking Python dependencies...

========================================
Custom Code Service Starting on Port 6003
========================================

Press Ctrl+C to stop the service

 * Serving Flask app 'custom_code_service'
 * Debug mode: on
 * Running on http://127.0.0.1:6003
```

**Test it:**
Open browser: http://localhost:6003/health

**Expected response:**
```json
{
  "status": "healthy",
  "service": "custom-code-executor"
}
```

✅ If you see this, Python service is running!

---

### 5. Test Code Execution

**What to do:**
1. Drag Custom Code widget to canvas
2. Connect a data source (Supabase) to Custom Code widget
3. Click "Execute Code" button

**Expected result:**
- Button shows "Executing..."
- After 1-2 seconds: "✅ Success!" in output area
- Output shows: "Processing complete!" (from default code)

✅ If execution works, full pipeline is operational!

---

### 6. Test Database Save

**FIRST:** Run SQL schema in Supabase!

**What to do:**
1. Go to Supabase → SQL Editor
2. Copy contents of `backend/supabase_custom_widgets_schema.sql`
3. Paste and run
4. Should see: "Success. No rows returned"

**Then test save:**
1. In Custom Code widget, enter:
   - Widget Name: "Test Widget"
   - Description: "My first widget"
2. Click "Save to Library"

**Expected result:**
- Alert: "✅ Widget 'Test Widget' saved to community library!"

**Verify in database:**
- Go to Supabase → Table Editor
- Look for table: `custom_widgets`
- Should see 1 row with your widget

✅ If widget appears in database, save is working!

---

### 7. Test Community Browser

**What to do:**
1. Click "Browse Community Widgets" button
2. Modal should open

**If no widgets saved yet:**
- Shows: "No community widgets found. Be the first to create one!"

**If widgets exist:**
- Lists all saved widgets
- Each shows: name, description, author, usage count
- "Load" button on each

**Test load:**
1. Create and save a widget first
2. Open browser modal
3. Click "Load" on your widget
4. Code should load into editor

✅ If you can save and load widgets, community feature works!

---

## 🎯 Summary Checklist

Before showing to instructor, verify:

- [ ] Custom Code widget appears in sidebar
- [ ] Can drag widget to canvas
- [ ] Widget shows code editor and buttons
- [ ] Backend responds at /api/custom-code/list
- [ ] Python service runs on port 6003
- [ ] Can execute simple Python code
- [ ] Database table created in Supabase
- [ ] Can save widget to database
- [ ] Can browse community widgets
- [ ] Can load saved widgets

If ALL items checked, you're ready! ✅

---

## 🚨 Common Issues & Fixes

### Issue: Widget not in sidebar
**Cause:** Frontend not restarted after code changes
**Fix:** 
```bash
Ctrl+C (stop frontend)
npm run dev (restart)
```

### Issue: "Cannot POST /api/custom-code/execute"
**Cause:** Backend not restarted
**Fix:**
```bash
cd backend
START_SERVER_SMART.bat
```

### Issue: "Custom code execution service is not available"
**Cause:** Python service not running
**Fix:**
```bash
cd backend
START_CUSTOM_CODE_SERVICE.bat
```

### Issue: "Table 'custom_widgets' does not exist"
**Cause:** SQL schema not run
**Fix:**
- Go to Supabase SQL Editor
- Run the schema file

### Issue: Code icon not showing
**Cause:** Code icon import missing
**Fix:** Already fixed in Sidebar.tsx, restart frontend

---

## 📸 What to Show Instructor

1. **Sidebar Screenshot**
   - Show "Custom Code" in list

2. **Widget on Canvas**
   - Show code editor, inputs, buttons

3. **Code Execution**
   - Show before/after execution
   - Show success message

4. **Community Browser**
   - Show saved widgets list
   - Show load functionality

5. **Explain the Flow**
   ```
   User writes code → Names it → Executes → Saves to DB → 
   Other users browse → Load widget → Use it → 
   Library grows exponentially!
   ```

This is EXACTLY what your instructor wanted! 🎉

---

## 🎓 Key Points for Presentation

1. **"Custom Code Widget allows users to write Python code"**
   - Show code editor
   - Explain input_data / output_data

2. **"Users label and save widgets"**
   - Show name/description fields
   - Click "Save to Library"

3. **"Saved to database for community sharing"**
   - Show Supabase table
   - Show list of saved widgets

4. **"Collaborative growth - library expands with users"**
   - Explain: 1 user = 1 widget, 100 users = 100+ widgets
   - Network effect!

5. **"Sandboxed execution for security"**
   - Only NumPy/Pandas allowed
   - No file/network access
   - Safe for all users

Good luck! 🚀
