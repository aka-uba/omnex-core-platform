# Migration Strategy

Bu doküman, modüler Prisma schema mimarisinde migration yönetimini açıklar.

## Kullanılan Script'ler

Bu doküman aşağıdaki script'ler tarafından kullanılır:

- **`scripts/migration-version-check.js`**: Schema version format validation yapar (SemVer)
  - Format kontrolü: `^v\d+\.\d+\.\d+$`
  - DEV MODE: Geçersiz format → warning
  - GUARDED MODE: Geçersiz format → block
- **`scripts/migration-helper.js`**: Migration yönetimi için helper fonksiyonlar
- **`scripts/merge-schemas.js`**: Schema merge yapar (migration öncesi)
- **`scripts/validate-tenant-bound.js`**: Tenant-bound validation yapar
- **`scripts/validate-relations.js`**: Relation validation yapar

## Migration Yapısı

### Legacy Migrations
Eski migration'lar `prisma/migrations/legacy/` dizininde saklanır. Bunlar modülerleştirme öncesi migration'lardır ve referans için tutulur.

### Yeni Migration Formatı

Yeni migration'lar şu formatta isimlendirilir:

```
{YYYYMMDDHHMMSS}_{module-slug}_{description}
```

Örnekler:
- `20250104120000_real-estate_add_property_features`
- `20250104120001_accounting_add_invoice_templates`
- `20250104120002_core-base_update_user_permissions`
- `20250104120003_extensions_add_entity_meta`
- `20251208000310_calendar_add_calendar_event_model`

## Migration Oluşturma

### Manuel Oluşturma

```bash
npm run prisma:migrate:dev
```

Bu komut:
1. Schema merge yapar (`scripts/merge-schemas.js`)
2. Validation yapar (`scripts/validate-tenant-bound.js`, `scripts/validate-relations.js`)
3. Module contracts kontrolü yapar (`scripts/validate-module-contracts.js`)
4. Version check yapar (`scripts/migration-version-check.js`)
5. Migration oluşturur

### Modül Bazlı Migration (Önerilen)

```bash
npm run migration:create <module-slug> <description>
```

Örnek:
```bash
npm run migration:create real-estate "add property features"
npm run migration:create accounting "update invoice model"
npm run migration:create calendar "add calendar event model"
```

## Schema Version Management

### Version Format

Schema version'ları SemVer formatında olmalıdır:
- ✅ `v1.4.2`
- ✅ `v2.0.0`
- ❌ `v1` (geçersiz)
- ❌ `1.4` (geçersiz)
- ❌ `2025-Q1` (geçersiz)

**Validation**: `scripts/migration-version-check.js` tarafından kontrol edilir.

### Version Registry

Schema version'ları iki yerde takip edilir:

1. **Core Database**: `SchemaVersion` modeli (tenant bazlı)
2. **Tenant Database**: `TenantSchemaRegistry` modeli

### Version Check

Migration öncesi otomatik version check yapılır:
- Format validation (SemVer) - `scripts/migration-version-check.js`
- Compatibility check
- Upgrade path validation

## Modül Bazlı Migration Kuralları

### Core Base Migrations
- `core-base` modülü için migration'lar
- Örnek: `20250104120000_core-base_update_user_model`

### Extensions Migrations
- `extensions` modülü için migration'lar
- Örnek: `20250104120001_extensions_add_audit_log`

### Module Migrations
- Modül spesifik migration'lar
- Örnek: `20250104120002_real-estate_add_apartment_features`
- Örnek: `20251208000310_calendar_add_calendar_event_model`

## Migration Best Practices

1. **Modül Bazlı**: Her migration bir modüle ait olmalı
2. **Açıklayıcı İsimler**: Migration isimleri ne yaptığını açıklamalı
3. **Version Bump**: Önemli değişikliklerde schema version bump yapılmalı
4. **Backward Compatibility**: Mümkün olduğunca geriye dönük uyumlu olmalı
5. **Test**: Migration'lar test tenantlarında test edilmeli

## Migration Test Süreci

1. **Test Tenant**: Test tenant database'inde migration çalıştır
2. **Veri Kontrolü**: Mevcut verilerin korunduğunu kontrol et
3. **Schema Kontrolü**: Schema'nın doğru uygulandığını kontrol et
4. **Version Kontrolü**: Version registry'nin güncellendiğini kontrol et

## Rollback Stratejisi

Migration rollback için:
1. Prisma migration rollback komutları kullanılabilir
2. Manuel SQL rollback script'leri hazırlanabilir
3. Version registry manuel güncellenebilir

## Notlar

- Legacy migration'lar referans için tutulur
- Yeni migration'lar modül bazlı isimlendirilir
- Schema version zorunludur (SemVer format)
- Migration öncesi validation otomatik yapılır
- Tüm validation script'leri `npm run prisma:migrate:dev` içinde çalıştırılır




