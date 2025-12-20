@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
echo ========================================
echo   Omnex Core Platform - Dev Server (WSL2)
echo ========================================
echo.

REM Proje dizinine git
cd /d "%~dp0"

echo [BILGI] WSL2 kontrol ediliyor...
wsl --status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] WSL2 bulunamadi veya calismiyor!
    echo [BILGI] Lutfen PC'yi yeniden baslatin veya WSL2'yi manuel olarak baslatin.
    echo [BILGI] WSL2 kontrol: wsl --status
    pause
    exit /b 1
)

echo [BILGI] WSL2 calisiyor.
echo [BILGI] WSL2'de development server baslatiliyor...
echo.

REM Windows path'ini al
set "CURRENT_DIR=%~dp0"
REM Sondaki \ karakterini kaldir
if "!CURRENT_DIR:~-1!"=="\" set "CURRENT_DIR=!CURRENT_DIR:~0,-1!"

echo [DEBUG] Windows Path: !CURRENT_DIR!

REM Manuel WSL path donusumu (C:\path -> /mnt/c/path)
set "WSL_PATH=!CURRENT_DIR!"
set "WSL_PATH=!WSL_PATH:\=/!"
set "WSL_PATH=!WSL_PATH:C:=/mnt/c!"
set "WSL_PATH=!WSL_PATH:c:=/mnt/c!"
set "WSL_PATH=!WSL_PATH:D:=/mnt/d!"
set "WSL_PATH=!WSL_PATH:d:=/mnt/d!"

echo [DEBUG] WSL Path: !WSL_PATH!
echo.

REM WSL2'de bash script'i calistir
echo [BILGI] Script baslatiliyor...
echo [BILGI] Durdurmak icin Ctrl+C basin veya pencereyi kapatin.
echo.
wsl -e bash -c "cd '!WSL_PATH!' && chmod +x start-dev.sh 2>/dev/null; bash start-dev.sh"

echo.
echo [BILGI] Server durdu.
pause
endlocal

