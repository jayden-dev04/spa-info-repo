@echo off
rem Eva Spa — migrate + seed + do luong, CHI CAN 1 token:
rem   https://supabase.com/dashboard/account/tokens -> New token -> copy (bat dau "sbp_")
rem Chay:  full-sync.bat  (roi dan token khi hoi)
cd /d "%~dp0"
set /p SUPABASE_ACCESS_TOKEN=Dan token (sbp_...) roi Enter: 
if "%SUPABASE_ACCESS_TOKEN%"=="" ( echo CHUA co token & pause & exit /b 1 )
cd client
node --experimental-strip-types scripts/full-sync.mjs
pause
