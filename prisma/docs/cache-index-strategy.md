# Cache & Index Strategy

## Overview

Bu doküman OMNEX SaaS Platform için cache ve index stratejisini tanımlar.

## Mimari Prensipler

### 1. Cache Layer Konumu

```
┌─────────────────────────────────────────────────────────┐
│                      Controller                          │
├─────────────────────────────────────────────────────────┤
│                       Service                            │
├─────────────────────────────────────────────────────────┤
│                   ✅ Cache Layer                         │
├─────────────────────────────────────────────────────────┤
│                       Prisma                             │
├─────────────────────────────────────────────────────────┤
│                      Database                            │
└─────────────────────────────────────────────────────────┘
```

**ÖNEMLİ:**
- Cache layer **Prisma'nın üzerinde** çalışır
- Prisma Client asla cache logic içermez
- Cache işlemleri Service katmanında yapılır

### 2. Index Güvenlik Kuralları

| Index Türü | Güvenlik | DEV Mode | GUARDED Mode |
|------------|----------|----------|--------------|
| `@@index([tenantId, companyId])` | ✅ Güvenli | Serbest | Serbest |
| `@@index([tenantId, companyId, status])` | ✅ Güvenli | Serbest | Serbest |
| `@@index([createdAt])` | ✅ Güvenli | Serbest | Serbest |
| `@@unique([tenantId, slug])` | ⚠️ Dikkatli | Warning | Validation zorunlu |
| Mevcut alana `@unique` eklemek | ❌ Riskli | Warning | Veri analizi zorunlu |

### 3. Tenant İzolasyonu

- **TenantId içermeyen index KABUL EDİLMEZ**
- Her query `tenantId` ile scope'lanmalıdır
- Cache key'leri tenant-bound olmalıdır

---

## Cache Sistemi

### Dosya Yapısı

```
src/lib/cache/
├── index.ts           # Export module
├── CacheConfig.ts     # TTL, strategy tanımları
├── CacheManager.ts    # Merkezi cache yönetimi
├── TenantCache.ts     # Tenant-specific cache
└── QueryCache.ts      # Query-optimized cache
```

### Kullanım Örnekleri

#### 1. Temel Cache Kullanımı

```typescript
import { cacheManager } from '@/lib/cache';

// Set
cacheManager.set('key', data, { ttl: '5m', tags: ['entity'] });

// Get
const data = cacheManager.get<MyType>('key');

// Delete
cacheManager.delete('key');
```

#### 2. Tenant Cache Kullanımı

```typescript
import { createTenantCache, ModuleCaches } from '@/lib/cache';

// Manuel oluşturma
const cache = createTenantCache(tenantId, companyId, 'real-estate');

// veya Factory kullanımı
const cache = ModuleCaches.realEstate(tenantId, companyId);

// Kullanım
const property = await cache.cacheDetail('property', propertyId, async () => {
  return prisma.property.findUnique({ where: { id: propertyId } });
});
```

#### 3. Query Cache Kullanımı (Önerilen)

```typescript
import { QueryCacheFactory } from '@/lib/cache';

// Factory ile oluştur
const propertyCache = QueryCacheFactory.property(tenantId, companyId);

// findMany - Liste sorguları
const properties = await propertyCache.findMany(
  { status: 'active' },
  () => prisma.property.findMany({ where: { tenantId, status: 'active' } })
);

// findOne - Tekil sorgular
const property = await propertyCache.findOne(propertyId, () =>
  prisma.property.findUnique({ where: { id: propertyId } })
);

// findPaginated - Sayfalı sorgular
const result = await propertyCache.findPaginated(
  { status: 'active' },
  { page: 1, pageSize: 20 },
  () => prisma.property.findMany({ where: { tenantId, status: 'active' }, skip: 0, take: 20 }),
  () => prisma.property.count({ where: { tenantId, status: 'active' } })
);

// Mutation sonrası invalidation
await prisma.property.update({ where: { id }, data });
propertyCache.invalidate(id);
```

### TTL Değerleri

| Veri Tipi | TTL | Kullanım |
|-----------|-----|----------|
| `tenant` | 5m | Tenant context |
| `user` | 5m | User data |
| `list` | 1m | Liste sorguları |
| `detail` | 5m | Detay sorguları |
| `count` | 1m | Sayım sorguları |
| `static` | 1h | Statik veriler (template, config) |
| `report` | 15m | Raporlar |

### Cache Key Pattern'leri

```
{module}:{entity}:{tenantId}:{identifier}

Örnekler:
- real-estate:property:tenant-123:prop-1
- real-estate:property:list:tenant-123:status:active
- accounting:invoice:tenant-123:inv-456
```

### Cache Invalidation

```typescript
// Tek kayıt
cacheManager.delete('real-estate:property:tenant-123:prop-1');

// Pattern ile
cacheManager.invalidatePattern('real-estate:property:tenant-123:*');

// Tag ile
cacheManager.invalidateTag('property');

// Tüm tenant cache'i
cacheManager.invalidateTenant('tenant-123');
```

---

## Index Stratejisi

### Composite Index Kuralları

1. **Temel Index (Zorunlu)**
   ```prisma
   @@index([tenantId, companyId])
   ```

2. **Status Index (Sık Kullanılan)**
   ```prisma
   @@index([tenantId, companyId, status])
   @@index([tenantId, companyId, isActive])
   ```

3. **Tarih Index (Sıralama/Filtreleme)**
   ```prisma
   @@index([tenantId, companyId, createdAt])
   @@index([tenantId, companyId, dueDate])
   ```

4. **Kategori Index (Gruplama)**
   ```prisma
   @@index([tenantId, companyId, category])
   @@index([tenantId, companyId, type])
   ```

### Modül Bazlı Index Önerileri

#### Real Estate
```prisma
// Property
@@index([tenantId, companyId, isActive])
@@index([tenantId, companyId, city])

// Apartment
@@index([tenantId, companyId, status])
@@index([propertyId, status])

// Payment
@@index([tenantId, companyId, status])
@@index([tenantId, companyId, dueDate])
@@index([tenantId, status, dueDate])  // Vadesi geçen ödemeler için
```

#### Accounting
```prisma
// Invoice
@@index([tenantId, companyId, status])
@@index([tenantId, companyId, dueDate])

// Expense
@@index([tenantId, companyId, category])
@@index([tenantId, companyId, expenseDate])
```

#### Production
```prisma
// Product
@@index([tenantId, companyId, category])
@@index([tenantId, companyId, type])

// ProductionOrder
@@index([tenantId, companyId, status])
@@index([tenantId, companyId, priority])
```

---

## Performans Önerileri

### 1. Query Optimization

```typescript
// ❌ Kötü: N+1 sorgu
const properties = await prisma.property.findMany();
for (const p of properties) {
  p.apartments = await prisma.apartment.findMany({ where: { propertyId: p.id } });
}

// ✅ İyi: Include ile tek sorgu
const properties = await prisma.property.findMany({
  include: { apartments: true }
});
```

### 2. Select Optimization

```typescript
// ❌ Kötü: Tüm alanları çeker
const properties = await prisma.property.findMany();

// ✅ İyi: Sadece gerekli alanlar
const properties = await prisma.property.findMany({
  select: { id: true, name: true, status: true }
});
```

### 3. Pagination

```typescript
// ✅ Cursor-based (büyük veri setleri için)
const properties = await prisma.property.findMany({
  take: 20,
  cursor: { id: lastId },
  skip: 1,
});

// ✅ Offset-based (küçük veri setleri için)
const properties = await prisma.property.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

---

## Migration Kuralları

1. Index ekleme `npm run prisma:migrate:dev` ile yapılır
2. Modüler schema dosyalarında değişiklik yapılır
3. `merge-schemas.js` otomatik birleştirme yapar
4. DEV mode'da warning, GUARDED mode'da block

---

## Checklist

### Index Eklerken
- [ ] TenantId içeriyor mu?
- [ ] Sık kullanılan sorgu mu?
- [ ] Composite index gerekli mi?
- [ ] Migration testi yapıldı mı?

### Cache Eklerken
- [ ] TTL uygun mu?
- [ ] Invalidation stratejisi var mı?
- [ ] Tag'ler doğru mu?
- [ ] Memory leak riski var mı?
