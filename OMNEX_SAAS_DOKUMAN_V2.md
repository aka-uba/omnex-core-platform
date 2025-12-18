# Omnex SaaS Platform - Kapsamlı Dokümantasyon v2.0

**Versiyon**: 2.0.0  
**Son Güncelleme**: 2025-12-15  
**Platform Versiyonu**: 1.0.9

---

## 📋 İçindekiler

1. [Platform Genel Bakış](#1-platform-genel-bakış)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Mimari Yapı](#3-mimari-yapı)
4. [Multi-Tenant Sistemi](#4-multi-tenant-sistemi)
5. [Lisans Yönetim Sistemi](#5-lisans-yönetim-sistemi)
6. [Super Admin Panel](#6-super-admin-panel)
7. [Modül Sistemi](#7-modül-sistemi)
8. [API Dokümantasyonu](#8-api-dokümantasyonu)
9. [Veritabanı Sistemi](#9-veritabanı-sistemi)
10. [UI ve Tasarım Standartları](#10-ui-ve-tasarım-standartları)
   - [10.6. Icon Sistemi](#106-icon-sistemi)
11. [Güvenlik](#11-güvenlik)
12. [Deployment](#12-deployment)
13. [Geliştirme Rehberi](#13-geliştirme-rehberi)

---

## 1. Platform Genel Bakış

### 1.1. Platform Tanımı

**Omnex Core Platform**, çok kiracılı (multi-tenant), modüler SaaS platformudur. Ajansların birden fazla müşteri şirketini yönetebileceği, AI içerik üretebileceği ve finans yönetimi yapabileceği kapsamlı bir işletim sistemidir.

**Mimari Model**: Shared Codebase + Per-Tenant Database + Subdomain/Path Routing + Tenant Context

### 1.2. Temel Özellikler

- ✅ **Multi-Tenant Mimarisi**: Her tenant için ayrı PostgreSQL database
- ✅ **Modüler Yapı**: 22 aktif modül, YAML konfigürasyonu
- ✅ **RBAC**: Role-Based Access Control sistemi
- ✅ **i18n Desteği**: 4 dil (tr, en, de, ar) + RTL desteği
- ✅ **Merkezi Sistemler**: Layout, Modal, Table, Export, File Manager, AI, Notifications
- ✅ **Modern UI**: Mantine UI + Tailwind CSS + CSS Modules

### 1.3. Platform İstatistikleri

- **Toplam Modül**: 22
- **Tamamlanmış Modül**: 12
- **Geliştirme Aşamasında**: 10
- **API Endpoint**: 200+
- **Database Model**: 50+ Prisma model
- **i18n Key**: 2000+ translation key
- **React Component**: 300+

---

## 2. Teknoloji Yığını

### 2.1. Core Framework

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| Next.js | 16.0.3 | App Router, SSR, SSG |
| React | 19.2.0 | UI Framework |
| TypeScript | 5.x | Type Safety |

### 2.2. UI Kütüphaneleri

| Kütüphane | Versiyon | Kullanım |
|-----------|----------|----------|
| Mantine UI | 8.3.9 | Birincil UI bileşenleri |
| Tailwind CSS | 4 | Layout utilities |
| CSS Modules | - | Component animasyonları |
| @tabler/icons-react | 3.35.0 | Icon seti |

### 2.3. Veritabanı ve ORM

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| PostgreSQL | 14+ | Multi-tenant database |
| Prisma | 5.22.0 | Type-safe ORM |
| bcryptjs | 3.0.3 | Password hashing |

### 2.4. State ve Form Yönetimi

| Kütüphane | Versiyon | Kullanım |
|-----------|----------|----------|
| React Query | 5.90.10 | Server state yönetimi |
| React Hook Form | 7.66.1 | Form yönetimi |
| Zod | 4.1.12 | Schema validasyonu |

### 2.5. Uluslararasılaştırma

| Kütüphane | Versiyon | Kullanım |
|-----------|----------|----------|
| next-intl | 4.5.6 | i18n sistemi |

**Desteklenen Diller**: Türkçe (tr), İngilizce (en), Almanca (de), Arapça (ar)

---

## 3. Mimari Yapı

### 3.1. Multi-Tenant Mimarisi

**Mimari Model**: Per-Tenant Database

- **Core Database**: Tenant metadata, platform yönetimi
- **Tenant Databases**: Her tenant için ayrı PostgreSQL database
- **Yearly Rotation**: `tenant_{slug}_{year}` formatında yıllık database rotasyonu
- **Routing**: Production'da subdomain, dev/staging'de path-based

### 3.2. Layout Sistemi

**Layout Türleri**:
- **Sidebar Layout**: Sol tarafta daraltılabilir/genişletilebilir sidebar
- **Top Layout**: Üstte sticky header, horizontal menü
- **Mobile Layout**: Responsive mobil optimizasyonu

**Özellikler**:
- Hibrit veri yönetimi (LocalStorage + Database)
- Öncelik sistemi (User > Role > Company > Default)
- Instant apply (değişiklikler anında uygulanır)
- Debounced sync (performans optimizasyonu)

### 3.3. Merkezi Sistemler

#### Layout Provider
- `src/components/layouts/core/LayoutProvider.tsx`
- `src/components/layouts/core/LayoutConfig.ts`
- `src/components/layouts/core/LayoutResolver.ts`

#### Modal Sistemi
- `src/components/modals/AlertModal.tsx` - Merkezi onay/uyarı modal'ları

#### Tablo Sistemi
- `mantine-datatable` - Merkezi DataTable bileşeni
- Filtre, sıralama, sayfalama desteği
- Export özellikleri (CSV, Excel, PDF, Word, HTML, Print)

#### Export Sistemi
- CSV, Excel, PDF, Word, HTML, Print formatları
- Company settings entegrasyonu
- Template sistemi

#### Dosya Yönetimi
- Merkezi dosya yönetim sistemi
- Upload, download, share özellikleri
- Tenant bazlı izolasyon

#### AI Servisi
- Metin, kod, görsel, ses, video üretimi
- Chat ve analiz özellikleri
- Template sistemi
- Quota yönetimi

#### Bildirim Sistemi
- Toast notifications
- Notification bell
- Real-time bildirimler

#### Session Timeout Sistemi
- `SessionTimeoutProvider` - Otomatik oturum sonlandırma
- Güvenlik ayarlarından `sessionTimeout` değerini okur (varsayılan: 30 dakika)
- Kullanıcı aktivitesini izler (mouse, keyboard, scroll, click)
- Zaman aşımından 1 dakika önce uyarı modalı gösterilir
- Kullanıcı "Oturumu Uzat" veya "Çıkış Yap" seçebilir
- Zaman dolduğunda otomatik olarak login sayfasına yönlendirilir
- Login sayfasında "Oturum Sona Erdi" uyarısı gösterilir

**Çalışma Mantığı**:
1. Kullanıcı giriş yaptığında `/api/general-settings`'ten `sessionTimeout` değeri okunur
2. Kullanıcı aktivitesi (mouse, keyboard, scroll, click) izlenir
3. Aktivite olmazsa zamanlayıcı çalışır
4. Timeout - 1 dakika kaldığında uyarı modalı gösterilir
5. Kullanıcı "Oturumu Uzat"a tıklarsa zamanlayıcı sıfırlanır
6. Zaman dolarsa localStorage temizlenir ve login sayfasına yönlendirilir

**i18n Keys** (`global` namespace):
- `session.timeoutWarning.title` - Uyarı başlığı
- `session.timeoutWarning.message` - Uyarı mesajı
- `session.timeoutWarning.extend` - "Oturumu Uzat" butonu
- `session.timeoutWarning.logout` - "Çıkış Yap" butonu
- `session.expired.title` - Oturum sona erdi başlığı
- `session.expired.message` - Oturum sona erdi mesajı

### 3.4. Routing Sistemi

**URL Yapısı**: `/{locale}/{route}`

**Desteklenen Locale'ler**: `tr`, `en`, `de`, `ar`

**Route Yapısı**:
```
/[locale]/
  ├── /                    # Ana sayfa
  ├── /dashboard           # Dashboard
  ├── /modules             # Modül sayfaları
  │   ├── /ai              # AI modülü
  │   ├── /accounting      # Muhasebe modülü
  │   ├── /hr              # İnsan kaynakları
  │   └── /[other-modules] # Diğer modüller
  ├── /users               # Kullanıcı yönetimi
  ├── /settings            # Ayarlar
  └── /admin               # Admin paneli (SuperAdmin)
```

---

## 4. Multi-Tenant Sistemi

### 4.1. Veritabanı Yapısı

**Core Database** (`omnex_core`):
- Tenant metadata
- Agency bilgileri
- Module registry
- Audit logs
- Backup metadata
- System metrics
- **Lisans Yönetimi**: LicenseType, LicensePackage, TenantLicense, LicensePayment, LicenseUsageLog

**Tenant Databases** (`tenant_{slug}_{year}`):
- User management
- Company data
- Module-specific data
- Notifications
- Reports
- ExportTemplate (Export şablonları)
- Tüm tenant'a özel veriler

### 4.2. Tenant Oluşturma

**Script ile**:
```bash
npm run tenant:create -- --name="ACME Corp" --slug="acme" --subdomain="acme"
```

**API ile**:
```bash
POST /api/tenants
{
  "name": "ACME Corp",
  "slug": "acme",
  "subdomain": "acme",
  "agencyId": "agency-id" // optional
}
```

### 4.3. Yearly Database Rotation

Yeni yıl için database rotation:
```bash
npm run tenant:new-year -- --tenant=acme --year=2026
```

### 4.4. Export/Import

**Export**:
```bash
npm run tenant:export -- --tenant=acme --year=2025
```

**Import**:
```bash
npm run tenant:import -- --file=acme_2025.tar.gz --restore-db=tenant_acme_2025_restore
```

### 4.5. Dual Admin System

Her tenant'ta iki admin kullanıcısı:

1. **Super Admin**: `admin@omnexcore.com` (username: `superadmin`)
   - Tüm tenant'larda mevcut
   - Tüm izinlere sahip

2. **Tenant Admin**: `admin@{tenant-slug}.com` (username: `admin`)
   - Her tenant'ın kendi admin'i
   - Tenant bazlı yönetim

---

## 5. Lisans Yönetim Sistemi

### 5.1. Genel Bakış

Lisans yönetim sistemi, platform genelinde tenant'ların lisans, paket ve ödeme yönetimini sağlar. SuperAdmin rolü için tasarlanmıştır.

### 5.2. Veritabanı Modelleri

#### LicenseType (Lisans Türleri)

Lisans türlerini tanımlar (örn: Trial, Standard, Premium, Enterprise).

| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | String | Benzersiz isim (trial, standard, premium, enterprise) |
| `displayName` | String | Görünen isim |
| `maxUsers` | Int? | Maksimum kullanıcı sayısı |
| `maxStorage` | Int? | GB cinsinden maksimum depolama |
| `maxCompanies` | Int? | Firma limiti |
| `features` | String[] | Özellik listesi |
| `defaultDurationDays` | Int | Varsayılan süre (gün) |
| `trialDays` | Int | Ücretsiz deneme süresi |

#### LicensePackage (Lisans Paketleri)

Fiyatlandırma paketlerini tanımlar.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | String | Paket adı |
| `typeId` | String? | Lisans türü referansı |
| `modules` | String[] | Dahil modüller (slug listesi) |
| `basePrice` | Decimal | Temel fiyat |
| `currency` | String | Para birimi (TRY, USD, EUR) |
| `billingCycle` | String | Faturalama döngüsü (monthly, quarterly, yearly) |
| `discountPercent` | Decimal? | Yüzde indirim |

#### TenantLicense (Tenant Lisansları)

Tenant'lara atanan lisansları tanımlar.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `tenantId` | String | Tenant referansı |
| `packageId` | String | Paket referansı |
| `licenseKey` | String? | Benzersiz aktivasyon kodu |
| `startDate` | DateTime | Başlangıç tarihi |
| `endDate` | DateTime | Bitiş tarihi |
| `status` | String | Durum (trial, active, expired, suspended, cancelled) |
| `paymentStatus` | String | Ödeme durumu (pending, paid, failed, refunded) |
| `autoRenew` | Boolean | Otomatik yenileme |

#### LicensePayment (Ödeme Kayıtları)

Lisans ödemelerini takip eder.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `licenseId` | String | Lisans referansı |
| `amount` | Decimal | Tutar |
| `currency` | String | Para birimi |
| `paymentMethod` | String | Ödeme yöntemi |
| `status` | String | Durum (pending, approved, rejected, refunded) |
| `paymentDate` | DateTime | Ödeme tarihi |
| `invoiceNumber` | String? | Fatura numarası |

### 5.3. API Endpoints

#### Lisans Türleri
- `GET /api/admin/license-types` - Türleri listele
- `POST /api/admin/license-types` - Yeni tür oluştur
- `GET /api/admin/license-types/[id]` - Tür detayı
- `PUT /api/admin/license-types/[id]` - Tür güncelle
- `DELETE /api/admin/license-types/[id]` - Tür sil

#### Lisans Paketleri
- `GET /api/admin/licenses` - Paketleri listele
- `POST /api/admin/licenses` - Yeni paket oluştur
- `GET /api/admin/licenses/[id]` - Paket detayı
- `PUT /api/admin/licenses/[id]` - Paket güncelle
- `DELETE /api/admin/licenses/[id]` - Paket sil
- `GET /api/admin/licenses/stats` - Dashboard istatistikleri

#### Tenant Lisansları
- `GET /api/admin/tenant-licenses` - Tenant lisanslarını listele
- `POST /api/admin/tenant-licenses` - Lisans ata
- `GET /api/admin/tenant-licenses/[id]` - Lisans detayı
- `PUT /api/admin/tenant-licenses/[id]` - Lisans güncelle
- `DELETE /api/admin/tenant-licenses/[id]` - Lisans iptal

#### Ödemeler
- `GET /api/admin/license-payments` - Ödemeleri listele
- `POST /api/admin/license-payments/[id]/approve` - Ödeme onayla
- `POST /api/admin/license-payments/[id]/reject` - Ödeme reddet

#### Bildirimler
- `GET /api/admin/license-notifications/check` - Süresi dolacak lisansları kontrol et

### 5.4. Sayfa Yapısı

```
/[locale]/admin/licenses/
├── page.tsx                        # Ana sayfa (redirect)
├── dashboard/
│   ├── page.tsx                    # Dashboard - istatistikler, grafikler
│   └── LicenseDashboardSkeleton.tsx
├── packages/
│   ├── page.tsx                    # Paket listesi
│   └── LicensePackagesSkeleton.tsx
├── types/
│   ├── page.tsx                    # Tür listesi
│   ├── create/page.tsx             # Yeni tür oluştur
│   └── LicenseTypesSkeleton.tsx
├── tenants/
│   ├── page.tsx                    # Firma lisansları
│   └── TenantLicensesSkeleton.tsx
├── payments/
│   ├── page.tsx                    # Ödeme takibi
│   └── LicensePaymentsSkeleton.tsx
├── create/
│   ├── page.tsx                    # Yeni paket oluştur
│   └── LicensePackageFormPageClient.tsx
└── [id]/
    ├── page.tsx                    # Paket detayı
    ├── edit/page.tsx               # Paket düzenle
    └── LicensePackageDetailPageClient.tsx
```

### 5.5. Dashboard İstatistikleri

License Dashboard şu istatistikleri gösterir:

- **Toplam Lisans Türleri**: Tanımlanmış lisans türü sayısı
- **Toplam Paketler**: Aktif paket sayısı
- **Aktif Lisanslar**: Aktif durumdaki tenant lisansları
- **Bekleyen Ödemeler**: Onay bekleyen ödeme sayısı
- **Deneme Lisansları**: Trial durumundaki lisanslar
- **Süresi Dolmuş**: Expired durumundaki lisanslar
- **Bu Ay Dolacaklar**: 30 gün içinde süresi dolacak lisanslar

---

## 6. Super Admin Panel

### 6.1. Menü Yapısı

Super Admin için varsayılan menüler:

#### 1. Merkezi Sistemler
- AI Servisi (`/admin/core-systems/ai`)
- Bildirimler (`/admin/core-systems/notifications`)

#### 2. Sistem Yönetimi
- Sistem Durumu (`/admin/system`) - CPU, Memory, Disk kullanımı
- Yedekleme (`/admin/backups`)
- Sistem Logları (`/admin/logs`)

#### 3. Tenant Yönetimi
- Tenant Listesi (`/admin/tenants`)
- Veritabanı Yönetimi (`/admin/tenants/database`)

#### 4. Optimizasyon
- Performans (`/admin/optimization/performance`)
- Cache Yönetimi (`/admin/optimization/cache`)
- Veritabanı Bakımı (`/admin/optimization/database`)

#### 5. Lisans Yönetimi
- Lisans Paneli (`/admin/licenses/dashboard`)
- Lisans Paketleri (`/admin/licenses/packages`)
- Lisans Türleri (`/admin/licenses/types`)
- Firma Lisansları (`/admin/licenses/tenants`)
- Ödeme Takibi (`/admin/licenses/payments`)

#### 6. Modül Yönetimi
- Modül Listesi (`/modules`)
- Yeni Modül Yükle (`/modules/upload`)

### 6.2. Sistem Durumu Sayfası

`/admin/system` sayfası gerçek zamanlı sistem metriklerini gösterir:

- **CPU Kullanımı**: Yüzde ve çekirdek sayısı
- **Bellek Kullanımı**: Kullanılan/Toplam GB
- **Disk Kullanımı**: Yüzde
- **Sunucu Bilgileri**: Hostname, Platform, Uptime, Node sürümü

---

## 7. Modül Sistemi

### 7.1. Modül Yapısı

Her modül aşağıdaki yapıya sahiptir:

```
src/modules/[module-name]/
  ├── module.config.yaml    # Modül konfigürasyonu
  ├── version.txt           # Versiyon geçmişi
  ├── components/           # Modül bileşenleri
  ├── schemas/              # Zod schema'ları
  ├── services/             # Servis katmanı
  ├── types/                # TypeScript tip tanımları
  └── widgets/             # Widget'lar (opsiyonel)
```

### 7.2. Modül Konfigürasyonu

**module.config.yaml** formatı:
```yaml
name: "Modül Adı"
slug: "module-slug"
version: "1.0.0"
description: "Modül açıklaması"
icon: "IconName"
category: "business"
menu:
  label: "Modül Adı"
  href: "/modules/module-slug"
  icon: "IconName"
  order: 10
settings:
  - key: "setting_key"
    type: "boolean"
    label: "Ayar Etiketi"
    default: true
```

### 7.3. Modül Listesi

#### Core Modüller (3)
1. **dashboard** ✅ - KPI istatistikleri ve analytics
2. **ai** ✅ - AI içerik üretimi (text, image, code, audio, video)
3. **module-management** ✅ - Modül yönetim sistemi

#### İş Modülleri (16)
4. **accounting** ✅ - Muhasebe ve finans yönetimi
5. **maintenance** ✅ - Bakım ve ekipman yönetimi
6. **hr** ✅ - İnsan kaynakları yönetimi
7. **license** ✅ - Lisans yönetim sistemi
8. **production** ✅ - Üretim planlama ve takibi
9. **real-estate** ✅ - Emlak yönetimi
10. **sohbet** ✅ - Mesajlaşma sistemi
11. **web-builder** ✅ - Drag & drop website builder
12. **belgeler-ve-imza** - Doküman ve dijital imza
13. **calendar** ✅ - Takvim ve olay yönetimi
14. **egitim** - Eğitim içerikleri
15. **musteri** - Müşteri ilişkileri
16. **randevu** - Randevu takvimi
17. **tedarikci** - Tedarikçi yönetimi
18. **urun** - Ürün kataloğu
19. **vardiya** - Vardiya planlama

#### Yardımcı Modüller (3)
20. **file-manager** ✅ - Dosya yönetim sistemi
21. **notifications** ✅ - Bildirim sistemi
22. **raporlar** ✅ - Raporlama sistemi

**Not**: ✅ işareti tamamlanmış modülleri gösterir.

### 7.4. Modül Ayarları Sistemi

Her modül için 3 ana tab:

1. **Summary Tab**: Modül bilgileri, versiyon geçmişi
2. **Settings Tab**: Modül ayarları (boolean, text, number, select, color)
3. **Menu Tab**: Menü yapılandırması (drag & drop sıralama)

**API Endpoints**:
- `GET /api/modules/[slug]/version-history` - Versiyon geçmişi
- `GET /api/modules/[slug]/settings` - Ayarlar yapılandırması
- `POST /api/modules/[slug]/settings` - Ayarları kaydet
- `GET /api/modules/[slug]/menu` - Menü yapılandırması
- `POST /api/modules/[slug]/menu` - Menü yapılandırmasını kaydet

### 7.5. Modüler Demo Seeder Sistemi

Her modül için bağımsız demo veri yükleme ve kaldırma:

**Özellikler**:
- Demo veriler `[DEMO]` prefix ile işaretlenir
- Gerçek veriler etkilenmeden demo veriler kaldırılabilir
- Bağımlılık yönetimi otomatik yapılır

**API Endpoints**:
- `GET /api/modules/[slug]/demo-data` - Demo veri durumunu kontrol eder
- `POST /api/modules/[slug]/demo-data` - Demo veri yükler
- `DELETE /api/modules/[slug]/demo-data` - Demo veriyi siler

---

## 8. API Dokümantasyonu

### 8.1. Base URL ve Authentication

**Base URL**: `https://your-domain.com/api`

**Authentication**: JWT Token
- Access Token: 7 gün geçerli
- Refresh Token: 30 gün geçerli
- HTTP-only cookies kullanılır

### 8.2. Standart Response Formatı

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": { ... }
  }
}
```

### 8.3. Authentication API

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `POST /api/auth/refresh` - Token yenileme

### 8.4. Modül API

- `GET /api/modules` - Modül listesi
- `POST /api/modules/upload` - Modül yükleme
- `POST /api/modules/[slug]/activate` - Aktifleştirme
- `POST /api/modules/[slug]/deactivate` - Pasifleştirme
- `DELETE /api/modules/[slug]/uninstall` - Kaldırma

### 8.5. Kullanıcı API

- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Kullanıcı oluşturma
- `GET /api/users/[id]` - Kullanıcı detayı
- `PATCH /api/users/[id]` - Kullanıcı güncelleme
- `DELETE /api/users/[id]` - Kullanıcı silme

### 8.6. Tenant API

- `GET /api/tenants` - Tenant listesi
- `POST /api/tenants` - Tenant oluşturma
- `GET /api/tenants/[id]` - Tenant detayı
- `POST /api/tenants/[id]/export` - Export
- `POST /api/tenants/[id]/import` - Import
- `POST /api/tenants/[id]/rotate` - Yearly DB rotation

### 8.7. Merkezi Sistem API'leri

**Dosya Yönetimi**:
- `GET /api/core-files` - Dosya listesi
- `POST /api/core-files` - Dosya yükleme
- `GET /api/core-files/[id]` - Dosya detayı
- `DELETE /api/core-files/[id]` - Dosya silme
- `GET /api/core-files/[id]/download` - Dosya indirme
- `POST /api/core-files/[id]/share` - Dosya paylaşımı

**AI Servisi**:
- `POST /api/core-ai/generate` - AI metin üretimi
- `POST /api/core-ai/chat` - AI chat
- `POST /api/core-ai/analyze` - AI veri analizi
- `GET /api/core-ai/models` - AI modelleri listesi
- `GET /api/core-ai/quota` - Quota kontrolü
- `GET /api/core-ai/templates` - Template listesi
- `POST /api/core-ai/templates` - Template oluşturma

### 8.8. Modül Özel API'leri

**Muhasebe Modülü**:
- `GET /api/accounting/invoices` - Fatura listesi
- `POST /api/accounting/invoices` - Fatura oluşturma
- `GET /api/accounting/expenses` - Gider listesi
- `GET /api/accounting/analytics` - Analitik

**Üretim Modülü**:
- `GET /api/production/products` - Ürün listesi
- `GET /api/production/bom` - BOM listesi
- `GET /api/production/orders` - Sipariş listesi
- `GET /api/production/analytics` - Analitik

**Emlak Modülü**:
- `GET /api/real-estate/properties` - Emlak listesi
- `POST /api/real-estate/properties` - Emlak oluşturma
- `GET /api/real-estate/apartments` - Daire listesi
- `GET /api/real-estate/contracts` - Sözleşme listesi

### 8.9. Sistem Yönetimi API (SuperAdmin)

- `GET /api/admin/audit-logs` - Audit log listesi
- `GET /api/admin/backups` - Yedek listesi
- `POST /api/admin/backups` - Yedek oluşturma
- `POST /api/admin/backups/[id]/restore` - Geri yükleme
- `GET /api/admin/system/info` - Sistem bilgileri
- `GET /api/admin/system/metrics` - Sistem metrikleri

### 8.10. Lisans Yönetimi API (SuperAdmin)

**Lisans Türleri**:
- `GET /api/admin/license-types` - Türleri listele
- `POST /api/admin/license-types` - Yeni tür oluştur
- `GET /api/admin/license-types/[id]` - Tür detayı
- `PUT /api/admin/license-types/[id]` - Tür güncelle
- `DELETE /api/admin/license-types/[id]` - Tür sil

**Lisans Paketleri**:
- `GET /api/admin/licenses` - Paketleri listele
- `POST /api/admin/licenses` - Yeni paket oluştur
- `GET /api/admin/licenses/[id]` - Paket detayı
- `PUT /api/admin/licenses/[id]` - Paket güncelle
- `DELETE /api/admin/licenses/[id]` - Paket sil
- `GET /api/admin/licenses/stats` - Dashboard istatistikleri

**Tenant Lisansları**:
- `GET /api/admin/tenant-licenses` - Tenant lisanslarını listele
- `POST /api/admin/tenant-licenses` - Lisans ata
- `GET /api/admin/tenant-licenses/[id]` - Lisans detayı
- `PUT /api/admin/tenant-licenses/[id]` - Lisans güncelle
- `DELETE /api/admin/tenant-licenses/[id]` - Lisans iptal

**Ödemeler**:
- `GET /api/admin/license-payments` - Ödemeleri listele
- `POST /api/admin/license-payments/[id]/approve` - Ödeme onayla
- `POST /api/admin/license-payments/[id]/reject` - Ödeme reddet

**Bildirimler**:
- `GET /api/admin/license-notifications/check` - Süresi dolacak lisansları kontrol et

### 8.11. Export Templates API

- `GET /api/export-templates` - Şablonları listele
- `POST /api/export-templates` - Yeni şablon oluştur
- `GET /api/export-templates/[id]` - Şablon detayı
- `PATCH /api/export-templates/[id]` - Şablon güncelle
- `DELETE /api/export-templates/[id]` - Şablon sil
- `POST /api/export-templates/[id]/set-default` - Varsayılan yap
- `GET /api/export-templates/[id]/preview` - Önizleme
- `GET /api/export-templates/[id]/export` - Dışa aktar
- `POST /api/export-templates/seed` - Demo şablonlar oluştur

### 8.12. Rate Limiting

- **Global**: 100 requests / 15 minutes per IP
- **Auth Endpoints**: 10 requests / 15 minutes
- Configurable via environment variables

---

## 9. Veritabanı Sistemi

### 9.1. Prisma ORM

**Dual Schema System**:
- `prisma/core.schema.prisma`: Core database (tenant metadata, agency, modules)
- `prisma/tenant.schema.prisma`: Tenant database (user, company, notifications, reports)

**Migration Komutları**:
```bash
# Core DB migration (development)
CORE_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/core.schema.prisma

# Core DB migration (production)
CORE_DATABASE_URL="..." npx prisma migrate deploy --schema=prisma/core.schema.prisma

# Tenant DB migration (sadece deploy, asla dev kullanmayın!)
TENANT_DATABASE_URL="..." npx prisma migrate deploy --schema=prisma/tenant.schema.prisma
```

**⚠️ KRİTİK**: Asla tenant DB üzerinde `prisma migrate dev` çalıştırmayın!

### 9.2. Veritabanı Kurulum Sihirbazı

**Konum**: `/setup` veya `/{locale}/setup`

**9 Adımlı Kurulum Süreci**:
1. Veritabanı Bağlantısı - Veritabanı bağlantılarını test eder
2. Veritabanları Oluştur - Core ve tenant veritabanlarını oluşturur
3. Schema Birleştirme - Modüler şemaları birleştirir
4. Schema Doğrulama - Schema bütünlüğünü doğrular
5. Veritabanı Uygulama - Şemayı veritabanlarına uygular
6. Client Oluştur - Prisma client'larını oluşturur
7. Core Seed - Core veritabanını doldurur
8. Tenant Seed - Tenant veritabanını doldurur
9. Demo Seed - Demo verilerini ekler (modüler sistem)

**Production Güvenliği**:
- Production ortamında setup sayfası **varsayılan olarak devre dışıdır**
- `ALLOW_SETUP_PAGE=true` environment variable ile aktifleştirilebilir

### 9.3. Cache ve Index Stratejisi

**Cache Layer Konumu**:
```
Controller
  └── Service
      └── ✅ Cache Layer (Prisma'nın üzerinde)
          └── Prisma
              └── Database
```

**TTL Değerleri**:
- `tenant`: 5m
- `user`: 5m
- `list`: 1m
- `detail`: 5m
- `count`: 1m
- `static`: 1h
- `report`: 15m

**Index Stratejisi**:
- Temel Index: `@@index([tenantId, companyId])`
- Status Index: `@@index([tenantId, companyId, status])`
- Tarih Index: `@@index([tenantId, companyId, createdAt])`
- Kategori Index: `@@index([tenantId, companyId, category])`

**⚠️ ÖNEMLİ**: TenantId içermeyen index KABUL EDİLMEZ

---

## 10. UI ve Tasarım Standartları

### 10.1. Stil Stratejisi

**Mantine UI**: Birincil stil sistemi (component visuals için)
**Tailwind CSS**: Sadece layout utilities ve responsive grid
**CSS Modules**: Component bazlı animasyonlar ve karmaşık selector'lar
**Design Tokens**: CSS custom properties (`src/styles/_tokens.css`)

### 10.2. Container ve Spacing Kuralları

**Container Kuralı**: Tüm sayfalarda `Container` component'i `pt="xl"` prop'u ile kullanılmalıdır.

**Paper Styling**:
- `shadow="xs"` - Varsayılan gölge
- `p="md"` - Varsayılan padding
- `mt="md"` - Varsayılan margin-top

**Tabs Kullanımı**:
- `variant="default"` - Varsayılan variant
- `orientation="horizontal"` - Varsayılan yönlendirme

### 10.3. Dark Mode Desteği

Tüm component'ler dark mode'u desteklemelidir:
- CSS variables `[data-mantine-color-scheme="dark"]` selector'ü ile override edilir
- Mantine theme otomatik olarak dark mode'u yönetir
- Component'lerde manuel dark mode kontrolü gerekmez

### 10.4. Responsive Tasarım

- Mobile-first yaklaşım
- Breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Tailwind responsive utilities kullanılır

### 10.5. RTL Desteği

Arapça (`ar`) için otomatik RTL yönlendirme:
- Mantine `DirectionProvider` kullanılır
- Tüm UI bileşenleri RTL uyumludur

### 10.6. Icon Sistemi

**Tabler Icons**: Platform'da ikonlar için Tabler Icons kütüphanesi kullanılmaktadır (`@tabler/icons-react` v3.35.0).

#### ModuleIcon Bileşeni

Modül ikonlarını render eden bileşen:

```tsx
import { ModuleIcon } from '@/lib/modules/icon-loader';

<ModuleIcon icon="Building" size={24} />
<ModuleIcon icon="Dashboard" size={32} />
```

**Özellikler**:
- `icon`: String olarak ikon adı (örn: "Building", "Dashboard", "Apps")
- `size`: İkon boyutu (piksel)
- `fallback`: İkon bulunamazsa gösterilecek alternatif (opsiyonel)

**Desteklenen Format**:
- `"Building"` → `IconBuilding`
- `"IconBuilding"` → `IconBuilding`
- `"building"` → `IconBuilding` (case-insensitive)

#### IconPicker Bileşeni

Kullanıcının 5000+ Tabler ikonundan seçim yapmasını sağlayan modal bileşen:

```tsx
import { IconPicker } from '@/components/common/IconPicker';

<IconPicker
  value={selectedIcon}
  onChange={(iconName) => setSelectedIcon(iconName)}
  opened={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Özellikler**:
- Kategorilere göre filtreleme (Navigation, Communication, Business, vb.)
- Arama özelliği
- Popüler ikonlar öncelikli sıralama
- ForwardRef component desteği (Tabler v3+)

#### IconPickerButton Bileşeni

IconPicker'ı tetikleyen buton bileşeni:

```tsx
import { IconPickerButton } from '@/components/common/IconPicker';

<IconPickerButton
  value={icon}
  onChange={setIcon}
  label="İkon Seç"
  placeholder="İkon seçin..."
/>
```

#### Modül İkon Yönetimi

**module.config.yaml İkon Tanımı**:
```yaml
name: Real Estate
slug: real-estate
version: 1.0.0
icon: Building              # Tabler icon adı
# veya
icon: /uploads/modules/real-estate/custom-icon.png  # Özel dosya yolu
```

**API Endpoints**:
- `PUT /api/modules/[slug]/icon` - Modül ikonunu günceller (Tabler icon adı)
- `POST /api/modules/[slug]/icon` - Özel ikon dosyası yükler (PNG, JPG, SVG, WebP, max 2MB)

**Event Sistemi**:
- `modules-updated` event: Modül ikonu değiştiğinde tetiklenir
- `menu-updated` event: Menü değiştiğinde sidebar'ı güncellemek için

#### Menü Öğelerinde İkon Kullanımı

`useMenuItems` hook'u string ikon adlarını React component'lerine map eder:

```typescript
{
  label: "Dashboard",
  href: "/dashboard",
  icon: "Dashboard",  // String olarak
  order: 1
}
```

**Detaylı Dokümantasyon**: `docs/icon-system.md`

---

## 11. Güvenlik

### 11.1. Authentication & Authorization

**JWT Token System**:
- Access tokens: 7 gün geçerli
- Refresh tokens: 30 gün geçerli
- HTTP-only cookies kullanılır

**Password Policy**:
- Minimum 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- Özel karakterler önerilir

**RBAC**:
- **SuperAdmin**: Tüm izinlere sahip (`*` wildcard)
- **AgencyUser**: Modül erişimi ve common actions
- **ClientUser**: Sınırlı modül erişimi, read-only

### 11.2. Data Protection

**Encryption**:
- At Rest: PostgreSQL native encryption, AES-256 (files)
- In Transit: HTTPS/TLS 1.3

**Multi-Tenant Isolation**:
- Separate database per tenant
- No cross-tenant queries
- Tenant context validation on every request

### 11.3. API Security

**Rate Limiting**:
- Global: 100 requests/15min per IP
- Auth endpoints: 10 requests/15min

**Input Validation**:
- Zod schema validation
- SQL injection prevention (Prisma ORM)
- XSS protection (Next.js built-in)
- CSRF protection

### 11.4. Audit & Compliance

**Audit Logging**:
- User authentication (login/logout)
- Permission changes
- Data modifications
- Failed access attempts

**Log Retention**: 90 gün minimum

**GDPR/KVKK Compliance**:
- Right to access
- Right to deletion
- Right to portability
- Right to rectification

---

## 12. Deployment

### 12.1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Domain with SSL certificate
- Minimum 2GB RAM, 2 CPU cores

### 12.2. Environment Setup

```env
# Production Database
CORE_DATABASE_URL="postgresql://user:pass@prod-db:5432/omnex_core"

# Security (MUST be unique and strong)
JWT_SECRET="[64-char-random-string]"
JWT_REFRESH_SECRET="[64-char-random-string]"
SESSION_SECRET="[64-char-random-string]"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 12.3. Database Setup

```bash
npm run db:create
npx prisma migrate deploy --schema=prisma/core.schema.prisma
npm run db:seed:core
npm run tenant:create -- --name="Production" --slug="prod"
```

### 12.4. Build and Deploy

```bash
npm ci --production=false
npm run build
npm start
```

### 12.5. Process Management (PM2)

```bash
npm install -g pm2
pm2 start npm --name "omnex-core" -- start
pm2 save
pm2 startup
```

### 12.6. Backup Strategy

- Günlük otomatik yedekleme
- Disaster recovery planı
- Veritabanı ve dosya yedekleme

### 12.7. Security Checklist

- [ ] Strong JWT secrets configured
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Database backups automated
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Audit logging enabled

---

## 13. Geliştirme Rehberi

### 13.1. Hızlı Başlangıç

**Otomatik Script**:
```bash
npm run db:create
```

**Manuel Yöntemler**:
- pgAdmin ile (GUI)
- psql komut satırı ile

**Sonraki Adımlar**:
1. Bağlantıyı test et (`npm run db:check`)
2. Migration çalıştır
3. Seed çalıştır (opsiyonel)
4. İlk tenant'ı oluştur

### 13.2. API Schema Validation Standartları

**Date Alanları İşleme**:
```typescript
// ✅ DOĞRU
export const schema = z.object({
  lastRenovationDate: z.coerce.date().optional().nullable(),
});

// ❌ YANLIŞ
deliveryDate: z.date().optional().nullable(), // String gelirse hata verir
```

**Validation Script**:
```bash
npm run validate:api-schema
```

### 13.3. Company/Tenant ID Validation

**Helper Fonksiyonlar**:
```typescript
import { requireCompanyId } from '@/lib/api/companyContext';

const companyId = await requireCompanyId(request, tenantPrisma);
```

**Validation Script**:
```bash
npm run validate:company-tenant-ids
```

### 13.4. Type Error Resolution Sistemi

**Otomatik Düzeltmeler**:
```bash
npm run type:fix:auto
```

**Type Snapshot**:
```bash
npm run type:snapshot
npm run type:snapshot:compare
```

**Type Break Scanner**:
```bash
npm run type:scan
```

### 13.5. Geliştirme Komutları

```bash
# Development
npm run dev

# Type checking
npm run typecheck
npm run typewatch

# Build
npm run build

# Database
npm run db:generate
npm run db:migrate
npm run db:seed

# Tenant management
npm run tenant:create
npm run tenant:list
npm run tenant:delete
```

---

## 14. Hook'lar ve Yardımcı Fonksiyonlar

### 14.1. React Query Hooks

**useUsers Hook**:
```typescript
const { data, isLoading } = useUsers({ page: 1, pageSize: 10, search: 'john' });
const { data: user } = useUser(userId);
const createUser = useCreateUser();
const updateUser = useUpdateUser();
const deleteUser = useDeleteUser();
```

**useRoles Hook**:
```typescript
const { data } = useRoles({ page: 1, search: 'admin' });
const { data: role } = useRole(roleId);
const createRole = useCreateRole();
const updateRole = useUpdateRole();
const deleteRole = useDeleteRole();
```

**usePermissions Hook**:
```typescript
const { data } = usePermissions({ category: 'Client Management' });
const createPermission = useCreatePermission();
const updatePermission = useUpdatePermission();
const deletePermission = useDeletePermission();
```

**useNotifications Hook**:
```typescript
const { data } = useNotifications(filters);
const { data: notification } = useNotification(notificationId);
const createNotification = useCreateNotification();
const archiveNotification = useArchiveNotification();
```

### 14.2. Merkezi Sistem Hooks

**useCoreFileManager Hook**:
```typescript
const { data: files, isLoading } = useFiles({ module: 'accounting', entityType: 'invoice' });
const uploadFile = useUploadFile();
const deleteFile = useDeleteFile();
const shareFile = useShareFile();
```

**useAIGenerate Hook**:
```typescript
const generate = useAIGenerate();
const result = await generate.mutateAsync({
  prompt: 'Write a blog post about...',
  model: 'gpt-4',
  provider: 'openai',
});
```

**useAccess Hook**:
```typescript
const { hasAccess, canCreate, canEdit, canDelete, withAccess } = useAccess();
if (hasAccess('accounting.invoice.create')) {
  // Show create button
}
```

**useExport Hook**:
```typescript
const { exportToCSV, exportToExcel, exportToPDF, exportToWord, exportToHTML, printData } = useExport();
await exportToCSV(data, { filename: 'report.csv' });
await exportToExcel(data, { filename: 'report.xlsx' });
```

**useLayout Hook**:
```typescript
const { currentLayout, config, setConfig, applyChanges, saveConfig } = useLayout();
applyChanges({ themeMode: 'dark' });
applyChanges({ layoutType: 'top' });
await saveConfig('user');
```

**useMenuItems Hook**:
```typescript
const menuItems = useMenuItems();
// Otomatik sıralama, alt menü desteği, rol bazlı filtreleme
```

### 14.3. Yardımcı Fonksiyonlar

**Styling Guidelines**: `/src/styles/style-guidelines.md`
- Mantine UI v8: Birincil stil sistemi
- Tailwind CSS: Sadece layout utilities
- CSS Modules: Animasyonlar ve karmaşık selector'lar
- Design Tokens: CSS custom properties

**Component Naming Conventions**: `/src/docs/component-naming.md`
- Prefix categories: Data, User, Control, Display
- File structure: `/src/components/<domain>/<ComponentName>/Component.tsx`

---

## 15. i18n Sistemi Detayları

### 15.1. Çeviri Dosya Organizasyonu

```
src/locales/
├── global/              # Global çeviriler
│   ├── tr.json
│   ├── en.json
│   ├── de.json
│   └── ar.json
└── modules/             # Modül bazlı çeviriler
    ├── ai/
    ├── auth/
    ├── calendar/
    ├── dashboard/
    ├── file-manager/
    ├── management/
    ├── notifications/
    ├── permissions/
    ├── roles/
    └── users/
```

### 15.2. useTranslation Hook

```typescript
const { t, locale } = useTranslation(namespace?: string);
t('key.path.to.translation')
t('modules.management.upload.title')
```

### 15.3. Özellikler

- **Namespace Desteği**: Modül bazlı çeviri organizasyonu
- **Otomatik Fallback**: Eksik çevirilerde varsayılan locale'e düşüş
- **Cache Mekanizması**: Performans optimizasyonu
- **Key Algılama**: Nokta içeren string'ler otomatik olarak i18n key olarak algılanır
- **Client & Server Desteği**: Hem client hem server component'lerde kullanılabilir
- **Tam Dil Desteği**: Tüm modüller için 4 dil (tr, en, de, ar) tam çeviri desteği
- **Key Senkronizasyonu**: Tüm dillerde aynı key yapısı garantisi
- **Placeholder Desteği**: Form placeholder'ları için çeviri desteği

### 15.4. RTL Desteği

- Arapça için otomatik RTL yönlendirme
- Mantine DirectionProvider entegrasyonu
- CSS `dir` attribute yönetimi
- Tüm UI bileşenlerinde RTL uyumluluğu

### 15.5. Lisans Yönetimi i18n Keys

Lisans yönetimi için tüm çeviriler `global` namespace altında:

```json
{
  "licenses": {
    "title": "Lisans Yönetimi",
    "description": "Platform lisans paketlerini ve tenant lisanslarını yönetin",
    "dashboard": {
      "title": "Lisans Paneli",
      "stats": {
        "licenseTypes": "Lisans Türleri",
        "licensePackages": "Lisans Paketleri",
        "activeLicenses": "Aktif Lisanslar",
        "pendingPayments": "Bekleyen Ödemeler"
      },
      "distribution": {
        "title": "Lisans Dağılımı",
        "active": "Aktif",
        "trial": "Deneme",
        "expired": "Süresi Dolmuş"
      },
      "expiringSoon": {
        "title": "Yakında Dolacaklar",
        "noExpiring": "30 gün içinde süresi dolacak lisans yok"
      }
    },
    "status": {
      "trial": "Deneme",
      "active": "Aktif",
      "expired": "Süresi Dolmuş",
      "suspended": "Askıda",
      "cancelled": "İptal"
    },
    "paymentStatus": {
      "pending": "Bekliyor",
      "paid": "Ödendi",
      "failed": "Başarısız",
      "refunded": "İade Edildi"
    }
  }
}
```

---

## 16. Tema Sistemi Detayları

### 16.1. Tema Yapılandırması

**Mantine Tema**:
- Primary color: Blue
- Default radius: Medium
- Font family: Inter, sans-serif
- Heading font: Inter, sans-serif

**Tailwind Tema Token'ları**:
- Primary (50-900): Ana renk paleti
- Background (light/dark): Arka plan renkleri
- Header (light/dark): Header renkleri
- Text (light/dark/primary/secondary/muted): Metin renkleri
- Border (light/dark/hover): Kenarlık renkleri
- Interactive (light/dark): Etkileşim renkleri

**Fontlar**:
- Display font: Space Grotesk
- Body font: Inter

### 16.2. Dark Mode

- Sistem tercihine göre otomatik algılama
- Manuel geçiş özelliği
- CSS değişkenleri ile dinamik renk yönetimi
- Tüm bileşenlerde tutarlı dark mode desteği

### 16.3. Tema Özelleştirme

- Layout değiştirme (sidebar/top)
- Sidebar renk özelleştirme
- Dark/Light mode geçişi
- Canlı önizleme
- Device-Specific Content Area: Desktop, Tablet, Mobile için ayrı genişlik ve padding ayarları
- Responsive Tabs: İçerik alanı ayarları için cihaz bazlı sekmeler
- Panel State Persistence: Panel durumu localStorage'da saklanır

**Performance Optimizations**:
- Debounce mekanizması (Slider ve NumberInput için 150ms)
- Component memoization (React.memo)
- Callback stabilization (useRef)
- Context value memoization

---

## 17. Mimari Yapı Detayları

### 17.1. Proje Klasör Yapısı

```
omnex-core-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Locale-based routing
│   │   ├── api/                # API routes
│   │   └── providers.tsx      # Global providers
│   ├── components/            # React components
│   │   ├── layouts/           # Layout components
│   │   ├── modals/            # Modal components
│   │   ├── tables/            # Table components
│   │   └── common/            # Common components
│   ├── modules/                # Modül klasörleri
│   │   ├── [module-name]/
│   │   │   ├── components/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── types/
│   ├── lib/                    # Utility libraries
│   │   ├── api/               # API helpers
│   │   ├── modules/           # Module system
│   │   ├── access-control/   # RBAC system
│   │   └── services/         # Business logic
│   ├── hooks/                 # Custom React hooks
│   ├── locales/               # i18n translations
│   │   ├── global/
│   │   └── modules/
│   └── styles/                # Global styles
├── prisma/
│   ├── core.schema.prisma     # Core database schema
│   ├── tenant.schema.prisma   # Tenant database schema
│   ├── seed/                  # Seed scripts
│   └── docs/                  # Prisma documentation
├── scripts/                   # Utility scripts
└── docs/                      # Documentation
```

### 17.2. Bileşen Mimarisi

**Layout Bileşenleri**:
- `LayoutProvider`: Ana layout context ve provider
- `LayoutWrapper`: Layout türüne göre seçim
- `SidebarLayout`: Sol tarafta sidebar
- `TopLayout`: Üstte header
- `MobileLayout`: Mobil responsive

**Header Bileşenleri**:
- `CentralPageHeader`: Merkezi sayfa header'ı
- `BreadcrumbNav`: Breadcrumb navigasyonu

**Modal Bileşenleri**:
- `AlertModal`: Onay ve uyarı modal'ları

**Tablo Bileşenleri**:
- `DataTable`: Merkezi tablo bileşeni
- `FilterModal`: Filtre modal'ı

**Skeleton Bileşenleri**:
- `HeaderSkeleton`: Sayfa header skeleton
- `ListPageSkeleton`: Liste sayfası skeleton
- `FormPageSkeleton`: Form sayfası skeleton

---

## 18. Geliştirme Ortamı

### 18.1. Environment Variables

```env
# Database
CORE_DATABASE_URL="postgresql://user:pass@localhost:5432/omnex_core"
TENANT_DATABASE_URL="postgresql://user:pass@localhost:5432/tenant_acme_2025"

# Security
JWT_SECRET="[64-char-random-string]"
JWT_REFRESH_SECRET="[64-char-random-string]"
SESSION_SECRET="[64-char-random-string]"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PostgreSQL Admin
PG_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres"

# Routing Configuration
PRODUCTION_DOMAIN="onwindos.com"
STAGING_DOMAIN="staging.onwindos.com"
TENANT_PATH_PREFIX="/tenant"

# Storage Configuration
STORAGE_TYPE="local"
STORAGE_LOCAL_PATH="./storage/tenants"

# Audit Log Configuration
AUDIT_LOG_ENABLED="true"
AUDIT_LOG_RETENTION_DAYS="365"
AUDIT_LOG_ASYNC="true"
```

### 18.2. Yapılandırma Dosyaları

**TypeScript (`tsconfig.json`)**:
- Strict mode aktif
- Path aliases (`@/` → `src/`)
- Next.js optimizasyonları

**Tailwind (`tailwind.config.ts`)**:
- Content paths yapılandırması
- Dark mode: `[data-mantine-color-scheme="dark"]`
- Custom color tokens
- Font family yapılandırması

**PostCSS (`postcss.config.js`)**:
- Tailwind CSS
- Autoprefixer
- PostCSS Preset Mantine

**Next.js (`next.config.ts`)**:
- TypeScript desteği
- App Router yapılandırması

### 18.3. Best Practices

**Component Organization**:
- Her modül kendi klasöründe
- Bileşenler `components/` altında
- Hooks `hooks/` altında

**Type Safety**:
- Tüm bileşenler TypeScript ile
- Interface ve type tanımlamaları
- Strict mode aktif

**i18n Kullanımı**:
- Hardcoded string'ler yerine `t()` kullanımı
- Namespace bazlı organizasyon
- Çeviri key'leri nokta notasyonu ile

**Modül Geliştirme**:
- `module.config.yaml` manifest dosyası zorunlu
- Modül bağımlılıkları tanımlanmalı
- Lifecycle hooks kullanılmalı

**Performance**:
- Lazy loading için dynamic imports
- Image optimization
- Code splitting
- Memoization gerektiğinde
- Tenant context caching (5 dakika TTL)
- Prisma log level optimizasyonu (sadece error log'ları)
- Client-side debug log'ların kaldırılması

**Debug Log Politikası**:
- **Client-side**: Tüm `console.log`, `console.warn`, `console.debug`, `console.info` log'ları kaldırılmıştır
- **Server-side**: Sadece kritik hatalar için `console.error` kullanılır
- **API Routes**: Hata durumlarında detaylı error logging (development mode'da stack trace)

---

## 📚 Ek Dokümantasyon

- **OMNEX_SAAS_PLATFORM_STANDARTLAR_V2.md**: Standartlar ve kurallar
- **docs/DEPLOYMENT.md**: Detaylı deployment rehberi
- **docs/SECURITY.md**: Güvenlik politikası
- **docs/MULTI_TENANT_SETUP.md**: Multi-tenant setup rehberi
- **docs/QUICK_START.md**: Hızlı başlangıç rehberi
- **prisma/docs/**: Prisma dokümantasyonu

---

**Son Güncelleme**: 2025-12-15  
**Dokümantasyon Versiyonu**: 2.0.0

