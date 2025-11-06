@echo off
cd /d "%~dp0"
echo Starting backend server on port 5001...
node server.js
pause
