# ⚠️ BEFORE USING THE APP - STARTUP CHECKLIST

## 📋 Every Time You Open the Project:

### ✅ Step 1: Start Backend Server (CRITICAL!)

**Option A - Double-Click:**
```
📁 backend/START_SERVER.bat  ← DOUBLE CLICK THIS!
```

**Option B - PowerShell:**
```powershell
cd backend
node server.js
```

**✅ Confirm it's running:**
- Open: http://127.0.0.1:5001/api/health
- Should show: `{"status":"ok"}`
- **KEEP THE WINDOW OPEN!**

---

### ✅ Step 2: Start Frontend Server

```powershell
npm run dev
```

**✅ Confirm it's running:**
- Open: http://localhost:5173
- Should show your app UI

---

### ✅ Step 3: Refresh Browser

Press **F5** or **Ctrl+R** in your browser

---

## 🔴 If You See This Error:

```
[vite] http proxy error: /api/supabase/fetch
Error: connect ECONNREFUSED 127.0.0.1:5001
```

**FIX:** Backend server is NOT running!
→ Go back to Step 1 and start the backend server

---

## 🎯 Quick Health Check

Before using the app, verify both servers are running:

| Check | URL | Expected Response |
|-------|-----|-------------------|
| Backend | http://127.0.0.1:5001/api/health | `{"status":"ok"}` |
| Frontend | http://localhost:5173 | App loads |

---

## 💡 Pro Tip

**Keep TWO terminal windows open side-by-side:**

```
┌─────────────────────┐  ┌─────────────────────┐
│  Terminal 1         │  │  Terminal 2         │
│  Backend Server     │  │  Frontend Server    │
│  Port: 5001         │  │  Port: 5173         │
│                     │  │                     │
│  node server.js     │  │  npm run dev        │
│  ✅ KEEP OPEN!       │  │  ✅ KEEP OPEN!       │
└─────────────────────┘  └─────────────────────┘
```

---

## ⚡ One-Command Startup (Advanced)

Create this script to start both servers at once:

**start-all.bat:**
```batch
@echo off
start cmd /k "cd backend && node server.js"
timeout /t 3
start cmd /k "npm run dev"
echo.
echo ✅ Both servers starting...
echo ✅ Backend: http://127.0.0.1:5001
echo ✅ Frontend: http://localhost:5173
echo.
pause
```

---

**🎉 You're all set! Start coding!**
