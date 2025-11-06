# ✅ Supabase Integration - Complete Setup Guide

## Current Status

✅ Frontend code updated with Fetch UI
✅ Backend proxy route ready  
⚠️ **ACTION NEEDED:** Add your service_role key to `backend/.env`

## 🔑 How to Get Your Service Role Key (2 minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/zatafiglyptbujqzsohc/settings/api

Login with: `22bm022@drngpit.ac.in`

### Step 2: Copy the Service Role Key

On the API settings page, you'll see two keys:

| Key Type | Description | What to Do |
|----------|-------------|------------|
| `anon` / `public` | For client-side use | ❌ Don't use this |
| `service_role` 🔒 | Bypasses RLS, full access | ✅ **USE THIS ONE** |

Click the **Copy** button next to `service_role` key.

### Step 3: Update backend/.env

Open: `backend/.env`

Replace `your_service_role_key_here` with the key you copied:

```env
SUPABASE_URL=https://zatafiglyptbujqzsohc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc..... (paste the full key here)
SUPABASE_TABLE=raman_data
```

Save the file.

## 🚀 Quick Start (After Adding Key)

### Terminal 1 - Backend
```powershell
cd C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main\backend
npm install
npm run dev
```

Expected output:
```
Server running on port 5001
SUPABASE_URL set: true
```

### Terminal 2 - Frontend  
```powershell
cd C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main
npm run dev
```

Expected output:
```
VITE vX.X.X ready in XXX ms
➜ Local: http://localhost:5173/
```

### Terminal 3 - Test Backend Connection
```powershell
curl "http://127.0.0.1:5001/api/supabase/fetch?table=raman_data&limit=5" -UseBasicParsing
```

Expected: JSON response with your data rows

## 🎯 Using the Supabase Widget

1. Open the app in your browser (http://localhost:5173)
2. Add a **Supabase Source** widget to the canvas
3. Enter table name: `raman_data`
4. Click **Fetch**
5. You should see: "X rows loaded"
6. Click **Open Preview** to view the data as a line chart

## 🐛 Troubleshooting

### "No data loaded" or "Error: ..."

**Check 1:** Is the backend running?
```powershell
curl "http://127.0.0.1:5001/api/health" -UseBasicParsing
```
Should return: `{"status":"ok"}`

**Check 2:** Did you add the service_role key?
```powershell
Get-Content C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main\backend\.env
```
Should NOT show `your_service_role_key_here`

**Check 3:** Did you restart the backend after editing .env?
Stop the backend (Ctrl+C) and run `npm run dev` again

**Check 4:** Test the Supabase endpoint directly
```powershell
curl "http://127.0.0.1:5001/api/supabase/fetch?table=raman_data&limit=5" -UseBasicParsing
```

Common responses:
- `{"error": "SUPABASE_URL not configured"}` → Restart backend
- `401` or `403` → Wrong key or table doesn't exist
- `{"data": [...]}` → ✅ Working! Check frontend code

### Backend won't start

**Error:** `EADDRINUSE: port 5001 already in use`

Solution:
```powershell
# Find what's using port 5001
netstat -ano | findstr :5001

# Kill that process (replace XXXX with PID from above)
Stop-Process -Id XXXX -Force

# Try starting backend again
npm run dev
```

### Frontend shows "Backend not reachable"

1. Make sure backend is running (Terminal 1)
2. Check `vite.config.ts` has proxy to `http://127.0.0.1:5001`
3. Restart frontend dev server

## 📋 What Changed

### Files Modified:
- `src/components/CanvasWidget.tsx` - Added Supabase fetch UI and auto-mapping
- `backend/.env` - Template updated with service_role key placeholder
- `backend/routes/supabase.js` - Already had the proxy (no changes needed)

### New Files Created:
- `GET_SERVICE_KEY.md` - Detailed instructions
- `SUPABASE_SETUP.md` - This file!
- `test_supabase_connection.py` - Python test script (optional)

## ⚠️ Security Reminders

1. **NEVER commit `backend/.env` to Git** (it's in `.gitignore`)
2. **NEVER share your service_role key publicly**
3. The service_role key has FULL database access - keep it secret!
4. Only use service_role key server-side (in `backend/`)

## 📞 Still Need Help?

If you're stuck:

1. Paste the output of these commands:
   ```powershell
   # Backend logs
   Get-Content C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main\backend\server.log -Tail 50
   
   # Test endpoint
   curl "http://127.0.0.1:5001/api/supabase/fetch?table=raman_data&limit=2" -UseBasicParsing
   
   # Check if backend is listening
   netstat -ano | findstr :5001
   ```

2. Screenshot of any error messages in:
   - Backend terminal
   - Frontend browser console (F12)
   - The Supabase widget error message

---

**Next:** After adding your service_role key, run the commands in the "Quick Start" section above! 🚀
