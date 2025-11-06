@echo off
echo Starting Custom Code Execution Service...
cd /d "%~dp0"
python custom_code_service.py
pause
