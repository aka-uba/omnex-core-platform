# Multi-Tenant Setup - Sonraki Adımlar

## ✅ Tamamlanan İşlemler

1. ✅ Core Prisma Client generate edildi
2. ✅ Tenant Prisma Client generate edildi
3. ✅ Tüm script'ler ve API endpoint'leri hazır
4. ✅ Database connection check script hazır

## 🔄 Şimdi Yapmanız Gerekenler

### 1. .env Dosyasını Kontrol Edin

`.env` dosyanızda şu değerlerin olduğundan emin olun:

```env
# Core Database (Platform yönetimi için)
CORE_DATABASE_URL="postgresql://user:password@localhost:5432/omnex_core?schema=public"

# Tenant Database Template (__DB_NAME__ placeholder'ı runtime'da değiştirilir)
TENANT_DB_TEMPLATE_URL="postgresql://user:password@localhost:5432/__DB_NAME__?schema=public"

# PostgreSQL Admin (Database oluşturma için - superuser gerekli)
PG_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres"
```

**Önemli:**
- `user`, `password`, `localhost`, `5432` değerlerini kendi PostgreSQL ayarlarınıza göre güncelleyin
- PostgreSQL servisinin çalıştığından emin olun

### 2. PostgreSQL Database Oluşturun

Core database'i oluşturun:

```sql
-- PostgreSQL'e bağlanın
psql -U postgres

-- Database oluşturun
CREATE DATABASE omnex_core;
```

### 3. Database Bağlantısını Test Edin

```bash
npm run db:check
```

Bu komut:
- Core DB bağlantısını test eder
- Tenant DB template URL'ini kontrol eder
- Admin URL'ini kontrol eder

### 4. Core Database Migration

Migration'ı uygulayın:

```bash
npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
```

### 5. Core Database Seed (Opsiyonel)

Varsayılan agency'yi oluşturun:

```bash
npm run db:seed:core
```

Bu, ilk agency'yi oluşturur (tenant oluştururken kullanmak için).

### 6. İlk Tenant Oluşturun

```bash
npm run tenant:create -- --name="Test Company" --slug="test" --subdomain="test"
```

Veya agency ID ile:

```bash
npm run tenant:create -- --name="Test Company" --slug="test" --subdomain="test" --agency-id="omnex-agency-001"
```

## 📋 Hızlı Başlangıç Komutları

```bash
# 1. Database bağlantısını kontrol et
npm run db:check

# 2. Core DB migration
npx prisma migrate dev --schema=prisma/core.schema.prisma --name init

# 3. Core DB seed (opsiyonel)
npm run db:seed:core

# 4. İlk tenant oluştur
npm run tenant:create -- --name="Test Company" --slug="test" --subdomain="test"
```

## 🔍 Sorun Giderme

### "CORE_DATABASE_URL environment variable is required"

`.env` dosyanızda `CORE_DATABASE_URL` değişkeninin olduğundan emin olun.

### "Can't reach database server"

1. PostgreSQL servisinin çalıştığını kontrol edin
2. `.env` dosyasındaki host, port, user, password değerlerini kontrol edin
3. Firewall ayarlarını kontrol edin

### "Database does not exist"

Core database'i oluşturun:
```sql
CREATE DATABASE omnex_core;
```

### Migration Hatası

Eğer migration sırasında hata alırsanız:
1. Database'in boş olduğundan emin olun
2. Prisma migration lock dosyasını kontrol edin
3. Gerekirse `prisma migrate reset` ile sıfırlayın (⚠️ DİKKAT: Tüm veriler silinir)

## 📝 Sonraki Adımlar (Migration Sonrası)

1. ✅ Core database migration başarılı
2. ✅ İlk agency oluşturuldu (opsiyonel)
3. ✅ İlk tenant oluşturuldu
4. 🔄 Tenant DB'nin başarıyla oluşturulduğunu kontrol edin
5. 🔄 Test kullanıcısı ile giriş yapmayı deneyin
6. 🔄 Diğer API route'larını tenant context kullanacak şekilde güncelleyin


