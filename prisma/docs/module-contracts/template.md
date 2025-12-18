# Module Contract: {module-name}

Bu doküman, {module-name} modülünün public API'sini ve bağımlılıklarını tanımlar.

## Kullanılan Script'ler

Bu doküman aşağıdaki script'ler tarafından kullanılır:

- **`scripts/validate-module-contracts.js`**: Module contract güncellemelerini kontrol eder
  - Git diff ile schema değişikliklerini tespit eder
  - `prisma/modules/{module-slug}/` değişmişse
  - `prisma/docs/module-contracts/{module-slug}.md` güncellenmiş mi kontrol eder
  - DEV MODE: Güncellenmemişse → warning
  - GUARDED MODE: Güncellenmemişse → block

## Genel Bilgiler

- **Module Slug**: `{module-slug}`
- **Schema Path**: `prisma/modules/{module-slug}/{module-slug}.prisma`
- **Last Updated**: {date}

## Public Models

Aşağıdaki modeller dış modüller tarafından kullanılabilir:

### ModelName
**Açıklama**: Model açıklaması
**Kullanım**: Nasıl kullanılır
**Relations**: Hangi modellere bağlı

## Internal Models

Aşağıdaki modeller sadece bu modül içinde kullanılır:

### ModelName
**Açıklama**: Model açıklaması
**Neden Internal**: Neden dışarıdan erişilemez

## Dependencies

Bu modül şu modüllere bağımlıdır:

- **Core Base**: `User`, `Company`
- **Extensions**: `Notification`, `CoreFile`, `AuditLog`
- **Modules**: (varsa)

## Dependents

Bu modüle bağımlı olan modüller:

- (varsa)

## Cross-Module Relations

Bu modülün diğer modüllerle ilişkileri:

- (varsa)

## Notlar

- Özel notlar
- Kullanım örnekleri
- Dikkat edilmesi gerekenler


















