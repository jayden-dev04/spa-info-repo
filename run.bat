@echo off
title Eva Spa - Fullstack TMDT Launcher
color 0A

echo ======================================================================
echo    🌿 KHOI DONG HE THONG TMDT & SPA DUONG SINH EVA SPA
echo ======================================================================
echo.

set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Users\kiena\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"

set "PROJECT_DIR=%~dp0"

echo [1/2] Dang khoi chay Laravel REST API Backend (http://localhost:8000)...
start "Laravel Backend Server (Port 8000)" cmd /k "cd /d "%PROJECT_DIR%server" && php -S localhost:8000 -t public"

echo [2/2] Dang khoi chay React 19 Frontend (http://localhost:5173)...
start "React Frontend Server (Port 5173)" cmd /k "cd /d "%PROJECT_DIR%client" && npm run dev"

echo.
echo ======================================================================
echo  ✅ He thong da khoi dong thanh cong!
echo.
echo  🌐 GIAO DIEN NGUOI DUNG (React SPA):
echo     * Trang chu:          http://localhost:5173/
echo     * Cua hang my pham:   http://localhost:5173/shop
echo     * Dat lich duong sinh:http://localhost:5173/booking
echo     * Cam nang & Blog:    http://localhost:5173/blog
echo     * Trang quan tri:     http://localhost:5173/admin
echo.
echo  🔌 REST API ENGINE (Laravel Backend):
echo     * API Health & Status:http://localhost:8000/
echo     * Appointments API:   http://localhost:8000/api/appointments
echo     * Orders API:         http://localhost:8000/api/orders
echo     * Auth role check:    POST http://localhost:8000/api/auth/exchange
echo.
echo  ^^^^^ Dang nhap chi dung GOOGLE. Sau khi mo Google, quay ve:
echo     http://localhost:5173/auth/callback
echo     -> ca 2 URL (localhost + 127.0.0.1) dang :5173 PHAI duoc khai bao
echo        trong Supabase > Authentication > URL Configuration.
echo        Va them 2 URL do vao Google Cloud > Authorized redirect URIs.
echo ======================================================================
echo.
pause
