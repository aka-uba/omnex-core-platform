@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   Omnex Core Platform - Dev Server
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Node.js bulunamadi!
    echo Lutfen Node.js yukleyin: https://nodejs.org/
    pause
    exit /b 1
)

echo BILGI: Node.js versiyonu:
node --version
echo.

echo BILGI: PostgreSQL servisi kontrol ediliyor...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\check-postgresql-simple.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo HATA: PostgreSQL servisi calismiyor!
    echo.
    pause
    exit /b 1
)
echo.

if not exist "node_modules" (
    echo UYARI: node_modules bulunamadi. Paketler yukleniyor...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo HATA: Paket yukleme basarisiz!
        pause
        exit /b 1
    )
    echo.
)

if not exist "node_modules\.prisma\core-client" (
    echo BILGI: Core Prisma client olusturuluyor...
    call npx prisma generate --schema=prisma/core.schema.prisma
    echo.
)

if not exist "node_modules\.prisma\tenant-client" (
    echo BILGI: Tenant Prisma client olusturuluyor...
    call npx prisma generate --schema=prisma/tenant.schema.prisma
    echo.
)

echo BILGI: Core veritabani kontrol ediliyor...
call npm run db:check-core >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo UYARI: Core veritabani bulunamadi. Olusturuluyor...
    call npm run db:create
    if %ERRORLEVEL% NEQ 0 (
        echo HATA: Core veritabani olusturulamadi!
        pause
        exit /b 1
    )
    echo.
    echo BILGI: Migration calistiriliyor...
    call npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
    echo.
    echo BILGI: Seed ediliyor...
    call npm run db:seed:core
    echo.
)

echo ========================================
echo   Development server baslatiliyor...
echo   http://localhost:3000
echo   Durdurmak icin Ctrl+C basin
echo ========================================
echo.

call npm run dev

echo.
echo BILGI: Server durduruluyor...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock" >nul 2>&1
)

echo BILGI: Temizlik tamamlandi.
pause
