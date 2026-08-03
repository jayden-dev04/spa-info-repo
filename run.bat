@echo off
title SPA Info Repo - Fullstack Launcher
color 0A

echo ========================================================
echo    🚀 STARTING FULLSTACK SPA INFO REPO APPLICATION
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Users\kiena\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"

set "PROJECT_DIR=%~dp0"

echo [1/2] Launching Laravel Backend (http://127.0.0.1:8000)...
start "Laravel Backend Server (Port 8000)" cmd /k "cd /d "%PROJECT_DIR%server" && php -S 127.0.0.1:8000 -t public"

echo [2/2] Launching React Frontend (http://localhost:5173)...
start "React Frontend Server (Port 5173)" cmd /k "cd /d "%PROJECT_DIR%client" && npm run dev"

echo.
echo ========================================================
echo  ✅ Both Frontend and Backend servers are running!
echo  - Frontend App: http://localhost:5173
echo  - Backend API:  http://127.0.0.1:8000/api/users
echo ========================================================
echo.
pause
