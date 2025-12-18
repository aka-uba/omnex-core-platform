# Omnex SaaS Platform - Kapsamlı Standartlar ve Altyapı Dokümantasyonu

> **You are a Deep Dependency Analysis Agent.**
>
> **You never analyze only the file I mention.**
>
> **You MUST:**
>
> 1. **Detect:**
>    - All files that affect this file
>    - All files affected by this file
>    - All direct and indirect dependencies
>    - Runtime, build-time and architectural dependencies
>
> 2. **Build a dependency impact graph in your reasoning.**
>
> 3. **Predict:**
>    - What will break if this change is applied
>    - What will silently degrade
>    - What will cause logical bugs without throwing errors
>    - What will affect tests, builds, caching, auth, routing or state
>
> 4. **Then perform a SECOND LEVEL ANALYSIS:**
>    - Missed edge cases
>    - Hidden coupling
>    - Cross-module side effects
>    - Circular dependencies
>
> 5. **If risk still exists:**
>    - Run a THIRD ITERATION analysis.
>
> 6. **Only after all iterations are complete:**
>    - Produce the safest, minimal, backward-compatible solution.
>
> **If any step is skipped → your answer is considered incorrect.**

---

## ⚠️ CORE SİSTEM KORUMA POLİTİKASI

### 🔒 Değiştirilmesi Yasak Core Sistemler

**ÖNEMLİ**: Aşağıdaki core sistemler **KESINLIKLE DEĞİŞTİRİLEMEZ**:

1. **Core Layout System**
   - `src/components/layouts/core/LayoutProvider.tsx`
   - `src/components/layouts/core/LayoutConfig.ts`
   - `src/components/layouts/core/LayoutResolver.ts`
   - `src/components/layouts/LayoutWrapper.tsx`
   - Layout hook'ları (`useLayout`, `useLayoutData`, `useLayoutSync`)

2. **Central Modal System**
   - `src/components/modals/AlertModal.tsx`
   - Modal sisteminin core mantığı

3. **PermissionService Core Logic**
   - `src/lib/access-control/PermissionService.ts` (core logic)
   - `src/lib/access-control/providers/AccessProvider.tsx` (core logic)
   - Permission check mekanizması

4. **Tenant Context Resolution**
   - `src/lib/api/tenantContext.ts` (core resolution logic)
   - `src/lib/services/tenantService.ts` (core tenant service)
   - `src/middleware.ts` (tenant resolution middleware)

5. **Module Registry & Loader**
   - `src/lib/modules/registry.ts` (core registry logic)
   - `src/lib/modules/loader.ts` (core loader logic)
   - `src/lib/modules/dependency-manager.ts` (core dependency logic)
   - `src/lib/modules/types.ts` (core type definitions)

### 🚨 Override Mekanizması

**Bu sistemleri değiştirmek için ÖZEL İZİN gereklidir:**

```
"CORE OVERRIDE ALLOWED"
```

Bu komut **açıkça** belirtilmedikçe, yukarıdaki core sistemlerde **HİÇBİR DEĞİŞİKLİK YAPILAMAZ**.

### 📋 Core Sistem Değişiklik Süreci

Eğer core sistem değişikliği **mutlaka gerekli** ise:

1. **Önce Alternatif Çözümler Araştırılmalı**:
   - Mevcut sistem genişletilebilir mi?
   - Plugin/Extension mekanizması kullanılabilir mi?
   - Wrapper pattern ile çözülebilir mi?

2. **Değişiklik Gerekçesi Dokümante Edilmeli**:
   - Neden core sistem değişikliği gerekli?
   - Alternatif çözümler neden yeterli değil?
   - Risk analizi yapıldı mı?

3. **Explicit Override Komutu**:
   - Kullanıcıdan **"CORE OVERRIDE ALLOWED"** komutu alınmalı
   - Bu komut olmadan değişiklik yapılmamalı

4. **Değişiklik Sonrası**:
   - Tüm bağımlılıklar test edilmeli
   - Breaking change analizi yapılmalı
   - Dokümantasyon güncellenmeli
   - Migration planı hazırlanmalı

### ⚡ İzin Verilen Değişiklikler

Core sistemlerin **kullanımı** ve **genişletilmesi** serbesttir:

- ✅ Core sistemleri **kullanmak** (import, çağırmak)
- ✅ Core sistemleri **genişletmek** (yeni özellikler eklemek - breaking change olmadan)
- ✅ Core sistemlerin **üzerine wrapper** yazmak
- ✅ Core sistemlerin **ayarlarını** değiştirmek (config dosyaları)
- ✅ Core sistemlerin **dokümantasyonunu** güncellemek

### ❌ Yasak Değişiklikler

Core sistemlerin **core mantığını** değiştirmek yasaktır:

- ❌ Core sistemlerin **internal logic**'ini değiştirmek
- ❌ Core sistemlerin **API signature**'ını değiştirmek (breaking change)
- ❌ Core sistemlerin **type definitions**'ını değiştirmek (breaking change)
- ❌ Core sistemlerin **dependency resolution** mantığını değiştirmek
- ❌ Core sistemlerin **tenant context** mantığını değiştirmek

### 🔍 Core Sistem Dosyaları Listesi

**Kesinlikle Değiştirilemez Dosyalar**:

```
src/components/layouts/core/
  ├── LayoutProvider.tsx          ❌
  ├── LayoutConfig.ts             ❌
  └── LayoutResolver.ts           ❌

src/components/layouts/
  └── LayoutWrapper.tsx           ❌

src/components/modals/
  └── AlertModal.tsx              ❌

src/lib/access-control/
  ├── PermissionService.ts       ❌ (core logic only)
  └── providers/
      └── AccessProvider.tsx      ❌ (core logic only)

src/lib/api/
  └── tenantContext.ts            ❌ (core resolution only)

src/lib/services/
  └── tenantService.ts            ❌ (core service only)

src/lib/modules/
  ├── registry.ts                 ❌
  ├── loader.ts                   ❌
  ├── dependency-manager.ts       ❌
  └── types.ts                    ❌ (core types only)

src/middleware.ts                 ❌ (tenant resolution only)
```

**Not**: Bu dosyaların **kullanımı** ve **genişletilmesi** serbesttir, sadece **core mantığının değiştirilmesi** yasaktır.

---

## 🎯 İÇERİK ÜRETİM KISITLAMALARI

### ✅ İzin Verilen İçerik Türleri

**SADECE aşağıdaki içerik türleri üretilebilir:**

1. **i18n Texts (Çeviri Metinleri)**
   - `src/locales/global/{locale}.json`
   - `src/locales/modules/{module-slug}/{locale}.json`
   - Translation key'leri ve değerleri
   - Tüm desteklenen diller için (tr, en, de, ar)

2. **UI Copy (Kullanıcı Arayüzü Metinleri)**
   - Button label'ları
   - Form label'ları
   - Placeholder metinleri
   - Tooltip metinleri
   - Help text'leri

3. **Empty State Messages (Boş Durum Mesajları)**
   - "Veri bulunamadı" mesajları
   - "Henüz öğe eklenmemiş" mesajları
   - Empty state illustration metinleri

4. **Validation Messages (Doğrulama Mesajları)**
   - Form validation error mesajları
   - Field validation mesajları
   - Zod schema validation mesajları
   - Custom validation mesajları

5. **Confirmation Modals (Onay Modal Mesajları)**
   - Delete confirmation mesajları
   - Action confirmation mesajları
   - Warning mesajları
   - Info mesajları

6. **Onboarding Texts (Karşılama Metinleri)**
   - Welcome mesajları
   - Tutorial metinleri
   - Help guide metinleri
   - Feature introduction metinleri

### ❌ Yasak İçerik Türleri

**AŞAĞIDAKİ İÇERİKLERE DOKUNULAMAZ:**

1. **Schema (Veritabanı Şemaları)**
   - `prisma/core.schema.prisma`
   - `prisma/tenant.schema.prisma`
   - `prisma/schema.prisma`
   - Model tanımları
   - Field tanımları
   - Relation tanımları
   - Index tanımları

2. **API (API Route'ları)**
   - `src/app/api/**/*.ts`
   - API endpoint'leri
   - Request/Response handler'ları
   - API logic

3. **Services (Servis Katmanı)**
   - `src/lib/services/**/*.ts`
   - Business logic
   - Data processing
   - External API integration

4. **Hooks (React Hook'ları)**
   - `src/hooks/**/*.ts`
   - Custom React hooks
   - Hook logic
   - Hook dependencies

### 📋 İçerik Üretim Süreci

#### Adım 1: İçerik Türü Belirleme

Önce hangi tür içerik üretileceği belirlenmelidir:
- i18n text mi?
- UI copy mi?
- Validation message mı?
- vb.

#### Adım 2: Doğru Dosyaya Ekleme

İçerik türüne göre doğru dosyaya eklenmelidir:

**i18n Texts için**:
```
src/locales/
├── global/
│   └── {locale}.json
└── modules/
    └── {module-slug}/
        └── {locale}.json
```

**UI Copy için**:
- Component içinde `t('key')` kullanılmalı
- Translation key'leri i18n dosyalarına eklenmeli

**Validation Messages için**:
- Zod schema'larında `z.string().min(1, 'error.message')`
- i18n dosyalarına error mesajları eklenmeli

#### Adım 3: Tüm Dillere Ekleme

Her içerik **tüm desteklenen dillere** eklenmelidir:
- `tr.json` (Türkçe)
- `en.json` (İngilizce)
- `de.json` (Almanca)
- `ar.json` (Arapça)

#### Adım 4: Key Yapısı Kontrolü

Translation key'leri hiyerarşik yapıda olmalıdır:
```json
{
  "category": {
    "subcategory": {
      "key": "value"
    }
  }
}
```

### ⚠️ Önemli Notlar

1. **Schema, API, Services, Hooks'a dokunulmaz**
   - Bu dosyalar sadece **okunabilir**
   - İçerik üretimi sırasında bu dosyalar referans olarak kullanılabilir
   - Ancak **değiştirilemez**

2. **Sadece Metin İçeriği**
   - Kod logic'i değiştirilemez
   - Sadece kullanıcıya gösterilen metinler üretilebilir

3. **i18n Uyumluluk**
   - Tüm üretilen içerikler i18n uyumlu olmalıdır
   - Hardcoded string'ler kullanılmamalıdır

4. **Dil Tutarlılığı**
   - Tüm dillerde aynı key yapısı kullanılmalıdır
   - Çeviriler tutarlı olmalıdır

### 📝 İçerik Üretim Checklist

Her içerik üretimi için:

- [ ] İçerik türü doğru belirlendi (i18n, UI copy, validation, vb.)
- [ ] Doğru dosyaya eklendi
- [ ] Tüm dillere eklendi (tr, en, de, ar)
- [ ] Key yapısı hiyerarşik ve tutarlı
- [ ] Schema/API/Services/Hooks'a dokunulmadı
- [ ] Hardcoded string kullanılmadı
- [ ] i18n uyumluluk kontrol edildi

---

## 📋 İçindekiler

0. [⚠️ Core Sistem Koruma Politikası](#-core-sistem-koruma-politikası)
0.1. [🎯 İçerik Üretim Kısıtlamaları](#-içerik-üretim-kısıtlamaları)
1. [Platform Genel Bakış](#1-platform-genel-bakış)
2. [Tasarım Sistemi ve Stil Yapısı](#2-tasarım-sistemi-ve-stil-yapısı)
3. [Merkezi Sistemler](#3-merkezi-sistemler)
4. [Tenant Yapısı ve Routing](#4-tenant-yapısı-ve-routing)
5. [Veritabanı Şeması ve Migration Standartları](#5-veritabanı-şeması-ve-migration-standartları)
6. [Sayfa Yapısı ve Header Standartları](#6-sayfa-yapısı-ve-header-standartları)
7. [Layout Sistemi](#7-layout-sistemi)
8. [Rol ve İzin Sistemi (RBAC)](#8-rol-ve-izin-sistemi-rbac)
9. [Modül Sistemi ve Bağımlılıklar](#9-modül-sistemi-ve-bağımlılıklar)
10. [Uluslararasılaştırma (i18n)](#10-uluslararasılaştırma-i18n)
11. [API Standartları](#11-api-standartları)
12. [Bağımlılık Analizi ve Etki Grafiği](#12-bağımlılık-analizi-ve-etki-grafiği)
13. [Versiyon Yönetimi](#13-versiyon-yönetimi)
14. [Sayfa Üretim Standartları](#14-sayfa-üretim-standartları)
15. [Değişiklik Yapma Standartları](#15-değişiklik-yapma-standartları)

---

## 1. Platform Genel Bakış

### 1.1. Teknoloji Yığını

| Kategori | Teknoloji | Versiyon | Amaç |
|----------|-----------|----------|------|
| **Framework** | Next.js | 16.0.3 | App Router, SSR, SSG |
| **UI Library** | React | 19.2.0 | UI framework |
| **UI Library** | Mantine UI | 8.3.9 | Birincil UI bileşenleri |
| **Styling** | Tailwind CSS | 4 | Layout utilities ve responsive grid |
| **Styling** | CSS Modules | - | Component bazlı animasyonlar |
| **Database** | PostgreSQL | - | Multi-tenant veritabanı |
| **ORM** | Prisma | 5.22.0 | Type-safe database access |
| **i18n** | next-intl | 4.5.6 | Uluslararasılaştırma |
| **State** | React Query | 5.90.10 | Server state yönetimi |
| **Forms** | React Hook Form | 7.66.1 | Form yönetimi |
| **Validation** | Zod | 4.1.12 | Schema validasyonu |

### 1.2. Versiyon Bilgisi

- **Mevcut Versiyon**: 1.0.9 (package.json, version.txt)
- **Dokümantasyon Versiyonu**: 1.0.10 (güncellenmeli)
- **Platform Adı**: Omnex-Core - Agency Operating System
- **Lisans**: Private

### 1.3. Mimari Model

**Shared Codebase + Per-Tenant Database + Subdomain/Path Routing + Tenant Context**

---

## 2. Tasarım Sistemi ve Stil Yapısı

### 2.1. Stil Stratejisi (Canonical Rules)

#### 2.1.1. Mantine UI - Birincil Stil Sistemi

**Kural**: Mantine UI v8, tüm component görselleri için birincil stil sistemidir.

**Kullanım**:
- Component görselleri (renkler, border-radius, gölgeler, tipografi) Mantine theme üzerinden yönetilir
- Tüm tasarım token'ları CSS custom properties olarak `src/styles/_tokens.css` içinde tanımlanır
- Mantine theme bu token'ları `src/theme.ts` üzerinden map eder
- **Yasak**: Mantine component'lerde doğrudan `style` attribute override kullanımı

**Örnek**:
```tsx
// ✅ Doğru
<Button variant="filled" color="primary">Click</Button>

// ❌ Yanlış
<Button style={{ backgroundColor: '#ff0000' }}>Click</Button>
```

#### 2.1.2. Tailwind CSS - Sadece Layout Utilities

**Kural**: Tailwind CSS sadece layout utilities ve responsive grid için kullanılır.

**Kullanım**:
- `flex`, `grid`, `gap-4`, `p-4`, `m-2`, `w-full`, `h-screen`
- `md:flex-row`, `lg:grid-cols-3` gibi responsive utilities
- **Yasak**: Visual token override'ları (renkler, gölgeler, border'lar Mantine theme'den gelmeli)

**Örnek**:
```tsx
// ✅ Doğru
<div className="flex gap-4 md:grid md:grid-cols-2">
  <Card>...</Card>
</div>

// ❌ Yanlış
<div className="bg-red-500 text-white shadow-lg">...</div>
```

#### 2.1.3. CSS Modules - Animasyonlar ve Karmaşık Selector'lar

**Kural**: CSS Modules, component bazlı animasyonlar ve karmaşık selector'lar için kullanılır.

**Kullanım**:
- Dosya adlandırma: `ComponentName.module.css`
- Import: `import styles from './ComponentName.module.css'`
- Animasyonlar, transitions, component-specific styling

**Örnek**:
```tsx
// ✅ Doğru
import styles from './Component.module.css';
<div className={styles.animatedBox}>...</div>
```

#### 2.1.4. Design Tokens - CSS Custom Properties

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
- **Colors**: Primary palette, semantic colors (bg, text, border)
- **Spacing**: xs, sm, md, lg, xl, 2xl, 3xl
- **Border Radius**: xs, sm, md, lg, xl, full
- **Shadows**: sm, md, lg, xl
- **Typography**: Font sizes, line heights, font families

**Örnek Token Tanımı**:
```css
:root {
  --color-primary-600: #228be6;
  --bg-primary: #ffffff;
  --text-primary: #212529;
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
  --shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
```

### 2.2. Dark Mode Desteği

**Kural**: Tüm component'ler dark mode'u desteklemelidir.

**Uygulama**:
- CSS variables `[data-mantine-color-scheme="dark"]` selector'ü ile override edilir
- Mantine theme otomatik olarak dark mode'u yönetir
- Component'lerde manuel dark mode kontrolü gerekmez

**Örnek**:
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #212529;
}

[data-mantine-color-scheme="dark"] {
  --bg-primary: #202124;
  --text-primary: #e8eaed;
}
```

### 2.3. Responsive Tasarım

**Breakpoint'ler**:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

**Kural**: Tüm component'ler mobile-first yaklaşımı ile tasarlanmalıdır.

**Örnek**:
```tsx
// ✅ Doğru
<div className="flex flex-col md:flex-row gap-4">
  <Card className="w-full md:w-1/2">...</Card>
</div>
```

---

## 3. Merkezi Sistemler

### 3.1. Merkezi Modal Sistemi

#### 3.1.1. AlertModal - Onay ve Uyarı Modal'ları

**Konum**: `src/components/modals/AlertModal.tsx`

**Amaç**: Sadece uyarılar ve onaylar için kullanılır.

**Tasarım Felsefesi**:
- **NÖTR ve RENKSİZDİR**
- Standart modal stillendirme, renk kodlaması yok
- Renkler notification sistemi (toast) için ayrılmıştır

**Props**:
```typescript
interface AlertModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  size?: string;
}
```

**Kullanım**:
```tsx
import { AlertModal } from '@/components/modals/AlertModal';

<AlertModal
  opened={opened}
  onClose={onClose}
  title="Confirm Delete"
  message="Are you sure you want to delete this item?"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  variant="danger"
/>
```

**Özellikler**:
- ESC tuşu ile kapatma
- Backdrop tıklaması ile kapatma
- Responsive tasarım
- Dark mode desteği
- Loading state desteği

#### 3.1.2. Form Modal Kullanımı

**Not**: Form modal'ları için `AlertModal` kullanılabilir veya Mantine'in `Modal` component'i doğrudan kullanılabilir.

**Özellikler**:
- Standard Card Style
- Form content alanı
- Theme-aware
- Responsive

### 3.2. Bildirim Sistemi (Notification System)

#### 3.2.1. ToastNotification - Geçici Bildirimler

**Konum**: `src/modules/notifications/components/ToastNotification.tsx`

**Amaç**: Non-blocking, temporary feedback mesajları.

**Özellikler**:
- **Position**: Top-center of viewport
- **Max Visible**: Maximum 5 toast gösterilir
- **Auto-dismiss**: Varsayılan 4000ms (4 saniye)
- **Pause on Hover**: Timer hover'da duraklar
- **Progress Bar**: Kalan süre göstergesi
- **Theme-aware**: CSS variables kullanır

**Renk Kodlaması**:
- **Info**: Blue (`--toast-info-*`)
- **Success**: Green (`--toast-success-*`)
- **Warning**: Yellow/Orange (`--toast-warning-*`)
- **Error**: Red (`--toast-error-*`)

**Kullanım**:
```tsx
import { showToast } from '@/modules/notifications/components/ToastNotification';

showToast({
  type: 'success',
  title: 'Saved',
  message: 'Your changes have been saved.',
  duration: 4000,
});
```

#### 3.2.2. NotificationBell - Bildirim Çanı

**Konum**: `src/modules/notifications/components/NotificationBell.tsx`

**Amaç**: Header'da bildirim çanı ve dropdown.

**Özellikler**:
- Unread notification count badge
- Dropdown ile notification listesi
- Mark as read/unread
- Browser notification permission

### 3.3. Merkezi Tablo Sistemi (DataTable)

**Konum**: `src/components/tables/DataTable.tsx`

**Amaç**: Tüm sayfalarda kullanılacak merkezi tablo bileşeni.

#### 3.3.1. Özellikler

1. **Search Box**: Global search input, gerçek zamanlı filtreleme
2. **Filter Icon & Modal**: `FilterModal` ile tarih aralığı, kolon bazlı filtreler
3. **Column Settings Icon & Modal**: Drag & drop kolon sıralama, kolon görünürlük toggle
4. **Export Icons**: Context-aware export menü (CSV, Excel, Word, PDF, Print, HTML)
5. **Bulk Selection & Actions**: Checkbox seçimi, bulk delete, bulk download
6. **Pagination Controls**: Previous/Next, sayfa numarası, records per page selector
7. **Actions Column**: "..." dropdown menü veya yan yana ikonlar

#### 3.3.2. Props Interface

```typescript
export interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  searchable?: boolean;
  sortable?: boolean;
  pageable?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  filters?: FilterOption[];
  onFilter?: (filters: Record<string, any>) => void;
  showColumnSettings?: boolean;
  onColumnReorder?: (columns: DataTableColumn[]) => void;
  onColumnToggle?: (columnKey: string, visible: boolean) => void;
  onExport?: (format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => void;
  showExportIcons?: boolean;
}
```

#### 3.3.3. Kullanım

```tsx
import { DataTable } from '@/components/tables/DataTable';

<DataTable
  columns={columns}
  data={data}
  searchable={true}
  sortable={true}
  pageable={true}
  defaultPageSize={25}
  onExport={(format) => handleExport(format)}
  showExportIcons={true}
/>
```

### 3.4. Skeleton Sistemi

**Konum**: `src/components/skeletons/`

**Amaç**: Sayfa yüklenirken tutarlı loading state'leri göstermek için reusable skeleton componentler.

#### 3.4.1. Temel Skeleton Componentler

| Component | Dosya | Kullanım Alanı |
|-----------|-------|----------------|
| `HeaderSkeleton` | `HeaderSkeleton.tsx` | Sayfa başlıkları (breadcrumbs, title, actions) |
| `ListPageSkeleton` | `ListPageSkeleton.tsx` | Liste sayfaları (header + table) |
| `FormPageSkeleton` | `FormPageSkeleton.tsx` | Form sayfaları (header + tabs + form fields) |
| `DetailPageSkeleton` | `DetailPageSkeleton.tsx` | Detay sayfaları (tabs + content) |
| `DataTableSkeleton` | `../tables/DataTableSkeleton.tsx` | Tablo skeleton (toolbar + rows + pagination) |

#### 3.4.2. HeaderSkeleton Props

```typescript
interface HeaderSkeletonProps {
  showBreadcrumbs?: boolean;  // default: true
  showDescription?: boolean;  // default: true
  showActions?: boolean;      // default: true
  actionsCount?: number;      // default: 1
}
```

#### 3.4.3. ListPageSkeleton Props

```typescript
interface ListPageSkeletonProps {
  showHeader?: boolean;       // default: true
  showBreadcrumbs?: boolean;  // default: true
  showDescription?: boolean;  // default: true
  actionsCount?: number;      // default: 1
  columns?: number;           // default: 5
  rows?: number;              // default: 8
  showToolbar?: boolean;      // default: true
}
```

#### 3.4.4. FormPageSkeleton Props

```typescript
interface FormPageSkeletonProps {
  showHeader?: boolean;       // default: true
  showBreadcrumbs?: boolean;  // default: true
  showTabs?: boolean;         // default: false
  tabsCount?: number;         // default: 4
  fieldsCount?: number;       // default: 6
  showTextarea?: boolean;     // default: true
  showActions?: boolean;      // default: true
}
```

#### 3.4.5. Kullanım Kuralları

**DOĞRU Kullanım**:
```tsx
// Liste sayfası skeleton'u
import { ListPageSkeleton } from '@/components/skeletons';

export function UsersPageSkeleton() {
  return <ListPageSkeleton columns={6} rows={5} actionsCount={1} />;
}

// Form sayfası skeleton'u
import { FormPageSkeleton } from '@/components/skeletons';

export function CreateUserPageSkeleton() {
  return <FormPageSkeleton showTabs={true} tabsCount={6} fieldsCount={8} />;
}
```

**YANLIŞ Kullanım**:
```tsx
// ❌ CentralPageHeader skeleton içinde kullanılmamalı
export function PageSkeleton() {
  return (
    <Container>
      <CentralPageHeader ... />  {/* ❌ YANLIŞ - Header duplicate olur */}
      <Skeleton ... />
    </Container>
  );
}
```

#### 3.4.6. Skeleton Tasarım Prensipleri

1. **Header Duplicate Yasak**: Skeleton'lar CentralPageHeader kullanmamalı, bunun yerine HeaderSkeleton kullanmalı
2. **Reusable Componentler**: Mümkün olduğunca merkezi skeleton componentleri kullanılmalı
3. **Tutarlı Görünüm**: Tüm skeleton'lar aynı stil ve animasyonları kullanmalı
4. **Responsive**: Skeleton'lar responsive tasarımı desteklemeli

#### 3.4.7. Özel Skeleton Durumları

Karmaşık sayfalar için (istatistik kartları, özel bölümler vb.) özel skeleton oluşturulabilir:

```tsx
import { Container, Skeleton } from '@mantine/core';
import { HeaderSkeleton } from '@/components/skeletons';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

export function CustomPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <HeaderSkeleton actionsCount={2} />

      {/* Özel içerik skeleton'u */}
      <Paper p="md" mb="lg">
        <Skeleton height={100} />
      </Paper>

      <DataTableSkeleton columns={5} rows={8} />
    </Container>
  );
}
```

### 3.5. Merkezi Export Sistemi

**Konum**: `src/lib/export/ExportProvider.tsx`

**Amaç**: Tüm export işlemleri için merkezi sistem.

#### 3.4.1. Desteklenen Formatlar

- **CSV**: `exportToCSV(data, options)`
- **Excel**: `exportToExcel(data, options)`
- **Word**: `exportToWord(data, options)`
- **PDF**: `exportToPDF(data, options)`
- **HTML**: `exportToHTML(data, options)`
- **Print**: `printData(data, options)`
- **ZIP**: `exportToZIP(files, zipFilename)`

#### 3.4.2. Export Options

```typescript
interface ExportOptions {
  format: 'csv' | 'excel' | 'word' | 'pdf' | 'html' | 'print';
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  tableStyle?: 'professional' | 'minimal';
  filename?: string;
  dateRange?: { start: Date; end: Date };
}
```

#### 3.4.3. Kullanım

```tsx
import { useExport } from '@/lib/export/ExportProvider';

const { exportToExcel, exportToPDF, isExporting } = useExport();

// Excel export
await exportToExcel(data, {
  includeHeader: true,
  filename: 'report.xlsx',
});

// PDF export
await exportToPDF(data, {
  includePageNumbers: true,
  tableStyle: 'professional',
});
```

#### 3.4.4. Company Settings Entegrasyonu

Export işlemleri otomatik olarak company settings'den (logo, company name, vb.) bilgileri alır.

---

## 4. Tenant Yapısı ve Routing

### 4.1. Multi-Tenant Mimarisi

**Model**: Per-Tenant Database Architecture

**Özellikler**:
- Her tenant için ayrı PostgreSQL database
- Tam veri izolasyonu
- Yearly database rotation (`tenant_{slug}_{year}`)
- Subdomain/Path routing

### 4.2. Veritabanı Yapısı

#### 4.2.1. Core Database

**Schema**: `prisma/core.schema.prisma`

**Amaç**: Platform yönetimi, tenant metadata, agency bilgileri

**Modeller**:
- `Tenant`: Tenant metadata (slug, subdomain, dbName, currentDb, allDatabases[])
- `Agency`: Tenant'ların sahibi (super admin alanı)
- `Module`: Platform geneli modül tanımları
- `TenantModule`: Tenant-modül ilişkileri
- `ModulePermission`: Modül-rol izin ilişkileri
- `TenantLicense`: Tenant lisans bilgileri
- `BackupMetadata`: Yedekleme metadata

**Prisma Client**: `corePrisma` (import from `@/lib/corePrisma`)

**Environment Variable**: `CORE_DATABASE_URL`

#### 4.2.2. Tenant Databases

**Schema**: `prisma/tenant.schema.prisma`

**Amaç**: Her tenant için ayrı database, tenant'a özel tüm veriler

**Modeller**:
- `User`: Tenant kullanıcıları
- `Company`: Tenant'ın iş birimi
- `BrandKit`: Şirket marka kimliği
- `Asset`: Dosya ve varlık yönetimi
- `Content`: İçerik yönetimi
- `Finance`: Finansal kayıtlar
- `Notification`: Bildirimler
- `Report`: Raporlar
- `AIGeneration`: AI üretim geçmişi
- `Role`: Rol tanımları
- `PermissionDefinition`: İzin tanımları
- `UserPermission`: Kullanıcı izinleri
- `AuditLog`: Aktivite timeline

**Prisma Client**: `getTenantPrisma(dbUrl)` (import from `@/lib/dbSwitcher`)

**Environment Variable**: `TENANT_DATABASE_URL` (runtime'da tenant context'ten alınır)

### 4.3. Routing Sistemi

#### 4.3.1. Production Routing

**Subdomain Routing**: `acme.onwindos.com`

**Middleware**: Tenant slug subdomain'den otomatik çözümlenir

#### 4.3.2. Development/Staging Routing

**Path-based Routing**: `/tenant/acme` veya `localhost:3000/tenant/acme`

**Middleware**: Tenant slug path'ten otomatik çözümlenir

#### 4.3.3. Tenant Context Resolution

**Konum**: `src/lib/api/tenantContext.ts`

**Fonksiyon**: `resolveTenantContext(slug, source?, hostname?)`

**Özellikler**:
- In-memory caching (TTL: 5 dakika)
- Subdomain, custom domain, path-based routing desteği
- Tenant status kontrolü (sadece active tenant'lar)

**Kullanım**:
```typescript
import { requireTenantContext } from '@/lib/api/tenantContext';

const tenantContext = await requireTenantContext(request);
// Returns: { id, slug, name, dbName, currentDb, dbUrl, subdomain, customDomain }
```

### 4.4. Yearly Database Rotation

**İsimlendirme**: `tenant_{slug}_{year}`

**Örnek**: `tenant_acme_2025`, `tenant_acme_2026`

**Özellikler**:
- Yeni yıl başında yeni DB oluşturulur
- Eski DB'ler arşivlenebilir
- `allDatabases[]` array'inde tüm DB'ler tutulur
- `currentDb` aktif yıl database'ini gösterir

---

## 5. Veritabanı Şeması ve Migration Standartları

### 5.1. Schema Yapısı

#### 5.1.1. Dual Schema System

**Core Schema**: `prisma/core.schema.prisma`
- Generator output: `../node_modules/.prisma/core-client`
- Datasource: `CORE_DATABASE_URL`

**Tenant Schema**: `prisma/tenant.schema.prisma`
- Generator output: `../node_modules/.prisma/tenant-client`
- Datasource: `TENANT_DATABASE_URL` (runtime'da değişir)

#### 5.1.2. Schema Standartları

**Naming Conventions**:
- Model isimleri: PascalCase (`User`, `Company`, `Notification`)
- Field isimleri: camelCase (`firstName`, `createdAt`)
- Relation field'ları: camelCase (`userId`, `companyId`)

**Index Standartları**:
- Primary key: `@id @default(uuid())` veya `@id @default(cuid())`
- Unique constraint: `@unique` veya `@@unique([field1, field2])`
- Index: `@@index([field])` veya `@@index([field1, field2])`

**Relation Standartları**:
- Foreign key: `@relation(fields: [fieldId], references: [id])`
- Cascade delete: `onDelete: Cascade`
- Set null: `onDelete: SetNull`

### 5.2. Migration Standartları

#### 5.2.1. Migration İsimlendirme

**Format**: `YYYYMMDDHHMMSS_description`

**Örnek**: `20250101000001_init`, `20250101000002_add_core_file_management`

#### 5.2.2. Migration Oluşturma

**Core Database**:
```bash
CORE_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/core.schema.prisma --name migration_name
```

**Tenant Database**:
```bash
TENANT_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/tenant.schema.prisma --name migration_name
```

#### 5.2.3. Migration Uygulama

**Development**:
```bash
npx prisma migrate dev --schema=prisma/core.schema.prisma
npx prisma migrate dev --schema=prisma/tenant.schema.prisma
```

**Production**:
```bash
npx prisma migrate deploy --schema=prisma/core.schema.prisma
npx prisma migrate deploy --schema=prisma/tenant.schema.prisma
```

#### 5.2.4. Prisma Client Generate

**Her migration sonrası**:
```bash
npx prisma generate --schema=prisma/core.schema.prisma
npx prisma generate --schema=prisma/tenant.schema.prisma
```

#### 5.2.5. Migration Best Practices

1. **Backward Compatibility**: Migration'lar geriye dönük uyumlu olmalı
2. **Data Migration**: Veri taşıma işlemleri ayrı migration'larda yapılmalı
3. **Index Creation**: Büyük tablolarda index'ler ayrı migration'da oluşturulmalı
4. **Testing**: Her migration test edilmeli
5. **Documentation**: Migration'lar dokümante edilmeli

---

## 6. Sayfa Yapısı ve Header Standartları

### 6.1. Sayfa Yapısı

#### 6.1.1. Route Yapısı

```
/[locale]/
  ├── /                    # Ana sayfa
  ├── /dashboard           # Dashboard
  ├── /modules             # Modül sayfaları
  │   ├── /[module-slug]   # Modül ana sayfası
  │   ├── /[module-slug]/dashboard
  │   ├── /[module-slug]/[entity]  # Entity listesi
  │   ├── /[module-slug]/[entity]/create
  │   ├── /[module-slug]/[entity]/[id]
  │   └── /[module-slug]/[entity]/[id]/edit
  ├── /management          # Yönetim sayfaları
  │   ├── /users
  │   ├── /roles
  │   └── /permissions
  ├── /admin               # Admin sayfaları
  │   ├── /tenants
  │   ├── /licenses
  │   └── /system
  └── /settings            # Ayarlar
      ├── /company
      │   └── /locations    # Lokasyon yönetimi (core özellik)
      ├── /profile
      └── /menu-management
```

#### 6.1.2. Sayfa Dosya Yapısı

**Server Component (page.tsx)**:
```tsx
import { ComponentNamePageClient } from './ComponentNamePageClient';

export const dynamic = 'force-dynamic';

export default async function ComponentNamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ComponentNamePageClient locale={locale} />;
}
```

**Client Component (ComponentNamePageClient.tsx)**:
```tsx
'use client';

import { Container } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';

export function ComponentNamePageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/module-name');
  
  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('page.title')}
        description={t('page.description')}
        namespace="modules/module-name"
        icon={<IconName size={32} />}
        breadcrumbs={[...]}
        actions={[...]}
      />
      {/* Page content */}
    </Container>
  );
}
```

### 6.2. CentralPageHeader Standartları

**Konum**: `src/components/headers/CentralPageHeader.tsx`

#### 6.2.1. Props Interface

```typescript
interface CentralPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  namespace?: string; // i18n namespace
}
```

#### 6.2.2. Breadcrumb Yapısı

```typescript
interface BreadcrumbItem {
  label: string; // i18n key
  href: string;
  namespace?: string; // i18n namespace (default: 'global')
}
```

**Örnek**:
```tsx
breadcrumbs={[
  { 
    label: 'navigation.dashboard', 
    href: `/${locale}/dashboard`, 
    namespace: 'global' 
  },
  { 
    label: 'menu.label', 
    href: `/${locale}/modules/module-name`, 
    namespace: 'modules/module-name' 
  },
  { 
    label: t('page.title'), 
    namespace: 'modules/module-name' 
  },
]}
```

#### 6.2.3. Action Buttons

```typescript
interface ActionButton {
  label: string; // i18n key veya direkt text
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string; // Link button için
  variant?: string;
  color?: string;
}
```

**Örnek**:
```tsx
actions={[
  {
    label: t('actions.create'),
    icon: <IconPlus size={18} />,
    onClick: () => router.push(`/${locale}/modules/module-name/create`),
    variant: 'filled',
  },
]}
```

#### 6.2.4. Kullanım Standartları

1. **Tüm sayfalarda kullanılmalı**: Her sayfa `CentralPageHeader` kullanmalı
2. **i18n zorunlu**: Tüm metinler i18n key'leri ile sağlanmalı
3. **Icon zorunlu**: Her sayfa için uygun icon seçilmeli
4. **Breadcrumb zorunlu**: Navigation için breadcrumb sağlanmalı
5. **Actions opsiyonel**: Gerekli durumlarda action button'lar eklenmeli

---

## 7. Layout Sistemi

### 7.1. Layout Tipleri

#### 7.1.1. Sidebar Layout

**Konum**: `src/components/layouts/sidebar/SidebarLayout.tsx`

**Özellikler**:
- Sol tarafta daraltılabilir/genişletilebilir sidebar
- Ana içerik alanı
- Üst header bar
- Alt footer
- Responsive tasarım
- Dark/Light mode desteği

**Sidebar Genişliği**:
- Genişletilmiş: 16rem (260px)
- Daraltılmış: 4rem (64px)

#### 7.1.2. Top Layout

**Konum**: `src/components/layouts/top/TopLayout.tsx`

**Özellikler**:
- Üstte sticky header
- Horizontal menü navigasyonu
- Mobil hamburger menü
- Ana içerik alanı
- Alt footer
- Responsive tasarım

#### 7.1.3. Mobile Layout

**Konum**: `src/components/layouts/mobile/MobileLayout.tsx`

**Özellikler**:
- Mobil optimizasyonu
- Bottom navigation
- Hamburger menü
- Responsive tasarım

### 7.2. Layout Context

**Konum**: `src/components/layouts/core/LayoutProvider.tsx`

**Özellikler**:
- Hibrit veri yönetimi: LocalStorage + Database
- Öncelik sistemi: User > Role > Company > Default
- Instant apply: Değişiklikler anında uygulanır
- Debounced sync: Performans için debounced database senkronizasyonu

**Kullanım**:
```tsx
import { useLayout } from '@/components/layouts/hooks/useLayout';

const { currentLayout, setLayout, config } = useLayout();
```

### 7.3. Layout Wrapper

**Konum**: `src/components/layouts/LayoutWrapper.tsx`

**Özellikler**:
- Otomatik layout seçimi (responsive)
- Auth sayfaları için layout bypass
- Layout context entegrasyonu

---

## 8. Rol ve İzin Sistemi (RBAC)

### 8.1. Roller

#### 8.1.1. SuperAdmin

**Özellikler**:
- Tüm izinlere sahip (`*` wildcard)
- Tüm modüllere erişim
- Tenant yönetimi
- Sistem yönetimi
- Modül yönetimi

#### 8.1.2. AgencyUser

**Özellikler**:
- Modül erişimi (AI, Accounting, File Manager, Notifications, HR, Maintenance)
- Common actions (create, edit, delete, export, import, print)
- Export features (CSV, Excel, PDF)
- File operations (upload, download)

#### 8.1.3. ClientUser

**Özellikler**:
- Sınırlı modül erişimi (File Manager, Notifications)
- Sınırlı actions (view, download)
- Read-only erişim çoğu özellikte

### 8.2. Permission Service

**Konum**: `src/lib/access-control/PermissionService.ts`

**Özellikler**:
- Role-based permissions
- User-specific permissions
- Permission expiration
- Resource-based permissions

**Kullanım**:
```typescript
import { PermissionService } from '@/lib/access-control/PermissionService';

const permissionService = new PermissionService(tenantPrisma);

const hasAccess = await permissionService.hasPermission({
  userId: 'user-id',
  permissionKey: 'module.action',
});
```

### 8.3. Access Provider (Frontend)

**Konum**: `src/lib/access-control/providers/AccessProvider.tsx`

**Kullanım**:
```tsx
import { useAccess } from '@/lib/access-control/hooks/useAccess';

const { hasAccess, canCreate, canEdit, canDelete } = useAccess();

if (hasAccess('module.action')) {
  // Show feature
}
```

### 8.4. Permission Key Format

**Format**: `{module}.{action}` veya `{module}.{entity}.{action}`

**Örnekler**:
- `module.ai`
- `module.accounting`
- `accounting.invoice.create`
- `accounting.invoice.edit`
- `accounting.invoice.delete`

---

## 9. Modül Sistemi ve Bağımlılıklar

### 9.1. Modül Yapısı

#### 9.1.1. Modül Dizin Yapısı

```
src/modules/
├── [module-slug]/
│   ├── module.config.yaml      # Modül konfigürasyonu
│   ├── components/             # Modül bileşenleri
│   ├── schemas/                # Zod validation schemas
│   ├── services/               # Business logic
│   ├── types/                  # TypeScript types
│   ├── hooks/                  # Custom hooks
│   ├── widgets/                # Dashboard widgets
│   └── version.txt             # Modül versiyonu
```

#### 9.1.2. module.config.yaml Yapısı

```yaml
name: "Module Name"
slug: "module-slug"
version: "1.0.0"
description: "Module description"
icon: "IconName"
author: "Omnex Team"
category: "business" # business, system, utility
minCoreVersion: "1.0.8"
dependencies:
  - slug: "dependency-module"
    version: "1.0.0"
    required: true
menu:
  main:
    label: "Module Label"
    icon: "IconName"
    href: "/modules/module-slug"
    order: 10
    permissions: ["SuperAdmin", "AgencyUser", "ClientUser"]
    items:
      - title: "Dashboard"
        path: "/modules/module-slug/dashboard"
        icon: "Dashboard"
        order: 1
settings:
  - key: "settingKey"
    label: "Setting Label"
    description: "Setting description"
    type: "boolean" # boolean, string, number, select, color
    defaultValue: true
    category: "General"
permissions:
  - key: "module.action"
    description: "Permission description"
```

### 9.2. Modül Bağımlılıkları

#### 9.2.1. Dependency Manager

**Konum**: `src/lib/modules/dependency-manager.ts`

**Özellikler**:
- SemVer tabanlı versiyon kontrolü
- Circular dependency kontrolü
- Missing dependency tespiti
- Incompatible version tespiti

#### 9.2.2. Bağımlılık Çözümleme

**Fonksiyon**: `resolveDependencies(module: ModuleManifest)`

**Return**:
```typescript
{
  valid: boolean;
  missing: string[];        // Eksik modüller
  incompatible: string[];   // Uyumsuz versiyonlar
}
```

#### 9.2.3. Circular Dependency Kontrolü

**Fonksiyon**: `checkCircularDependencies(slug: string)`

**Return**: `string[] | null` (cycle path veya null)

### 9.3. Modül Yükleme

#### 9.3.1. Module Loader

**Konum**: `src/lib/modules/loader.ts`

**Özellikler**:
- YAML konfigürasyon yükleme
- Dependency validation
- Status monitoring
- Menu yükleme

#### 9.3.2. Module Registry

**Konum**: `src/lib/modules/registry.ts`

**Özellikler**:
- Modül kayıt sistemi
- Aktif modül yönetimi
- Modül durumu takibi

### 9.4. Mevcut Modüller

**Toplam**: 22 modül

1. accounting
2. ai
3. belgeler-ve-imza
4. calendar
5. dashboard
6. egitim
7. file-manager
8. hr
9. license
10. maintenance
11. module-management
12. musteri
13. notifications
14. production
15. randevu
16. raporlar
17. real-estate
18. sohbet
19. tedarikci
20. urun
21. vardiya
22. web-builder

**Not**: 
- **locations** modülü kaldırılmıştır. Lokasyon yönetimi artık `/settings/company/locations` sayfasında core özellik olarak sunulmaktadır.
- **settings** modülü kaldırılmıştır. Ayarlar sayfaları core sistem içinde `/settings` route'u altında yönetilmektedir.
- **web-sayfa** modülü kaldırılmıştır. Web sayfa yönetimi **web-builder** modülü içinde birleştirilmiştir.

---

## 10. Uluslararasılaştırma (i18n)

### 10.1. i18n Yapısı

#### 10.1.1. Desteklenen Diller

- **tr** (Türkçe) - Varsayılan dil
- **en** (İngilizce)
- **de** (Almanca)
- **ar** (Arapça) - RTL desteği

#### 10.1.2. Çeviri Dosya Yapısı

```
src/locales/
├── global/
│   ├── tr.json
│   ├── en.json
│   ├── de.json
│   └── ar.json
└── modules/
    ├── [module-slug]/
    │   ├── tr.json
    │   ├── en.json
    │   ├── de.json
    │   └── ar.json
```

### 10.2. i18n Kullanım Kuralları

#### 10.2.1. Evrensel Kural

**TÜM kullanıcıya yönelik metinler i18n çevirileri kullanmalı**

#### 10.2.2. Translation Key Format

**Format**: `{namespace}.{category}.{key}`

**Örnekler**:
- `global.buttons.save`
- `modules.real-estate.properties.title`
- `global.errors.notFound`

#### 10.2.3. Namespace'ler

- **Global UI**: `"global"` namespace (butonlar, navigasyon, hatalar, ortak)
- **Modül bazlı**: Modül adı namespace olarak (`modules/real-estate`, `modules/accounting`, vb.)

#### 10.2.4. Client Component'ler

**Hook**: `useTranslation(namespace)`

**Kullanım**:
```tsx
import { useTranslation } from '@/lib/i18n/client';

const { t } = useTranslation('modules/real-estate');

<h1>{t('properties.title')}</h1>
```

#### 10.2.5. Server Component'ler

**Fonksiyon**: `getServerTranslation(locale, namespace)`

**Kullanım**:
```tsx
import { getServerTranslation } from '@/lib/i18n/server';

const { t } = await getServerTranslation(locale, 'modules/real-estate');
```

#### 10.2.6. Fallback Mekanizması

- Çeviri bulunamazsa key döndürülür
- Varsayılan locale (tr) fallback olarak kullanılır

### 10.3. i18n Checklist

Her yeni sayfa/component için:

- [ ] Tüm hardcoded string'ler i18n key'leri ile değiştirildi
- [ ] Tüm dillerde (tr, en, de, ar) çeviriler eklendi
- [ ] Namespace doğru kullanıldı
- [ ] Client component'lerde `useTranslation` kullanıldı
- [ ] Server component'lerde `getServerTranslation` kullanıldı
- [ ] Translation key'leri hiyerarşik yapıda organize edildi

---

## 11. API Standartları

### 11.1. API Route Yapısı

```
src/app/api/
├── [resource]/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET (detail), PUT (update), DELETE
│       └── [action]/
│           └── route.ts      # Custom actions
```

### 11.2. API Standartları

#### 11.2.1. Response Format

**Success Response**:
```typescript
{
  success: true,
  data: any,
  message?: string
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,
  code?: string,
  details?: any
}
```

#### 11.2.2. Tenant Context

**Tüm API route'larında tenant context zorunludur**:

```typescript
import { requireTenantContext } from '@/lib/api/tenantContext';

export async function GET(request: NextRequest) {
  const tenantContext = await requireTenantContext(request);
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);
  
  // API logic
}
```

#### 11.2.3. Authentication

**JWT Token System**:
- Access tokens: 7 gün geçerlilik
- Refresh tokens: 30 gün geçerlilik
- HTTP-only cookies

#### 11.2.4. Error Handling

**Standart Error Handling**:
```typescript
try {
  // API logic
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: error.message || 'An error occurred',
      code: 'ERROR_CODE',
    },
    { status: 500 }
  );
}
```

### 11.3. API Endpoint Örnekleri

#### 11.3.1. List Endpoint

```typescript
// GET /api/resource
export async function GET(request: NextRequest) {
  const tenantContext = await requireTenantContext(request);
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);
  
  const items = await tenantPrisma.resource.findMany({
    where: { /* filters */ },
    include: { /* relations */ },
  });
  
  return NextResponse.json({ success: true, data: items });
}
```

#### 11.3.2. Create Endpoint

```typescript
// POST /api/resource
export async function POST(request: NextRequest) {
  const tenantContext = await requireTenantContext(request);
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);
  
  const body = await request.json();
  
  // Validation
  const validated = schema.parse(body);
  
  const item = await tenantPrisma.resource.create({
    data: validated,
  });
  
  return NextResponse.json({ success: true, data: item }, { status: 201 });
}
```

---

## 12. Bağımlılık Analizi ve Etki Grafiği

### 12.1. Bağımlılık Analizi Süreci

#### 12.1.1. Birinci Seviye Analiz

**Tespit Edilmesi Gerekenler**:
- Dosyayı etkileyen tüm dosyalar
- Dosyanın etkilediği tüm dosyalar
- Doğrudan ve dolaylı bağımlılıklar
- Runtime, build-time ve mimari bağımlılıklar

**Analiz Yöntemleri**:
1. **Import Analizi**: Dosyadaki tüm import'ları kontrol et
2. **Export Analizi**: Dosyanın export ettiği tüm fonksiyon/component'leri kontrol et
3. **Type Dependencies**: TypeScript type bağımlılıklarını kontrol et
4. **Runtime Dependencies**: Runtime'da kullanılan servis/hook'ları kontrol et

#### 12.1.2. İkinci Seviye Analiz

**Kontrol Edilmesi Gerekenler**:
- Kaçırılan edge case'ler
- Gizli coupling'ler
- Cross-module side effect'ler
- Circular dependency'ler

**Analiz Yöntemleri**:
1. **Context Dependencies**: React Context kullanımlarını kontrol et
2. **Global State**: Global state (Redux, Zustand, vb.) kullanımlarını kontrol et
3. **Event Listeners**: Event listener'ları kontrol et
4. **Side Effects**: useEffect, useMemo, useCallback bağımlılıklarını kontrol et

#### 12.1.3. Üçüncü Seviye Analiz (Gerekirse)

**Risk Değerlendirmesi**:
- Değişikliğin kırılma riski
- Sessizce bozulabilecek özellikler
- Hata fırlatmayan mantık hataları
- Test, build, cache, auth, routing veya state etkileri

**Analiz Yöntemleri**:
1. **Breaking Changes**: Geriye dönük uyumluluk kontrolü
2. **Performance Impact**: Performans etkisi analizi
3. **Security Impact**: Güvenlik etkisi analizi
4. **User Experience Impact**: Kullanıcı deneyimi etkisi analizi

### 12.2. Etki Grafiği Örnekleri

#### 12.2.1. Component Değişikliği

```
Component.tsx
  ↓
  ├─→ Styles (Component.module.css)
  │   └─→ CSS Variables (_tokens.css)
  ├─→ Types (types.ts)
  │   └─→ Shared Types (lib/types/...)
  ├─→ Hooks (useComponent.ts)
  │   ├─→ React Query (useQuery, useMutation)
  │   └─→ Custom Hooks (lib/hooks/...)
  ├─→ Services (componentService.ts)
  │   └─→ API Routes (/api/component)
  │       └─→ Tenant Context (lib/api/tenantContext.ts)
  │           └─→ Prisma Client (lib/dbSwitcher.ts)
  ├─→ i18n (locales/modules/...)
  │   └─→ Translation Files (tr.json, en.json, de.json, ar.json)
  └─→ Parent Components (pages/...)
      └─→ Layout System (components/layouts/...)
```

**Etki Analizi**:
- Component değişikliği → Styles, Types, Hooks, Services etkilenir
- Styles değişikliği → CSS Variables etkilenebilir
- Types değişikliği → Tüm kullanıcı component'ler etkilenir
- Services değişikliği → API Routes etkilenir
- i18n değişikliği → Tüm dil dosyaları etkilenir

#### 12.2.2. Schema Değişikliği

```
tenant.schema.prisma
  ↓
  ├─→ Migration (prisma/migrations/YYYYMMDD_description/)
  │   └─→ migration.sql
  │       └─→ Database (PostgreSQL)
  ├─→ Prisma Client (@prisma/tenant-client)
  │   └─→ Generated Types (node_modules/.prisma/tenant-client)
  ├─→ Services (lib/services/...)
  │   ├─→ Business Logic
  │   └─→ Data Validation (Zod schemas)
  ├─→ API Routes (/api/...)
  │   ├─→ GET /api/resource
  │   ├─→ POST /api/resource
  │   ├─→ PUT /api/resource/[id]
  │   └─→ DELETE /api/resource/[id]
  ├─→ Components (components/...)
  │   ├─→ Forms (form components)
  │   └─→ Lists (list components)
  └─→ Seed Scripts (prisma/seed/...)
```

**Etki Analizi**:
- Schema değişikliği → Migration oluşturulmalı
- Migration → Database yapısı değişir
- Prisma Client → Type definitions güncellenir
- Services → Business logic güncellenebilir
- API Routes → Request/Response formatları değişebilir
- Components → Form fields, validation rules değişebilir
- Seed Scripts → Seed data güncellenebilir

#### 12.2.3. i18n Değişikliği

```
locales/modules/module/tr.json
  ↓
  ├─→ Other Locales (en.json, de.json, ar.json)
  │   └─→ Translation Consistency
  ├─→ Components (components/...)
  │   ├─→ useTranslation Hook
  │   └─→ Translation Keys
  ├─→ Pages (app/[locale]/...)
  │   ├─→ Server Components (getServerTranslation)
  │   └─→ Client Components (useTranslation)
  └─→ API Responses (api/...)
      └─→ Error Messages
```

**Etki Analizi**:
- i18n değişikliği → Tüm dil dosyaları güncellenmeli
- Translation key değişikliği → Tüm kullanıcı component'ler güncellenmeli
- Missing translation → Fallback mekanizması devreye girer

#### 12.2.4. API Route Değişikliği

```
api/resource/route.ts
  ↓
  ├─→ Request Validation (Zod schemas)
  │   └─→ schemas/resource.schema.ts
  ├─→ Tenant Context (lib/api/tenantContext.ts)
  │   └─→ Core Database (corePrisma)
  ├─→ Prisma Client (lib/dbSwitcher.ts)
  │   └─→ Tenant Database (getTenantPrisma)
  ├─→ Services (lib/services/...)
  │   └─→ Business Logic
  ├─→ Frontend Components (components/...)
  │   ├─→ React Query (useQuery, useMutation)
  │   └─→ Form Components
  └─→ Error Handling (lib/errors/...)
      └─→ Error Messages (i18n)
```

**Etki Analizi**:
- API Route değişikliği → Request/Response formatları değişebilir
- Validation schema değişikliği → Frontend validation güncellenmeli
- Business logic değişikliği → Services güncellenebilir
- Error handling değişikliği → Error messages güncellenebilir

### 12.3. Bağımlılık Kontrol Listesi

Her değişiklik öncesi:

#### 12.3.1. Dosya Seviyesi Kontroller

- [ ] Etkilenen dosyalar tespit edildi
- [ ] Import/Export bağımlılıkları kontrol edildi
- [ ] Type bağımlılıkları kontrol edildi
- [ ] Circular dependency kontrolü yapıldı

#### 12.3.2. Modül Seviyesi Kontroller

- [ ] Etkilenen modüller belirlendi
- [ ] Modül bağımlılıkları kontrol edildi
- [ ] Cross-module side effect'ler kontrol edildi
- [ ] Modül interface'leri güncellendi

#### 12.3.3. API Seviyesi Kontroller

- [ ] API değişiklikleri kontrol edildi
- [ ] Request/Response formatları güncellendi
- [ ] Validation schemas güncellendi
- [ ] Error handling güncellendi
- [ ] API dokümantasyonu güncellendi

#### 12.3.4. Database Seviyesi Kontroller

- [ ] Schema değişiklikleri migration'a eklendi
- [ ] Migration test edildi
- [ ] Prisma Client generate edildi
- [ ] Seed scripts güncellendi
- [ ] Backward compatibility kontrol edildi

#### 12.3.5. i18n Seviyesi Kontroller

- [ ] i18n değişiklikleri tüm dillere eklendi
- [ ] Translation key'leri tutarlı
- [ ] Fallback mekanizması test edildi
- [ ] Missing translation kontrolü yapıldı

#### 12.3.6. Test ve Dokümantasyon

- [ ] Test senaryoları güncellendi
- [ ] Unit test'ler güncellendi
- [ ] Integration test'ler güncellendi
- [ ] Dokümantasyon güncellendi
- [ ] CHANGELOG güncellendi

### 12.4. Bağımlılık Analizi Araçları

#### 12.4.1. Manuel Analiz

- **Import Graph**: Dosyalardaki import'ları manuel olarak takip et
- **Type Graph**: TypeScript type bağımlılıklarını kontrol et
- **Runtime Graph**: Runtime bağımlılıklarını kontrol et

#### 12.4.2. Otomatik Analiz

- **TypeScript Compiler**: Type checking ile bağımlılıkları tespit et
- **ESLint**: Import/export kurallarını kontrol et
- **Dependency Graph Tools**: Otomatik bağımlılık grafiği oluştur

### 12.5. Risk Değerlendirme Matrisi

| Değişiklik Tipi | Kırılma Riski | Sessiz Bozulma Riski | Mantık Hatası Riski | Etki Alanı |
|-----------------|---------------|---------------------|---------------------|-----------|
| Component Styling | Düşük | Orta | Düşük | UI |
| Component Logic | Orta | Yüksek | Yüksek | UI, State |
| API Route | Yüksek | Yüksek | Yüksek | Backend, Frontend |
| Schema Change | Çok Yüksek | Çok Yüksek | Çok Yüksek | Database, Backend, Frontend |
| i18n Change | Düşük | Orta | Düşük | UI, Messages |
| Service Change | Orta | Yüksek | Yüksek | Business Logic |
| Hook Change | Orta | Yüksek | Yüksek | State, UI |
| Type Change | Yüksek | Orta | Orta | Type Safety |

### 12.6. Geriye Dönük Uyumluluk Stratejisi

#### 12.6.1. Breaking Change Yapılmadan Önce

1. **Deprecation Warning**: Eski API'yi deprecated olarak işaretle
2. **Migration Path**: Yeni API'ye geçiş yolu sağla
3. **Documentation**: Değişiklik dokümante et
4. **Version Bump**: Major version artır

#### 12.6.2. Backward Compatible Değişiklikler

1. **Additive Changes**: Sadece yeni özellikler ekle
2. **Optional Parameters**: Yeni parametreler opsiyonel olsun
3. **Default Values**: Varsayılan değerler sağla
4. **Feature Flags**: Yeni özellikler feature flag ile kontrol edilsin

---

## 13. Versiyon Yönetimi

### 13.1. Versiyonlama Standardı

**SemVer (Semantic Versioning)**:
- **MAJOR** (X.0.0): Geriye dönük uyumsuz API değişiklikleri
- **MINOR** (0.X.0): Geriye dönük uyumlu yeni özellikler
- **PATCH** (0.0.X): Geriye dönük uyumlu hata düzeltmeleri

### 13.2. Versiyon Dosyaları

#### 13.2.1. package.json

```json
{
  "version": "1.0.9"
}
```

#### 13.2.2. version.txt

```
Version: 1.0.9
Date: 2025-12-02
Notes: Modül yapısı optimize edildi...
```

#### 13.2.3. CHANGELOG.md

**Format**:
```markdown
## [1.0.9] - 2025-12-02

### ✨ Yeni Özellikler
- ...

### 🐛 Düzeltmeler
- ...
```

### 13.3. Versiyon Güncelleme Süreci

1. **Değişiklikler yapılır**
2. **package.json güncellenir**
3. **version.txt güncellenir**
4. **CHANGELOG.md güncellenir**
5. **OMNEX_SAAS_DOKUMAN.md güncellenir**
6. **Git commit ve tag oluşturulur**

### 13.4. Versiyon Tutarlılığı

**Kural**: Tüm versiyon dosyaları senkronize olmalıdır.

**Kontrol Listesi**:
- [ ] package.json versiyonu güncel
- [ ] version.txt versiyonu güncel
- [ ] CHANGELOG.md güncel
- [ ] OMNEX_SAAS_DOKUMAN.md versiyon bilgisi güncel
- [ ] OMNEX_SAAS_PLATFORM_STANDARTLAR.md versiyon bilgisi güncel

### 13.5. Versiyon Güncelleme Süreci

**Adımlar**:
1. Değişiklikler yapılır ve test edilir
2. `package.json` versiyonu güncellenir
3. `version.txt` güncellenir (tarih ve notlar ile)
4. `CHANGELOG.md` güncellenir (değişiklik kategorileri ile)
5. `OMNEX_SAAS_DOKUMAN.md` versiyon bilgisi güncellenir
6. `OMNEX_SAAS_PLATFORM_STANDARTLAR.md` versiyon bilgisi güncellenir
7. Git commit: `git commit -m "chore: bump version to X.Y.Z"`
8. Git tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`

---

## 14. Sayfa Üretim Standartları

### 14.1. Yeni Sayfa Oluşturma Süreci

#### 14.1.1. Adım 1: Route Yapısı Belirleme

**Kural**: Route yapısı modül yapısına uygun olmalıdır.

**Format**: `/[locale]/modules/[module-slug]/[entity]/[action]`

**Örnek**: `/[locale]/modules/real-estate/properties/create`

**Not**: 
- **Modül sayfaları**: `/[locale]/modules/[module-slug]/[entity]/[action]` formatında olmalıdır.
- **Core özellikler**: Modül olmayan core özellikler (ör: lokasyon yönetimi) `/settings/company/locations` gibi core route'lar altında yer alır.

#### 14.1.2. Adım 2: Dosya Yapısı Oluşturma

```
app/[locale]/modules/[module-slug]/[entity]/
├── page.tsx                    # Server component
├── [entity]PageClient.tsx      # Client component
├── create/
│   ├── page.tsx
│   └── Create[Entity]PageClient.tsx
└── [id]/
    ├── page.tsx
    ├── [entity]DetailPageClient.tsx
    └── edit/
        ├── page.tsx
        └── Edit[Entity]PageClient.tsx
```

#### 14.1.3. Adım 3: i18n Çevirileri Ekleme

**Tüm dillerde çeviriler eklenmeli**:
- `src/locales/modules/[module-slug]/tr.json`
- `src/locales/modules/[module-slug]/en.json`
- `src/locales/modules/[module-slug]/de.json`
- `src/locales/modules/[module-slug]/ar.json`

**Key Yapısı**:
```json
{
  "[entity]": {
    "title": "...",
    "description": "...",
    "create": {
      "title": "...",
      "form": {
        "fields": {
          "fieldName": {
            "label": "...",
            "placeholder": "...",
            "error": "..."
          }
        }
      }
    },
    "list": {
      "columns": {
        "columnName": "..."
      },
      "actions": {
        "create": "...",
        "edit": "...",
        "delete": "..."
      }
    }
  }
}
```

#### 14.1.4. Adım 4: API Route'ları Oluşturma

**Standart Endpoint'ler**:
- `GET /api/[module-slug]/[entity]` - List
- `GET /api/[module-slug]/[entity]/[id]` - Detail
- `POST /api/[module-slug]/[entity]` - Create
- `PUT /api/[module-slug]/[entity]/[id]` - Update
- `DELETE /api/[module-slug]/[entity]/[id]` - Delete

#### 14.1.5. Adım 5: Component'leri Oluşturma

**Standart Component'ler**:
- `[Entity]List.tsx` - List component (DataTable kullanarak)
- `[Entity]Form.tsx` - Form component (React Hook Form + Zod)
- `[Entity]Detail.tsx` - Detail component

#### 14.1.6. Adım 6: Schema Validation

**Zod Schema Oluşturma**:
```typescript
// schemas/[entity].schema.ts
import { z } from 'zod';

export const entitySchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  // ...
});
```

#### 14.1.7. Adım 7: Type Definitions

**TypeScript Types**:
```typescript
// types/[entity].ts
export interface Entity {
  id: string;
  field1: string;
  field2: number;
  // ...
}
```

### 14.2. Sayfa Template

#### 14.2.1. List Page Template

```tsx
'use client';

import { Container } from '@mantine/core';
import { IconName } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';

export function EntityListPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/module-slug');
  
  const { data, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await fetch(`/api/module-slug/entity`);
      const result = await res.json();
      return result.data;
    },
  });

  const columns = [
    { key: 'field1', label: t('entity.list.columns.field1'), sortable: true },
    { key: 'field2', label: t('entity.list.columns.field2'), sortable: true },
    // ...
  ];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('entity.title')}
        description={t('entity.description')}
        namespace="modules/module-slug"
        icon={<IconName size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/module-slug`, namespace: 'modules/module-slug' },
          { label: t('entity.title'), namespace: 'modules/module-slug' },
        ]}
        actions={[
          {
            label: t('entity.list.actions.create'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${locale}/modules/module-slug/entity/create`),
            variant: 'filled',
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        onExport={(format) => handleExport(format)}
        showExportIcons={true}
      />
    </Container>
  );
}
```

#### 14.2.2. Create/Edit Form Template

```tsx
'use client';

import { Container, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { useTranslation } from '@/lib/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entitySchema } from '@/modules/module-slug/schemas/entity.schema';
import { showToast } from '@/modules/notifications/components/ToastNotification';

export function CreateEntityPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/module-slug');
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm({
    initialValues: {
      field1: '',
      field2: 0,
      // ...
    },
    validate: zodResolver(entitySchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch(`/api/module-slug/entity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      showToast({
        type: 'success',
        title: t('entity.create.success.title'),
        message: t('entity.create.success.message'),
      });
      router.push(`/${locale}/modules/module-slug/entity`);
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: t('entity.create.error.title'),
        message: error.message,
      });
    },
  });

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('entity.create.title')}
        description={t('entity.create.description')}
        namespace="modules/module-slug"
        icon={<IconName size={32} />}
        breadcrumbs={[...]}
      />
      <Paper p="xl" mt="md">
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
          {/* Form fields */}
          <Button type="submit" loading={mutation.isPending}>
            {t('entity.create.submit')}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
```

### 14.3. Sayfa Checklist

Her yeni sayfa için:

- [ ] Route yapısı belirlendi ve oluşturuldu
- [ ] Server component (page.tsx) oluşturuldu
- [ ] Client component oluşturuldu
- [ ] CentralPageHeader kullanıldı
- [ ] Breadcrumb'lar eklendi
- [ ] i18n çevirileri tüm dillere eklendi
- [ ] API route'ları oluşturuldu
- [ ] Zod validation schema oluşturuldu
- [ ] TypeScript types tanımlandı
- [ ] DataTable kullanıldı (list sayfalarında)
- [ ] React Hook Form kullanıldı (form sayfalarında)
- [ ] Toast notification'lar eklendi
- [ ] Error handling yapıldı
- [ ] Loading state'leri eklendi
- [ ] Responsive tasarım kontrol edildi
- [ ] Dark mode desteği kontrol edildi

---

## 15. Değişiklik Yapma Standartları

### 15.1. Değişiklik Öncesi Kontroller

#### 15.1.1. Bağımlılık Analizi

1. **Dosya Bağımlılıkları**: Import/export analizi
2. **Modül Bağımlılıkları**: Cross-module etkiler
3. **API Bağımlılıkları**: Backend/Frontend etkiler
4. **Database Bağımlılıkları**: Schema/Migration etkileri
5. **i18n Bağımlılıkları**: Translation etkileri

#### 15.1.2. Risk Değerlendirmesi

1. **Breaking Change Risk**: Geriye dönük uyumluluk
2. **Performance Risk**: Performans etkisi
3. **Security Risk**: Güvenlik etkisi
4. **User Experience Risk**: Kullanıcı deneyimi etkisi

### 15.2. Değişiklik Sırası

1. **Planlama**: Değişiklik planı oluştur
2. **Backup**: Mevcut kodun yedeğini al
3. **Implementation**: Değişiklikleri uygula
4. **Testing**: Test senaryolarını çalıştır
5. **Documentation**: Dokümantasyonu güncelle
6. **Review**: Code review yap
7. **Deploy**: Deploy et

### 15.3. Değişiklik Sonrası Kontroller

- [ ] Tüm test'ler geçiyor
- [ ] Build başarılı
- [ ] Linter hataları yok
- [ ] Type errors yok
- [ ] Dokümantasyon güncel
- [ ] CHANGELOG güncel
- [ ] Versiyon dosyaları güncel

---

## 16. Type-Safety ve TypeScript Standartları

### 16.1. Type-Safety Protocol
**Konum**: `.cursor/rules/NEXT_TYPESAFETY.md`

**Amaç**: Uzun süreli geliştirme sırasında tip hatalarının birikmesini önlemek.

**Kurallar**:
- Her kod değişikliğinde `tsc --noEmit` mental simülasyonu yapılmalı
- Tüm import zinciri kontrol edilmeli
- Tip değişikliği yapılıyorsa tüm bağlı dosyalarda propagate edilmeli
- `typewatch` uzun geliştirme süreçlerinde açık tutulmalı

### 16.2. TypeScript Configuration
**Strict Mode**: `tsconfig.json` içinde strict type checking aktif.

**Ek Kontroller**:
- `noUncheckedIndexedAccess`: Array/object index erişimlerinde tip kontrolü
- `noImplicitOverride`: Override keyword zorunluluğu
- `exactOptionalPropertyTypes`: Optional property type kontrolü
- `noImplicitReturns`: Fonksiyon return type kontrolü
- `noImplicitAny`: Any kullanımı yasak
- `noUnusedLocals`: Kullanılmayan local değişkenler yasak

### 16.3. Development Workflow
1. `npm run typewatch` açık tutulmalı
2. Kod değişiklikleri yapılır
3. Typewatch kırmızı → hemen düzelt
4. 30+ dakika build almadan geliştirme yapılmamalı

### 16.4. Build Process
Build öncesi:
- `npm run typecheck` çalıştırılmalı
- Tüm tip hataları düzeltilmeli
- Build sadece tip hatası yoksa alınmalı

### 16.5. Type-Safety Checklist
Her kod değişikliğinde:

- [ ] `tsc --noEmit` mental simülasyonu yapıldı
- [ ] Tüm import zinciri kontrol edildi
- [ ] Tip değişikliği yapılıyorsa tüm bağımlı dosyalar güncellendi
- [ ] Return type tutarlılığı kontrol edildi
- [ ] Server/Client ayrımı kontrol edildi
- [ ] API contract → Zod → DTO senkron kontrol edildi
- [ ] Breaking change riski değerlendirildi
- [ ] `typewatch` açık ve hata yok

### 16.6. Operational Mode Integration

**DEV MODE**:
- `typewatch` açık tutulmalı (warning)
- Tip hataları hemen düzeltilmeli (warning)
- Build öncesi `npm run typecheck` çalıştırılmalı (warning)

**GUARDED MODE**:
- `typewatch` açık tutulmalı (BLOCKING)
- Tip hataları hemen düzeltilmeli (BLOCKING)
- Build öncesi `npm run typecheck` çalıştırılmalı (BLOCKING)
- Tüm tip kontrolleri geçmeli (BLOCKING)

---

## 📝 Sonuç

Bu dokümantasyon, Omnex SaaS Platform'un tüm standartlarını, yapılarını ve best practice'lerini içermektedir. Her yeni özellik veya değişiklik yapılırken bu dokümantasyona uyulmalıdır.

### Önemli Prensipler

1. **Bağımlılık Analizi Zorunlu**: Her değişiklik öncesi bağımlılık analizi yapılmalıdır
2. **i18n Uyumluluk**: Tüm sayfalar ve component'ler i18n uyumlu olmalıdır
3. **Merkezi Sistemler**: Tüm component'ler merkezi sistemleri (modal, table, export, vb.) kullanmalıdır
4. **Tenant Context**: Tüm API'ler tenant context kullanmalıdır
5. **Migration Standartları**: Tüm database değişiklikleri migration standartlarına uygun olmalıdır
6. **Type Safety**: TypeScript type safety korunmalıdır
7. **Error Handling**: Tüm hatalar uygun şekilde handle edilmelidir
8. **Responsive Design**: Tüm component'ler responsive olmalıdır
9. **Dark Mode**: Tüm component'ler dark mode'u desteklemelidir
10. **Documentation**: Tüm değişiklikler dokümante edilmelidir

### Dokümantasyon Güncelleme Süreci

Her önemli değişiklik sonrası:

1. Bu dokümantasyon güncellenir
2. OMNEX_SAAS_DOKUMAN.md güncellenir
3. CHANGELOG.md güncellenir
4. Versiyon dosyaları güncellenir

### İletişim ve Destek

Sorularınız veya önerileriniz için:
- Dokümantasyon: Bu dosya ve OMNEX_SAAS_DOKUMAN.md
- Code Review: Pull request'lerde standartlara uygunluk kontrol edilir
- Team Discussion: Standart değişiklikleri için team discussion

---

**Güncelleme Tarihi**: 2025-12-08  
**Versiyon**: 1.0.9  
**Son Güncelleyen**: Deep Dependency Analysis Agent  
**Dokümantasyon Versiyonu**: 1.0.1

