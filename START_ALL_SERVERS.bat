@echo off
REM ===================================================================
REM ONE-COMMAND STARTUP - Starts both Backend and Frontend servers
REM ===================================================================

title Starting All Servers...
color 0B

echo.
echo ========================================
echo   Starting All Servers
echo ========================================
echo.

REM Kill any existing node processes on port 5001
echo Checking for port conflicts...

REM Kill all node.exe processes
taskkill /F /IM node.exe >nul 2>&1

REM Kill lktsrv.exe (common conflict on port 5001)
taskkill /F /IM lktsrv.exe >nul 2>&1

REM Also check and kill by port (more thorough)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    echo Killing process on port 5001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 3 /nobreak >nul

REM Start Backend Server in new window
echo.
echo [1/2] Starting Backend Server (Port 5001)...
start "Backend Server - Port 5001" cmd /k "cd /d "%~dp0backend" && node server.js"

REM Wait for backend to start
timeout /t 4 /nobreak >nul

REM Start Frontend Server in new window  
echo [2/2] Starting Frontend Server (Port 5173)...
start "Frontend Server - Port 5173" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================
echo   ✅ Servers Starting!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:5001
echo Frontend: http://localhost:5173
echo.
echo Wait 10 seconds, then open: http://localhost:5173
echo.
echo ⚠️  Keep both windows OPEN!
echo    Closing them will stop the servers.
echo.
echo ========================================
echo.

timeout /t 10

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ✅ All done! You can close this window.
echo.
pause
