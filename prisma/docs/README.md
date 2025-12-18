# Prisma Schema Documentation

Bu dizin, modüler Prisma schema mimarisinin dokümantasyonunu içerir.

## Dokümanlar

### 📋 [Schema Relations](./schema-relations.md)
Cross-module relation politikası ve whitelist kuralları.

**Kullanılan Script'ler:**
- `scripts/validate-relations.js`

### 🔧 [Cross-Cutting Concerns](./cross-cutting-concerns.md)
Tüm modüllerin kullanabileceği merkezi sistemler.

**Kullanılan Script'ler:**
- `scripts/validate-relations.js`
- `scripts/merge-schemas.js`

### 🤖 [AI Schema Rules](./ai-schema-rules.md)
AI asistanlarının schema ile etkileşim kurarken uyması gereken kurallar.

**Kullanılan Script'ler:**
- `scripts/validate-relations.js`
- `scripts/validate-tenant-bound.js`
- `scripts/validate-module-contracts.js`
- `scripts/merge-schemas.js`

### 📦 [Migration Strategy](./migration-strategy.md)
Migration yönetimi ve schema version kontrolü.

**Kullanılan Script'ler:**
- `scripts/migration-version-check.js`
- `scripts/migration-helper.js`
- `scripts/merge-schemas.js`
- `scripts/validate-tenant-bound.js`
- `scripts/validate-relations.js`

### 📝 [Module Contracts](./module-contracts/)
Her modülün public API'si ve bağımlılıkları.

**Kullanılan Script'ler:**
- `scripts/validate-module-contracts.js`

### 🚀 [Setup Wizard](./setup-wizard.md)
Veritabanı kurulum sihirbazı kullanım kılavuzu.

**Kullanılan Script'ler:**
- Tüm schema management script'leri
- Tüm seed script'leri

## Tüm Script'ler

### Schema Management Script'leri

1. **`scripts/merge-schemas.js`**
   - Modüler schema dosyalarını birleştirir (`core-base`, `extensions`, `modules`)
   - Duplicate model name detection
   - Broken relation target detection
   - Relation policy validation
   - `prisma/tenant.schema.prisma` dosyasını auto-generate eder

2. **`scripts/validate-tenant-bound.js`**
   - Tenant-bound validation (tenantId, companyId kontrolü)
   - Core modelleri (User, Company) hariç tutar
   - Mode-aware (DEV: warning, GUARDED: block)

3. **`scripts/validate-relations.js`**
   - Cross-module relation policy kontrolü
   - Whitelist kontrolü
   - Relation integrity check
   - Duplicate model name kontrolü
   - Mode-aware (DEV: warning, GUARDED: block)

4. **`scripts/validate-module-contracts.js`**
   - Module contract güncellemelerini kontrol eder
   - Git diff ile schema değişikliklerini tespit eder
   - `prisma/docs/module-contracts/{module-slug}.md` dosyalarını kontrol eder
   - Mode-aware (DEV: warning, GUARDED: block)

5. **`scripts/migration-version-check.js`**
   - Schema version format validation (SemVer: `^v\d+\.\d+\.\d+$`)
   - Version compatibility check
   - Upgrade path validation
   - Mode-aware (DEV: warning, GUARDED: block)

6. **`scripts/migration-helper.js`**
   - Migration yönetimi için helper fonksiyonlar
   - Legacy migration'ları taşıma

7. **`scripts/operational-mode.js`**
   - Operational mode detection (DEV/GUARDED)
   - Mode-aware validation handling
   - Environment variable kontrolü (`DEV_MODE`, `NODE_ENV`, `CI`)

8. **`scripts/prisma-wrapper.js`**
   - Prisma binary protection
   - DEV MODE: Warning (devam eder)
   - GUARDED MODE: Block (process.exit(1))
   - npm script'ler zorunlu kılar

## Operational Modes

### DEV MODE (Default)
- Tüm validasyonlar warning seviyesinde
- Prisma komutları doğrudan çalıştırılabilir (warning ile)
- Pre-commit hook zorunlu değil

### GUARDED MODE (CI/CD & Production)
- Tüm validasyonlar block seviyesinde
- Prisma komutları sadece npm script'ler üzerinden
- Pre-commit hook zorunlu

## Kullanım

### Schema Merge
```bash
npm run schema:merge
```

### Validation
```bash
npm run schema:validate
npm run schema:validate-relations
npm run schema:validate-contracts
npm run schema:validate-version
```

### Prisma Operations
```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

## Dizin Yapısı

```
prisma/
├── core-base/              # Core modeller
├── extensions/             # Cross-cutting concerns
├── modules/                # Modül bazlı şemalar
├── docs/                   # Bu dokümantasyon
│   ├── schema-relations.md
│   ├── cross-cutting-concerns.md
│   ├── ai-schema-rules.md
│   ├── migration-strategy.md
│   └── module-contracts/
│       ├── template.md
│       └── calendar.md
└── tenant.schema.prisma    # AUTO-GENERATED
```

## Önemli Notlar

- `prisma/tenant.schema.prisma` auto-generated dosyadır, manuel düzenlenmemelidir
- Tüm schema değişiklikleri modüler dosyalarda yapılmalıdır
- Her schema değişikliği sonrası `npm run schema:merge` çalıştırılmalıdır
- Module contract'lar schema değişikliklerinde güncellenmelidir
- Cross-module relation'lar whitelist'e göre kontrol edilir

