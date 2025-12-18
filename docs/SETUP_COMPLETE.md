# Multi-Tenant Setup - Tamamlandı! ✅

## Başarıyla Tamamlanan İşlemler

1. ✅ **PostgreSQL Kurulumu ve Başlatma**
   - PostgreSQL 18.1 kuruldu
   - Data klasörü initialize edildi
   - Servis başlatıldı (port 5432)

2. ✅ **Core Database**
   - `omnex_core` database oluşturuldu
   - Core schema migration uygulandı
   - Varsayılan agency oluşturuldu (Omnex Agency)

3. ✅ **İlk Tenant Oluşturuldu**
   - Tenant: Demo Company (slug: demo)
   - Database: `tenant_demo_2025`
   - Migration uygulandı
   - Seed data oluşturuldu (admin user, roles, permissions)

## Oluşturulan Tenant Bilgileri

**Tenant:** Demo Company
- **Slug:** demo
- **Subdomain:** demo
- **Database:** tenant_demo_2025
- **Status:** active

**Varsayılan Admin:**
- **Email:** admin@demo.com
- **Password:** Omnex123!
- **Role:** SuperAdmin

## Erişim

### Production (Subdomain)
```
http://demo.onwindos.com
```

### Local Development (Path-based)
```
http://localhost:3000/tenant/demo
```

## Sonraki Adımlar

### 1. Test Erişimi
- Development server'ı başlatın: `npm run dev`
- Tarayıcıda `http://localhost:3000/tenant/demo` adresine gidin
- Admin kullanıcısı ile giriş yapın

### 2. Yeni Tenant Oluşturma
```bash
npm run tenant:create -- --name="ACME Corp" --slug="acme" --subdomain="acme" --agency-id="omnex-agency-001"
```

### 3. Tenant Listeleme
```bash
npm run tenant:list
```

### 4. Tenant Silme
```bash
npm run tenant:delete -- --slug=demo
```

## Önemli Notlar

### PostgreSQL Servisini Başlatma
PostgreSQL servisi her bilgisayar açılışında otomatik başlamayabilir. Başlatmak için:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\18\data"
```

Veya Windows Services'ten manuel başlatın.

### Migration Yönetimi

⚠️ **KRİTİK**: Asla tenant DB üzerinde `prisma migrate dev` çalıştırmayın!

- **Core DB**: `npx prisma migrate dev --schema=prisma/core.schema.prisma`
- **Tenant DB**: `npx prisma migrate deploy --schema=prisma/tenant.schema.prisma` (locked version)

### Environment Variables

`.env` dosyanızda şu değerler olmalı:

```env
CORE_DATABASE_URL="postgresql://postgres@localhost:5432/omnex_core?schema=public"
TENANT_DB_TEMPLATE_URL="postgresql://postgres@localhost:5432/__DB_NAME__?schema=public"
PG_ADMIN_URL="postgresql://postgres@localhost:5432/postgres"
```

## Sistem Durumu

- ✅ Core database: Çalışıyor
- ✅ Tenant database: tenant_demo_2025 oluşturuldu
- ✅ Migration'lar: Uygulandı
- ✅ Seed data: Oluşturuldu
- ✅ Middleware: Tenant resolver hazır
- ✅ API routes: Tenant context kullanıyor

## Kullanılabilir Komutlar

```bash
# Database işlemleri
npm run db:check              # Bağlantı kontrolü
npm run db:create             # Core DB oluştur
npm run db:seed:core         # Core DB seed

# Tenant işlemleri
npm run tenant:create        # Yeni tenant oluştur
npm run tenant:list          # Tenant'ları listele
npm run tenant:delete        # Tenant sil
npm run tenant:new-year      # Yıllık rotation
npm run tenant:export        # Export
npm run tenant:import        # Import
```

## Sorun Giderme

### PostgreSQL Çalışmıyor
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\18\data"
```

### Tenant DB Migration Hatası
Tenant DB için `migrate deploy` kullanın, `migrate dev` değil!

### Import Path Hataları
Tüm import path'leri düzeltildi. Eğer hata alırsanız:
- `node_modules/.prisma/core-client` → Core DB için
- `node_modules/.prisma/tenant-client` → Tenant DB için

