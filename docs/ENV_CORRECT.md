# .env Dosyası - Doğru Format

## ❌ Yanlış (Satırlar Birleşik + TENANT_DB_TEMPLATE_URL Yanlış)

```env
CORE_DATABASE_URL="postgresql://postgres@localhost:5432/omnex_core?schema=public"TENANT_DB_TEMPLATE_URL="postgresql://postgres@localhost:5432/omnex_core?schema=public"PG_ADMIN_URL="postgresql://postgres@localhost:5432/postgres"
```

## ✅ Doğru Format

```env
CORE_DATABASE_URL="postgresql://postgres@localhost:5432/omnex_core?schema=public"
TENANT_DB_TEMPLATE_URL="postgresql://postgres@localhost:5432/__DB_NAME__?schema=public"
PG_ADMIN_URL="postgresql://postgres@localhost:5432/postgres"
```

## Önemli Farklar

1. **Her satır ayrı olmalı** (satır sonları gerekli)
2. **TENANT_DB_TEMPLATE_URL'de `__DB_NAME__` olmalı** (omnex_core değil!)
   - Bu placeholder runtime'da gerçek tenant DB ismi ile değiştirilir
   - Örnek: `tenant_acme_2025` → `postgresql://postgres@localhost:5432/tenant_acme_2025`

## Şifre Varsa

Eğer PostgreSQL'de şifre belirlediyseniz:

```env
CORE_DATABASE_URL="postgresql://postgres:your_password@localhost:5432/omnex_core?schema=public"
TENANT_DB_TEMPLATE_URL="postgresql://postgres:your_password@localhost:5432/__DB_NAME__?schema=public"
PG_ADMIN_URL="postgresql://postgres:your_password@localhost:5432/postgres"
```

## Kontrol

`.env` dosyanızı düzelttikten sonra:

```bash
npm run db:check
```

Bu komut bağlantıları test eder ve hataları gösterir.

