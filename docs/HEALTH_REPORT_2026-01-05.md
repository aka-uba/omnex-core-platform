# OMNEX CORE PLATFORM - KAPSAMLI SAĞLIK RAPORU

**Tarih:** 5 Ocak 2026
**Proje:** C:\xampp\htdocs\omnex-core-platform
**Versiyon:** 1.0.9
**Toplam Dosya:** 1355 TypeScript/TSX

---

## GENEL DURUM ÖZETİ

| Kategori | Durum | Puan |
|----------|-------|------|
| TypeScript | Temiz | 10/10 |
| ESLint | Temiz | 10/10 |
| npm Güvenlik | 0 Zafiyet | 10/10 |
| Prisma Şemalar | Valid | 10/10 |
| **Güvenlik** | Kritik Sorunlar | 3/10 |
| **Performans** | İyileştirme Gerek | 5/10 |
| **Kod Kalitesi** | Orta | 6/10 |

---

## 1. KRİTİK GÜVENLİK SORUNLARI

### 1.1 SQL Injection Riski

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `src/lib/services/databaseService.ts` | 43-49 | `$queryRawUnsafe` + string interpolation |
| `src/app/api/setup/reset-database/route.ts` | 30, 51 | DROP TABLE/SEQUENCE + string interpolation |

### 1.2 Command Injection Riski

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `src/app/api/setup/db-push/route.ts` | 24-25 | `execAsync()` body'den URL alıyor |
| `src/lib/services/backupService.ts` | 152-154 | `pg_dump` URL injection |
| `src/lib/services/tenantService.ts` | 159-163 | `execSync` shell command |

### 1.3 Hardcoded Credentials

| Dosya | Sorun |
|-------|-------|
| `.env.production` | Production şifreleri repo'da |
| `.env.production.bak-server` | Eski sunucu şifreleri |
| `src/app/api/setup/server-control/route.ts:8` | Fallback token: `omnex-admin-2025` |

### 1.4 Setup Page Açık

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `src/middleware.ts` | 34-36 | `/setup` bypass - auth yok |
| `src/app/api/setup/check-access/route.ts` | 45 | Dev modda kontrol yok |

### 1.5 CSRF Koruması Eksik

- Tüm API routes'da CSRF token kontrolü yok
- State-changing operations korumasız

### 1.6 Auth Kontrolü Eksik API'ler

| Dosya | Endpoint |
|-------|----------|
| `src/app/api/modules/route.ts` | GET /api/modules - açık |
| `src/app/api/test/directory-structure/route.ts` | Sistem yapısını döndürüyor |

---

## 2. PERFORMANS SORUNLARI

### 2.1 N+1 Query Problemleri

| Dosya | Sorun | Impact |
|-------|-------|--------|
| `src/app/api/real-estate/staff/[id]/performance/route.ts:184-239` | 12 ay loop = 24-48 DB sorgusu | +2-4 sn response |
| `src/app/api/dashboard/summary/route.ts` | 8+ sorgu, SELECT *, no cache | Her istekte full compute |
| `src/app/api/accounting/analytics/route.ts` | 8 sıralı aggregate | N×latency |

### 2.2 Cache Eksikliği

- `force-dynamic` kullanımı yaygın
- HTTP cache headers yok
- Dashboard her istekte tüm sorguları çalıştırıyor

### 2.3 SELECT * Kullanımı

- Dashboard API'de tüm alanlar çekiliyor
- Sadece ID/status yeterli olan yerlerde full entity

### 2.4 Çözüm Önerileri

```typescript
// 1. Tek sorguda tüm veri
const allPayments = await prisma.payment.findMany({
  where: { dueDate: { gte: dayjs().subtract(12, 'months').toDate() } },
  select: { id: true, amount: true, status: true, dueDate: true },
});

// 2. Cache ekle
export const revalidate = 300; // 5 dakika
```

---

## 3. KOD KALİTESİ SORUNLARI

### 3.1 Type Safety

| Sorun | Sayı |
|-------|------|
| `any` type kullanımı | 417 |
| `catch (error: any)` | 130 dosya |
| Type assertion (`as any`) | 50+ |

### 3.2 i18n İhlalleri

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `src/app/[locale]/login/demo/page.tsx` | 16-82 | 10+ hardcoded Türkçe metin |

### 3.3 Debug Log'lar (Üretimde Kalmamalı)

| Dosya | Satır |
|-------|-------|
| `src/modules/file-manager/components/FilePreviewModal.tsx` | 69 |
| `src/app/[locale]/modules/real-estate/staff/[id]/StaffDetailPageClient.tsx` | 63 |

### 3.4 DataTable Kullanımı Eksik

- Maintenance modülü: Tüm listeler
- Production modülü: Tüm listeler
- Real-Estate: Properties, Tenants, Leases listeleri

---

## 4. İYİ DURUMDA OLAN ALANLAR

| Alan | Durum |
|------|-------|
| TypeScript derleme | 0 hata |
| npm paket güvenliği | 0 zafiyet |
| Prisma şema validasyon | Valid |
| Core sistemler | Dokunulmamış |
| Event listener cleanup | Mevcut |
| useMemo/useCallback | Kritik yerlerde var |
| Absolute imports | 200+ dosyada |
| AlertModal kullanımı | Doğru |

---

## 5. ÖNCELİKLİ EYLEM LİSTESİ

### DERHAL (Bu Hafta)

1. **Credentials Temizliği**
   - `.env.production*` dosyalarını repo'dan kaldır
   - `.gitignore`'a pattern ekle
   - Hardcoded token'ları kaldır

2. **SQL Injection Düzeltme**
   - `$queryRawUnsafe` → parametreli sorgu
   - String interpolation kaldır

3. **Setup Endpoint Güvenliği**
   - Production'da kapat veya auth ekle

### YAKINDA (2 Hafta)

4. **Performans - N+1 Düzeltme**
   - Loop içi sorguları tek sorguya çevir
   - Dashboard'a cache ekle

5. **Type Safety**
   - `catch (error: any)` → `catch (error: unknown)`
   - Kritik API'lerde `any` kaldır

### BACKLOG

6. **i18n Hardcoded Metinler**
   - Çevirilere taşı

7. **Console.log Temizliği**
   - Debug log'ları kaldır

8. **DataTable Standardizasyonu**
   - Eksik modüllere ekle

---

## 6. İSTATİSTİKLER

- **Toplam TS/TSX Dosya**: 1355
- **Toplam Sayfa**: 303
- **try-catch Bloğu**: 458
- **catch (error: any)**: 130
- **any Type Kullanımı**: 417
- **TODO/FIXME**: 89

---

## 7. İYİLEŞTİRME TAHMİNİ

| Düzeltme | Beklenen İyileşme |
|----------|-------------------|
| N+1 query düzeltme | %70-80 API hızlanması |
| Cache ekleme | %50 sunucu yükü azalma |
| Güvenlik düzeltmeleri | Kritik açıklar kapatılır |
| Type safety | Daha az runtime hata |

---

**Rapor Oluşturma:** Claude Code
**Analiz Tarihi:** 2026-01-05


---

## 8. UYGULANAN DUZELTMELER

Asagidaki sorunlar duzeltildi:

| Dosya | Duzeltme |
|-------|----------|
| **.gitignore** | .env dosya pattern'leri guncellendi |
| **server-control/route.ts** | Hardcoded fallback token kaldirildi |
| **databaseService.ts** | SQL injection: parametreli sorgu eklendi |
| **reset-database/route.ts** | SQL injection + TypeScript tipleri eklendi |
| **staff/[id]/performance/route.ts** | N+1 query duzeltildi (24 -> 2 sorgu), dayjs metotlari duzeltildi |
| **dashboard/summary/route.ts** | Cache eklendi (revalidate = 300) |
| **login/demo/page.tsx** | i18n cevirileri eklendi |
| **FilePreviewModal.tsx** | Debug console.log kaldirildi |
| **StaffDetailPageClient.tsx** | Debug console.log kaldirildi |

### Dogrulama

- TypeScript: 0 hata
- ESLint: 0 hata (duzeltilen dosyalarda)

**Duzeltme Tarihi:** 2026-01-05
