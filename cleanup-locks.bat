@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   Omnex Core Platform - Temizlik
echo ========================================
echo.

cd /d "%~dp0"

echo Port 3000 ve 3001 kontrol ediliyor...
echo.

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Port 3000 - PID: %%a sonlandiriliyor...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Port 3001 - PID: %%a sonlandiriliyor...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Lock dosyalari kontrol ediliyor...

if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock" >nul 2>&1
    echo .next\dev\lock silindi.
) else (
    echo .next\dev\lock yok.
)

if exist ".next\trace" (
    rmdir /s /q ".next\trace" >nul 2>&1
    echo .next\trace silindi.
)

echo.
echo Temizlik tamamlandi!
echo.
pause
