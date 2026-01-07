# Omnex Core Platform - Docker Deployment Guide

## Quick Start (Fresh Install)

### 1. Prepare Local Environment

```bash
# Ana repo'da
cd C:\xampp\htdocs\omnex-core-platform
npm install next@16.1.1 --save
npm run build
```

### 2. Upload to Server

Dosyaları sunucuya yükle (FTP veya SCP):
```bash
# SCP ile
scp -P 2222 -r ./deploy deploy@146.190.224.121:/opt/omnex/
scp -P 2222 ./package*.json deploy@146.190.224.121:/opt/omnex/
scp -P 2222 -r ./prisma deploy@146.190.224.121:/opt/omnex/
scp -P 2222 -r ./src deploy@146.190.224.121:/opt/omnex/
# ... diğer dosyalar
```

### 3. Server Setup

```bash
# SSH ile bağlan (root olarak)
ssh root@146.190.224.121

# İlk kurulum script'ini çalıştır
cd /opt/omnex/deploy/scripts
chmod +x *.sh
./01-initial-setup.sh
```

### 4. Configure Environment

```bash
# .env dosyasını oluştur
cd /opt/omnex/deploy
cp .env.example .env
nano .env

# Şu değerleri değiştir:
# - PG_PASSWORD: Güçlü bir şifre
# - JWT_SECRET: openssl rand -base64 48
# - JWT_REFRESH_SECRET: openssl rand -base64 48
# - SESSION_SECRET: openssl rand -base64 32
# - ENCRYPTION_KEY: openssl rand -hex 16
# - SERVER_ADMIN_TOKEN: Güçlü bir token
# - PASV_ADDRESS: 146.190.224.121
```

### 5. Deploy Application

```bash
# Deploy user olarak
sudo -u deploy bash 02-deploy-app.sh
```

### 6. Restore Backup (Optional)

```bash
# Backup dosyasını yükle
scp -P 2222 server_backup_20251230.tar.gz deploy@146.190.224.121:/tmp/

# Restore et
sudo -u deploy bash 03-restore-backup.sh /tmp/server_backup_20251230.tar.gz
```

---

## Security Configuration

### SSH (Port 2222)
- Root login: prohibit-password (only key-based)
- Password auth: disabled
- Max tries: 3

### Firewall (UFW)
- Default: deny incoming, allow outgoing
- Allowed: 22, 2222 (SSH), 80, 443 (HTTP/S), 21, 40000-40100 (FTP)

### Fail2Ban
- SSH: 3 retries, 24h ban
- Nginx: rate limiting enabled

### Docker Security
- Non-root user in containers
- Resource limits
- Health checks
- Log rotation

---

## Useful Commands

```bash
# Container durumu
docker compose ps

# Logları izle
docker compose logs -f
docker compose logs -f app
docker compose logs -f postgres

# Yeniden başlat
docker compose restart
docker compose restart app

# Durdur
docker compose down

# Container shell
docker compose exec app sh
docker compose exec postgres psql -U omnex_user -d omnex_core

# SSL yenile
docker compose run --rm certbot renew
docker compose restart nginx

# Backup
docker compose exec postgres pg_dump -U omnex_user omnex_core > backup.sql
```

---

## Troubleshooting

### Container başlamıyor
```bash
docker compose logs app
docker compose logs postgres
```

### Database bağlantı hatası
```bash
# PostgreSQL durumunu kontrol et
docker compose exec postgres pg_isready -U omnex_user

# Bağlantı testi
docker compose exec postgres psql -U omnex_user -d omnex_core -c "SELECT 1"
```

### SSL sertifika sorunu
```bash
# Sertifika durumu
docker compose run --rm certbot certificates

# Manuel yenileme
docker compose run --rm certbot renew --force-renewal
docker compose restart nginx
```

---

## Versions Used

| Component | Version |
|-----------|---------|
| Ubuntu | 24.04 LTS |
| Docker | Latest |
| Node.js | 22-alpine |
| PostgreSQL | 17-alpine |
| Nginx | alpine |
| Next.js | 16.1.1 |
| React | 19.2.3 |
| Prisma | 5.22.0 |
