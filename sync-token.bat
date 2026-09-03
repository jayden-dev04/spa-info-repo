@echo off
rem ============================================================
rem  EVA SPA — Nhap TOKEN tai khoan Supabase (KHONG phai sb_secret_!) vao server\.mgmt_token
rem  Token lay tai: https://supabase.com/dashboard/account/tokens
rem    -> New token -> ten "eva-sync" -> copy chuoi dai (vi du "d9f2...") -> DAN o day.
rem  Chay 2 buoc: enable-exec-sql (1 lan, idempotent) -> dev-sync all (migrate+seed+status)
rem ============================================================
cd /d "%~dp0server"
setlocal EnableDelayedExpansion
set /p T=Token tai khoan (khong phai sb_secret_): 
if "%T%"=="" ( echo Trong token. & pause & exit /b 1 )
>nul echo !T!> .mgmt_token
php enable-exec-sql.php
php dev-sync.php all
pause
