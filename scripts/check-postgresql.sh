#!/bin/bash

# PostgreSQL Servis ve Baglanti Kontrol Script (WSL2/Linux)
# PostgreSQL servisinin çalışıp çalışmadığını ve bağlantı kurulup kurulamadığını kontrol eder

set -e

echo "[BILGI] PostgreSQL servisi kontrol ediliyor..."

# WSL2 ortamını tespit et
IS_WSL=false
if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
    IS_WSL=true
    echo "[BILGI] WSL2 ortami tespit edildi."
fi

# WSL2'de Windows'taki PostgreSQL'i kontrol et
if [ "$IS_WSL" = true ]; then
    echo "[BILGI] Windows'taki PostgreSQL kontrolu yapiliyor..."

    # Windows'ta netstat ile port kontrolü yap
    WIN_PG_CHECK=$(cmd.exe /c "netstat -an" 2>/dev/null | tr -d '\r' | grep ":5432" | grep "LISTENING" || true)

    if [ -n "$WIN_PG_CHECK" ]; then
        echo "[BILGI] Windows'ta PostgreSQL servisi calisiyor (port 5432 aktif)."
        echo "[BILGI] PostgreSQL kontrolu tamamlandi."
        exit 0
    else
        echo "[HATA] Windows'ta PostgreSQL servisi calismiyor!"
        echo "[BILGI] Cozum onerileri:"
        echo "[BILGI]   1. Windows'ta PostgreSQL servisini baslatin"
        echo "[BILGI]   2. pgAdmin veya Services'ten PostgreSQL'i kontrol edin"
        echo "[BILGI]   3. Port 5432'nin kullanildigini dogrulayin"
        exit 1
    fi
fi

# Linux/Native ortam için eski kontrol mantığı
# PostgreSQL servisinin çalışıp çalışmadığını kontrol et
if command -v systemctl >/dev/null 2>&1; then
    # systemd kullanılıyorsa
    if systemctl is-active --quiet postgresql || systemctl is-active --quiet postgresql@*; then
        echo "[BILGI] PostgreSQL servisi calisiyor."
    else
        echo "[UYARI] PostgreSQL servisi calismiyor. Baslatiliyor..."
        if systemctl start postgresql 2>/dev/null || systemctl start postgresql@* 2>/dev/null; then
            echo "[BILGI] PostgreSQL servisi baslatildi."
            sleep 2
        else
            echo "[HATA] PostgreSQL servisi baslatilamadi!"
            echo "[BILGI] Manuel olarak baslatmayi deneyin: sudo systemctl start postgresql"
            exit 1
        fi
    fi
elif command -v service >/dev/null 2>&1; then
    # service komutu kullanılıyorsa
    if service postgresql status >/dev/null 2>&1; then
        echo "[BILGI] PostgreSQL servisi calisiyor."
    else
        echo "[UYARI] PostgreSQL servisi calismiyor. Baslatiliyor..."
        if sudo service postgresql start 2>/dev/null; then
            echo "[BILGI] PostgreSQL servisi baslatildi."
            sleep 2
        else
            echo "[HATA] PostgreSQL servisi baslatilamadi!"
            echo "[BILGI] Manuel olarak baslatmayi deneyin: sudo service postgresql start"
            exit 1
        fi
    fi
else
    # Servis yönetimi bulunamadı, sadece port kontrolü yap
    echo "[UYARI] Servis yonetim araci bulunamadi. Sadece port kontrolu yapiliyor..."
fi

# Port 5432 bağlantısını test et
echo "[BILGI] PostgreSQL baglantisi test ediliyor (localhost:5432)..."

if command -v nc >/dev/null 2>&1; then
    # netcat ile test
    if nc -z localhost 5432 2>/dev/null; then
        echo "[BILGI] PostgreSQL baglantisi basarili (localhost:5432)"
    else
        echo "[HATA] PostgreSQL port 5432'ye baglanilamadi!"
        echo "[BILGI] Cozum onerileri:"
        echo "[BILGI]   1. PostgreSQL'in calistigindan emin olun"
        echo "[BILGI]   2. Port 5432'nin acik oldugunu kontrol edin"
        echo "[BILGI]   3. .env dosyanizdaki CORE_DATABASE_URL ve TENANT_DB_TEMPLATE_URL degerlerini kontrol edin"
        exit 1
    fi
elif command -v timeout >/dev/null 2>&1 && command -v bash >/dev/null 2>&1; then
    # timeout ve bash ile test
    if timeout 3 bash -c 'cat < /dev/null > /dev/tcp/localhost/5432' 2>/dev/null; then
        echo "[BILGI] PostgreSQL baglantisi basarili (localhost:5432)"
    else
        echo "[HATA] PostgreSQL port 5432'ye baglanilamadi!"
        echo "[BILGI] Cozum onerileri:"
        echo "[BILGI]   1. PostgreSQL'in calistigindan emin olun"
        echo "[BILGI]   2. Port 5432'nin acik oldugunu kontrol edin"
        echo "[BILGI]   3. .env dosyanizdaki CORE_DATABASE_URL ve TENANT_DB_TEMPLATE_URL degerlerini kontrol edin"
        exit 1
    fi
else
    # Basit psql bağlantı testi
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="${PGPASSWORD}" psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
            echo "[BILGI] PostgreSQL baglantisi basarili (localhost:5432)"
        else
            echo "[UYARI] PostgreSQL baglanti testi yapilamadi, ancak devam ediliyor..."
        fi
    else
        echo "[UYARI] Baglanti test araclari bulunamadi, ancak devam ediliyor..."
    fi
fi

echo "[BILGI] PostgreSQL kontrolu tamamlandi."
exit 0











