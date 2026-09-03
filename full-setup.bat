@echo off
rem ============================================================
rem  EVA SPA — chayHet migration + seed, KHONG can key/token/SQL Editor.
rem  Chi can EMAIL + MAT KHAU tai khoan Supabase (cai dang vao dashboard).
rem  Bam kep file nay (hoac chay full-setup.bat trong cmd).
rem ============================================================
cd /d "%~dp0server"
echo.
echo Lan dau can dang nhap tai khoan Supabase (email/password dung luc vao dashboard).
echo Mat khau KHONG hien khi go la binh thuong.
set /p EMA=Email Supabase: 
set /p PAS=Mat khau: 
php dev-sync.php login "%EMA%" "%PAS%"
if errorlevel 1 ( echo Dang nhap that bai — kiem tra email/pass (khong phai Gmail). & pause & exit /b 1 )
php dev-sync.php all
pause
