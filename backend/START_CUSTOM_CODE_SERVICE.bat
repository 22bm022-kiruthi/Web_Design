@echo off
REM Start Custom Code Execution Service (Python)
echo Starting Custom Code Execution Service...
echo.

cd /d "%~dp0python"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking Python dependencies...
python -c "import flask, flask_cors, numpy, pandas" >nul 2>&1
if errorlevel 1 (
    echo Installing required Python packages...
    pip install flask flask-cors numpy pandas
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Custom Code Service Starting on Port 6003
echo ========================================
echo.
echo Press Ctrl+C to stop the service
echo.

REM Start the Python service
python custom_code_service.py

pause
