# Prisma Migrations

Bu dizin Prisma migration dosyalarını içerir.

## Yapı

```
prisma/migrations/
├── legacy/              # Eski migration'lar (modülerleştirme öncesi)
│   └── ...
├── {YYYYMMDDHHMMSS}_{module-slug}_{description}/
│   └── migration.sql
└── migration_lock.toml
```

## Migration İsimlendirme

Yeni migration'lar şu formatta isimlendirilmelidir:

```
{YYYYMMDDHHMMSS}_{module-slug}_{description}
```

Örnekler:
- `20250104120000_real-estate_add_property_features`
- `20250104120001_accounting_add_invoice_templates`
- `20250104120002_core-base_update_user_permissions`

## Modül Bazlı Migration

Her migration bir modüle ait olmalıdır:
- `core-base`: Core base modelleri için
- `extensions`: Extension modelleri için
- `{module-slug}`: Modül spesifik migration'lar için

## Version Check

Migration'lar öncesi schema version kontrolü yapılır:
- SemVer format zorunlu: `v1.4.2`
- Version compatibility check
- Upgrade path validation

## Legacy Migrations

Eski migration'lar `legacy/` dizininde saklanır ve referans için tutulur.


















