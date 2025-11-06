@echo off
REM ===================================================================
REM Smart Backend Server Startup
REM Automatically kills port conflicts and starts server
REM ===================================================================

title Backend Server Startup
color 0A

echo.
echo ========================================
echo   Smart Backend Server Startup
echo ========================================
echo.

REM Kill any existing node.exe processes
echo [1/4] Checking for existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL%==0 (
    echo       Found and killed existing Node.js processes
) else (
    echo       No existing Node.js processes found
)

REM Kill lktsrv.exe if it exists (common port 5001 conflict)
echo [2/4] Checking for port 5001 conflicts...
taskkill /F /IM lktsrv.exe >nul 2>&1
if %ERRORLEVEL%==0 (
    echo       Killed conflicting lktsrv.exe process
) else (
    echo       No lktsrv.exe conflict found
)

REM Wait for ports to clear
echo [3/4] Waiting for port 5001 to clear...
timeout /t 3 /nobreak >nul
echo       Port should be clear now

REM Start the server
echo [4/4] Starting backend server...
echo.
echo ========================================
echo   Server running on port 5001
echo ========================================
echo.
echo   Backend: http://127.0.0.1:5001
echo   Health:  http://127.0.0.1:5001/api/health
echo.
echo   Keep this window OPEN!
echo.
echo ========================================
echo.

cd /d "%~dp0"
node server.js

echo.
echo ========================================
echo   Server has stopped!
echo ========================================
echo.
pause
