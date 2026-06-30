@echo off
echo ==============================================
echo        Starting ERP 2.0 (Phase 1)
echo ==============================================

echo [1/2] Starting Express Backend Server...
start cmd /k "cd backend && npm run dev"

echo [2/2] Starting Next.js Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are booting up in separate windows!
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
pause
