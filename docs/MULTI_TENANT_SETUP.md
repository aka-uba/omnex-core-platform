# Multi-Tenant Enterprise Setup Guide

Bu dokümantasyon, Omnex Core Platform'un multi-tenant enterprise yapısına nasıl geçirildiğini ve nasıl kullanılacağını açıklar.

## Tamamlanan Fazlar

✅ **Faz 1**: Architecture dokümantasyonu, tenant config ve env örnekleri  
✅ **Faz 2**: Core ve Tenant Prisma schema dosyaları  
✅ **Faz 3**: Tenant bootstrap script, API endpoint ve service layer  
✅ **Faz 4**: Middleware tenant resolver, DB switcher ve routing mantığı  
✅ **Faz 5**: API route'ları tenant context kullanacak şekilde güncellendi  
✅ **Faz 6**: Yearly DB rotation script ve API endpoint  
✅ **Faz 7**: Export/Import script'leri ve API endpoint'leri  
✅ **Faz 8**: Audit Log / Activity Timeline sistemi  

## Kurulum

### 1. Environment Variables

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# Core DB
CORE_DATABASE_URL="postgresql://user:pass@host:5432/omnex_core"

# Tenant DB Template
TENANT_DB_TEMPLATE_URL="postgresql://user:pass@host:5432/__DB_NAME__"

# PostgreSQL Admin
PG_ADMIN_URL="postgresql://postgres:pass@host:5432/postgres"
```

### 2. Prisma Client Generate

Her iki schema için Prisma client'ları generate edin:

```bash
# Core client
CORE_DATABASE_URL="..." npx prisma generate --schema=prisma/core.schema.prisma

# Tenant client
TENANT_DATABASE_URL="..." npx prisma generate --schema=prisma/tenant.schema.prisma
```

### 3. Core Database Migration

Core database'i oluşturun ve migration'ları uygulayın:

```bash
# Core DB migration
CORE_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
```

## Kullanım

### Tenant Oluşturma

#### Script ile:
```bash
pnpm tenant:create --name="ACME Corp" --slug="acme" --subdomain="acme"
```

#### API ile:
```bash
POST /api/tenants
{
  "name": "ACME Corp",
  "slug": "acme",
  "subdomain": "acme",
  "agencyId": "agency-id" // optional
}
```

### Yearly DB Rotation

Yeni yıl için database rotation:

```bash
pnpm tenant:new-year --tenant=acme --year=2026
```

Veya API ile:
```bash
POST /api/tenants/{id}/rotate
{
  "year": 2026
}
```

### Export/Import

#### Export:
```bash
pnpm tenant:export --tenant=acme --year=2025
```

Veya API ile:
```bash
POST /api/tenants/{id}/export
{
  "year": 2025
}
```

#### Import:
```bash
pnpm tenant:import --file=acme_2025.tar.gz --restore-db=tenant_acme_2025_restore
```

Veya API ile:
```bash
POST /api/tenants/{id}/import
FormData: { file: File, restoreDb?: string }
```

## Routing

### Production
- Subdomain: `acme.onwindos.com`

### Staging
- Subdomain: `acme.staging.onwindos.com`
- Path fallback: `/tenant/acme`

### Local Development
- Path-based: `localhost:3000/tenant/acme`

## API Route Pattern

Tüm tenant-specific API route'ları şu pattern'i kullanır:

```typescript
import { requireTenantPrisma } from '@/lib/api/tenantContext';

export async function GET(request: NextRequest) {
  const tenantPrisma = requireTenantPrisma(request);
  
  // tenantPrisma.user.findMany() kullan
}
```

## Audit Logging

Audit log'lar otomatik olarak tenant DB'de saklanır:

```typescript
import { logAuditEvent } from '@/lib/services/auditLogService';

await logAuditEvent(tenantContext, {
  userId: user.id,
  action: 'update',
  entity: 'User',
  entityId: userId,
  metadata: { oldValue, newValue },
});
```

## Önemli Notlar

⚠️ **KRİTİK**: Asla tenant DB üzerinde `prisma migrate dev` çalıştırmayın!
- Core DB → `prisma migrate dev`
- Tenant DB → `prisma migrate deploy` (locked version)

## Sonraki Adımlar

1. Core database'i oluşturun ve migration'ları uygulayın
2. İlk tenant'ı oluşturun
3. Diğer API route'larını tenant context kullanacak şekilde güncelleyin
4. Frontend'i tenant routing'e göre güncelleyin

## Sorun Giderme

### Tenant DB oluşturulamıyor
- PostgreSQL admin erişimini kontrol edin
- `PG_ADMIN_URL` doğru mu?

### Migration fail
- Tenant `setup_failed=true` olarak işaretlenir
- Database otomatik olarak drop edilir
- Log'ları kontrol edin

### Routing çalışmıyor
- Middleware'in tenant'ı resolve ettiğinden emin olun
- `x-tenant-slug` header'ı kontrol edin


