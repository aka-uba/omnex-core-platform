# Omnex Core Platform - Production Deployment Guide

Bu dokuman, Omnex Core Platform'un DigitalOcean droplet'ine deploy edilmesi icin tum adimlari icermektedir.

## Sunucu Bilgileri

- **IP Adresi**: 104.248.80.247
- **Domain**: property.onway-gmbh.de
- **OS**: Ubuntu 24.04 LTS
- **Node.js**: v20.x
- **PostgreSQL**: 16
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)

---

## 1. Sunucu Baslangic Kurulumu

### 1.1 Sistem Guncelleme

```bash
ssh root@104.248.80.247
apt update && apt upgrade -y
apt install -y git curl build-essential software-properties-common
```

### 1.2 Node.js 20.x Kurulumu

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 1.3 PostgreSQL 16 Kurulumu

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 1.4 Veritabani ve Kullanici Olusturma

```bash
sudo -u postgres psql

# PostgreSQL icinde:
CREATE USER omnex_user WITH PASSWORD 'JHkS2q4N9HbLqKO5KnqPQ';
CREATE DATABASE omnex_core OWNER omnex_user;
CREATE DATABASE tenant_omnexcore_2025 OWNER omnex_user;
GRANT ALL PRIVILEGES ON DATABASE omnex_core TO omnex_user;
GRANT ALL PRIVILEGES ON DATABASE tenant_omnexcore_2025 TO omnex_user;
\q

# Schema izinleri
sudo -u postgres psql -d omnex_core -c "GRANT ALL ON SCHEMA public TO omnex_user;"
sudo -u postgres psql -d tenant_omnexcore_2025 -c "GRANT ALL ON SCHEMA public TO omnex_user;"
```

### 1.5 PM2 Kurulumu

```bash
npm install -g pm2
pm2 startup systemd
mkdir -p /var/log/pm2
```

### 1.6 Nginx Kurulumu

```bash
apt install -y nginx
systemctl enable nginx
```

---

## 2. Proje Kurulumu

### 2.1 Projeyi Klonlama

```bash
cd /var/www
git clone https://github.com/aka-uba/omnex-core-platform.git omnex
cd omnex
```

### 2.2 Environment Dosyasi Olusturma

```bash
cat > .env << 'EOF'
# Database Configuration
CORE_DATABASE_URL="postgresql://omnex_user:JHkS2q4N9HbLqKO5KnqPQ@localhost:5432/omnex_core?schema=public"
TENANT_DATABASE_URL="postgresql://omnex_user:JHkS2q4N9HbLqKO5KnqPQ@localhost:5432/tenant_omnexcore_2025?schema=public"

# Application Settings
NEXT_PUBLIC_APP_URL="https://property.onway-gmbh.de"
NEXT_PUBLIC_API_URL="https://property.onway-gmbh.de/api"
NODE_ENV="production"

# Authentication Secrets
JWT_SECRET="yc0dwg1FHsKJ+T3BfHuPlhTy18qur2m04ooKi+kqWp+LFnS6aUzFVOQqhKF6qGnk"
NEXTAUTH_SECRET="zT8Xm2vR5nL1wQ9pY6kJ3hB7dF0cA4sE8gU2iO5tN1mK9xC6vZ3qW7jP0rL4yH8a"
NEXTAUTH_URL="https://property.onway-gmbh.de"

# Encryption Keys
ENCRYPTION_KEY="4f8a2c6e1b9d3f7a0e5c8b2d6a9f1c4e7b0d3a6f9c2e5b8a1d4f7c0e3b6a9d2f"
COOKIE_SECRET="m5Kp9Rt2Wv6Xz1Bn3Cj7Dh0Fl4Gq8Is2Lu5Nx7Oy9Pz1Qr3St5Uv7Wx9Ya1Zb3Cd"

# Email Configuration (Resend)
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="noreply@property.onway-gmbh.de"

# File Upload
UPLOAD_DIR="/var/www/omnex/uploads"
MAX_FILE_SIZE="10485760"

# Redis (optional)
# REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="info"
EOF
```

### 2.3 Swap Alani Olusturma (Build icin gerekli)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.4 Bagimliliklari Yukleme

```bash
npm install
```

### 2.5 Prisma Setup

```bash
npx prisma generate --schema=prisma/core/schema.prisma
npx prisma generate --schema=prisma/tenant/schema.prisma
npx prisma db push --schema=prisma/core/schema.prisma
npx prisma db push --schema=prisma/tenant/schema.prisma
```

### 2.6 Production Build

```bash
NODE_OPTIONS='--max-old-space-size=3072' npm run build
```

---

## 3. PM2 Konfigurasyonu

### 3.1 ecosystem.config.js

Proje kokunde `ecosystem.config.js` dosyasi bulunmaktadir:

```javascript
module.exports = {
  apps: [{
    name: 'omnex',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100,
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
    error_file: '/var/log/pm2/omnex-error.log',
    out_file: '/var/log/pm2/omnex-out.log',
    merge_logs: true,
    time: true
  }]
};
```

### 3.2 PM2 Baslatma

```bash
cd /var/www/omnex
pm2 start ecosystem.config.js
pm2 save
```

### 3.3 PM2 Komutlari

```bash
pm2 status          # Durum kontrolu
pm2 logs omnex      # Log izleme
pm2 restart omnex   # Yeniden baslatma
pm2 stop omnex      # Durdurma
pm2 delete omnex    # Silme
```

---

## 4. Nginx Konfigurasyonu

### 4.1 Site Konfigurasyonu

```bash
cat > /etc/nginx/sites-available/omnex << 'EOF'
server {
    listen 80;
    server_name property.onway-gmbh.de;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    client_max_body_size 50M;
}
EOF

ln -sf /etc/nginx/sites-available/omnex /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 5. SSL Sertifikasi (Let's Encrypt)

### 5.1 Certbot Kurulumu ve Sertifika Alma

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d property.onway-gmbh.de --non-interactive --agree-tos -m admin@onway-gmbh.de
```

### 5.2 Otomatik Yenileme Testi

```bash
certbot renew --dry-run
```

Certbot otomatik olarak `/etc/cron.d/certbot` ile yenileme yapar.

---

## 6. DNS Ayarlari

Domain saglayicinizda asagidaki kayitlari ekleyin:

| Tip | Host | Deger | TTL |
|-----|------|-------|-----|
| A | property | 104.248.80.247 | 3600 |

DNS propagasyonu kontrol:
```bash
nslookup property.onway-gmbh.de
# veya
host property.onway-gmbh.de
```

---

## 7. GitHub Actions ile Otomatik Deploy

### 7.1 GitHub Secrets Ayarlari

Repository Settings > Secrets and variables > Actions:

| Secret Name | Value |
|-------------|-------|
| `SERVER_HOST` | 104.248.80.247 |
| `SERVER_USER` | root |
| `SERVER_SSH_KEY` | (SSH private key) |
| `SERVER_PATH` | /var/www/omnex |

### 7.2 SSH Key Olusturma

Lokal makinede:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub
# Bu ciktiyi sunucuya ekle
```

Sunucuda:
```bash
echo "PUBLIC_KEY_BURAYA" >> ~/.ssh/authorized_keys
```

### 7.3 Workflow Dosyasi

`.github/workflows/deploy.yml` dosyasi projede mevcuttur. `main` branch'e push yapildiginda otomatik deploy calisir.

---

## 8. Manuel Deploy (deploy.sh)

Proje kokunde `deploy.sh` scripti bulunmaktadir:

```bash
ssh root@104.248.80.247
cd /var/www/omnex
./deploy.sh
```

Veya manuel olarak:

```bash
cd /var/www/omnex
git pull origin main
npm install
npx prisma generate --schema=prisma/core/schema.prisma
npx prisma generate --schema=prisma/tenant/schema.prisma
NODE_OPTIONS='--max-old-space-size=3072' npm run build
pm2 restart omnex
```

---

## 9. Veritabani Baglanti Bilgileri

Setup Wizard (`/setup`) icin:

- **Core Database URL**:
  ```
  postgresql://omnex_user:JHkS2q4N9HbLqKO5KnqPQ@localhost:5432/omnex_core?schema=public
  ```

- **Tenant Database URL**:
  ```
  postgresql://omnex_user:JHkS2q4N9HbLqKO5KnqPQ@localhost:5432/tenant_omnexcore_2025?schema=public
  ```

- **Tenant Slug**: `omnexcore`

---

## 10. Sorun Giderme

### 10.1 Build Hatasi (Out of Memory)

```bash
# Swap kontrolu
free -h

# Swap yoksa olustur
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Build'i yeniden dene
NODE_OPTIONS='--max-old-space-size=3072' npm run build
```

### 10.2 502 Bad Gateway

```bash
# PM2 durumunu kontrol et
pm2 status

# Calismiyorsa baslat
pm2 start ecosystem.config.js

# Loglari kontrol et
pm2 logs omnex --lines 100
```

### 10.3 Statik Dosyalar 404

Tarayicida cache temizligi yapin (Ctrl+Shift+R) veya:

```bash
# Nginx reload
systemctl reload nginx

# PM2 restart
pm2 restart omnex
```

### 10.4 SSL Sertifika Sorunu

```bash
# Sertifika durumu
certbot certificates

# Manuel yenileme
certbot renew

# Nginx reload
systemctl reload nginx
```

### 10.5 PostgreSQL Baglanti Hatasi

```bash
# PostgreSQL durumu
systemctl status postgresql

# Baslatma
systemctl start postgresql

# Baglanti testi
psql -U omnex_user -h localhost -d omnex_core
```

### 10.6 Disk Alani Kontrolu

```bash
df -h
# .next/cache temizligi
rm -rf /var/www/omnex/.next/cache/*
```

---

## 11. Yedekleme

### 11.1 Veritabani Yedekleme

```bash
# Yedek al
pg_dump -U omnex_user -h localhost omnex_core > backup_core_$(date +%Y%m%d).sql
pg_dump -U omnex_user -h localhost tenant_omnexcore_2025 > backup_tenant_$(date +%Y%m%d).sql

# Geri yukleme
psql -U omnex_user -h localhost omnex_core < backup_core_20241218.sql
```

### 11.2 Otomatik Yedekleme (Cron)

```bash
crontab -e

# Her gun gece 3'te yedek al
0 3 * * * pg_dump -U omnex_user -h localhost omnex_core > /var/backups/omnex_core_$(date +\%Y\%m\%d).sql
0 3 * * * pg_dump -U omnex_user -h localhost tenant_omnexcore_2025 > /var/backups/tenant_$(date +\%Y\%m\%d).sql
```

---

## 12. Guvenlik Onerileri

1. **Firewall (UFW)**:
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

2. **Fail2ban** (brute-force koruma):
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

3. **SSH Guvenligi**:
   - Root login'i devre disi birakin
   - SSH key authentication kullanin
   - Port degistirmeyi dusunun

4. **Duzenli Guncellemeler**:
   ```bash
   apt update && apt upgrade -y
   ```

---

## 13. Faydali Linkler

- **Uygulama**: https://property.onway-gmbh.de
- **Setup Wizard**: https://property.onway-gmbh.de/setup
- **GitHub Repo**: https://github.com/aka-uba/omnex-core-platform

---

## Duzenleme Tarihi

Son guncelleme: 18 Aralik 2024

---

*Bu dokuman Omnex Core Platform production deployment sureci icin hazirlanmistir.*
