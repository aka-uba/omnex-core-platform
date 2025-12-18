# Modüler Demo Seeder Sistemi

Bu doküman, Omnex Core Platform'un modüler demo veri yönetim sistemini açıklar.

## Genel Bakış

Modüler demo seeder sistemi, her modül için bağımsız demo veri yükleme ve kaldırma işlemlerini destekler. Bu sayede:

- Her modül kendi demo verilerini yönetebilir
- Demo veriler `[DEMO]` prefix ile işaretlenir
- Gerçek veriler etkilenmeden demo veriler kaldırılabilir
- Bağımlılık yönetimi otomatik yapılır

## Mimari

```
prisma/seed/modules/
├── base-seeder.ts          # Interface ve helper fonksiyonlar
├── seeder-registry.ts      # Merkezi seeder yönetimi
├── index.ts                # Export noktası
├── run-all.ts              # CLI runner
│
├── locations.seed.ts       # Temel modül (bağımlılık yok)
├── maintenance.seed.ts     # locations bağımlı
├── real-estate.seed.ts     # Bağımsız
├── accounting.seed.ts      # locations bağımlı
├── hr.seed.ts              # Bağımsız
├── production.seed.ts      # locations bağımlı
├── notifications.seed.ts   # Bağımsız
├── chat.seed.ts            # hr bağımlı
├── web-builder.seed.ts     # Bağımsız
├── ai.seed.ts              # Bağımsız
├── file-management.seed.ts # Bağımsız
├── reports.seed.ts         # Bağımsız
└── audit.seed.ts           # Bağımsız
```

## Base Seeder Interface

Her modül seeder'ı `ModuleSeeder` interface'ini implemente eder:

```typescript
interface ModuleSeeder {
  // Modül tanımlayıcı bilgileri
  moduleSlug: string;        // 'real-estate', 'accounting' vb.
  moduleName: string;        // 'Real Estate', 'Accounting' vb.
  description: string;       // Türkçe açıklama

  // Bağımlılıklar (önce seed edilmesi gereken modüller)
  dependencies?: string[];   // ['locations', 'hr'] vb.

  // Seed işlemleri
  seed(ctx: SeederContext): Promise<SeederResult>;

  // Silme işlemleri
  unseed(ctx: SeederContext): Promise<SeederResult>;

  // Mevcut demo veri sayısını kontrol et
  checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }>;
}
```

### SeederContext

Tüm seeder'lara geçirilen context:

```typescript
interface SeederContext {
  tenantPrisma: TenantPrismaClient;  // Tenant DB client
  corePrisma: CorePrismaClient;       // Core DB client
  tenantId: string;                   // Core tenant ID
  companyId: string;                  // Company ID
  adminUserId: string;                // Admin user ID
  tenantSlug: string;                 // 'omnexcore' vb.
}
```

### SeederResult

Her işlemin sonucu:

```typescript
interface SeederResult {
  success: boolean;
  itemsCreated: number;
  itemsDeleted?: number;
  error?: string;
  details?: Record<string, number>;  // { 'properties': 3, 'apartments': 18 }
}
```

## Bağımlılık Yönetimi

Seeder registry otomatik bağımlılık çözümlemesi yapar:

```
locations (temel)
    ├── maintenance
    ├── accounting
    └── production

hr (temel)
    └── chat
```

Seed işleminde:
1. Bağımlılıklar kontrol edilir
2. Eksik bağımlılıklar otomatik seed edilir
3. Ana modül seed edilir

Unseed işleminde:
1. Ters bağımlılık sırasıyla silinir
2. Bağımlı modüller önce silinir

## Demo Veri İşaretleme

Demo veriler şu yöntemlerle işaretlenir:

### 1. ID Pattern
```typescript
// generateDemoId helper kullanımı
id: generateDemoId(tenantSlug, 'property', '1')
// Sonuç: 'omnexcore-demo-property-1'
```

### 2. Prefix Pattern
```typescript
// Metin alanlarında [DEMO] prefix
title: '[DEMO] Sistem Güncellemesi'
name: '[DEMO] Modern Business Theme'
```

### 3. Code/Number Pattern
```typescript
// Kod alanlarında DEMO prefix
code: 'PRD-DEMO-001'
invoiceNumber: 'INV-DEMO-2024-0001'
contractNumber: 'CONT-DEMO-0001'
```

## API Endpoints

### GET /api/modules/[slug]/demo-data

Demo veri durumunu kontrol eder.

**Request:**
```
GET /api/modules/real-estate/demo-data
GET /api/modules/all/demo-data  # Tüm modüller
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moduleSlug": "real-estate",
    "moduleName": "Real Estate",
    "description": "Gayrimenkul yönetimi demo verileri",
    "hasData": true,
    "count": 45,
    "dependencies": []
  }
}
```

### POST /api/modules/[slug]/demo-data

Demo veri yükler.

**Request:**
```
POST /api/modules/real-estate/demo-data
POST /api/modules/all/demo-data  # Tüm modüller
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moduleSlug": "real-estate",
    "moduleName": "Real Estate",
    "itemsCreated": 45,
    "details": {
      "properties": 3,
      "apartments": 18,
      "tenants": 6,
      "contracts": 6,
      "payments": 18,
      "appointments": 8,
      "staff": 4
    }
  }
}
```

### DELETE /api/modules/[slug]/demo-data

Demo veriyi siler.

**Request:**
```
DELETE /api/modules/real-estate/demo-data
DELETE /api/modules/all/demo-data  # Tüm modüller
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moduleSlug": "real-estate",
    "moduleName": "Real Estate",
    "itemsDeleted": 45
  }
}
```

## CLI Kullanımı

### Tüm Modülleri Seed Et
```bash
TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore
```

### Tek Modül Seed Et
```bash
TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore --module=real-estate
```

### Tüm Demo Verileri Sil
```bash
TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore --unseed
```

### Tek Modül Demo Verisini Sil
```bash
TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore --module=real-estate --unseed
```

### Mevcut Modülleri Listele
```bash
npx tsx prisma/seed/modules/run-all.ts --list
```

## UI Entegrasyonu

### ModuleSettingsPage

Her modülün settings sayfasında "Demo Veriler" sekmesi bulunur:

```
/tr/modules/real-estate/settings  -> Demo Veriler sekmesi
/tr/modules/accounting/settings   -> Demo Veriler sekmesi
/tr/modules/hr/settings           -> Demo Veriler sekmesi
...
```

### DemoDataTab Komponenti

`src/modules/module-management/components/DemoDataTab.tsx`

Özellikler:
- Demo veri durumunu gösterir (yüklü/yüklü değil)
- Kayıt sayısını gösterir
- Bağımlılıkları listeler
- "Demo Verileri Yükle" butonu
- "Demo Verileri Kaldır" butonu
- Yükleme/silme işlemi sırasında loading durumu
- Başarı/hata bildirimleri

### Setup Wizard

`/setup` sayfasında demo seed adımı modüler sistemi kullanır ve modül seçimi yapılabilir:

#### Modül Seçim Modal'ı

Setup wizard'ın "Demo Seed" adımında kullanıcılara modül seçim modal'ı sunulur:

```
┌─────────────────────────────────────────────────┐
│  Demo Verileri Yükle                            │
├─────────────────────────────────────────────────┤
│  Yüklenecek modülleri seçin:                    │
│                                                 │
│  ☑ Tümünü Seç                                  │
│                                                 │
│  ☑ Locations (Konum verileri)                  │
│  ☑ Real Estate (Gayrimenkul)                   │
│  ☑ Accounting (Muhasebe)                        │
│  ☑ HR (İnsan Kaynakları)                       │
│  ☑ Production (Üretim)                         │
│  ☑ Maintenance (Bakım)                         │
│  ☑ Notifications (Bildirimler)                 │
│  ☑ Chat (Sohbet)                               │
│  ☑ Web Builder (Web Sitesi)                    │
│  ☐ AI (Yapay Zeka)                             │
│  ☑ File Management (Dosya Yönetimi)            │
│  ☑ Reports (Raporlar)                          │
│  ☑ Audit (Denetim Logları)                     │
│                                                 │
│          [İptal]    [Yükle]                    │
└─────────────────────────────────────────────────┘
```

#### Demo Veri Kaldırma

Setup wizard'da mevcut demo verileri kaldırma seçeneği de mevcuttur:

```
┌─────────────────────────────────────────────────┐
│  Demo Verileri Kaldır                           │
├─────────────────────────────────────────────────┤
│  ⚠️ Bu işlem geri alınamaz!                    │
│                                                 │
│  Kaldırılacak modülleri seçin:                 │
│                                                 │
│  ☑ Tümünü Seç                                  │
│                                                 │
│  ☑ Locations (3 kayıt)                         │
│  ☑ Real Estate (45 kayıt)                      │
│  ☐ Accounting (0 kayıt - veri yok)             │
│  ...                                            │
│                                                 │
│          [İptal]    [Kaldır]                   │
└─────────────────────────────────────────────────┘
```

#### API Endpoints

```typescript
// GET /api/setup/demo-modules - Mevcut modül listesi ve durumları
// POST /api/setup/demo-modules - Seçili modüllere demo veri yükle
// DELETE /api/setup/demo-modules - Seçili modüllerden demo veri kaldır
```

#### Legacy Mod

Legacy mod da korunmuştur (geriye dönük uyumluluk için):
```typescript
// src/app/api/setup/run-seed/route.ts
case 'demo-legacy':
  command = `npx tsx prisma/seed/demo-seed.ts --tenant-slug=${tenantSlug}`;
  break;
```

## Yeni Modül Seeder Ekleme

### 1. Seeder Dosyası Oluştur

```typescript
// prisma/seed/modules/my-module.seed.ts
import { ModuleSeeder, SeederContext, SeederResult } from './base-seeder';

export class MyModuleSeeder implements ModuleSeeder {
  moduleSlug = 'my-module';
  moduleName = 'My Module';
  description = 'My module demo verileri';
  dependencies = ['locations']; // Opsiyonel

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug } = ctx;
    let itemsCreated = 0;

    try {
      // Demo veri oluştur
      await tenantPrisma.myModel.create({
        data: {
          id: `${tenantSlug}-demo-my-module-1`,
          name: '[DEMO] Test Item',
          tenantId,
          companyId,
        },
      });
      itemsCreated++;

      return { success: true, itemsCreated };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;

    try {
      const result = await tenantPrisma.myModel.deleteMany({
        where: { id: { contains: '-demo-my-module-' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.myModel.count({
      where: { id: { contains: '-demo-my-module-' } },
    });

    return { hasData: count > 0, count };
  }
}
```

### 2. Registry'ye Ekle

```typescript
// prisma/seed/modules/seeder-registry.ts
import { MyModuleSeeder } from './my-module.seed';

const seeders: ModuleSeeder[] = [
  // ... mevcut seeder'lar
  new MyModuleSeeder(),
];
```

### 3. Index'e Export Ekle

```typescript
// prisma/seed/modules/index.ts
export { MyModuleSeeder } from './my-module.seed';
```

## Modül Listesi ve Bağımlılıkları

| Modül | Slug | Bağımlılıklar | Oluşturulan Veriler |
|-------|------|---------------|---------------------|
| Locations | locations | - | 3 lokasyon |
| Maintenance | maintenance | locations | 8 ekipman, 5 bakım kaydı |
| Real Estate | real-estate | - | 3 mülk, 18 daire, 6 kiracı, 6 sözleşme, 18 ödeme, 8 randevu, 4 personel |
| Accounting | accounting | locations | 3 abonelik, 10 fatura, ödemeler, 15 gider |
| HR | hr | - | 8 kullanıcı, 8 çalışan, 12 izin, 24 bordro |
| Production | production | locations | 10 ürün, 6 üretim emri, 16 adım, 24 stok hareketi |
| Notifications | notifications | - | 8 bildirim |
| Chat | chat | hr | 3 sohbet odası, 15 mesaj |
| Web Builder | web-builder | - | 1 tema, 1 website, 4 sayfa, 4 bölüm, 1 form, 5 form gönderisi |
| AI | ai | - | 5 AI üretimi |
| File Management | file-management | - | 10 dosya |
| Reports | reports | - | 5 rapor |
| Audit | audit | - | 20 audit log |

## Best Practices

### 1. Demo Veri İşaretleme
- ID'lerde `-demo-` pattern kullan
- Metin alanlarında `[DEMO]` prefix kullan
- Kod/numara alanlarında `DEMO` kelimesi ekle

### 2. Bağımlılık Yönetimi
- Minimum bağımlılık prensibi
- Döngüsel bağımlılıktan kaçın
- Bağımlılıkları açıkça belirt

### 3. Hata Yönetimi
- Try-catch ile hataları yakala
- Başarısız işlemlerde kısmi sonuç döndür
- Hata mesajlarını açık yaz

### 4. Performans
- Batch işlemler için `Promise.all` kullan
- Gereksiz sorguları minimize et
- Transaction kullanımını değerlendir

## Çeviriler

Türkçe çeviriler `src/locales/modules/module-management/tr.json` dosyasında:

```json
{
  "moduleSettings": {
    "tabs": {
      "demoData": "Demo Veriler"
    },
    "demoData": {
      "title": "Demo Veriler",
      "description": "Bu modül için demo verileri yükleyebilir veya kaldırabilirsiniz.",
      "infoTitle": "Demo Veriler Hakkında",
      "infoMessage": "Demo veriler sisteminizi test etmenize yardımcı olur...",
      "warningTitle": "Dikkat",
      "warningMessage": "Demo verileri kaldırmak geri alınamaz...",
      "status": {
        "loaded": "{{count}} kayıt yüklü",
        "hasData": "Demo veri yüklü",
        "noData": "Demo veri yok"
      },
      "actions": {
        "load": "Demo Verileri Yükle",
        "remove": "Demo Verileri Kaldır"
      }
    }
  }
}
```

## Sorun Giderme

### "Seeder not found" Hatası
- Modül slug'ının doğru olduğunu kontrol et
- Seeder'ın registry'ye eklendiğini doğrula

### Bağımlılık Hatası
- Bağımlı modülün önce seed edildiğini kontrol et
- Bağımlılık tanımının doğru olduğunu doğrula

### Demo Veri Silinmiyor
- Silme sorgusundaki pattern'ın doğru olduğunu kontrol et
- Foreign key kısıtlamalarını kontrol et

### API 401 Hatası
- Kullanıcının oturum açtığını kontrol et
- TenantId ve CompanyId'nin mevcut olduğunu doğrula

---

# Production Deploy

Setup Wizard'da "Production Deploy" sekmesi ile sunucu kurulumu ve deployment işlemleri yapılabilir.

## Genel Bakış

Production Deploy özelliği şunları sağlar:
- SSH bağlantısı ile sunucu yönetimi
- Otomatik deployment scriptleri oluşturma
- PM2, Nginx, PostgreSQL konfigürasyonları
- GitHub Actions CI/CD entegrasyonu
- SSL sertifikası kurulumu (Let's Encrypt)

## Hedef Sunucu Gereksinimleri

### Önerilen: Hetzner CPX31

| Özellik | Değer |
|---------|-------|
| CPU | 4 vCPU (AMD) |
| RAM | 8 GB |
| Storage | 160 GB NVMe SSD |
| Bandwidth | 20 TB |
| OS | Ubuntu 22.04 LTS |

### Yazılım Gereksinimleri

- Node.js 20.x LTS
- PostgreSQL 16
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Certbot (SSL/Let's Encrypt)

## Setup Wizard Production Deploy Tab

### SSH Bağlantısı

```
┌─────────────────────────────────────────────────┐
│  SSH Bağlantısı                                 │
├─────────────────────────────────────────────────┤
│  Sunucu IP/Hostname: [___________________]      │
│  Port:               [22]                       │
│  Kullanıcı Adı:      [root]                    │
│  Kimlik Doğrulama:   [SSH Key ▼]               │
│                                                 │
│  SSH Private Key:                               │
│  ┌─────────────────────────────────────────┐   │
│  │ -----BEGIN OPENSSH PRIVATE KEY-----     │   │
│  │ ...                                     │   │
│  │ -----END OPENSSH PRIVATE KEY-----       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│              [🔑 Bağlantıyı Test Et]           │
└─────────────────────────────────────────────────┘
```

### Uygulama Yapılandırması

- **Uygulama Adı**: PM2 ve Nginx'te kullanılacak isim
- **Domain**: SSL sertifikası ve Nginx için domain
- **GitHub Repository URL**: Kaynak kod deposu
- **Branch**: Deploy edilecek branch (main, production vb.)
- **Node.js Sürümü**: 20.x LTS (önerilen)
- **PM2 Instance Sayısı**: CPU sayısı kadar (CPX31 için 4)

### Veritabanı Yapılandırması

- **Database Host**: localhost veya remote PostgreSQL
- **Database Port**: 5432 (varsayılan)
- **Database Adı**: Tenant veritabanı adı
- **Database Kullanıcısı**: PostgreSQL kullanıcısı
- **Database Parolası**: Güçlü parola

## Oluşturulan Scriptler

### 1. deploy.sh

Deployment script'i:

```bash
#!/bin/bash
set -e

APP_NAME="omnex-app"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN="app.example.com"
BRANCH="main"

echo "=========================================="
echo "  Omnex Production Deploy"
echo "=========================================="

cd ${APP_DIR}

# Pull latest changes
git fetch origin
git checkout ${BRANCH}
git pull origin ${BRANCH}

# Install dependencies
npm ci --production=false

# Build application
npm run build

# Run Prisma migrations
npm run prisma:merge
npx prisma generate --schema=prisma/core.schema.prisma
npx prisma generate --schema=prisma/tenant.schema.prisma
npx prisma db push --schema=prisma/core.schema.prisma --accept-data-loss
npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss

# Restart PM2
pm2 reload ecosystem.config.js --update-env

echo "Deploy completed successfully!"
```

### 2. ecosystem.config.js

PM2 konfigürasyonu:

```javascript
module.exports = {
  apps: [{
    name: 'omnex-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/omnex-app',
    instances: 'max', // 4 CPU için 4 instance
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1500M',
    error_file: '/var/log/pm2/omnex-app-error.log',
    out_file: '/var/log/pm2/omnex-app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000
  }]
};
```

### 3. nginx.conf

Nginx reverse proxy konfigürasyonu:

```nginx
upstream omnex_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=omnex_limit:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name app.example.com;

    # SSL (Certbot)
    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Static files
    location /_next/static {
        alias /var/www/omnex-app/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy
    location / {
        proxy_pass http://omnex_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. GitHub Actions Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm test --if-present
      - run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/omnex-app
            git pull origin main
            npm ci --production=false
            npm run build
            pm2 reload ecosystem.config.js --update-env
```

## API Endpoints

### GET /api/setup/deploy

Deploy bilgilerini ve adımlarını getirir.

**Query Parameters:**
- `action=steps` - Deploy adımlarını listele
- `action=generate-scripts` - Scriptleri oluştur

### POST /api/setup/deploy

Deploy işlemlerini çalıştırır.

**Actions:**
- `test-connection` - SSH bağlantısını test et
- `execute-step` - Belirli bir adımı çalıştır
- `save-config` - Konfigürasyonu kaydet

## Deploy Adımları

1. **SSH Bağlantı Testi** - Sunucuya erişim kontrolü
2. **Sistem Güncellemesi** - apt update && upgrade
3. **Bağımlılık Kurulumu** - Node.js, PM2, Nginx, Certbot
4. **PostgreSQL Kurulumu** - Database server
5. **Veritabanı Oluştur** - Core ve Tenant DB
6. **Repo Klonla** - GitHub'dan kaynak kod
7. **Uygulama Kurulumu** - npm install && build
8. **Environment Ayarları** - .env dosyası
9. **Prisma Migrate** - Database şeması
10. **PM2 Yapılandırması** - Process manager
11. **Nginx Yapılandırması** - Reverse proxy
12. **SSL Sertifikası** - Let's Encrypt (opsiyonel)
13. **Firewall** - UFW kuralları

## GitHub Secrets

GitHub Actions için gerekli secret'lar:

| Secret | Açıklama |
|--------|----------|
| `SERVER_HOST` | Sunucu IP adresi |
| `SERVER_USER` | SSH kullanıcı adı |
| `SERVER_PORT` | SSH port (varsayılan: 22) |
| `SSH_PRIVATE_KEY` | SSH private key |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth secret key |

## Environment Variables

Production ortamında kullanılacak environment variables:

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.example.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/omnex_core
TENANT_DATABASE_URL=postgresql://user:pass@localhost:5432/tenant_xxx

# Auth
NEXTAUTH_URL=https://app.example.com
NEXTAUTH_SECRET=your-secret-key

# Other
ALLOW_SETUP_PAGE=false
```

## Best Practices

### Güvenlik
- SSH key kullanın (parola değil)
- Güçlü database parolaları
- SSL sertifikası mutlaka aktif
- Firewall kuralları düzgün yapılandırın

### Performans
- PM2 cluster mode kullanın
- Nginx static file cache
- Database connection pooling
- Gzip compression aktif

### Monitoring
- PM2 logs takibi
- Nginx access/error logs
- Database performance metrics
- Uptime monitoring

### Backup
- Database günlük backup
- .env dosyası güvenli saklama
- Deployment rollback planı
