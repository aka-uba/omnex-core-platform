@echo off
echo ========================================
echo   Omnex Core Platform - Dev Server
echo ========================================
echo.

REM Proje dizinine git
cd /d "%~dp0"

REM Node.js kontrolü
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen Node.js yukleyin: https://nodejs.org/
    pause
    exit /b 1
)

REM Node.js versiyonunu göster
echo [BILGI] Node.js versiyonu:
node --version
echo.

REM PostgreSQL servis kontrolü ve başlatma
echo [BILGI] PostgreSQL servisi kontrol ediliyor...
echo.

REM Önce servis kontrolü yap
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\check-postgresql-simple.ps1"
set PG_CHECK_ERROR=%ERRORLEVEL%

if %PG_CHECK_ERROR% NEQ 0 (
    echo.
    echo [UYARI] PostgreSQL servisi bulunamadi veya calismiyor!
    echo.
    echo [BILGI] Cozum onerileri:
    echo [BILGI]   1. PostgreSQL Windows servisi olarak kayitli degilse:
    echo [BILGI]      - scripts\add-postgresql-to-services.bat dosyasini calistirin
    echo [BILGI]      - Veya PowerShell'i YONETICI olarak acip scripts\stop-and-register-service.ps1 calistirin
    echo [BILGI]   2. Servis kayitli ama calismiyorsa:
    echo [BILGI]      - services.msc acin ve PostgreSQL servisini baslatin
    echo [BILGI]      - Veya: PowerShell'de Start-Service postgresql-x64-18
    echo.
    
    REM Son kontrol
    if %PG_CHECK_ERROR% NEQ 0 (
        echo.
        echo [HATA] PostgreSQL servisi calismiyor veya baglanti kurulamadi!
        echo.
        echo [BILGI] Cozum onerileri:
        echo [BILGI]   1. PostgreSQL Windows servisi olarak kayitli degilse:
        echo [BILGI]      - scripts\add-postgresql-to-services.bat dosyasini calistirin
        echo [BILGI]      - Veya PowerShell'i YONETICI olarak acip scripts\stop-and-register-service.ps1 calistirin
        echo [BILGI]   2. Servis kayitli ama calismiyorsa:
        echo [BILGI]      - services.msc acin ve PostgreSQL servisini baslatin
        echo [BILGI]      - Veya: PowerShell'de Start-Service postgresql-x64-18
        echo [BILGI]   3. PostgreSQL'in localhost:5432 portunda calistigindan emin olun
        echo [BILGI]   4. .env dosyanizdaki CORE_DATABASE_URL ve TENANT_DB_TEMPLATE_URL degerlerini kontrol edin
        echo.
        pause
        exit /b 1
    )
)
echo.

REM node_modules kontrolü
if not exist "node_modules" (
    echo [UYARI] node_modules bulunamadi. Paketler yukleniyor...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [HATA] Paket yukleme basarisiz!
        pause
        exit /b 1
    )
    echo.
)

REM Prisma client kontrolü (core ve tenant)
if not exist "node_modules\.prisma\core-client" (
    echo [BILGI] Core Prisma client olusturuluyor...
    call npx prisma generate --schema=prisma/core.schema.prisma
    echo.
)

if not exist "node_modules\.prisma\tenant-client" (
    echo [BILGI] Tenant Prisma client olusturuluyor...
    call npx prisma generate --schema=prisma/tenant.schema.prisma
    echo.
)

REM Core database kontrolü
echo [BILGI] Core veritabani kontrol ediliyor...
call npm run db:check-core >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Core veritabani bulunamadi veya baglanti kurulamadi.
    echo [BILGI] Core veritabani olusturuluyor...
    call npm run db:create
    if %ERRORLEVEL% NEQ 0 (
        echo [HATA] Core veritabani olusturulamadi!
        pause
        exit /b 1
    )
    echo.
    echo [BILGI] Core veritabani migration calistiriliyor...
    call npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
    echo.
    echo [BILGI] Core veritabani seed ediliyor...
    call npm run db:seed:core
    echo.
)

echo [BILGI] Development server baslatiliyor...
echo [BILGI] Tarayicinizda http://localhost:3000 adresini acin
echo.
echo [BILGI] Durdurmak icin Ctrl+C basin
echo.

REM Development server'ı başlat
call npm run dev

pause




