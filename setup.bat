@echo off
echo ========================================
echo   Omnex Core Platform - Setup
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

echo [BILGI] Node.js versiyonu:
node --version
echo.

echo [BILGI] npm versiyonu:
npm --version
echo.

REM PostgreSQL servis kontrolü
echo [BILGI] PostgreSQL servisi kontrol ediliyor...
powershell -Command "Get-Service | Where-Object {$_.DisplayName -like '*PostgreSQL*' -or $_.Name -like '*postgresql*'} | Select-Object -First 1 | ForEach-Object { if ($_.Status -ne 'Running') { Write-Host '[UYARI] PostgreSQL servisi calismiyor. Baslatiliyor...'; Start-Service -Name $_.Name -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; if ((Get-Service -Name $_.Name).Status -eq 'Running') { Write-Host '[BILGI] PostgreSQL servisi baslatildi.' } else { Write-Host '[HATA] PostgreSQL servisi baslatilamadi! Lutfen manuel olarak baslatin.'; exit 1 } } else { Write-Host '[BILGI] PostgreSQL servisi calisiyor.' } }" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] PostgreSQL servisi kontrol edilemedi veya bulunamadi.
    echo [UYARI] Lutfen PostgreSQL servisinin calistigindan emin olun.
    echo [UYARI] Devam ediliyor...
)
echo.

echo [BILGI] Paketler yukleniyor...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Paket yukleme basarisiz!
    pause
    exit /b 1
)
echo.

REM Core database kontrolü ve oluşturma
echo [BILGI] Core veritabani kontrol ediliyor...
call npm run db:check-core >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Core veritabani bulunamadi veya baglanti kurulamadi.
    echo [BILGI] Core veritabani olusturuluyor...
    call npm run db:create
    if %ERRORLEVEL% NEQ 0 (
        echo [UYARI] Core veritabani olusturulamadi. Devam ediliyor...
    )
    echo.
)

REM Core database migration
echo [BILGI] Core veritabani migration calistiriliyor...
call npx prisma migrate dev --schema=prisma/core.schema.prisma --name init >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Core migration basarisiz olabilir. Devam ediliyor...
)
echo.

REM Prisma client'ları generate et (core ve tenant)
echo [BILGI] Prisma client'lar olusturuluyor (Core ve Tenant)...
call npx prisma generate --schema=prisma/core.schema.prisma
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Core Prisma client olusturma basarisiz!
    pause
    exit /b 1
)

call npx prisma generate --schema=prisma/tenant.schema.prisma
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Tenant Prisma client olusturma basarisiz!
    pause
    exit /b 1
)
echo.

REM Core database seed
echo [BILGI] Core veritabani seed ediliyor...
call npm run db:seed:core
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Core veritabani seed basarisiz! (Devam ediliyor...)
)
echo.

echo ========================================
echo   Kurulum tamamlandi!
echo ========================================
echo.
echo [BILGI] Development server baslatmak icin: start-dev.bat
echo [BILGI] Production server baslatmak icin: start-prod.bat
echo.

pause




