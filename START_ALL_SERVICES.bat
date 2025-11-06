@echo off
echo ========================================
echo   STARTING ALL SERVICES
echo ========================================
echo.

REM Kill any existing processes
echo Stopping existing services...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start Backend
echo Starting Backend Server (Port 5001)...
start "Backend Server - Port 5001" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul

REM Start Python Service
echo Starting Python Service (Port 6003)...
start "Python Service - Port 6003" cmd /k "cd /d "%~dp0backend" && python\\.venv\\Scripts\\python.exe python\\custom_code_service.py"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend (Port 5173)...
start "Frontend - Port 5173" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Check the 3 new windows that opened:
echo   - Backend Server - Port 5001
echo   - Python Service - Port 6003  
echo   - Frontend - Port 5173
echo.
echo Your website will be at: http://localhost:5173/
echo.
echo Press any key to close this window...
pause >nul
