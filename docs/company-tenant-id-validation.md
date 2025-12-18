# CompanyId ve TenantId Validation Rehberi

## Sorun

Multi-tenant SaaS platformlarda, `companyId` ve `tenantId` alanları çoğu model için zorunludur. Ancak API route'larında bu alanların eksik kullanılması durumunda database hataları oluşabilir.

## Tespit Yöntemleri

### 1. Otomatik Validation Script

```bash
npm run validate:company-tenant-ids
```

Bu script:
- Tüm Prisma modellerinde zorunlu `companyId` ve `tenantId` alanlarını tespit eder
- API route'larında bu alanların doğru kullanılıp kullanılmadığını kontrol eder
- Eksik kullanımları raporlar

### 2. Manuel Kontrol

#### Prisma Schema Kontrolü

Zorunlu alanları olan modelleri bulmak için:

```bash
grep -r "companyId\s+String[^?]" prisma/
grep -r "tenantId\s+String[^?]" prisma/
```

#### API Route Kontrolü

API route'larında `create` ve `update` işlemlerini kontrol edin:

```typescript
// ❌ YANLIŞ - companyId eksik
await tenantPrisma.modelName.create({
  data: {
    tenantId: tenantContext.id,
    // companyId eksik!
  },
});

// ✅ DOĞRU - companyId mevcut
const companyId = await requireCompanyId(request, tenantPrisma);
await tenantPrisma.modelName.create({
  data: {
    tenantId: tenantContext.id,
    companyId: companyId,
  },
});
```

## Çözüm: Helper Fonksiyonlar

### `requireCompanyId` Kullanımı

```typescript
import { requireCompanyId } from '@/lib/api/companyContext';

export async function POST(request: NextRequest) {
  return withTenant(async (tenantPrisma) => {
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await requireCompanyId(request, tenantPrisma);
    
    const newItem = await tenantPrisma.modelName.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId,
        // ... diğer alanlar
      },
    });
    
    return successResponse({ item: newItem });
  });
}
```

### `getCompanyIdFromRequest` Kullanımı (Opsiyonel)

Eğer companyId opsiyonel ise:

```typescript
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

export async function POST(request: NextRequest) {
  return withTenant(async (tenantPrisma) => {
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    
    const newItem = await tenantPrisma.modelName.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId || null, // Opsiyonel
        // ... diğer alanlar
      },
    });
    
    return successResponse({ item: newItem });
  });
}
```

## Standart Pattern

Tüm API route'larında şu pattern'i kullanın:

```typescript
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ item: unknown }>>(
    request,
    async (tenantPrisma) => {
      // 1. Tenant context al
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', '...', 400);
      }

      // 2. CompanyId al
      const companyId = await requireCompanyId(request, tenantPrisma);

      // 3. Request body'yi validate et
      const body = await request.json();
      const validatedData = schema.parse(body);

      // 4. Create/Update işlemi
      const item = await tenantPrisma.modelName.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          ...validatedData,
        },
      });

      return successResponse({ item });
    },
    { required: true, module: 'module-name' }
  );
}
```

## Yaygın Hatalar

### 1. CompanyId Eksik

```typescript
// ❌ YANLIŞ
await tenantPrisma.modelName.create({
  data: {
    tenantId: tenantContext.id,
    // companyId eksik!
  },
});
```

**Hata**: `Field companyId is required`

### 2. TenantId Eksik

```typescript
// ❌ YANLIŞ
await tenantPrisma.modelName.create({
  data: {
    companyId: companyId,
    // tenantId eksik!
  },
});
```

**Hata**: `Field tenantId is required`

### 3. Yanlış TenantId

```typescript
// ❌ YANLIŞ
await tenantPrisma.modelName.create({
  data: {
    tenantId: 'hardcoded-tenant-id', // Yanlış!
    companyId: companyId,
  },
});
```

**Çözüm**: Her zaman `tenantContext.id` kullanın

## CI/CD Entegrasyonu

Validation script'ini CI/CD pipeline'ına ekleyin:

```yaml
# .github/workflows/ci.yml
- name: Validate Company/Tenant IDs
  run: npm run validate:company-tenant-ids
```

## Düzenli Kontrol

Her migration veya yeni API route eklemeden önce:

1. `npm run validate:company-tenant-ids` çalıştırın
2. Tespit edilen sorunları düzeltin
3. Helper fonksiyonları kullanın

## İlgili Dosyalar

- `scripts/validate-company-tenant-ids.js` - Validation script
- `src/lib/api/companyContext.ts` - Helper fonksiyonlar
- `src/lib/api/tenantContext.ts` - Tenant context helper'ları

















