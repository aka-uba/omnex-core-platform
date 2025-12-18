# Veritabanı Kurulum Sihirbazı

## Genel Bakış

Veritabanı kurulum sihirbazı, tüm veritabanı kurulum süreçlerini manuel olarak yapabileceğiniz HTML arayüzlü bir kurulum aracıdır.

## Erişim

- **URL**: `/setup` veya `/{locale}/setup`
- **Geliştirme**: Her zaman erişilebilir
- **Production**: Varsayılan olarak devre dışı

## Production Ortamında Kullanım

### Güvenlik

Production ortamında setup sayfası **varsayılan olarak devre dışıdır**. Güvenlik için:

1. **Environment Variable ile Aktifleştirme**:
   ```bash
   ALLOW_SETUP_PAGE=true
   ```

2. **Erişim Kontrolü**:
   - Setup sayfası erişim kontrolü yapar
   - Production'da `ALLOW_SETUP_PAGE=true` olmadan erişim reddedilir
   - Development ortamında her zaman erişilebilir

### Önerilen Kullanım

**Production'da setup sayfasını kullanmak için:**

1. **Geçici olarak aktifleştirin**:
   ```bash
   # .env veya environment variable
   ALLOW_SETUP_PAGE=true
   ```

2. **Kurulumu yapın**

3. **Güvenlik için tekrar devre dışı bırakın**:
   ```bash
   ALLOW_SETUP_PAGE=false
   # veya environment variable'ı kaldırın
   ```

### Alternatif: SSH/CLI Kullanımı

Production ortamında setup sayfası yerine CLI komutlarını kullanabilirsiniz:

```bash
# Schema merge
npm run schema:merge

# Validation
npm run schema:validate
npm run schema:validate-relations

# Database push
npx prisma db push --force-reset --accept-data-loss --schema=prisma/core.schema.prisma
npx prisma db push --force-reset --accept-data-loss --schema=prisma/tenant.schema.prisma

# Generate clients
npm run prisma:generate

# Seed
npm run db:seed:core
npm run db:seed:tenant -- --tenant-slug=your-tenant
npm run db:seed:demo -- --tenant-slug=your-tenant
```

## Özellikler

### 9 Adımlı Kurulum Süreci

1. **Veritabanı Bağlantısı**: Veritabanı bağlantılarını test eder
2. **Veritabanları Oluştur**: Core ve tenant veritabanlarını oluşturur
3. **Schema Birleştirme**: Modüler şemaları birleştirir
4. **Schema Doğrulama**: Schema bütünlüğünü doğrular
5. **Veritabanı Uygulama**: Şemayı veritabanlarına uygular
6. **Client Oluştur**: Prisma client'larını oluşturur
7. **Core Seed**: Core veritabanını doldurur
8. **Tenant Seed**: Tenant veritabanını doldurur
9. **Demo Seed**: Demo verilerini ekler

### Özellikler

- ✅ Adım adım ilerleme
- ✅ Her adımı tek tek çalıştırma
- ✅ Tüm adımları otomatik çalıştırma
- ✅ Otomatik ilerleme seçeneği
- ✅ Gerçek zamanlı log görüntüleme
- ✅ Hata yönetimi ve çözüm önerileri
- ✅ Veritabanı sıfırlama seçenekleri
- ✅ Tamamlanma modal'ı
- ✅ Rapor indirme (Markdown/Text)

### Rapor İndirme

Kurulum tamamlandığında:
- **Markdown formatında** (`omnex-setup-report-YYYY-MM-DD.md`)
- **Text formatında** (`omnex-setup-report-YYYY-MM-DD.txt`)

Rapor içeriği:
- Tarih ve durum
- Yapılandırma bilgileri
- Tüm adımların durumu
- Hata mesajları ve çözümler
- Tüm loglar

## Kullanılan Script'ler

- `scripts/merge-schemas.js`
- `scripts/validate-tenant-bound.js`
- `scripts/validate-relations.js`
- `prisma/seed/core-seed.ts`
- `prisma/seed/tenant-seed.ts`
- `prisma/seed/demo-seed.ts`

## API Endpoints

- `POST /api/setup/test-connection` - Veritabanı bağlantı testi
- `POST /api/setup/create-database` - Veritabanı oluşturma
- `POST /api/setup/schema-merge` - Schema merge
- `POST /api/setup/validate-schema` - Schema validation
- `POST /api/setup/db-push` - Database push
- `POST /api/setup/generate-client` - Client generate
- `POST /api/setup/run-seed` - Seed çalıştırma
- `POST /api/setup/reset-database` - Veritabanı sıfırlama
- `GET /api/setup/check-access` - Erişim kontrolü

## Güvenlik Notları

1. **Production'da dikkatli kullanın**: Setup sayfası veritabanı sıfırlama ve değiştirme yetkisine sahiptir
2. **Environment Variable**: Production'da `ALLOW_SETUP_PAGE=true` olmadan erişim reddedilir
3. **IP Whitelist**: İsterseniz middleware'e IP whitelist ekleyebilirsiniz
4. **Authentication**: İsterseniz authentication ekleyebilirsiniz

## Sorun Giderme

### EPERM Hatası (Windows)

Windows'ta dosya kilidi hatası genellikle zararsızdır:
- Prisma Studio'yu kapatın
- Diğer Prisma process'lerini kapatın
- Adımı tekrar çalıştırın

### Veritabanı Bağlantı Hatası

- PostgreSQL servisinin çalıştığından emin olun
- Connection string'i kontrol edin
- Kullanıcı izinlerini kontrol edin

### Schema Validation Hatası

- Tüm modellerde `tenantId` ve `companyId` olduğundan emin olun
- Cross-module relation'ları whitelist'e göre kontrol edin
- Module contract'ları güncel olduğundan emin olun


















