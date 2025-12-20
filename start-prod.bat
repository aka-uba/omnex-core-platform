@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   Omnex Core Platform - Production Server
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
    call npm run prisma:generate
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
    call npx prisma migrate deploy --schema=prisma/core.schema.prisma
    echo.
)

echo BILGI: Production build kontrol ediliyor...
if not exist ".next" (
    echo BILGI: Build olusturuluyor...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo HATA: Build basarisiz!
        pause
        exit /b 1
    )
    echo.
) else (
    if not exist ".next\BUILD_ID" (
        echo UYARI: BUILD_ID bulunamadi. Build yeniden olusturuluyor...
        call npm run build
        if %ERRORLEVEL% NEQ 0 (
            echo HATA: Build basarisiz!
            pause
            exit /b 1
        )
        echo.
    ) else (
        echo BILGI: Mevcut build bulundu.
        echo.
    )
)

set NODE_ENV=production

echo ========================================
echo   Production server baslatiliyor...
echo   NODE_ENV=production
echo   http://localhost:3000
echo   Durdurmak icin Ctrl+C basin
echo ========================================
echo.

call npm start

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
