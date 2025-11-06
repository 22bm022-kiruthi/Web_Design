# 🔴 FIX: EADDRINUSE - Port 5001 Already in Use

## ❌ The Error You're Seeing:

```
Uncaught Exception: Error: listen EADDRINUSE: address already in use 0.0.0.0:5001
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '0.0.0.0',
  port: 5001
```

**What this means:** Another process is already using port 5001

---

## ✅ INSTANT FIX (One Command)

### **Option 1: Use Smart Startup Script** ⭐ **EASIEST**

**Double-click this file:**
```
📁 backend/START_SERVER_SMART.bat
```

This automatically:
- ✅ Kills all conflicting processes
- ✅ Clears port 5001
- ✅ Starts backend server
- ✅ Never fails!

---

### **Option 2: PowerShell One-Liner**

Copy and paste this into PowerShell:

```powershell
taskkill /F /IM node.exe; taskkill /F /IM lktsrv.exe; Start-Sleep -Seconds 3; cd backend; node server.js
```

---

### **Option 3: Manual Kill + Restart**

```powershell
# Step 1: Kill all Node.js processes
taskkill /F /IM node.exe

# Step 2: Kill lktsrv (common port 5001 conflict)
taskkill /F /IM lktsrv.exe

# Step 3: Wait 3 seconds
Start-Sleep -Seconds 3

# Step 4: Start backend
cd backend
node server.js
```

---

## 🔍 UNDERSTANDING THE PROBLEM

### **Common Culprits on Port 5001:**

1. **Previous Node.js instance** (your own backend from earlier)
   - Forgot to close the terminal
   - Process didn't exit cleanly

2. **lktsrv.exe** (Logitech Keyboard/Mouse Service)
   - Randomly uses port 5001
   - Most common conflict!

3. **Other background services**
   - TeamViewer
   - Remote desktop tools
   - Development tools

---

## 🛠️ DETAILED TROUBLESHOOTING

### **Step 1: Identify the Process**

```powershell
# See what's using port 5001
netstat -ano | findstr :5001
```

**Example output:**
```
TCP    0.0.0.0:5001    0.0.0.0:0    LISTENING    12345
UDP    0.0.0.0:5001    *:*                       6096
```

The last number is the **PID (Process ID)**

---

### **Step 2: Find the Process Name**

```powershell
# Find out what process it is (replace 12345 with actual PID)
Get-Process -Id 12345
```

**Example output:**
```
ProcessName   : node
Id            : 12345
```

---

### **Step 3: Kill the Process**

```powershell
# Kill by PID
taskkill /F /PID 12345

# Or kill all instances of a process
taskkill /F /IM node.exe
taskkill /F /IM lktsrv.exe
```

---

### **Step 4: Verify Port is Clear**

```powershell
# Check if port is now free
netstat -ano | findstr :5001
```

**Expected:** No output (port is free)

---

## 🚨 PERSISTENT CONFLICTS (lktsrv.exe)

### **Problem:** lktsrv.exe keeps restarting

**lktsrv.exe** is a Logitech service that may automatically restart.

### **Solutions:**

#### **Option A: Kill before every start** (Recommended)
```powershell
# Add to your startup routine
taskkill /F /IM lktsrv.exe 2>$null
Start-Sleep -Seconds 2
node server.js
```

#### **Option B: Change backend port** (Permanent fix)

Edit `backend/server.js`:

```javascript
// Change from:
const PORT = process.env.PORT || 5001;

// To:
const PORT = process.env.PORT || 5002;
```

Then update `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5002', // Changed from 5001
      // ...
    }
  }
}
```

#### **Option C: Disable Logitech service** (System-wide)

**⚠️ Only if you don't use Logitech keyboard/mouse!**

1. Press `Win + R`
2. Type: `services.msc`
3. Find "Logitech Keyboard Service" or similar
4. Right-click → Properties
5. Startup type: **Disabled**
6. Click **Stop**
7. Click **OK**

---

## 🔄 AUTOMATED FIX SCRIPT

### **Create: `clear-port-5001.ps1`**

```powershell
# Save this as: clear-port-5001.ps1
Write-Host "🔍 Finding processes on port 5001..." -ForegroundColor Yellow

$tcpConnections = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
$udpConnections = Get-NetUDPEndpoint -LocalPort 5001 -ErrorAction SilentlyContinue

if ($tcpConnections) {
    $tcpConnections | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "❌ Killing $($process.Name) (PID: $($_.OwningProcess))" -ForegroundColor Red
        Stop-Process -Id $_.OwningProcess -Force
    }
}

if ($udpConnections) {
    $udpConnections | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "❌ Killing $($process.Name) (PID: $($_.OwningProcess))" -ForegroundColor Red
        Stop-Process -Id $_.OwningProcess -Force
    }
}

Start-Sleep -Seconds 2
Write-Host "✅ Port 5001 is now clear!" -ForegroundColor Green
```

**Usage:**
```powershell
# Run before starting backend
.\clear-port-5001.ps1
cd backend
node server.js
```

---

## 📋 PREVENTION CHECKLIST

### **Every Time You Stop Coding:**

- [ ] Press `Ctrl+C` in backend terminal
- [ ] Close the backend terminal window
- [ ] Verify with: `netstat -ano | findstr :5001` (should be empty)

### **Every Time You Start Coding:**

- [ ] Check if port is free: `netstat -ano | findstr :5001`
- [ ] If occupied, run: `taskkill /F /IM node.exe; taskkill /F /IM lktsrv.exe`
- [ ] Wait 3 seconds
- [ ] Start backend: `cd backend && node server.js`

---

## 🎯 QUICK REFERENCE

### **Most Common Fix:**
```powershell
taskkill /F /IM node.exe
taskkill /F /IM lktsrv.exe
Start-Sleep -Seconds 3
cd backend
node server.js
```

### **Check if Port is Free:**
```powershell
netstat -ano | findstr :5001
# No output = Port is free ✅
# Output shown = Port occupied ❌
```

### **Find What's Using Port:**
```powershell
Get-NetTCPConnection -LocalPort 5001 | Select-Object OwningProcess
Get-Process -Id <PID_FROM_ABOVE>
```

### **Kill by Process Name:**
```powershell
taskkill /F /IM <process_name>.exe
```

### **Kill by PID:**
```powershell
taskkill /F /PID <process_id>
```

---

## 🆘 STILL HAVING ISSUES?

### **Last Resort Options:**

#### **1. Restart Computer**
- Clears all port conflicts
- Fresh start guaranteed

#### **2. Use Different Port**
- Edit `backend/server.js`: Change `5001` to `5002`
- Edit `vite.config.ts`: Change proxy target to `5002`
- Restart both servers

#### **3. Check Windows Firewall**
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

#### **4. Run as Administrator**
- Right-click PowerShell
- "Run as Administrator"
- Try killing processes again

---

## ✅ SUCCESS INDICATORS

### **Backend Started Successfully:**

```
WARN: MONGO_URI not set — running in Supabase-only / local-fallback mode
Server running on port 5001
SUPABASE_URL set: true
SUPABASE_SERVICE_KEY present: true
```

### **Health Check Passes:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/health"
# Output: status : ok
```

### **Frontend Connects:**
- No ECONNREFUSED errors in browser console
- Supabase widget can load data
- No proxy errors in terminal

---

## 📊 ERROR vs. SUCCESS

### **❌ Error State:**
```
Uncaught Exception: Error: listen EADDRINUSE: address already in use 0.0.0.0:5001
```

### **✅ Success State:**
```
Server running on port 5001
SUPABASE_URL set: true
SUPABASE_SERVICE_KEY present: true
```

---

## 🎓 UNDERSTANDING THE ERROR

**EADDRINUSE** means:
- **E** = Error
- **ADDR** = Address
- **IN USE** = Already occupied

**Why it happens:**
1. You started the server
2. It crashed or you closed terminal without stopping it
3. Process is still running in background
4. You try to start server again
5. Port 5001 is still occupied by old process
6. New server can't bind to port → Error!

**How Node.js works:**
- One process per port
- Port 5001 can only have ONE listener
- If occupied, new listener fails with EADDRINUSE

---

## 🚀 SUMMARY

**The Problem:**
- Port 5001 is already in use
- Usually by old Node.js or lktsrv.exe

**The Solution:**
1. **Double-click:** `backend/START_SERVER_SMART.bat` (easiest)
2. **Or manually:** Kill node.exe and lktsrv.exe, wait 3 seconds, restart

**Prevention:**
- Always close backend terminal with `Ctrl+C`
- Use START_SERVER_SMART.bat which auto-clears conflicts
- Check port before starting: `netstat -ano | findstr :5001`

**Never Fails Method:**
```powershell
taskkill /F /IM node.exe
taskkill /F /IM lktsrv.exe
Start-Sleep -Seconds 3
cd backend
node server.js
```

---

**✅ You should now be able to start your backend server without errors!**
