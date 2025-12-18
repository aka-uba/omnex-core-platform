# API Schema Validation Rehberi

## Sorun

API route'larında schema uyumsuzlukları oluşabilir:
- Date alanları string olarak geliyor ama Date bekleniyor
- Schema'daki alanlar API route'larında eksik
- Create/Update işlemlerinde tüm alanlar işlenmiyor
- GET response'larda date alanları ISO string'e çevrilmiyor

## Otomatik Validation

### Script Çalıştırma

```bash
npm run validate:api-schema
```

Bu script:
- Tüm Zod schema dosyalarını bulur
- Tüm API route dosyalarını bulur
- Schema'daki date alanlarını tespit eder
- API route'larda date işlemelerini kontrol eder
- Schema'daki tüm alanların kullanılıp kullanılmadığını kontrol eder
- Eksik alanları ve sorunları raporlar

## Standart Pattern'ler

### 1. Date Alanları

#### Schema'da
```typescript
// ✅ DOĞRU - z.coerce.date() kullanın
export const schema = z.object({
  lastRenovationDate: z.coerce.date().optional().nullable(),
  deliveryDate: z.coerce.date().optional().nullable(),
});
```

#### API Route'da (Create/Update)
```typescript
// ✅ DOĞRU - new Date() ile dönüştürün
const newItem = await tenantPrisma.modelName.create({
  data: {
    lastRenovationDate: validatedData.lastRenovationDate 
      ? new Date(validatedData.lastRenovationDate) 
      : null,
    deliveryDate: validatedData.deliveryDate 
      ? new Date(validatedData.deliveryDate) 
      : null,
  },
});
```

#### API Route'da (GET Response)
```typescript
// ✅ DOĞRU - ISO string'e çevirin
return successResponse({
  item: {
    ...item,
    lastRenovationDate: item.lastRenovationDate?.toISOString() || null,
    deliveryDate: item.deliveryDate?.toISOString() || null,
  },
});
```

### 2. Tüm Alanları Kullanma

#### Create İşlemi
```typescript
// ✅ DOĞRU - Schema'daki tüm alanları kullanın
const newItem = await tenantPrisma.modelName.create({
  data: {
    tenantId: tenantContext.id,
    companyId: companyId,
    // Schema'daki tüm alanlar
    field1: validatedData.field1,
    field2: validatedData.field2 || null,
    field3: validatedData.field3 || null,
    // ... tüm alanlar
  },
});
```

#### Update İşlemi
```typescript
// ✅ DOĞRU - Tüm alanları kontrol edin
const updateData: Prisma.ModelNameUpdateInput = {};
if (validatedData.field1 !== undefined) updateData.field1 = validatedData.field1;
if (validatedData.field2 !== undefined) updateData.field2 = validatedData.field2 || null;
if (validatedData.field3 !== undefined) updateData.field3 = validatedData.field3 || null;
// ... tüm alanlar

const updatedItem = await tenantPrisma.modelName.update({
  where: { id },
  data: updateData,
});
```

## Yaygın Hatalar

### 1. Date Dönüşümü Eksik

```typescript
// ❌ YANLIŞ
deliveryDate: validatedData.deliveryDate || null,

// ✅ DOĞRU
deliveryDate: validatedData.deliveryDate 
  ? new Date(validatedData.deliveryDate) 
  : null,
```

### 2. Schema'da z.date() Kullanımı

```typescript
// ❌ YANLIŞ - String gelirse hata verir
deliveryDate: z.date().optional().nullable(),

// ✅ DOĞRU - Otomatik dönüşüm yapar
deliveryDate: z.coerce.date().optional().nullable(),
```

### 3. GET Response'da Date Dönüşümü Eksik

```typescript
// ❌ YANLIŞ
return successResponse({
  item: {
    ...item,
    deliveryDate: item.deliveryDate, // Date objesi
  },
});

// ✅ DOĞRU
return successResponse({
  item: {
    ...item,
    deliveryDate: item.deliveryDate?.toISOString() || null,
  },
});
```

### 4. Eksik Alanlar

```typescript
// ❌ YANLIŞ - Schema'da var ama API'de yok
const schema = z.object({
  field1: z.string(),
  field2: z.string(), // API'de kullanılmıyor!
});

// ✅ DOĞRU - Tüm alanlar kullanılıyor
const newItem = await tenantPrisma.modelName.create({
  data: {
    field1: validatedData.field1,
    field2: validatedData.field2, // Kullanılıyor
  },
});
```

## Validation Checklist

Her yeni API route veya schema değişikliğinde:

- [ ] `npm run validate:api-schema` çalıştırıldı
- [ ] Date alanları `z.coerce.date()` kullanıyor
- [ ] Create/Update'te date'ler `new Date()` ile dönüştürülüyor
- [ ] GET response'larda date'ler `.toISOString()` ile çevriliyor
- [ ] Schema'daki tüm alanlar create/update'te kullanılıyor
- [ ] Opsiyonel alanlar için `|| null` kullanılıyor
- [ ] Linter hataları yok

## CI/CD Entegrasyonu

Validation script'ini CI/CD pipeline'ına ekleyin:

```yaml
# .github/workflows/ci.yml
- name: Validate API Schema Consistency
  run: npm run validate:api-schema
```

## İlgili Dosyalar

- `scripts/validate-api-schema-consistency.js` - Validation script
- `scripts/validate-company-tenant-ids.js` - Company/Tenant ID validation
- `docs/api-schema-validation.md` - Bu dokümantasyon

## Düzenli Kontroller

- Her yeni API route eklemeden önce
- Her schema değişikliğinden sonra
- Her major release öncesi
- Her migration öncesi

















