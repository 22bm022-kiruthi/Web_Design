# PowerShell script to start and keep backend server running
$ErrorActionPreference = "Continue"

Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Backend will run on http://localhost:5001" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main\backend"

# Start the server
node server.js

# Keep window open if server crashes
Write-Host ""
Write-Host "Server stopped. Press any key to exit..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
