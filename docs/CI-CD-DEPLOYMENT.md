# CI/CD Deployment Guide

Bu dokuman, Omnex Core Platform icin GitHub Actions tabanli otomatik deployment sistemini aciklar.

---

## Genel Bakis

```
Local Development          GitHub                    Production Server
+----------------+    +------------------+    +------------------------+
|                |    |                  |    |                        |
|  git push      +--->+  GitHub Actions  +--->+  Docker Build/Deploy   |
|  origin main   |    |  (CI/CD)         |    |  (146.190.224.121)     |
|                |    |                  |    |                        |
+----------------+    +------------------+    +------------------------+
```

---

## Sunucu Bilgileri

| Parametre | Deger |
|-----------|-------|
| IP Adresi | 146.190.224.121 |
| Domain | property.onway-gmbh.de |
| SSH Port | 2222 |
| SSH User | deploy |
| Deployment | Docker + Docker Compose |

---

## 1. Pipeline Nasil Calisir?

### 1.1 Tetikleme

Pipeline asagidaki durumlarda otomatik tetiklenir:

1. **Push to main**: `main` branch'e her push yapildiginda
2. **Manual trigger**: GitHub Actions sayfasindan "Run workflow" butonu ile

### 1.2 Adimlar

```
1. GitHub Actions runner baslatilir (~15 sn)
2. SSH ile sunucuya baglanilir (~2-3 sn)
3. git pull origin main calistirilir (~5-10 sn)
4. docker compose build --no-cache app (~5-8 dk)
   - npm ci
   - npm run build
   - Docker image olusturma
5. docker compose up -d app (~10-15 sn)
6. docker image prune -f (temizlik)
```

### 1.3 Toplam Sure

| Senaryo | Sure |
|---------|------|
| Normal build | 8-12 dakika |
| Cache'li build | 5-8 dakika |
| Sadece config degisikligi | 3-5 dakika |

### 1.4 Kesinti Suresi

**ONEMLI:** Container restart sirasinda **~10-15 saniye kesinti** olusur.

Bu sure icinde:
- Kullanicilar 502 Bad Gateway gorebilir
- Aktif oturumlar kesilmez (JWT token'lar gecerli kalir)
- Veritabani baglantilari etkilenmez

---

## 2. GitHub Secrets Ayarlari

Repository > Settings > Secrets and variables > Actions

### 2.1 Gerekli Secrets

| Secret Name | Aciklama | Ornek |
|-------------|----------|-------|
| `SERVER_HOST` | Sunucu IP adresi | `146.190.224.121` |
| `SSH_PRIVATE_KEY` | deploy kullanicisinin SSH private key'i | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### 2.2 SSH Key Olusturma

Sunucuda:
```bash
# Sunucuya baglan
ssh -p 2222 deploy@146.190.224.121

# Yeni key olustur
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions -N ""

# Authorized keys'e ekle
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Private key'i goster (bunu GitHub Secret olarak ekle)
cat ~/.ssh/github-actions
```

---

## 3. Workflow Dosyasi

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  APP_NAME: omnex
  DOMAIN: property.onway-gmbh.de

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 2222
          command_timeout: 15m
          script: |
            cd /opt/omnex/deploy
            echo "Starting deployment at $(date)"

            # Pull latest code
            cd /opt/omnex && git pull origin main

            # Build and restart app container only
            cd /opt/omnex/deploy
            docker compose build --no-cache app
            docker compose up -d app

            # Cleanup old images
            docker image prune -f

            echo "Deployment completed at $(date)"
```

---

## 4. Sunucu Dizin Yapisi

```
/opt/omnex/
├── .git/                    # Git repository
├── deploy/                  # Docker yapilandirmasi
│   ├── .env                 # Environment variables (GIT'TE YOK)
│   ├── docker-compose.yml   # Container tanimlari
│   ├── Dockerfile           # App image
│   ├── nginx/               # Nginx config
│   │   └── conf.d/
│   │       └── default.conf
│   ├── certbot/             # SSL sertifikalari
│   └── init-db/             # Veritabani init scriptleri
├── prisma/                  # Prisma schemalari
├── src/                     # Uygulama kaynak kodu
├── scripts/                 # Seeder ve utility scriptleri
└── public/                  # Statik dosyalar
```

---

## 5. Docker Container'lari

| Container | Image | Port | Gorev |
|-----------|-------|------|-------|
| omnex-postgres | postgres:17-alpine | 5432 (internal) | Veritabani |
| omnex-app | deploy-app | 3000 (internal) | Next.js uygulama |
| omnex-nginx | nginx:alpine | 80, 443 | Reverse proxy + SSL |
| omnex-certbot | certbot/certbot | - | SSL yenileme |

---

## 6. Manuel Deployment

### 6.1 Sunucuya Baglanma

```bash
ssh -p 2222 deploy@146.190.224.121
```

### 6.2 Manuel Build ve Deploy

```bash
cd /opt/omnex
git pull origin main

cd deploy
docker compose build --no-cache app
docker compose up -d app
docker image prune -f
```

### 6.3 Sadece Restart

```bash
cd /opt/omnex/deploy
docker compose restart app
```

### 6.4 Tum Servisleri Yeniden Baslat

```bash
cd /opt/omnex/deploy
docker compose down
docker compose up -d
```

---

## 7. Log Izleme

### 7.1 App Loglari

```bash
cd /opt/omnex/deploy
docker compose logs -f app
```

### 7.2 Nginx Loglari

```bash
docker compose logs -f nginx
```

### 7.3 Tum Loglar

```bash
docker compose logs -f
```

### 7.4 Son N Satir

```bash
docker compose logs --tail=100 app
```

---

## 8. Rollback (Geri Alma)

### 8.1 Son Commit'i Geri Al

```bash
cd /opt/omnex
git revert HEAD --no-edit
git push origin main
# GitHub Actions otomatik deploy edecek
```

### 8.2 Belirli Bir Commit'e Don

```bash
cd /opt/omnex
git log --oneline -10  # Commit'leri listele
git checkout <commit-hash> .
git commit -m "Rollback to <commit-hash>"
git push origin main
```

### 8.3 Acil Durum (Manuel)

```bash
cd /opt/omnex
git reset --hard <commit-hash>
cd deploy
docker compose build --no-cache app
docker compose up -d app
```

---

## 9. Sorun Giderme

### 9.1 GitHub Actions Hatasi

1. GitHub > Repository > Actions sekmesine git
2. Basarisiz workflow'a tikla
3. Log detaylarini incele
4. Kontrol edilecekler:
   - Secrets dogru ayarlanmis mi?
   - SSH key gecerli mi?
   - Sunucu eriselebilir mi?

### 9.2 SSH Baglanti Hatasi

```bash
# Local'den test et
ssh -p 2222 deploy@146.190.224.121

# Hata aliyorsan:
# 1. SSH key'in authorized_keys'de mi kontrol et
# 2. Firewall 2222 portunu aciyor mu kontrol et
# 3. SSH servisi calisiyor mu kontrol et
```

### 9.3 Docker Build Hatasi

```bash
# Sunucuda manuel build dene
cd /opt/omnex/deploy
docker compose build --no-cache app 2>&1 | tee build.log

# Hata mesajini incele
cat build.log
```

### 9.4 Container Baslamiyor

```bash
# Container durumu
docker compose ps

# Detayli log
docker compose logs app

# Yeniden olustur
docker compose up -d --force-recreate app
```

### 9.5 Disk Alani Sorunu

```bash
# Disk kullanimi
df -h

# Docker temizligi
docker system prune -a -f
docker volume prune -f
```

---

## 10. Guvenlik Notlari

1. **SSH Key Guvenligi**
   - Private key'i asla paylasmayin
   - GitHub Secrets'ta saklayin
   - Duzenliaralikla key'leri yenileyin

2. **Environment Variables**
   - `.env` dosyasi git'te OLMAMALI
   - Sunucuda manuel olusturulur
   - Secrets icin guclu parolalar kullanin

3. **Firewall**
   - Sadece gerekli portlar acik: 2222, 80, 443
   - Fail2Ban aktif

4. **SSL**
   - Let's Encrypt sertifikalari
   - Otomatik yenileme (90 gun)

---

## 11. Deployment Checklist

Yeni deployment oncesi:

- [ ] Local'de `npm run build` basarili mi?
- [ ] Testler geciyor mu?
- [ ] `.env` degisiklikleri sunucuya uygulanacak mi?
- [ ] Database migration gerekli mi?
- [ ] Kritik saatlerde deployment yapilmiyor mu?

Deployment sonrasi:

- [ ] Site eriselebilir mi? (https://property.onway-gmbh.de)
- [ ] Login calisiyormu?
- [ ] Kritik fonksiyonlar test edildi mi?
- [ ] Loglarda hata var mi?

---

## 12. Faydali Komutlar Ozeti

```bash
# Sunucuya baglan
ssh -p 2222 deploy@146.190.224.121

# Container durumu
cd /opt/omnex/deploy && docker compose ps

# App loglari
docker compose logs -f app

# Manuel deploy
cd /opt/omnex && git pull origin main
cd deploy && docker compose build --no-cache app && docker compose up -d app

# Restart
docker compose restart app

# Temizlik
docker system prune -a -f
```

---

## Duzenleme Tarihi

Son guncelleme: 30 Aralik 2024

---

*Bu dokuman Omnex Core Platform CI/CD deployment sureci icin hazirlanmistir.*
