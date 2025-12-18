# Omnex SaaS Platform - Standartlar ve Kurallar v2.0

**Versiyon**: 2.0.0  
**Son Güncelleme**: 2025-12-15  
**Platform Versiyonu**: 1.0.9

---

## 📋 İçindekiler

1. [Core Sistem Koruma Politikası](#1-core-sistem-koruma-politikası)
2. [İçerik Üretim Kısıtlamaları](#2-içerik-üretim-kısıtlamaları)
3. [Tasarım Sistemi ve Stil Yapısı](#3-tasarım-sistemi-ve-stil-yapısı)
4. [Merkezi Sistemler](#4-merkezi-sistemler)
   - [4.6. Session Timeout Sistemi](#46-session-timeout-sistemi)
5. [Tenant Yapısı ve Routing](#5-tenant-yapısı-ve-routing)
6. [Veritabanı Şeması Standartları](#6-veritabanı-şeması-standartları)
7. [Sayfa Yapısı ve Header Standartları](#7-sayfa-yapısı-ve-header-standartları)
8. [Layout Sistemi](#8-layout-sistemi)
9. [Rol ve İzin Sistemi (RBAC)](#9-rol-ve-izin-sistemi-rbac)
10. [Modül Sistemi Standartları](#10-modül-sistemi-standartları)
11. [Lisans Yönetim Sistemi Standartları](#11-lisans-yönetim-sistemi-standartları)
12. [Export Templates Standartları](#12-export-templates-standartları)
13. [Super Admin Panel Standartları](#13-super-admin-panel-standartları)
14. [API Standartları](#14-api-standartları)
15. [UI Standartları](#15-ui-standartları)
   - [15.5. Icon Sistemi Standartları](#155-icon-sistemi-standartları)
16. [Type Safety Standartları](#16-type-safety-standartları)
17. [Deployment ve Güvenlik Standartları](#17-deployment-ve-güvenlik-standartları)

---

## 1. Core Sistem Koruma Politikası

### 1.1. Değiştirilmesi Yasak Core Sistemler

**ÖNEMLİ**: Aşağıdaki core sistemler **KESINLIKLE DEĞİŞTİRİLEMEZ**:

#### 1. Core Layout System
- `src/components/layouts/core/LayoutProvider.tsx`
- `src/components/layouts/core/LayoutConfig.ts`
- `src/components/layouts/core/LayoutResolver.ts`
- `src/components/layouts/LayoutWrapper.tsx`
- Layout hook'ları (`useLayout`, `useLayoutData`, `useLayoutSync`)

#### 2. Central Modal System
- `src/components/modals/AlertModal.tsx`
- Modal sisteminin core mantığı

#### 3. PermissionService Core Logic
- `src/lib/access-control/PermissionService.ts` (core logic)
- `src/lib/access-control/providers/AccessProvider.tsx` (core logic)
- Permission check mekanizması

#### 4. Tenant Context Resolution
- `src/lib/api/tenantContext.ts` (core resolution logic)
- `src/lib/services/tenantService.ts` (core tenant service)
- `src/middleware.ts` (tenant resolution middleware)

#### 5. Module Registry & Loader
- `src/lib/modules/registry.ts` (core registry logic)
- `src/lib/modules/loader.ts` (core loader logic)
- `src/lib/modules/dependency-manager.ts` (core dependency logic)
- `src/lib/modules/types.ts` (core type definitions)

### 1.2. Override Mekanizması

**Bu sistemleri değiştirmek için ÖZEL İZİN gereklidir**:

```
"CORE OVERRIDE ALLOWED"
```

Bu komut **açıkça** belirtilmedikçe, yukarıdaki core sistemlerde **HİÇBİR DEĞİŞİKLİK YAPILAMAZ**.

### 1.3. Core Sistem Değişiklik Süreci

Eğer core sistem değişikliği **mutlaka gerekli** ise:

1. **Alternatif Çözümler Araştırılmalı**
2. **Değişiklik Gerekçesi Dokümante Edilmeli**
3. **Explicit Override Komutu** alınmalı
4. **Değişiklik Sonrası** tüm bağımlılıklar test edilmeli

### 1.4. İzin Verilen Değişiklikler

- ✅ Core sistemleri **kullanmak** (import, çağırmak)
- ✅ Core sistemleri **genişletmek** (yeni özellikler eklemek - breaking change olmadan)
- ✅ Core sistemlerin **üzerine wrapper** yazmak
- ✅ Core sistemlerin **ayarlarını** değiştirmek (config dosyaları)
- ✅ Core sistemlerin **dokümantasyonunu** güncellemek

### 1.5. Yasak Değişiklikler

- ❌ Core sistemlerin **internal logic**'ini değiştirmek
- ❌ Core sistemlerin **API signature**'ını değiştirmek (breaking change)
- ❌ Core sistemlerin **type definitions**'ını değiştirmek (breaking change)
- ❌ Core sistemlerin **dependency resolution** mantığını değiştirmek
- ❌ Core sistemlerin **tenant context** mantığını değiştirmek

---

## 2. İçerik Üretim Kısıtlamaları

### 2.1. İzin Verilen İçerik Türleri

**SADECE aşağıdaki içerik türleri üretilebilir**:

1. **i18n Texts (Çeviri Metinleri)**
   - `src/locales/global/{locale}.json`
   - `src/locales/modules/{module-slug}/{locale}.json`
   - Tüm desteklenen diller için (tr, en, de, ar)

2. **UI Copy (Kullanıcı Arayüzü Metinleri)**
   - Button label'ları
   - Form label'ları
   - Placeholder metinleri
   - Tooltip metinleri

3. **Empty State Messages**
   - "Veri bulunamadı" mesajları
   - "Henüz öğe eklenmemiş" mesajları

4. **Validation Messages**
   - Form validation error mesajları
   - Zod schema validation mesajları

5. **Confirmation Modals**
   - Delete confirmation mesajları
   - Action confirmation mesajları

6. **Onboarding Texts**
   - Welcome mesajları
   - Tutorial metinleri

### 2.2. Yasak İçerik Türleri

**AŞAĞIDAKİ İÇERİKLERE DOKUNULAMAZ**:

1. **Schema (Veritabanı Şemaları)**
   - `prisma/core.schema.prisma`
   - `prisma/tenant.schema.prisma`
   - Model tanımları, field tanımları, relation tanımları

2. **API (API Route'ları)**
   - `src/app/api/**/*.ts`
   - API endpoint'leri, request/response handler'ları

3. **Services (Servis Katmanı)**
   - `src/lib/services/**/*.ts`
   - Business logic, data processing

4. **Hooks (React Hook'ları)**
   - `src/hooks/**/*.ts`
   - Custom React hooks, hook logic

### 2.3. İçerik Üretim Süreci

1. **İçerik Türü Belirleme**
2. **Doğru Dosyaya Ekleme**
3. **Tüm Dillere Ekleme** (tr, en, de, ar)
4. **Key Yapısı Kontrolü** (hiyerarşik yapı)

---

## 3. Tasarım Sistemi ve Stil Yapısı

### 3.1. Stil Stratejisi (Canonical Rules)

#### Mantine UI - Birincil Stil Sistemi

**Kural**: Mantine UI v8, tüm component görselleri için birincil stil sistemidir.

**Kullanım**:
- Component görselleri (renkler, border-radius, gölgeler, tipografi) Mantine theme üzerinden yönetilir
- Tüm tasarım token'ları CSS custom properties olarak `src/styles/_tokens.css` içinde tanımlanır
- **Yasak**: Mantine component'lerde doğrudan `style` attribute override kullanımı

#### Tailwind CSS - Sadece Layout Utilities

**Kural**: Tailwind CSS sadece layout utilities ve responsive grid için kullanılır.

**Kullanım**:
- `flex`, `grid`, `gap-4`, `p-4`, `m-2`, `w-full`, `h-screen`
- `md:flex-row`, `lg:grid-cols-3` gibi responsive utilities
- **Yasak**: Visual token override'ları (renkler, gölgeler, border'lar Mantine theme'den gelmeli)

#### CSS Modules - Animasyonlar ve Karmaşık Selector'lar

**Kural**: CSS Modules, component bazlı animasyonlar ve karmaşık selector'lar için kullanılır.

**Kullanım**:
- Dosya adlandırma: `ComponentName.module.css`
- Import: `import styles from './ComponentName.module.css'`
- Animasyonlar, transitions, component-specific styling

#### Design Tokens - CSS Custom Properties

**Kural**: Tüm tasarım token'ları CSS custom properties olarak tanımlanır.

**Dosya Yapısı**:
```
src/
├── styles/
│   ├── _tokens.css          # Tüm design tokens (CSS variables)
│   └── style-guidelines.md  # Stil rehberi
├── theme.ts                 # Mantine theme (maps CSS vars)
└── app/
    └── globals.css          # Imports _tokens.css
```

**Token Kategorileri**:
- Colors: Primary palette, semantic colors
- Spacing: xs, sm, md, lg, xl, 2xl, 3xl
- Border Radius: xs, sm, md, lg, xl, full
- Shadows: sm, md, lg, xl
- Typography: Font sizes, line heights, font families

### 3.2. Dark Mode Desteği

**Kural**: Tüm component'ler dark mode'u desteklemelidir.

**Uygulama**:
- CSS variables `[data-mantine-color-scheme="dark"]` selector'ü ile override edilir
- Mantine theme otomatik olarak dark mode'u yönetir
- Component'lerde manuel dark mode kontrolü gerekmez

### 3.3. Responsive Tasarım

**Kural**: Mobile-first yaklaşım kullanılır.

**Breakpoints**:
- `xs`: < 576px
- `sm`: ≥ 576px
- `md`: ≥ 768px
- `lg`: ≥ 992px
- `xl`: ≥ 1200px

---

## 4. Merkezi Sistemler

### 4.1. Merkezi Modal Sistemi

**AlertModal Component**:
- Onay ve uyarı modal'ları için merkezi sistem
- `src/components/modals/AlertModal.tsx`
- Kullanım: `AlertModal.open({ title, message, onConfirm, onCancel })`

### 4.2. Bildirim Sistemi

**ToastNotification**:
- Geçici bildirimler için
- Mantine `notifications` kullanılır
- Kullanım: `notifications.show({ title, message, color })`

**NotificationBell**:
- Bildirim çanı component'i
- Real-time bildirim desteği

### 4.3. Merkezi Tablo Sistemi (DataTable)

**Özellikler**:
- Filtreleme, sıralama, sayfalama
- Export özellikleri (CSV, Excel, PDF, Word, HTML, Print)
- Responsive tasarım
- Dark mode desteği

**Kullanım**:
```tsx
<DataTable
  data={data}
  columns={columns}
  filters={filters}
  exportFormats={['csv', 'excel', 'pdf']}
/>
```

### 4.4. Skeleton Sistemi

**Temel Skeleton Componentler**:
- `HeaderSkeleton` - Sayfa header skeleton
- `ListPageSkeleton` - Liste sayfası skeleton
- `FormPageSkeleton` - Form sayfası skeleton

**Kullanım Kuralları**:
- Loading state'te skeleton gösterilir
- Skeleton gerçek içerik yapısını taklit eder
- Dark mode desteği

### 4.5. Merkezi Export Sistemi

**Desteklenen Formatlar**:
- CSV, Excel, PDF, Word, HTML, Print

**Export Options**:
- Company settings entegrasyonu
- Template sistemi
- Custom formatting

### 4.6. Session Timeout Sistemi

**Konum**: `src/components/providers/SessionTimeoutProvider.tsx`

**Özellikler**:
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

**Güvenlik Ayarları**:
- `sessionTimeout`: Oturum zaman aşımı (dakika, varsayılan: 30)
- `maxConcurrentSessions`: Maksimum eşzamanlı oturum sayısı (varsayılan: 5)
- `rememberMeDuration`: "Beni Hatırla" süresi (gün, varsayılan: 30)

**Kullanım**:
```tsx
import { SessionTimeoutProvider } from '@/components/providers/SessionTimeoutProvider';

<SessionTimeoutProvider>
  {children}
</SessionTimeoutProvider>
```

---

## 5. Tenant Yapısı ve Routing

### 5.1. Multi-Tenant Mimarisi

**Mimari Model**: Per-Tenant Database

- Her tenant için ayrı PostgreSQL database
- Tam veri izolasyonu
- Yearly database rotation

### 5.2. Veritabanı Yapısı

**Core Database** (`omnex_core`):
- Tenant metadata
- Agency bilgileri
- Module registry
- Audit logs

**Tenant Databases** (`tenant_{slug}_{year}`):
- User management
- Company data
- Module-specific data
- Tüm tenant'a özel veriler

### 5.3. Routing Sistemi

**Production**: Subdomain (`acme.onwindos.com`)
**Staging**: Subdomain + path fallback (`acme.staging.onwindos.com` veya `/tenant/acme`)
**Local Development**: Path-based (`localhost:3000/tenant/acme`)

### 5.4. Yearly Database Rotation

Yıl bazlı database isimlendirme:
- Format: `tenant_{slug}_{year}`
- Yeni yıl için otomatik rotation
- Export/Import desteği

---

## 6. Veritabanı Şeması Standartları

### 6.1. Schema Yapısı

**Dual Schema System**:
- `prisma/core.schema.prisma`: Core database
- `prisma/tenant.schema.prisma`: Tenant database

**Schema Standartları**:
- Tüm modeller `tenantId` ve `companyId` içermelidir
- Index'ler `tenantId` ve `companyId` içermelidir
- Timestamps (`createdAt`, `updatedAt`) zorunludur

### 6.2. Migration Standartları

**Migration İsimlendirme**:
- Format: `YYYYMMDDHHMMSS_description`
- Örnek: `20250129120000_add_user_table`

**Migration Oluşturma**:
```bash
# Core DB
CORE_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/core.schema.prisma --name description

# Tenant DB (sadece deploy!)
TENANT_DATABASE_URL="..." npx prisma migrate deploy --schema=prisma/tenant.schema.prisma
```

**⚠️ KRİTİK**: Asla tenant DB üzerinde `prisma migrate dev` çalıştırmayın!

### 6.3. Index Stratejisi

**Composite Index Kuralları**:

1. **Temel Index (Zorunlu)**:
   ```prisma
   @@index([tenantId, companyId])
   ```

2. **Status Index (Sık Kullanılan)**:
   ```prisma
   @@index([tenantId, companyId, status])
   ```

3. **Tarih Index (Sıralama/Filtreleme)**:
   ```prisma
   @@index([tenantId, companyId, createdAt])
   ```

**Index Güvenlik Kuralları**:
- TenantId içermeyen index KABUL EDİLMEZ
- Mevcut alana `@unique` eklemek risklidir (veri analizi zorunlu)

---

## 7. Sayfa Yapısı ve Header Standartları

### 7.1. Sayfa Yapısı

**Route Yapısı**:
```
/[locale]/[route]
```

**Sayfa Dosya Yapısı**:
```
src/app/[locale]/
  ├── [route]/
  │   ├── page.tsx          # Ana sayfa
  │   ├── [id]/
  │   │   ├── page.tsx      # Detay sayfası
  │   │   └── edit/
  │   │       └── page.tsx  # Düzenleme sayfası
  │   └── create/
  │       └── page.tsx      # Oluşturma sayfası
```

### 7.2. CentralPageHeader Standartları

**Props Interface**:
```typescript
interface CentralPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  namespace?: string;
}
```

**Kullanım Standartları**:
- Tüm sayfalarda `CentralPageHeader` kullanılmalıdır
- `namespace` prop'u ile i18n desteği
- Breadcrumb'lar otomatik oluşturulur
- Action button'lar sağ üstte gösterilir

---

## 8. Layout Sistemi

### 8.1. Layout Tipleri

**Sidebar Layout**:
- Sol tarafta daraltılabilir/genişletilebilir sidebar
- Genişlik: 16rem (genişletilmiş), 4rem (daraltılmış)
- Smooth transition animasyonları

**Top Layout**:
- Üstte sticky header
- Horizontal menü navigasyonu
- Mobil hamburger menü

**Mobile Layout**:
- Responsive mobil optimizasyonu
- Hamburger menü (drawer)

### 8.2. Layout Context

**LayoutProvider**:
- Ana layout context ve provider
- Hibrit veri yönetimi (LocalStorage + Database)
- Öncelik sistemi (User > Role > Company > Default)
- Instant apply (değişiklikler anında uygulanır)
- Debounced sync (performans optimizasyonu)

### 8.3. Layout ve Navigasyon Mimarisi

**Mimari Yapı**:
```
LayoutProvider (Context: config, theme, responsive)
  └── LayoutWrapper (Layout türüne göre seçim)
      ├── TopLayout (top header)
      ├── SidebarLayout (sol menü)
      └── MobileLayout (mobil responsive)
```

**Menü Sistemi**:
1. User Role Kontrolü
2. Default Menus (role bazlı)
3. Active Modules
4. Managed Menus (API)
5. Available Pages (API)
6. Merge & Filter & Sort

---

## 9. Rol ve İzin Sistemi (RBAC)

### 9.1. Roller

**SuperAdmin**:
- Tüm izinlere sahip (`*` wildcard)
- Tüm modüllere erişim
- Sistem yönetimi yetkileri

**AgencyUser**:
- Modül erişimi ve common actions
- Tenant bazlı yönetim yetkileri

**ClientUser**:
- Sınırlı modül erişimi
- Read-only yetkiler (çoğu durumda)

### 9.2. Permission Service

**Permission Key Format**: `module.action`

**Örnekler**:
- `users.create`
- `users.update`
- `users.delete`
- `accounting.invoices.view`
- `accounting.invoices.create`

**Permission Check**:
```typescript
import { usePermission } from '@/lib/access-control';

const canCreate = usePermission('users.create');
```

### 9.3. Access Provider (Frontend)

**Kullanım**:
```tsx
<AccessProvider>
  {canCreate && <Button>Create</Button>}
</AccessProvider>
```

---

## 10. Modül Sistemi Standartları

### 10.1. Modül Yapısı

Her modül aşağıdaki yapıya sahip olmalıdır:

```
src/modules/[module-name]/
  ├── module.config.yaml    # Modül konfigürasyonu (zorunlu)
  ├── version.txt           # Versiyon geçmişi (opsiyonel)
  ├── components/           # Modül bileşenleri
  ├── schemas/              # Zod schema'ları
  ├── services/             # Servis katmanı
  ├── types/                # TypeScript tip tanımları
  └── widgets/             # Widget'lar (opsiyonel)
```

### 10.2. Modül Konfigürasyonu

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

### 10.3. Modül Ayarları Sistemi

**3 Ana Tab**:
1. **Summary Tab**: Modül bilgileri, versiyon geçmişi
2. **Settings Tab**: Modül ayarları (boolean, text, number, select, color)
3. **Menu Tab**: Menü yapılandırması (drag & drop sıralama)

**API Endpoints**:
- `GET /api/modules/[slug]/settings` - Ayarlar yapılandırması
- `POST /api/modules/[slug]/settings` - Ayarları kaydet
- `GET /api/modules/[slug]/menu` - Menü yapılandırması
- `POST /api/modules/[slug]/menu` - Menü yapılandırmasını kaydet

### 10.4. Varsayılan Menü Hiyerarşisi

**4 Ana Menü Grubu**:
1. **User Menüsü**: Dashboard, Profil, Ayarlar
2. **Company Menüsü**: Kullanıcılar, Roller, Lokasyonlar
3. **SuperAdmin Menüsü**: Tenant Yönetimi, Sistem Yönetimi
4. **Settings Menüsü**: Genel Ayarlar, Tema, Dil

**Toplam Menü Sayısı**: 50+ menü öğesi

---

## 11. Lisans Yönetim Sistemi Standartları

### 11.1. Genel Bakış

Lisans yönetim sistemi, platform genelinde tenant'ların lisans, paket ve ödeme yönetimini sağlar. SuperAdmin rolü için tasarlanmıştır.

### 11.2. Veritabanı Modelleri

**Core Database Modelleri** (`prisma/core.schema.prisma`):

- **LicenseType**: Lisans türleri (Trial, Standard, Premium, Enterprise)
- **LicensePackage**: Fiyatlandırma paketleri ve modül atamaları
- **TenantLicense**: Tenant'lara atanan lisanslar
- **LicensePayment**: Ödeme kayıtları ve onay süreci
- **LicenseUsageLog**: Kullanım istatistikleri

### 11.3. API Standartları

**Lisans Türleri API**:
- `GET /api/admin/license-types` - Türleri listele
- `POST /api/admin/license-types` - Yeni tür oluştur
- `GET /api/admin/license-types/[id]` - Tür detayı
- `PUT /api/admin/license-types/[id]` - Tür güncelle
- `DELETE /api/admin/license-types/[id]` - Tür sil

**Lisans Paketleri API**:
- `GET /api/admin/licenses` - Paketleri listele
- `POST /api/admin/licenses` - Yeni paket oluştur
- `GET /api/admin/licenses/[id]` - Paket detayı
- `PUT /api/admin/licenses/[id]` - Paket güncelle
- `DELETE /api/admin/licenses/[id]` - Paket sil
- `GET /api/admin/licenses/stats` - Dashboard istatistikleri

**Tenant Lisansları API**:
- `GET /api/admin/tenant-licenses` - Tenant lisanslarını listele
- `POST /api/admin/tenant-licenses` - Lisans ata
- `GET /api/admin/tenant-licenses/[id]` - Lisans detayı
- `PUT /api/admin/tenant-licenses/[id]` - Lisans güncelle
- `DELETE /api/admin/tenant-licenses/[id]` - Lisans iptal

**Ödemeler API**:
- `GET /api/admin/license-payments` - Ödemeleri listele
- `POST /api/admin/license-payments/[id]/approve` - Ödeme onayla
- `POST /api/admin/license-payments/[id]/reject` - Ödeme reddet

### 11.4. Sayfa Yapısı Standartları

**Lisans Yönetimi Sayfaları**:
```
/[locale]/admin/licenses/
├── dashboard/          # Dashboard istatistikleri
├── packages/          # Paket listesi
├── types/             # Tür listesi
├── tenants/          # Firma lisansları
├── payments/         # Ödeme takibi
├── create/           # Yeni paket oluştur
└── [id]/             # Paket detayı ve düzenleme
```

**Skeleton Components**: Her sayfa için skeleton component kullanılmalıdır.

### 11.5. i18n Standartları

Lisans yönetimi için tüm çeviriler `global` namespace altında:

```json
{
  "licenses": {
    "title": "Lisans Yönetimi",
    "description": "Platform lisans paketlerini ve tenant lisanslarını yönetin",
    "dashboard": { ... },
    "packages": { ... },
    "types": { ... },
    "tenants": { ... },
    "payments": { ... },
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

## 12. Export Templates Standartları

### 12.1. Genel Bakış

Export templates sistemi, dışa aktarım şablonlarını yönetir. Company settings entegrasyonu ile kullanılır.

### 12.2. Şablon Tipleri

- `header` - Sadece üst bilgi
- `footer` - Sadece alt bilgi
- `full` - Tam sayfa şablonu

### 12.3. Kapsam (Scope)

- `global` - Platform geneli
- `company` - Firma bazlı
- `location` - Lokasyon bazlı

### 12.4. API Standartları

- `GET /api/export-templates` - Şablonları listele
- `POST /api/export-templates` - Yeni şablon oluştur
- `GET /api/export-templates/[id]` - Şablon detayı
- `PATCH /api/export-templates/[id]` - Şablon güncelle
- `DELETE /api/export-templates/[id]` - Şablon sil
- `POST /api/export-templates/[id]/set-default` - Varsayılan yap
- `GET /api/export-templates/[id]/preview` - Önizleme
- `GET /api/export-templates/[id]/export` - Dışa aktar
- `POST /api/export-templates/seed` - Demo şablonlar oluştur

### 12.5. Sayfa Yapısı Standartları

```
/[locale]/settings/export-templates/
├── page.tsx                          # Şablon listesi
├── ExportTemplatesPageClient.tsx     # Client component
├── ExportTemplatesPageSkeleton.tsx   # Skeleton
├── components/
│   └── ExportTemplateForm.tsx        # Form component
├── create/
│   ├── page.tsx                      # Yeni şablon
│   └── CreateExportTemplatePageClient.tsx
└── [id]/
    └── edit/
        ├── page.tsx                  # Şablon düzenle
        ├── EditExportTemplatePageClient.tsx
        └── EditExportTemplatePageSkeleton.tsx
```

### 12.6. Şablon Özellikleri

**Header/Footer Şablonları**:
- Logo pozisyonu (left, center, right)
- Başlık ve alt başlık
- Tarih ve sayfa numarası formatı

**Full Şablonlar**:
- Tam sayfa düzeni
- Özelleştirilebilir stil
- Company settings entegrasyonu

---

## 13. Super Admin Panel Standartları

### 13.1. Menü Yapısı

Super Admin için varsayılan menü yapısı (`src/config/default-menus.config.ts`):

**Sistem Yönetimi**:
- Sistem Durumu (`/admin/system`)
- Yedekleme (`/admin/backups`)
- Sistem Logları (`/admin/logs`)

**Tenant Yönetimi**:
- Tenant Listesi (`/admin/tenants`)
- Veritabanı Yönetimi (`/admin/tenants/database`)

**Optimizasyon**:
- Performans (`/admin/optimization/performance`)
- Cache Yönetimi (`/admin/optimization/cache`)
- Veritabanı Bakımı (`/admin/optimization/database`)

**Lisans Yönetimi**:
- Lisans Paneli (`/admin/licenses/dashboard`)
- Lisans Paketleri (`/admin/licenses/packages`)
- Lisans Türleri (`/admin/licenses/types`)
- Firma Lisansları (`/admin/licenses/tenants`)
- Ödeme Takibi (`/admin/licenses/payments`)

### 13.2. Sayfa Standartları

**Sistem Durumu Sayfası** (`/admin/system`):
- CPU kullanımı (yüzde ve çekirdek sayısı)
- Bellek kullanımı (kullanılan/toplam GB)
- Disk kullanımı (yüzde)
- Sunucu bilgileri (hostname, platform, uptime, Node sürümü)

**Yedekleme Sayfası** (`/admin/backups`):
- Tenant bazlı yedek oluşturma
- Yedek listeleme
- Yedek indirme ve geri yükleme
- Yedek silme

**Sistem Logları Sayfası** (`/admin/logs`):
- Filtreleme (User ID, Status, Module, Tarih aralığı)
- Sayfalama (20 log/sayfa)
- Log detayı modal'ı
- CSV/JSON export

---

## 14. API Standartları

### 14.1. API Schema Validation Standartları

**Date Alanları İşleme**:
```typescript
// ✅ DOĞRU
export const schema = z.object({
  lastRenovationDate: z.coerce.date().optional().nullable(),
});

// ❌ YANLIŞ
deliveryDate: z.date().optional().nullable(), // String gelirse hata verir
```

**Tüm Alanları Kullanma**:
- Schema'daki tüm alanlar create/update işlemlerinde kullanılmalıdır
- Validation script: `npm run validate:api-schema`

### 14.2. Company/Tenant ID Validation

**Helper Fonksiyonlar**:
```typescript
import { requireCompanyId } from '@/lib/api/companyContext';

const companyId = await requireCompanyId(request, tenantPrisma);
```

**Standard API Pattern**:
```typescript
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
  });
}
```

**Validation Script**: `npm run validate:company-tenant-ids`

### 14.3. Standart Response Formatı

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

### 14.4. Rate Limiting

- **Global**: 100 requests / 15 minutes per IP
- **Auth Endpoints**: 10 requests / 15 minutes
- Configurable via environment variables

---

## 15. UI Standartları

### 15.1. Container ve Spacing Kuralları

**Container Kuralı**: Tüm sayfalarda `Container` component'i `pt="xl"` prop'u ile kullanılmalıdır.

```tsx
<Container pt="xl">
  {/* İçerik */}
</Container>
```

### 15.2. Paper Styling

**Varsayılan Stiller**:
- `shadow="xs"` - Varsayılan gölge
- `p="md"` - Varsayılan padding
- `mt="md"` - Varsayılan margin-top

```tsx
<Paper shadow="xs" p="md" mt="md">
  {/* İçerik */}
</Paper>
```

### 15.3. Tabs Kullanımı

**Varsayılan Ayarlar**:
- `variant="default"` - Varsayılan variant
- `orientation="horizontal"` - Varsayılan yönlendirme

```tsx
<Tabs variant="default" orientation="horizontal">
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content</Tabs.Panel>
</Tabs>
```

### 15.4. Özet Tablosu

| Component | Prop | Varsayılan Değer | Kullanım |
|-----------|------|------------------|----------|
| `Container` | `pt` | `"xl"` | Tüm sayfalarda zorunlu |
| `Paper` | `shadow` | `"xs"` | Varsayılan gölge |
| `Paper` | `p` | `"md"` | Varsayılan padding |
| `Paper` | `mt` | `"md"` | Varsayılan margin-top |
| `Tabs` | `variant` | `"default"` | Varsayılan variant |
| `Tabs` | `orientation` | `"horizontal"` | Varsayılan yönlendirme |

### 15.5. Icon Sistemi Standartları

**Tabler Icons**: Platform'da ikonlar için Tabler Icons kütüphanesi kullanılmaktadır (`@tabler/icons-react` v3.35.0).

#### Icon Kullanım Kuralları

1. **Modül İkonları**:
   - `module.config.yaml` dosyasında `icon` alanı string olarak tanımlanmalıdır
   - Tabler icon adı kullanılmalıdır (örn: "Building", "Dashboard")
   - "Icon" prefix'i opsiyoneldir (case-insensitive)

2. **Menü İkonları**:
   - Menü tanımlarında `icon` alanı string olarak kullanılmalıdır
   - `useMenuItems` hook'u string'leri React component'lerine map eder

3. **Component İkonları**:
   - `ModuleIcon` bileşeni modül ikonları için kullanılmalıdır
   - `IconPicker` bileşeni kullanıcı ikon seçimi için kullanılmalıdır
   - ForwardRef component desteği (Tabler v3+) dikkate alınmalıdır

#### Icon API Standartları

**PUT `/api/modules/[slug]/icon`**:
- Request body: `{ "icon": "Building" }`
- `module.config.yaml` dosyasını günceller
- Event tetikler: `modules-updated`, `menu-updated`

**POST `/api/modules/[slug]/icon`**:
- Request: FormData (file, max 2MB)
- Desteklenen formatlar: PNG, JPG, SVG, WebP
- Response: `{ "url": "...", "fileName": "..." }`

#### Icon Dosya Yapısı

```
src/
├── lib/modules/
│   └── icon-loader.tsx          # ModuleIcon bileşeni
├── components/common/
│   └── IconPicker.tsx           # IconPicker ve IconPickerButton
└── modules/
    └── [module-slug]/
        └── module.config.yaml   # icon: "Building" alanı
```

#### Icon Event Sistemi

**modules-updated Event**:
```typescript
window.dispatchEvent(new CustomEvent('modules-updated'));
```

**menu-updated Event**:
```typescript
window.dispatchEvent(new CustomEvent('menu-updated'));
```

#### Icon Kategorileri (IconPicker)

- Navigation: Home, Menu, Arrow, Chevron, vb.
- Communication: Mail, Message, Phone, Chat, vb.
- Business: Briefcase, Building, Office, vb.
- Charts: Chart, Graph, Analytics, vb.
- Technology: Code, Database, Server, vb.
- Security: Lock, Shield, Key, vb.
- Actions: Plus, Edit, Trash, Save, vb.

#### Icon Kullanım Checklist

- [ ] Modül ikonu `module.config.yaml`'da tanımlı
- [ ] Tabler icon adı kullanılıyor (string format)
- [ ] IconPicker kullanıcı seçimi için kullanılıyor
- [ ] Event'ler doğru tetikleniyor (`modules-updated`, `menu-updated`)
- [ ] ForwardRef component desteği dikkate alınıyor
- [ ] Özel ikon dosyası yükleniyorsa max 2MB limit kontrol ediliyor

**Detaylı Dokümantasyon**: `docs/icon-system.md`

---

## 16. Type Safety Standartları

### 16.1. Type Error Resolution Sistemi

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

### 16.2. Type Error Analizi

**Analiz Komutu**:
```bash
npm run type:analyze
```

**Özellikler**:
- Type error'ları kategorize eder
- Severity breakdown (high/medium/low)
- Otomatik düzeltilebilir hataları tespit eder

### 16.3. Önerilen Workflow

**Günlük Geliştirme**:
1. Geliştirmeye başlamadan önce: `npm run type:snapshot`
2. Geliştirme sırasında: `npm run typewatch` (ayrı terminalde)
3. Değişikliklerden sonra: `npm run type:fix:auto` → `npm run type:analyze`
4. Feature tamamlandığında: `npm run type:snapshot:compare` → `npm run type:scan`

**Build Öncesi**:
```bash
npm run type:fix:auto
npm run type:analyze
npm run typecheck
npm run build
```

---

## 17. Deployment ve Güvenlik Standartları

### 17.1. Production Deployment

**Prerequisites**:
- Node.js 18+
- PostgreSQL 14+
- Domain with SSL certificate
- Minimum 2GB RAM, 2 CPU cores

**Environment Setup**:
```env
CORE_DATABASE_URL="postgresql://user:pass@prod-db:5432/omnex_core"
JWT_SECRET="[64-char-random-string]"
JWT_REFRESH_SECRET="[64-char-random-string]"
SESSION_SECRET="[64-char-random-string]"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

**Build and Deploy**:
```bash
npm ci --production=false
npm run build
npm start
```

**Process Management (PM2)**:
```bash
npm install -g pm2
pm2 start npm --name "omnex-core" -- start
pm2 save
pm2 startup
```

### 17.2. Güvenlik Politikası

**Authentication & Authorization**:
- JWT Token System (Access: 7 days, Refresh: 30 days)
- Password Policy (min 8 chars, uppercase, lowercase, number, special)
- RBAC (SuperAdmin, AgencyUser, ClientUser)

**Session Management**:
- **Session Timeout**: Varsayılan 30 dakika (güvenlik ayarlarından yapılandırılabilir, 1-1440 dakika arası)
- **Max Concurrent Sessions**: Varsayılan 5 (güvenlik ayarlarından yapılandırılabilir, 1-20 arası)
- **Remember Me Duration**: Varsayılan 30 gün (güvenlik ayarlarından yapılandırılabilir, 1-365 gün arası)
- **Session Timeout Provider**: Otomatik oturum sonlandırma ve uyarı sistemi
- Kullanıcı aktivitesi izlenir (mouse, keyboard, scroll, click event'leri)
- Zaman aşımından 1 dakika önce uyarı modalı gösterilir
- Otomatik logout ve login sayfasına yönlendirme
- localStorage temizleme işlemi

**Data Protection**:
- Encryption (PostgreSQL native, AES-256 files, HTTPS/TLS 1.3)
- Multi-Tenant Isolation (separate database per tenant)

**API Security**:
- Rate Limiting (100 req/15min global, 10 req/15min auth)
- Input Validation (Zod schema, SQL injection prevention, XSS protection)

**Audit & Compliance**:
- Audit Logging (authentication, permissions, data modifications)
- Log Retention (90 days minimum)
- GDPR/KVKK Compliance

### 17.3. Security Checklist

- [ ] Strong JWT secrets configured
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Database backups automated
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Audit logging enabled

---

## 📚 Ek Dokümantasyon

- **OMNEX_SAAS_DOKUMAN_V2.md**: Ana dokümantasyon
- **docs/DEPLOYMENT.md**: Detaylı deployment rehberi
- **docs/SECURITY.md**: Güvenlik politikası
- **docs/MULTI_TENANT_SETUP.md**: Multi-tenant setup rehberi
- **prisma/docs/**: Prisma dokümantasyonu

---

**Son Güncelleme**: 2025-12-15  
**Dokümantasyon Versiyonu**: 2.0.0

