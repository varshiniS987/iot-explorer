@echo off
title IoT Final launcher
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org then run this again. & pause & exit /b 1)

if not exist "frontend\node_modules" (echo Installing frontend packages... & pushd frontend & call npm install & popd)
if not exist "backend\node_modules"  (echo Installing backend packages...  & pushd backend  & call npm install & popd)

start "IoT Final - Backend (port 8000)"  cmd /k "cd /d %~dp0backend && npm run dev"
start "IoT Final - Frontend (port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 6 >nul
start http://localhost:5173
echo.
echo Two windows were opened. Close them to stop the app.
echo If the Backend window shows a MongoDB error, the website still works - see README.md.
pause
