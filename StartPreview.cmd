@echo off
cd /d "%~dp0"
echo Installing dependencies and building DashFood. Keep this window open.
call npm run setup
if errorlevel 1 goto failed
call npm run review
:failed
echo.
echo Review the messages above. Node.js 22.12+ or 24 LTS is required.
pause
