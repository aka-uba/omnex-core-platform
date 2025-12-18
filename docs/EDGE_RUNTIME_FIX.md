# Edge Runtime Fix - Prisma Client Hatası

## Sorun

Next.js middleware Edge Runtime'da çalışır ve Prisma Client kullanamaz. Hata mesajı:

```
PrismaClient is not configured to run in Edge Runtime
```

## Çözüm

Middleware'de Prisma kullanımını kaldırdık ve tenant resolution'ı iki aşamaya ayırdık:

### 1. Middleware (Edge Runtime)
- Sadece tenant slug'ını çıkarır (subdomain veya path'ten)
- Prisma kullanmaz
- Slug'ı header'a ekler (`x-tenant-slug`)

### 2. API Routes (Node.js Runtime)
- Middleware'den gelen slug'ı kullanır
- Prisma ile full tenant context'i resolve eder
- Database URL'i alır ve tenant Prisma client'ı oluşturur

## Değişiklikler

### `src/lib/middleware/tenantResolver.ts`
- `resolveTenant()` → `extractTenantSlug()` (Edge-compatible)
- `resolveTenantContext()` eklendi (API routes için, Prisma kullanır)

### `src/middleware.ts`
- `resolveTenant()` → `extractTenantSlug()` kullanımı
- Sadece slug ve source header'a ekleniyor

### `src/lib/api/tenantContext.ts`
- Tüm fonksiyonlar async yapıldı
- `getTenantFromRequest()` artık Prisma ile full context resolve ediyor
- Custom domain desteği eklendi

### API Routes
- `requireTenantPrisma()` ve `requireTenant()` çağrılarına `await` eklendi
- Tüm route'lar güncellendi:
  - `src/app/api/users/route.ts`
  - `src/app/api/notifications/route.ts`
  - `src/app/api/audit-logs/route.ts`
  - `src/app/api/audit-logs/user/[userId]/route.ts`
  - `src/app/api/audit-logs/entity/[entity]/[entityId]/route.ts`

## Kullanım

### Middleware'de (Edge Runtime)
```typescript
import { extractTenantSlug } from '@/lib/middleware/tenantResolver';

const tenantSlug = extractTenantSlug(request);
if (tenantSlug) {
  response.headers.set('x-tenant-slug', tenantSlug.slug);
  response.headers.set('x-tenant-source', tenantSlug.source);
}
```

### API Routes'da (Node.js Runtime)
```typescript
import { requireTenantPrisma } from '@/lib/api/tenantContext';

export async function GET(request: NextRequest) {
  const tenantPrisma = await requireTenantPrisma(request);
  // Use tenantPrisma...
}
```

## Tenant Resolution Akışı

1. **Request gelir** → Middleware çalışır (Edge Runtime)
2. **Slug çıkarılır** → Subdomain veya path'ten
3. **Header eklenir** → `x-tenant-slug`, `x-tenant-source`, `x-hostname`
4. **API Route çalışır** → Node.js Runtime
5. **Full context resolve edilir** → Prisma ile database'den
6. **Tenant Prisma client oluşturulur** → Tenant DB'ye bağlanır

## Test

Middleware artık Edge Runtime'da çalışabilir ve Prisma hatası almayacaksınız.

```bash
npm run dev
```

Tarayıcıda test edin:
- `http://localhost:3000/tenant/demo` (path-based)
- `http://demo.localhost:3000` (subdomain - localhost için)

