#!/bin/bash

# Omnex Core Platform - Production Server (WSL2/Linux)
# Production server'ı başlatır ve gerekli kontrolleri yapar

set -e

echo "========================================"
echo "  Omnex Core Platform - Production Server"
echo "========================================"
echo ""

# Proje dizinine git
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# WSL2 ortamında Windows host IP'sini belirle ve environment variable olarak ayarla
IS_WSL=false
if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
    IS_WSL=true
    # Windows host IP'sini al
    WIN_HOST_IP=$(cat /etc/resolv.conf 2>/dev/null | grep nameserver | head -1 | awk '{print $2}')
    if [ -n "$WIN_HOST_IP" ]; then
        echo "[BILGI] WSL2 ortami - Windows host IP: $WIN_HOST_IP"
        # Database URL'lerini Windows IP ile guncelle
        export CORE_DATABASE_URL="postgresql://postgres:postgres@${WIN_HOST_IP}:5432/omnex_core?schema=public"
        export DATABASE_URL="postgresql://postgres:postgres@${WIN_HOST_IP}:5432/omnex_core?schema=public"
        export TENANT_DATABASE_URL="postgresql://postgres:postgres@${WIN_HOST_IP}:5432/tenant_omnexcore_2025?schema=public"
        export TENANT_DB_TEMPLATE_URL="postgresql://postgres:postgres@${WIN_HOST_IP}:5432/__DB_NAME__?schema=public"
        export PG_ADMIN_URL="postgresql://postgres@${WIN_HOST_IP}:5432/postgres"
        export PG_HOST="$WIN_HOST_IP"
        echo "[BILGI] Database baglantilari Windows IP'ye yonlendirildi"
    fi
fi

# Node.js kontrolü - Önce WSL2 içinde, sonra Windows'taki Node.js'i dene
USE_WIN_NODE=false
NODE_CMD=""
if command -v node >/dev/null 2>&1; then
    NODE_CMD="node"
    echo "[BILGI] WSL2 icindeki Node.js kullaniliyor"
elif [ -f "/mnt/c/Program Files/nodejs/node.exe" ]; then
    USE_WIN_NODE=true
    NODE_CMD="C:\\Program Files\\nodejs\\node.exe"
    echo "[BILGI] Windows'taki Node.js kullaniliyor"
elif [ -f "/mnt/c/Program Files (x86)/nodejs/node.exe" ]; then
    USE_WIN_NODE=true
    NODE_CMD="C:\\Program Files (x86)\\nodejs\\node.exe"
    echo "[BILGI] Windows'taki Node.js kullaniliyor"
else
    # Windows PATH'ten node'u bulmayı dene
    WIN_NODE=$(cmd.exe /c "where node" 2>/dev/null | tr -d '\r' | head -n 1)
    if [ -n "$WIN_NODE" ]; then
        USE_WIN_NODE=true
        NODE_CMD="$WIN_NODE"
        echo "[BILGI] Windows'taki Node.js kullaniliyor (PATH'ten bulundu)"
    else
        echo "[HATA] Node.js bulunamadi!"
        echo "[BILGI] WSL2 icinde Node.js kurulu degil ve Windows'ta Node.js bulunamadi."
        echo "[BILGI] Cozum:"
        echo "[BILGI]   1. Windows'ta Node.js kurulu oldugundan emin olun"
        echo "[BILGI]   2. Veya WSL2 icinde Node.js kurun: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        exit 1
    fi
fi

# Node.js versiyonunu göster
echo "[BILGI] Node.js versiyonu:"
if [ "$USE_WIN_NODE" = true ]; then
    # Windows'ta node PATH'te olduğu için direkt kullan
    WIN_NODE_VERSION=$(cmd.exe /c "node --version" 2>&1 | tr -d '\r' | head -n 1)
    echo "$WIN_NODE_VERSION"
else
    "$NODE_CMD" --version
fi
echo ""

# Windows path'ini hesapla (bir kez)
get_win_path() {
    if [ -z "$WIN_SCRIPT_DIR" ]; then
        WIN_SCRIPT_DIR=$(wslpath -w "$SCRIPT_DIR" 2>/dev/null)
        if [ -z "$WIN_SCRIPT_DIR" ]; then
            # Fallback: manuel dönüşüm
            WIN_SCRIPT_DIR=$(echo "$SCRIPT_DIR" | sed 's|^/mnt/\([a-z]\)/|\U\1:/|' | sed 's|/|\\|g')
        fi
    fi
    echo "$WIN_SCRIPT_DIR"
}

# npm ve npx wrapper fonksiyonları
run_npm() {
    if [ "$USE_WIN_NODE" = false ] && command -v npm >/dev/null 2>&1; then
        npm "$@"
    else
        # Windows'taki npm'i kullan
        local WIN_PATH
        WIN_PATH=$(get_win_path)
        # Argümanları doğru şekilde geçir
        local ARGS="$*"
        cmd.exe /c "cd /d $WIN_PATH && npm $ARGS" 2>&1 | tr -d '\r'
    fi
}

run_npx() {
    if [ "$USE_WIN_NODE" = false ] && command -v npx >/dev/null 2>&1; then
        npx "$@"
    else
        # Windows'taki npx'i kullan
        local WIN_PATH
        WIN_PATH=$(get_win_path)
        # Argümanları doğru şekilde geçir
        local ARGS="$*"
        cmd.exe /c "cd /d $WIN_PATH && npx $ARGS" 2>&1 | tr -d '\r'
    fi
}

# PostgreSQL servis kontrolü ve başlatma
echo "[BILGI] PostgreSQL servisi kontrol ediliyor..."
echo ""

# PostgreSQL kontrol scriptini çalıştır
if [ -f "scripts/check-postgresql.sh" ]; then
    bash scripts/check-postgresql.sh
    PG_CHECK_ERROR=$?
    
    if [ $PG_CHECK_ERROR -ne 0 ]; then
        echo ""
        echo "[UYARI] PostgreSQL servisi bulunamadi veya calismiyor!"
        echo ""
        echo "[BILGI] Cozum onerileri:"
        echo "[BILGI]   1. PostgreSQL'in calistigindan emin olun:"
        echo "[BILGI]      - sudo systemctl start postgresql"
        echo "[BILGI]      - veya: sudo service postgresql start"
        echo "[BILGI]   2. PostgreSQL'in localhost:5432 portunda calistigindan emin olun"
        echo "[BILGI]   3. .env dosyanizdaki CORE_DATABASE_URL ve TENANT_DB_TEMPLATE_URL degerlerini kontrol edin"
        echo ""
        exit 1
    fi
else
    echo "[UYARI] PostgreSQL kontrol scripti bulunamadi, atlaniyor..."
fi
echo ""

# node_modules kontrolü
if [ ! -d "node_modules" ]; then
    echo "[UYARI] node_modules bulunamadi. Paketler yukleniyor..."
    echo ""
    run_npm install
    if [ $? -ne 0 ]; then
        echo "[HATA] Paket yukleme basarisiz!"
        exit 1
    fi
    echo ""
fi

# Prisma client kontrolü (core ve tenant)
if [ ! -d "node_modules/.prisma/core-client" ]; then
    echo "[BILGI] Core Prisma client olusturuluyor..."
    run_npx prisma generate --schema=prisma/core.schema.prisma
    echo ""
fi

if [ ! -d "node_modules/.prisma/tenant-client" ]; then
    echo "[BILGI] Tenant Prisma client olusturuluyor..."
    echo "[BILGI] Schema merge ve validation calistiriliyor..."
    run_npm run prisma:generate
    echo ""
fi

# Core database kontrolü
echo "[BILGI] Core veritabani kontrol ediliyor..."
run_npm run db:check-core >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[UYARI] Core veritabani bulunamadi veya baglanti kurulamadi."
    echo "[BILGI] Core veritabani olusturuluyor..."
    run_npm run db:create
    if [ $? -ne 0 ]; then
        echo "[HATA] Core veritabani olusturulamadi!"
        exit 1
    fi
    echo ""
    echo "[BILGI] Core veritabani migration calistiriliyor..."
    run_npx prisma migrate deploy --schema=prisma/core.schema.prisma
    echo ""
fi

# Build kontrolü ve oluşturma
echo "[BILGI] Production build kontrol ediliyor..."
if [ ! -d ".next" ]; then
    echo "[BILGI] .next klasoru bulunamadi. Production build olusturuluyor..."
    run_npm run build
    if [ $? -ne 0 ]; then
        echo "[HATA] Build basarisiz!"
        echo "[BILGI] Build hatalarini kontrol edin ve tekrar deneyin."
        exit 1
    fi
    echo ""
else
    # .next klasörü var, ama içeriği kontrol et
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "[UYARI] .next klasoru var ama BUILD_ID bulunamadi. Build yeniden olusturuluyor..."
        run_npm run build
        if [ $? -ne 0 ]; then
            echo "[HATA] Build basarisiz!"
            echo "[BILGI] Build hatalarini kontrol edin ve tekrar deneyin."
            exit 1
        fi
        echo ""
    else
        echo "[BILGI] Mevcut build bulundu. Yeni build olusturmak icin .next klasorunu silin."
        echo ""
    fi
fi

# .next klasörü ve BUILD_ID kontrolü
if [ ! -d ".next" ]; then
    echo "[HATA] .next klasoru bulunamadi! Build basarisiz olmus olabilir."
    exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "[HATA] BUILD_ID dosyasi bulunamadi! Build tamamlanmamis olabilir."
    echo "[BILGI] Lutfen 'npm run build' komutunu manuel olarak calistirin ve hatalari kontrol edin."
    exit 1
fi

# NODE_ENV=production set et
export NODE_ENV=production

echo "[BILGI] Production server baslatiliyor..."
echo "[BILGI] NODE_ENV=production"
echo "[BILGI] Tarayicinizda http://localhost:3000 adresini acin"
echo ""
echo "[BILGI] Durdurmak icin Ctrl+C basin"
echo ""

# Production server'ı başlat
run_npm start
if [ $? -ne 0 ]; then
    echo ""
    echo "[HATA] Production server baslatilamadi!"
    echo "[BILGI] Olası nedenler:"
    echo "[BILGI]   1. Port 3000 zaten kullaniliyor olabilir"
    echo "[BILGI]   2. .next klasoru bozuk olabilir - 'npm run build' calistirin"
    echo "[BILGI]   3. Environment variables eksik olabilir - .env dosyasini kontrol edin"
    echo "[BILGI]   4. Prisma client'lar eksik olabilir - 'npm run prisma:generate' calistirin"
    echo ""
    exit 1
fi


