# Yan Gider (Nebenkosten) Sistemi

## Genel Bakış

Almanya'daki Nebenkostenabrechnung (yan gider hesaplaması) sistemine göre tasarlanmış, gayrimenkul yönetimi için kapsamlı yan gider takibi ve yıl sonu uzlaştırma modülü.

## Özellikler

### 1. Daire Seviyesi Kira Yapısı

**Dosya:** `src/modules/real-estate/components/ApartmentForm.tsx`

Almanya kira modeline uygun alanlar:
- **Kaltmiete (Soğuk Kira):** Temel kira tutarı
- **Nebenkosten (Yan Giderler):** Ortak giderler için tahmini aylık tutar
- **Heizkosten (Isıtma Giderleri):** Isıtma masrafları için tahmini tutar
- **Warmmiete (Sıcak Kira):** Otomatik hesaplanan toplam (coldRent + additionalCosts + heatingCosts)
- **Kaution (Depozito):** Güvence bedeli

```
Warmmiete = Kaltmiete + Nebenkosten + Heizkosten
```

### 2. Bina Giderleri Yönetimi

**Dosyalar:**
- `src/modules/real-estate/components/PropertyExpenseForm.tsx`
- `src/modules/real-estate/components/PropertyExpenseList.tsx`
- `src/app/api/real-estate/property-expenses/route.ts`

**Özellikler:**
- Gider ekleme/düzenleme/silme
- Kategori bazlı sınıflandırma
- Yıl ve ay bazlı filtreleme
- Toplam özet görüntüleme

**Gider Kategorileri:**
| Kategori | Açıklama |
|----------|----------|
| utilities | Elektrik/Su/Gaz |
| maintenance | Bakım |
| insurance | Sigorta |
| taxes | Vergiler |
| management | Yönetim Ücreti |
| cleaning | Temizlik |
| heating | Isıtma |
| other | Diğer |

### 3. Yıl Sonu Uzlaştırma (Nebenkostenabrechnung)

**Dosyalar:**
- `src/modules/real-estate/components/SideCostReconciliation.tsx`
- `src/modules/real-estate/services/sideCostCalculationService.ts`
- `src/app/api/real-estate/reconciliation/route.ts`

**Hesaplama Mantığı:**

```typescript
// Daire başı gerçek pay
actualShare = totalExpenses / apartmentCount  // eşit dağıtım
// veya
actualShare = (apartmentArea / totalArea) * totalExpenses  // metrekare bazlı

// Yıl boyunca ödenen tahmini
totalEstimatedPaid = monthlyAdditionalCosts * monthsOccupied

// Fark hesaplama
difference = actualShare - totalEstimatedPaid
// + değer = kiracı borçlu (az ödemiş)
// - değer = kiracı alacaklı (fazla ödemiş)
```

**Dağıtım Yöntemleri:**
- **Eşit Dağıtım:** Toplam gider / daire sayısı
- **Metrekare Bazlı:** Alan oranına göre dağıtım

**Uzlaştırma Durumları:**
| Durum | Açıklama |
|-------|----------|
| draft | Taslak |
| calculated | Hesaplandı |
| finalized | Kesinleştirildi |
| cancelled | İptal Edildi |

## Veritabanı Modelleri

### PropertyExpense

```prisma
model PropertyExpense {
  id                 String    @id @default(uuid())
  tenantId           String
  companyId          String
  propertyId         String
  name               String
  category           String    // utilities, maintenance, insurance, taxes, management, cleaning, heating, other
  amount             Decimal   @db.Decimal(12, 2)
  expenseDate        DateTime
  year               Int
  month              Int?
  description        String?
  receiptUrl         String?
  invoiceNumber      String?
  vendorName         String?
  isDistributed      Boolean   @default(false)
  distributionMethod String?
  distributedAt      DateTime?
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([tenantId, companyId])
  @@index([propertyId])
  @@index([year])
}
```

### SideCostReconciliation

```prisma
model SideCostReconciliation {
  id                 String    @id @default(uuid())
  tenantId           String
  companyId          String
  propertyId         String
  year               Int
  totalExpenses      Decimal   @db.Decimal(12, 2)
  apartmentCount     Int
  perApartmentShare  Decimal   @db.Decimal(12, 2)
  distributionMethod String
  fiscalYearStart    DateTime?
  fiscalYearEnd      DateTime?
  status             String    @default("draft")
  calculatedAt       DateTime?
  finalizedAt        DateTime?
  finalizedBy        String?
  details            Json      // ReconciliationApartmentDetail[]
  notes              String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([propertyId, year])
}
```

## API Endpoints

### Property Expenses

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/real-estate/property-expenses` | Gider listesi |
| POST | `/api/real-estate/property-expenses` | Yeni gider oluştur |
| GET | `/api/real-estate/property-expenses/[id]` | Tek gider getir |
| PUT | `/api/real-estate/property-expenses/[id]` | Gider güncelle |
| DELETE | `/api/real-estate/property-expenses/[id]` | Gider sil (soft delete) |

### Reconciliation

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/real-estate/reconciliation` | Uzlaştırma listesi |
| POST | `/api/real-estate/reconciliation` | Yeni uzlaştırma hesapla |
| GET | `/api/real-estate/reconciliation/[id]` | Tek uzlaştırma getir |
| PUT | `/api/real-estate/reconciliation/[id]` | Uzlaştırma güncelle/kesinleştir |
| DELETE | `/api/real-estate/reconciliation/[id]` | Uzlaştırma sil |

## React Hooks

```typescript
// Property Expenses
import {
  usePropertyExpenses,
  usePropertyExpense,
  useCreatePropertyExpense,
  useUpdatePropertyExpense,
  useDeletePropertyExpense
} from '@/hooks/usePropertyExpenses';

// Reconciliation
import {
  useReconciliations,
  useReconciliation,
  useCreateReconciliation,
  useUpdateReconciliation,
  useDeleteReconciliation,
  useFinalizeReconciliation
} from '@/hooks/useReconciliation';
```

## Sayfa Erişimi

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Gayrimenkul Detay | `/modules/real-estate/properties/[id]` | "Bina Giderleri" ve "Kira ve Yan Giderler" sekmeleri |
| Uzlaştırma | `/modules/real-estate/reconciliation` | Yıl sonu uzlaştırma yönetimi |

## Örnek Kullanım Senaryosu

1. **Daire Tanımlama:** Dairelere coldRent, additionalCosts, heatingCosts değerleri girilir
2. **Gider Girişi:** Yıl boyunca bina giderleri (elektrik, su, sigorta vb.) kaydedilir
3. **Uzlaştırma:** Yıl sonunda:
   - Toplam giderler hesaplanır
   - Dairelere dağıtılır (eşit veya m² bazlı)
   - Her kiracının ödediği tahmini ile karşılaştırılır
   - Borç/alacak belirlenir
4. **Kesinleştirme:** Uzlaştırma onaylanır, değiştirilemez hale gelir

## Çeviriler

Tüm metinler `src/locales/modules/real-estate/tr.json` ve `en.json` dosyalarında:
- `sideCosts.*` - Yan gider alanları
- `propertyExpenses.*` - Gider yönetimi
- `reconciliation.*` - Uzlaştırma

## Gelecek Geliştirmeler

- [ ] PDF rapor oluşturma
- [ ] E-posta ile kiracıya gönderme
- [ ] Muhasebe modülü entegrasyonu
- [ ] Özel dağıtım oranları (custom method)
- [ ] Çoklu yıl karşılaştırma
