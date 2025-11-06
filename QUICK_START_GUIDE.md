# 🎯 QUICK START GUIDE - NEVER GET ECONNREFUSED ERROR AGAIN!

## 🚀 THE EASIEST WAY (Recommended)

### **Just Double-Click This File:**
```
📁 START_ALL_SERVERS.bat
```

**That's it!** It will:
1. ✅ Kill any port conflicts
2. ✅ Start backend server (port 5001)
3. ✅ Start frontend server (port 5173)
4. ✅ Open your browser automatically
5. ✅ Show you two CMD windows (keep them open!)

---

## 🔧 Manual Way (If you prefer terminals)

### **Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```
✅ Keep this window open!

### **Terminal 2 - Frontend:**
```powershell
npm run dev
```
✅ Keep this window open!

### **Then open browser:**
```
http://localhost:5173
```

---

## 🔍 How to Know Everything is Working

### **Test 1: Backend Health Check**
Open this URL in browser:
```
http://127.0.0.1:5001/api/health
```
✅ Should show: `{"status":"ok"}`

### **Test 2: Frontend Loads**
```
http://localhost:5173
```
✅ Should show: Your app UI

### **Test 3: Supabase Connection**
In your app:
1. Add Supabase Source widget
2. Enter table: `raman_data`
3. Enter filter: `Polystyrene (PS)`
4. Click "Load Data"
5. ✅ Should show: "70 instances" or similar

---

## ❌ TROUBLESHOOTING

### Error: "ECONNREFUSED 127.0.0.1:5001"

**Cause:** Backend server is NOT running

**Fix:**
```powershell
# Check if server is running
netstat -ano | findstr :5001

# If nothing shows, start the server:
cd backend
node server.js
```

---

### Error: "Port 5001 already in use"

**Fix:**
```powershell
# Find the process
netstat -ano | findstr :5001

# Look for TCP LISTENING line, note the PID (last number)
# Kill it:
taskkill /F /PID <PID_NUMBER>

# Or use automated fix:
$pid = (Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }

# Then start server
cd backend
node server.js
```

---

### Error: Server starts then exits immediately

**Possible causes:**
1. Syntax error in code
2. Port conflict
3. Missing dependencies

**Fix:**
```powershell
# Check for errors
cd backend
node -c server.js

# If no output, syntax is OK
# Try running with full output:
node server.js

# Look for any error messages
```

---

## 📱 Daily Development Workflow

```
Morning:
  1. Double-click: START_ALL_SERVERS.bat
  2. Wait 10 seconds
  3. Browser opens automatically
  4. Start coding! 🎉

During Work:
  - Keep both CMD windows open
  - Refresh browser (F5) when needed
  - Check backend window for API logs

End of Day:
  - Close both CMD windows (or press Ctrl+C)
  - Or just close VS Code (servers will stop)
```

---

## 🎓 Understanding the Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    Browser      │         │   VS Code       │
│  localhost:5173 │         │                 │
└────────┬────────┘         └─────────────────┘
         │                           
         │ HTTP Requests             
         ↓                           
┌─────────────────┐         ┌─────────────────┐
│  Frontend       │  API    │   Backend       │
│  (Vite/React)   │────────→│   (Node/Express)│
│  Port 5173      │  Calls  │   Port 5001     │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ SQL Queries
                                     ↓
                            ┌─────────────────┐
                            │   Supabase      │
                            │   (PostgreSQL)  │
                            │   Remote Cloud  │
                            └─────────────────┘
```

**Key Points:**
- Frontend (port 5173) → Makes API calls → Backend (port 5001)
- Backend (port 5001) → Queries → Supabase (cloud)
- **If backend is down → Frontend gets ECONNREFUSED**

---

## ✅ Success Checklist

Before using the app, ensure all are ✅:

- [ ] Backend server running (CMD window open)
- [ ] Frontend server running (npm run dev)
- [ ] http://127.0.0.1:5001/api/health returns {"status":"ok"}
- [ ] http://localhost:5173 shows app UI
- [ ] No ECONNREFUSED errors in browser console

---

## 🆘 Emergency Restart

If everything is broken:

```powershell
# 1. Kill everything
taskkill /F /IM node.exe

# 2. Wait 3 seconds
Start-Sleep -Seconds 3

# 3. Restart all
START_ALL_SERVERS.bat
```

---

## 📞 Still Stuck?

Common issues and solutions:

| Symptom | Solution |
|---------|----------|
| Backend won't start | Check `node --version` (need v14+) |
| Port conflict | Kill process: `taskkill /F /PID <PID>` |
| Firewall blocking | Allow Node.js in Windows Firewall |
| Frontend won't connect | Check backend is on port 5001 |
| Supabase timeout | Check internet connection |

---

**Remember:** 
- ✅ Always start BACKEND first, then FRONTEND
- ✅ Keep both server windows OPEN
- ✅ One-click solution: `START_ALL_SERVERS.bat`

**You'll never see ECONNREFUSED again!** 🎉
