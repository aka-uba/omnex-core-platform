@echo off
echo ========================================
echo   PostgreSQL Servis Kaydi Olusturma
echo ========================================
echo.
echo [BILGI] Bu islem yonetici yetkisi gerektirir.
echo [BILGI] UAC penceresi acilacak, lutfen "Evet" deyin.
echo.
echo [BILGI] Bu script:
echo [BILGI]   1. Calisan PostgreSQL'i durduracak
echo [BILGI]   2. postmaster.pid dosyasini temizleyecek
echo [BILGI]   3. Windows servis kaydini olusturacak
echo [BILGI]   4. Servisi baslatacak
echo.
pause

REM PowerShell scriptini yönetici olarak çalıştır
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '%~dp0stop-and-register-service.ps1' -Verb RunAs -Wait"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [BILGI] PostgreSQL servis kaydi basariyla olusturuldu!
    echo [BILGI] Artik Windows servisleri uzerinden yonetebilirsiniz (services.msc)
    echo [BILGI] Servis adi: postgresql-x64-18
) else (
    echo.
    echo [HATA] Servis kaydi olusturulamadi!
    echo [BILGI] Lutfen PowerShell'i yonetici olarak acip scripts\stop-and-register-service.ps1 calistirin
)

echo.
pause

