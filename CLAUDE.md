# OMNEX CORE PLATFORM - Claude Referans Dokümanı

> **Bu dosya Claude'un projeyi anlaması ve tutarlı çalışması için kritik bilgileri içerir.**
> **Her oturumda otomatik okunur. Değişiklik yaparken bu kurallara uy.**

---

## 1. PROJE MİMARİSİ

### 1.1 Multi-Tenant Yapısı
- **Model**: Per-Tenant Database (her tenant için ayrı PostgreSQL DB)
- **Core DB**: `omnex_core` - Tenant metadata, Agency, Module registry
- **Tenant DB**: `tenant_{slug}_{year}` - Tenant'a özel tüm veriler
- **Routing**:
  - Production: Subdomain (`acme.onwindos.com`)
  - Local: Path-based (`localhost:3000/tenant/acme`)

### 1.2 Temel Klasör Yapısı
```
src/
├── app/[locale]/              # Next.js App Router sayfaları
│   ├── modules/               # Modül sayfaları
│   ├── admin/                 # Super Admin sayfaları
│   ├── management/            # Yönetim sayfaları
│   └── settings/              # Ayar sayfaları
├── components/                # UI bileşenleri (MERKEZI)
│   ├── headers/               # CentralPageHeader
│   ├── tables/                # DataTable (MERKEZI TABLO)
│   ├── modals/                # AlertModal (MERKEZI MODAL)
│   ├── skeletons/             # Skeleton bileşenleri
│   └── layouts/               # Layout sistemi
├── lib/                       # Business logic
│   ├── api/                   # API helpers (withTenant, response)
│   ├── export/                # Export sistemi (CSV, Excel, PDF, Word)
│   ├── i18n/                  # Çeviri sistemi
│   └── modules/               # Modül yükleyici
├── locales/                   # Çeviri dosyaları
│   ├── global/                # Global çeviriler (tr, en, de, ar)
│   └── modules/               # Modül çevirileri
├── modules/                   # Modül tanımları (module.config.yaml)
├── hooks/                     # Custom React hooks
└── context/                   # React Context providers
```

---

## 2. KRİTİK KURALLAR - ASLA İHLAL ETME

### 2.1 Core Sistemler - DEĞİŞTİRME
Aşağıdaki sistemler **CORE OVERRIDE ALLOWED** komutu olmadan değiştirilemez:

**1. Core Layout System:**
- `src/components/layouts/core/LayoutProvider.tsx`
- `src/components/layouts/core/LayoutConfig.ts`
- `src/components/layouts/core/LayoutResolver.ts`
- `src/components/layouts/LayoutWrapper.tsx`
- Layout hook'ları (`useLayout`, `useLayoutData`, `useLayoutSync`)

**2. Central Modal System:**
- `src/components/modals/AlertModal.tsx`

**3. PermissionService Core Logic:**
- `src/lib/access-control/PermissionService.ts`
- `src/lib/access-control/providers/AccessProvider.tsx`

**4. Tenant Context Resolution:**
- `src/lib/api/tenantContext.ts`
- `src/lib/services/tenantService.ts`
- `src/middleware.ts`

**5. Module Registry & Loader:**
- `src/lib/modules/registry.ts`
- `src/lib/modules/loader.ts`
- `src/lib/modules/dependency-manager.ts`
- `src/lib/modules/types.ts`

**İzin Verilen:**
- ✅ Core sistemleri kullanmak (import, çağırmak)
- ✅ Core sistemleri genişletmek (breaking change olmadan)
- ✅ Core sistemlerin üzerine wrapper yazmak

**Yasak:**
- ❌ Core sistemlerin internal logic'ini değiştirmek
- ❌ Core sistemlerin API signature'ını değiştirmek
- ❌ Core sistemlerin type definitions'ını değiştirmek

### 2.2 i18n Kuralları - DİKKATLİ OL
**YANLIŞ YAPTIĞIN EN BÜYÜK HATA BU!**

| Namespace | Dosya Yolu | Kullanım |
|-----------|-----------|----------|
| `global` | `src/locales/global/{locale}.json` | `useTranslation('global')` |
| `modules/{module}` | `src/locales/modules/{module}/{locale}.json` | `useTranslation('modules/{module}')` |

**KURALLAR:**
```typescript
// Modül sayfasında:
const { t } = useTranslation('modules/real-estate');  // Modül çevirileri
const { t: tGlobal } = useTranslation('global');      // Global çeviriler

// Global çeviri örnekleri (global namespace):
tGlobal('common.actions.save')      // "Kaydet"
tGlobal('common.actions.cancel')    // "İptal"
tGlobal('table.actions')            // "İşlemler"

// Modül çeviri örnekleri (modules/real-estate namespace):
t('apartments.title')               // "Daireler"
t('form.unitNumber')                // "Birim Numarası"
```

**YAPMA:**
- Global key'i modül dosyasına ekleme
- Modül key'ini global dosyaya ekleme
- Yanlış namespace kullanma

### 2.3 Veritabanı Kuralları
```bash
# Core DB için:
npx prisma migrate dev --schema=prisma/core.schema.prisma

# Tenant DB için - SADECE deploy!
npx prisma migrate deploy --schema=prisma/tenant.schema.prisma
```
**ASLA** tenant DB'de `migrate dev` kullanma!

### 2.4 İçerik Üretim Kısıtlamaları

**Üretilebilir İçerik:**
- ✅ i18n metinleri (tüm dillere: tr, en, de, ar)
- ✅ UI metinleri (button, form label, placeholder, tooltip)
- ✅ Empty state mesajları
- ✅ Validation mesajları
- ✅ Confirmation modal mesajları

**Dokunulamaz İçerik:**
- ❌ Schema (prisma/*.schema.prisma)
- ❌ API Routes (src/app/api/**)
- ❌ Services (src/lib/services/**)
- ❌ Hooks (src/hooks/**)

### 2.5 Index Stratejisi (Prisma)
```prisma
// ZORUNLU: Her modelde tenantId + companyId index
@@index([tenantId, companyId])

// Sık kullanılan: Status ile birlikte
@@index([tenantId, companyId, status])

// Sıralama için: Tarih ile birlikte
@@index([tenantId, companyId, createdAt])
```
**KURAL:** TenantId içermeyen index KABUL EDİLMEZ!

---

## 3. STİL SİSTEMİ

### 3.1 Stil Stratejisi
| Sistem | Kullanım | Örnek |
|--------|----------|-------|
| **Mantine UI** | Component görselleri (renkler, gölgeler, tipografi) | `<Button color="blue">` |
| **Tailwind CSS** | Sadece layout utilities | `flex`, `grid`, `gap-4`, `p-4`, `md:flex-row` |
| **CSS Modules** | Animasyonlar, karmaşık selector'lar | `ComponentName.module.css` |

**Yasak:**
- ❌ Mantine component'lerde doğrudan `style` attribute override
- ❌ Tailwind ile renk/gölge tanımlama (Mantine'den gelmeli)

### 3.2 Dark Mode
- Tüm component'ler dark mode desteklemeli
- `[data-mantine-color-scheme="dark"]` selector kullanılır
- Manuel dark mode kontrolü gerekmez

### 3.3 Responsive Breakpoints
| Breakpoint | Min Width |
|------------|-----------|
| xs | < 576px |
| sm | ≥ 576px |
| md | ≥ 768px |
| lg | ≥ 992px |
| xl | ≥ 1200px |

---

## 4. UI STANDARTLARI

### 4.1 Sayfa Yapısı Template

#### Liste Sayfası
```tsx
'use client';
import { Container } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useTranslation } from '@/lib/i18n/client';

export function ListPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/module-name');
  const { t: tGlobal } = useTranslation('global');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('items.title')}
        description={t('items.description')}
        namespace="modules/module-name"
        icon={<IconHome size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/module-name`, namespace: 'modules/module-name' },
          { label: t('items.title'), namespace: 'modules/module-name' },
        ]}
        actions={[
          {
            label: t('items.create.title'),
            icon: <IconHome size={18} />,
            onClick: () => { /* navigate */ },
            variant: 'filled',
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data}
        tableId="unique-table-id"
        showExportIcons={true}
        exportNamespace="modules/module-name"
      />
    </Container>
  );
}
```

#### Detay Sayfası (Tabs ile)
```tsx
<Container size="xl" pt="xl">
  <CentralPageHeader {...headerProps} />

  <Tabs defaultValue="details" mt="md">
    <Tabs.List>
      <Tabs.Tab value="details" leftSection={<IconFileText size={16} />}>
        {t('details')}
      </Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="details" pt="md">
      <Paper shadow="xs" p="md">
        {/* İçerik */}
      </Paper>
    </Tabs.Panel>
  </Tabs>
</Container>
```

### 4.2 Spacing Kuralları
| Element | Değer | Açıklama |
|---------|-------|----------|
| Container | `pt="xl"` | Sadece üst padding |
| Paper | `shadow="xs" p="md"` | Varsayılan paper |
| Tabs | `mt="md"` | Header sonrası |
| Tabs.Panel | `pt="md"` | Panel içi padding |

### 4.3 Skeleton Kullanımı
```tsx
// Loading state için:
if (isLoading) {
  return <ListPageSkeleton />;
  // veya
  return <DetailPageSkeleton showTabs={true} />;
}
```

---

## 5. MERKEZİ SİSTEMLER

### 5.1 DataTable (Merkezi Tablo)
**Dosya**: `src/components/tables/DataTable.tsx`

```tsx
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';

const columns: DataTableColumn[] = [
  {
    key: 'name',
    label: t('form.name'),
    sortable: true,
    searchable: true,
  },
  {
    key: 'status',
    label: t('table.status'),
    render: (value) => <Badge>{value}</Badge>,
  },
  {
    key: 'actions',
    label: tGlobal('table.actions'),
    align: 'right',
    render: (_, row) => (
      <Group gap="xs" justify="flex-end">
        <ActionIcon><IconEdit /></ActionIcon>
        <ActionIcon><IconTrash /></ActionIcon>
      </Group>
    ),
  },
];

<DataTable
  columns={columns}
  data={data}
  tableId="unique-id"           // localStorage için
  showExportIcons={true}        // Export butonları
  showColumnSettings={true}     // Kolon ayarları
  exportNamespace="modules/x"   // Export çevirileri
  defaultPageSize={25}
  // Audit History (Değişiklik Geçmişi)
  showAuditHistory={true}       // Audit ikonu göster
  auditEntityName="Apartment"   // Entity adı (DB'deki model adı)
  auditIdKey="id"               // Satır ID key (varsayılan: 'id')
  onAuditViewAll={(entityId) => router.push(`/audit/${entityId}`)} // Tüm geçmişi gör
/>
```

### 5.2 AlertModal (Merkezi Modal)
**Dosya**: `src/components/modals/AlertModal.tsx`

```tsx
import { AlertModal } from '@/components/modals/AlertModal';

<AlertModal
  opened={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  title={t('delete.title')}
  message={t('delete.message')}
  onConfirm={handleDelete}
  variant="danger"  // 'danger' | 'warning' | 'info'
/>
```

### 5.3 CentralPageHeader
**Dosya**: `src/components/headers/CentralPageHeader.tsx`

```tsx
<CentralPageHeader
  title={t('page.title')}
  description={t('page.description')}
  namespace="modules/module-name"
  icon={<IconBuilding size={32} />}
  showBackButton={true}         // Varsayılan true
  breadcrumbs={[...]}
  actions={[
    { label: t('action'), onClick: fn, variant: 'filled', color: 'blue' }
  ]}
/>
```

### 5.4 Export Sistemi
**Dosyalar**:
- `src/lib/export/ExportProvider.tsx` - Export context ve hooks
- `src/lib/export/ExportTemplateService.ts` - Template yönetimi
- `src/lib/export/exportUtils.ts` - Export fonksiyonları
- `src/lib/export/types.ts` - TypeScript tipleri

**Desteklenen Formatlar:** CSV, Excel, PDF, Word, HTML, Print

**Grid-Based Section Layout (Template Sistemi):**
Export şablonları grid tabanlı bölüm yapısı kullanır:
- `TemplateSection` → `SectionColumn[]` → `SectionItem[]`
- Her bölüm 1-4 sütun içerebilir
- Sütun hizalaması otomatik: ilk sütun=sol, son sütun=sağ, ortadakiler=orta

**Section Item Tipleri:**
| Tip | Açıklama |
|-----|----------|
| `logo` | Logo/görsel (base64 veya URL) |
| `text` | Statik metin |
| `variable` | Dinamik değişken (placeholder) |
| `divider` | Yatay çizgi |
| `spacer` | Boşluk |

**Desteklenen Değişkenler (Placeholders):**
```typescript
{{pageTitle}}      // Sayfa başlığı
{{companyName}}    // Firma adı
{{companyAddress}} // Firma adresi
{{companyPhone}}   // Firma telefonu
{{companyEmail}}   // Firma e-posta
{{companyWebsite}} // Firma web sitesi
{{companyTaxId}}   // Vergi numarası
{{date}}           // Bugünün tarihi
{{year}}           // Yıl
```

**Item Özellikleri:**
```typescript
interface SectionItem {
  id: string;
  type: SectionItemType;
  value?: string;           // Metin veya değişken kodu
  logoUrl?: string;         // Logo/image için base64 veya URL
  fontSize?: number;        // Font boyutu (px)
  fontWeight?: 'normal' | 'bold';
  color?: string;           // Renk (hex)
}
```

**Template Kullanımı:**
```typescript
// DataTable'da otomatik
<DataTable
  showExportIcons={true}
  exportNamespace="modules/module-name"
/>

// Manuel export
import { useExport } from '@/lib/export/ExportProvider';
const { exportData } = useExport();
await exportData(data, { format: 'pdf', includeHeader: true });
```

**Export Formatlarında Hizalama:**
- PDF/HTML/Print: CSS `display: table` ile grid layout
- Excel: Hücre birleştirme ile kolon span
- Word: Table layout ile grid yapısı

### 5.5 Toast Bildirim Sistemi
**Dosyalar**:
- `src/hooks/useNotification.tsx` - Merkezi bildirim hook'u
- `src/modules/notifications/components/ToastNotification.tsx` - Toast bileşeni
- `src/styles/_tokens.css` - Toast renk değişkenleri

**Kullanım:**
```typescript
import { useNotification } from '@/hooks/useNotification';

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();

// Tek parametre - sadece mesaj (başlık global çeviriden gelir)
showSuccess('Kayıt başarıyla oluşturuldu');
showError('Bir hata oluştu');

// İki parametre - geriye uyumlu (ilk parametre göz ardı edilir)
showSuccess('Eski başlık', 'Mesaj içeriği');
```

**Başlıklar:**
Tüm bildirim başlıkları global çevirilerden gelir (`src/locales/global/`):
- `notifications.success.title` → "Başarılı"
- `notifications.error.title` → "Hata"
- `notifications.warning.title` → "Uyarı"
- `notifications.info.title` → "Bilgi"

**CSS Değişkenleri (Light Mode):**
```css
--toast-info-bg: #228be6;
--toast-success-bg: #12b886;
--toast-warning-bg: #fab005;
--toast-error-bg: #fa5252;
--toast-{type}-icon-bg: #ffffff;  /* Beyaz oval ikon arka planı */
--toast-{type}-icon: #1a1a1a;     /* Siyah ikon */
```

**Dark Mode:**
```css
--toast-{type}-icon-bg: transparent;  /* Şeffaf arka plan */
--toast-{type}-icon: currentColor;    /* Miras alınan renk */
```

### 5.6 Session Timeout Sistemi
**Dosya**: `src/components/providers/SessionTimeoutProvider.tsx`

**Özellikler:**
- Varsayılan: 30 dakika (güvenlik ayarlarından yapılandırılabilir)
- Kullanıcı aktivitesi izler (mouse, keyboard, scroll, click)
- Zaman aşımından 1 dakika önce uyarı modalı
- "Oturumu Uzat" veya "Çıkış Yap" seçeneği

**i18n Keys (global namespace):**
- `session.timeoutWarning.title`
- `session.timeoutWarning.message`
- `session.timeoutWarning.extend`
- `session.timeoutWarning.logout`

### 5.6.1 Audit History (Değişiklik Geçmişi)
**Dosyalar**:
- `src/components/audit/AuditHistoryPopup.tsx` - Popup bileşeni
- `src/lib/api/auditHelper.ts` - Audit helper fonksiyonları
- `prisma/extensions/audit.prisma` - AuditLog modeli
- `src/lib/services/auditLogService.ts` - Audit servis katmanı
- `src/app/api/audit-logs/route.ts` - REST API endpoint

**Özellikler:**
- Her satır için değişiklik geçmişi gösterimi
- Son 5 işlem popup'ta görüntülenir
- Kim, ne zaman, hangi işlemi yaptı bilgisi
- Değişen alanlar ve eski/yeni değerler
- **Genişletilebilir değişiklik listesi** - "+3 değişiklik daha" tıklanabilir
- **Modül bazlı çeviri** - Alan etiketleri modülün kendi çevirilerinden gelir
- **Tarih formatı** - ISO tarihleri otomatik formatlanır

**DataTable Entegrasyonu:**
```tsx
<DataTable
  showAuditHistory={true}       // Audit ikonu göster
  auditEntityName="Apartment"   // Entity adı (model adı ile aynı olmalı)
  auditIdKey="id"               // Satır ID key
  exportNamespace="modules/real-estate"  // Çeviri namespace (audit etiketleri için)
  onAuditViewAll={(entityId) => {}} // Opsiyonel: Tüm geçmişi gör callback
/>
```

**Çeviri Namespace Kullanımı:**
AuditHistoryPopup alan etiketlerini şu sırayla arar:
1. `modules/{module}` → `form.{field}` (örn: `form.unitNumber`)
2. `modules/{module}` → `table.{field}` (örn: `table.status`)
3. `global` → `form.{field}`
4. `global` → `form.fields.{field}` (legacy)
5. camelCase → readable format (örn: `unitNumber` → `Unit Number`)

**IGNORED_FIELDS (Audit'te Gösterilmeyenler):**
```typescript
const IGNORED_FIELDS = [
  'updatedAt', 'createdAt', 'id', 'tenantId', 'companyId',
  'property', 'contracts', 'payments', 'appointments', 'maintenance',
  '_count', 'user', 'company', 'tenant',
  // Relation IDs
  'propertyId', 'apartmentId', 'contractId', 'tenantRecordId', 'locationId',
];
```

**API Kullanımı:**
```
GET /api/audit-logs?entity=Apartment&entityId=xxx&pageSize=5
```

**AuditLog Kaydetme - Helper Fonksiyonları:**
```typescript
import { getAuditContext, logCreate, logUpdate, logDelete } from '@/lib/api/auditHelper';

// Handler başında audit context al (cookie'den userId okur)
const auditContext = await getAuditContext(request);

// CREATE işlemi
logCreate(tenantContext, auditContext, 'Apartment', newItem.id, companyId, {
  unitNumber: newItem.unitNumber,
  status: newItem.status,
});

// UPDATE işlemi - otomatik değişiklik tespiti
logUpdate(tenantContext, auditContext, 'Apartment', id, existingItem, updatedItem, companyId);

// DELETE işlemi
logDelete(tenantContext, auditContext, 'Apartment', id, companyId, {
  unitNumber: existingItem.unitNumber,
});
```

**ÖNEMLİ - Cookie Adı:**
- Auth token cookie adı: `accessToken` (HttpOnly)
- `jwt.ts` ve `auditHelper.ts` bu cookie'yi okur
- Login sırasında `response.cookies.set('accessToken', ...)` ile ayarlanır

**i18n Keys (global namespace):**
- `audit.title` → "Değişiklik Geçmişi"
- `audit.recentChanges` → "Son Değişiklikler"
- `audit.viewAll` → "Tüm Geçmişi Gör"
- `audit.noHistory` → "Henüz değişiklik yok"
- `audit.system` → "Sistem"
- `audit.actions.create` → "Oluşturuldu"
- `audit.actions.update` → "Güncellendi"
- `audit.actions.delete` → "Silindi"
- `audit.changes.added` → "eklendi"
- `audit.changes.removed` → "kaldırıldı"
- `audit.changes.cleared` → "temizlendi"
- `audit.changes.set` → "ayarlandı"
- `audit.changes.more` → "değişiklik daha"
- `audit.changes.showLess` → "Daha az göster"

### 5.7 Layout Sistemi
**Dosya**: `src/components/layouts/`

**Layout Tipleri:**
| Tip | Açıklama |
|-----|----------|
| Sidebar | Sol tarafta daraltılabilir sidebar (16rem/4rem) |
| Top | Üstte sticky header, horizontal menü |
| Mobile | Responsive hamburger menü |

**Layout Context Öncelik Sırası:**
User > Role > Company > Default

### 5.8 Tema Varsayılan Sistemi
**Dosyalar**:
- `src/components/layouts/core/LayoutConfig.ts` - Storage keys ve helper fonksiyonlar
- `src/components/layouts/core/LayoutProvider.tsx` - Config yükleme öncelik sırası
- `src/components/layouts/configurator/ThemeConfigurator.tsx` - Admin UI

**LocalStorage Keys:**
| Key | Açıklama |
|-----|----------|
| `omnex-layout-config-v2` | Kullanıcının kendi tema ayarları |
| `omnex-layout-config-timestamp` | Son güncelleme zamanı |
| `omnex-company-defaults` | Admin tarafından belirlenen firma varsayılanları |

**Öncelik Sırası (İlk Render):**
1. Kullanıcının kendi config'i (`omnex-layout-config-v2`)
2. Firma varsayılanları (`omnex-company-defaults`)
3. Sistem varsayılanları (`DEFAULT_LAYOUT_CONFIG`)

**Admin "Varsayılan Yap" Butonu:**
- Sadece admin rolleri görebilir: `SuperAdmin`, `Admin`, `TenantAdmin`, `CompanyAdmin`
- Mevcut config'i `omnex-company-defaults` localStorage'a kaydeder
- Aynı zamanda DB'ye kaydeder (cross-browser senkronizasyon için)
- `setCompanyDefaults()` helper fonksiyonu kullanır

**Kullanıcı "Sıfırla" Butonu:**
- Tüm localStorage key'lerini temizler
- Sayfa yeniden yüklenir (clean state)
- LayoutProvider DB'den firma varsayılanlarını çeker
- Sonraki yüklemelerde localStorage cache kullanılır

**Cross-Browser Senkronizasyon:**
```typescript
// LayoutProvider.tsx - DB'den company defaults yükleme
useEffect(() => {
  // localStorage'da company defaults yoksa DB'den çek
  if (!hasUserConfig && !hasCompanyDefaults && companyId) {
    fetchWithAuth(`/api/layout/config?scope=company&companyId=${companyId}`)
      .then(response => response.json())
      .then(data => {
        if (data.data?.config) {
          localStorage.setItem(STORAGE_KEYS.companyDefaults, JSON.stringify(data.data.config));
          setConfigState(data.data.config);
        }
      });
  }
}, [companyId]);
```

**API Endpoint:**
- `POST /api/layout/config` - Config kaydetme
- `GET /api/layout/config?scope=company&companyId=xxx` - Firma varsayılanlarını çekme

**Helper Fonksiyonlar (LayoutConfig.ts):**
```typescript
// Firma varsayılanlarını localStorage'a kaydet
export function setCompanyDefaults(config: LayoutConfig): void {
  localStorage.setItem(STORAGE_KEYS.companyDefaults, JSON.stringify(config));
  // Diğer tab'lara bildir
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.companyDefaults,
    newValue: JSON.stringify(config),
  }));
}

// Firma varsayılanlarını localStorage'dan oku
export function getCompanyDefaults(): LayoutConfig {
  const stored = localStorage.getItem(STORAGE_KEYS.companyDefaults);
  return stored ? JSON.parse(stored) : DEFAULT_LAYOUT_CONFIG;
}
```

**i18n Keys (global namespace):**
- `settings.theme.saveAsDefault` - "Varsayılan Yap"
- `settings.theme.defaultsSaved` - "Firma varsayılanları kaydedildi"
- `settings.theme.resetTitle` - "Sıfırla"
- `settings.theme.resetConfirm` - "Ayarları sıfırlamak istediğinize emin misiniz?"
- `settings.theme.resetSuccess` - "Ayarlar sıfırlandı"

---

## 6. API STANDARTLARI

### 6.1 API Route Pattern
```typescript
// src/app/api/module-name/route.ts
import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireCompanyId } from '@/lib/api/companyContext';

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenantPrisma) => {
    const items = await tenantPrisma.modelName.findMany();
    return successResponse({ items });
  }, { required: true, module: 'module-name' });
}

export async function POST(request: NextRequest) {
  return withTenant(request, async (tenantPrisma) => {
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await requireCompanyId(request, tenantPrisma);

    const body = await request.json();
    // Zod validation...

    const item = await tenantPrisma.modelName.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId,
        ...validatedData,
      },
    });

    return successResponse({ item }, undefined, 201);
  }, { required: true, module: 'module-name' });
}
```

### 6.2 Response Formatları
```typescript
// Başarılı
successResponse({ item });
successResponse({ items }, { page: 1, limit: 10, total: 100 });

// Hata
errorResponse('ERROR_CODE', 'Hata mesajı', details, 400);
notFoundResponse('Item');
validationErrorResponse('Validation failed', errors);
```

### 6.3 Date Alanları
```typescript
// Schema'da:
deliveryDate: z.coerce.date().optional().nullable(),

// Create/Update'te:
deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,

// Response'da:
deliveryDate: item.deliveryDate?.toISOString() || null,
```

---

## 7. MODÜL SİSTEMİ

### 7.1 Modül Yapısı
```
src/modules/{module-slug}/
├── module.config.yaml     # Modül konfigürasyonu
├── components/            # Modül bileşenleri
├── types/                 # TypeScript tipleri
└── schemas/               # Zod şemaları

src/locales/modules/{module-slug}/
├── tr.json
├── en.json
├── de.json
└── ar.json
```

### 7.2 module.config.yaml Örneği
```yaml
name: Module Name
slug: module-slug
version: 1.0.0
icon: Building
category: business
menu:
  main:
    label: Module Name
    href: /modules/module-slug
    order: 10
```

### 7.3 Demo Veri Lokalizasyon Sistemi

Demo veriler için çoklu dil desteği. **ÖNEMLİ:** Demo verilerde `currency` alanı **belirtilmez** - Prisma varsayılan değeri (`TRY`) kullanır. **Uygulama çalışırken para birimi görüntülemesi `GeneralSettings.currency` (Ayarlar > Bölge ve Saat) değerine göre `useCurrency` hook ile formatlanır.**

**Desteklenen Diller:**
| Locale | Ülke | Açıklama |
|--------|------|----------|
| `tr` | TR | Türkçe (varsayılan) |
| `en` | US | İngilizce |
| `de` | DE | Almanca |
| `ar` | SA | Arapça |

**Dosya Yapısı:**
```
prisma/seed/
├── locales/
│   ├── demo-data.tr.json    # Türkçe demo veriler
│   ├── demo-data.en.json    # İngilizce demo veriler
│   ├── demo-data.de.json    # Almanca demo veriler
│   └── demo-data.ar.json    # Arapça demo veriler
└── modules/
    ├── base-seeder.ts       # Locale type ve helper fonksiyonlar
    ├── index.ts             # Export barrel
    ├── seeder-registry.ts   # Seeder kayıt ve yönetimi
    └── *.seed.ts            # Modül seeder'ları
```

**CLI Kullanımı:**
```bash
# Almanca demo veriler ile seed
TENANT_DATABASE_URL="..." npx tsx prisma/seed/demo-seed.ts --tenant-slug=demo --locale=de

# Mevcut locale'leri listele
npx tsx prisma/seed/demo-seed.ts --list-locales

# Belirli modülü seed et
npx tsx prisma/seed/demo-seed.ts --tenant-slug=demo --locale=en --module=real-estate
```

**Setup Wizard Demo Veri Yükleme:**
Setup wizard'da demo veri yüklerken:
1. Kullanıcı dil seçer (tr, en, de, ar)
2. API mevcut demo veriyi kontrol eder (`checkStatus`)
3. Varsa önce temizler (`unseed`)
4. Sonra yeni locale ile yükler (`seed`)

Bu sayede farklı dilde demo veri yüklemek mümkün - önceki veri otomatik temizlenir.

**Seeder'da Localized Veri Kullanımı:**
```typescript
async seed(ctx: SeederContext): Promise<SeederResult> {
  const { demoData, locale } = ctx;

  // Lokalize edilmiş mülk verileri
  const properties = demoData.realEstate.properties;

  // Lokalize edilmiş kiracı isimleri
  const tenants = demoData.realEstate.tenants;

  // Ülke kodu
  const country = demoData.country; // TR, DE, US, SA

  // Currency alanı BELİRTİLMEZ - Prisma varsayılan değeri kullanır
  await tenantPrisma.contract.create({
    data: {
      // currency alanı yok - varsayılan "TRY" kullanılacak
      // Görüntüleme GeneralSettings.currency'ye göre formatlanır
      rentAmount: new Prisma.Decimal(15000),
      // ...
    }
  });
}
```

**Seeder İdempotent Olmalı:**
Tekrar çalıştırıldığında hata vermemeli:
```typescript
// ✅ DOĞRU: upsert kullan (ID ile)
const id = generateDemoId(tenantSlug, 'email-campaign', String(idx + 1));
await tenantPrisma.emailCampaign.upsert({
  where: { id },
  update: {},
  create: { id, ... },
});

// ✅ DOĞRU: unique constraint ile upsert
await tenantPrisma.contract.upsert({
  where: { tenantId_contractNumber: { tenantId, contractNumber } },
  update: {},
  create: { ... },
});

// ❌ YANLIŞ: create ile ID - tekrar çalışınca hata verir
await tenantPrisma.something.create({
  data: { id: generateDemoId(...), ... }, // Unique constraint hatası!
});
```

**Demo Veri JSON Yapısı:**
```json
{
  "locale": "de",
  "country": "DE",
  "dateFormat": "DD.MM.YYYY",
  "locations": { "hq": {...}, "factory": {...}, "warehouse": {...} },
  "realEstate": { "properties": [...], "tenants": [...], "staffRoles": {...} },
  "hr": { "departments": [...], "employees": [...], "positions": {...} },
  "production": { "products": [...], "orderStatuses": {...} },
  "maintenance": { "equipment": [...], "workOrderTypes": {...} },
  "accounting": { "expenseCategories": [...], "paymentMethods": {...} },
  "notifications": { "templates": {...} },
  "webBuilder": { "company": {...}, "pages": {...} }
}
```

**KURALLAR:**
- ✅ Demo verilerde hardcoded Türkçe metin yerine `demoData` kullan
- ✅ Ülke kodu için `demoData.country` kullan
- ✅ **Currency alanını belirtme** - Prisma varsayılan değer kullanır
- ✅ ID ile `create` yerine `upsert` kullan (idempotent olması için)
- ✅ Yeni locale eklerken tüm seeder'ları güncelle
- ❌ Seeder'da `currency: null` yazma (TypeScript hatası verir)
- ❌ `ctx.currency` artık mevcut değil - **kullanma!**

---

## 8. HOOK KULLANIMI

### 8.1 Veri Çekme Pattern
```typescript
// Hook tanımı (src/hooks/useItems.ts)
export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}

// Kullanım
const { items, loading } = useItems();
```

### 8.2 useAuth Hook ve SSR/Hydration
**Dosya**: `src/hooks/useAuth.ts`

**Önemli:** localStorage'dan state okuma SSR'da çalışmaz (`window` undefined).

```typescript
// ❌ YANLIŞ: Sadece initial state'e güvenmek
const [user, setUser] = useState<User | null>(() => loadUserFromStorage());

useEffect(() => {
  setLoading(false); // SSR'da user null kalır!
}, []);

// ✅ DOĞRU: Client mount sonrası yeniden yükle
useEffect(() => {
  loadUser();        // localStorage'dan yeniden oku
  setLoading(false);
}, []);
```

**SSR/Hydration Akışı:**
1. SSR: `window` undefined → `user = null`
2. Client hydration: React SSR state'ini korur (`null`)
3. useEffect çalışır → `loadUser()` localStorage'dan okur → `user` güncellenir

**useAuth Kullanımı:**
```typescript
const { user, loading, isAuthenticated, logout, refreshUser } = useAuth();

// Loading kontrolü
if (loading) return <Skeleton />;

// Auth kontrolü
if (!user) {
  router.push('/auth/login');
  return null;
}
```

### 8.3 LayoutWrapper Auth Kontrolü
**Dosya**: `src/components/layouts/LayoutWrapper.tsx`

Auth kontrolü `LayoutWrapper` içinde yapılır:
- Public sayfalar: `/auth/*`, `/login`, `/register`, `/setup`, `/public/*`
- Diğer sayfalar: `useAuth` ile kontrol edilir, login yoksa redirect

```typescript
// Public path kontrolü
const PUBLIC_PATHS = [
  '/auth/login', '/auth/register', '/auth/activate',
  '/login', '/register', '/welcome', '/setup', '/public/',
];
```

---

## 9. YAPILAN HATALAR - TEKRARLAMA

### 9.1 i18n Hataları
- **YANLIŞ**: Modül key'ini `src/locales/global/tr.json`'a eklemek
- **DOĞRU**: `src/locales/modules/{module}/tr.json`'a eklemek

- **KRİTİK HATA - DUPLICATE KEY**: JSON dosyasında aynı anahtar iki kez tanımlanırsa, son değer geçerli olur ve önceki büyük obje kaybolur!
  - **YANLIŞ**: Dosya sonuna yeni `"form": { ... }` objesi eklemek (mevcut `form` objesini ezer!)
  - **DOĞRU**: Mevcut `form` objesini bul ve içine yeni key'leri ekle
  - **Kontrol**: Her dil dosyasında `"form":` araması yap, sadece nested olanlar hariç root seviyede tek `form` olmalı
  - **Örnek**: `form`, `table`, `messages` gibi büyük objeler dosyada tekrar EDİLMEMELİ

### 9.2 UI Hataları
- **YANLIŞ**: Kendi tablo tasarımı oluşturmak
- **DOĞRU**: `DataTable` bileşenini kullanmak

- **YANLIŞ**: Doğrudan Mantine notifications kullanmak
- **DOĞRU**: `useNotification` hook'unu kullanmak (toast için), `AlertModal` kullanmak (onay için)

- **YANLIŞ**: Paper içinde Paper kullanmak
- **DOĞRU**: Tek Paper, içinde Tabs

### 9.3 Skeleton Hataları
- **YANLIŞ**: Skeleton'u her sayfada farklı yazmak
- **DOĞRU**: `ListPageSkeleton` veya `DetailPageSkeleton` kullanmak

### 9.4 Export Hataları
- **YANLIŞ**: Export butonlarını manuel eklemek
- **DOĞRU**: DataTable'da `showExportIcons={true}` kullanmak

### 9.5 Currency Hataları
- **YANLIŞ**: Hardcoded para birimi kullanmak
  ```typescript
  // YAPMA!
  amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  currency: 'TRY',
  <Select data={['TRY', 'USD', 'EUR']} />
  ```
- **DOĞRU**: `useCurrency` hook ve merkezi sabitleri kullanmak
  ```typescript
  const { formatCurrency, currency } = useCurrency();
  formatCurrency(amount);
  <Select data={CURRENCY_SELECT_OPTIONS} />
  ```

### 9.6 Settings Form State Hataları
- **YANLIŞ**: `useState` initial value'da props kullanmak (props async yükleniyorsa)
  ```typescript
  // settings henüz yüklenmemiş olabilir!
  const [formData, setFormData] = useState({
    currency: settings.currency || 'TRY',
  });
  ```
- **DOĞRU**: `useEffect` ile props değişince state'i güncellemek
  ```typescript
  const [formData, setFormData] = useState({ currency: DEFAULT_CURRENCY });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({ currency: settings.currency || DEFAULT_CURRENCY });
    }
  }, [settings]);
  ```

---

## 10. KONTROL LİSTESİ

Yeni sayfa/özellik eklerken:

- [ ] Doğru namespace ile i18n kullanıldı mı?
- [ ] CentralPageHeader kullanıldı mı?
- [ ] DataTable kullanıldı mı? (liste için)
- [ ] AlertModal kullanıldı mı? (silme onayı için)
- [ ] Skeleton eklendi mi?
- [ ] Container `pt="xl"` var mı?
- [ ] Tabs kullanıldıysa `mt="md"` var mı?
- [ ] Paper `shadow="xs" p="md"` var mı?
- [ ] API'de withTenant kullanıldı mı?
- [ ] tenantId ve companyId eklendi mi?
- [ ] Mobile responsive test edildi mi?
- [ ] **Para birimi için `useCurrency` hook kullanıldı mı?**
- [ ] **Currency Select için `CURRENCY_SELECT_OPTIONS` kullanıldı mı?**
- [ ] **Form state async props ile senkronize ediliyor mu? (useEffect)**

---

## 11. DOSYA KONUMLARI HIZLI REFERANS

| Amaç | Dosya |
|------|-------|
| Merkezi Tablo | `src/components/tables/DataTable.tsx` |
| Merkezi Modal | `src/components/modals/AlertModal.tsx` |
| Toast Bildirim | `src/hooks/useNotification.tsx` |
| Sayfa Header | `src/components/headers/CentralPageHeader.tsx` |
| Skeleton'lar | `src/components/skeletons/` |
| API withTenant | `src/lib/api/withTenant.ts` |
| API Response | `src/lib/api/response.ts` |
| i18n Client | `src/lib/i18n/client.ts` |
| Global Çeviriler | `src/locales/global/` |
| Modül Çevirileri | `src/locales/modules/` |
| Tema Context | `src/context/ThemeContext.tsx` |
| Company Context | `src/context/CompanyContext.tsx` |
| Demo Veri Locales | `prisma/seed/locales/` |
| Seeder Base | `prisma/seed/modules/base-seeder.ts` |
| Seeder CLI | `prisma/seed/modules/run-all.ts` |
| Modül Seeder'lar | `prisma/seed/modules/*.seed.ts` |

---

## 12. PERFORMANS KURALLARI

### 12.1 Context Provider Kuralları
```typescript
// ✅ DOĞRU: Route-aware context - Auth sayfalarında skip
const pathname = usePathname();
const isAuthPage = pathname?.includes('/login') || pathname?.includes('/auth/');

useEffect(() => {
  if (isAuthPage) {
    setLoading(false);
    return; // Auth sayfalarında fetch yapma
  }
  fetchData();
}, [isAuthPage]);

// ❌ YANLIŞ: Her zaman fetch
useEffect(() => {
  fetchData(); // Auth sayfalarında bile çalışır - GEREKSIZ
}, []);
```

### 12.2 Cache Stratejisi
| Bileşen | Cache Süresi | Tip |
|---------|--------------|-----|
| ModuleContext | 5 dakika | Memory (React state) |
| Menu-Resolver | 5 dakika | HTTP Browser Cache |
| CompanyContext | Uygulama ömrü | Memory (hasFetched ref) |
| Layout | 60 saniye | Next.js ISR |

### 12.3 Prisma Singleton Kuralı
```typescript
// ✅ DOĞRU: Singleton kullan
import { corePrisma } from '@/lib/corePrisma';

export async function GET() {
  const data = await corePrisma.tenant.findMany();
  return NextResponse.json(data);
}

// ❌ YANLIŞ: Her request'te yeni client - MEMORY LEAK!
export async function GET() {
  const prisma = new PrismaClient(); // YAPMA!
  const data = await prisma.tenant.findMany();
  await prisma.$disconnect();
  return NextResponse.json(data);
}
```

### 12.4 Console.log Kuralları
```typescript
// ✅ DOĞRU: Sadece error loglama
console.error('Critical error:', error);

// ✅ DOĞRU: Development-only logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// ❌ YANLIŞ: Production'da debug log - SİL!
console.log('[component] Data loaded:', data);
```

---

## 13. İKON SİSTEMİ

### 13.1 Tabler Icons Kullanımı
```tsx
// ModuleIcon - String ikon adından component
import { ModuleIcon } from '@/lib/modules/icon-loader';

<ModuleIcon icon="Building" size={24} />
<ModuleIcon icon="Dashboard" size={32} />

// Desteklenen formatlar:
// "Building" → IconBuilding
// "IconBuilding" → IconBuilding
// "building" → IconBuilding (case-insensitive)
```

### 13.2 IconPicker - Kullanıcı İkon Seçimi
```tsx
import { IconPicker, IconPickerButton } from '@/components/common/IconPicker';

<IconPickerButton
  value={icon}
  onChange={setIcon}
  label="İkon Seç"
/>
```

### 13.3 Menü İkonları (useMenuItems)
```typescript
// String ikon adı → React component mapping
const iconMap: Record<string, React.ComponentType> = {
  Dashboard: IconDashboard,
  Building: IconBuilding,
  Users: IconUsers,
  // ... 50+ ikon
};
```

---

## 14. GÜVENLİK KURALLARI

### 14.1 Kimlik Doğrulama
- **JWT Access Token**: 7 gün
- **Refresh Token**: 30 gün
- **Algorithm**: HS256

### 14.2 Şifre Politikası
- Minimum 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam

### 14.3 RBAC Rolleri
| Rol | Yetki |
|-----|-------|
| SuperAdmin | Tam sistem erişimi |
| AgencyUser | Ajans seviyesi erişim |
| ClientUser | Temel kullanıcı erişimi |

### 14.4 Rate Limiting
- Global: 100 request / 15 dakika / IP
- Auth endpoints: 10 request / 15 dakika

### 14.5 Input Validation
- Zod schema validation kullan
- Prisma ORM SQL injection önler
- Next.js XSS koruması sağlar

---

## 15. TYPE HATA YÖNETİMİ

### 15.1 Komutlar
```bash
# Type hatalarını analiz et
npm run type:analyze

# Otomatik düzeltmeleri uygula
npm run type:fix:auto

# Type check
npm run typecheck

# Geliştirme sırasında izle
npm run typewatch
```

### 15.2 Yaygın Type Hataları

**exactOptionalPropertyTypes:**
```typescript
// ❌ Hata
<Component className={undefined} />

// ✅ Çözüm
<Component className={className || undefined} />
```

**Possibly Undefined:**
```typescript
// ❌ Hata
const value = obj.property; // obj possibly undefined

// ✅ Çözüm
const value = obj?.property;
```

---

## 16. MODÜL ÇEVİRİ YAPISI

### 16.1 Global Çeviriler (`src/locales/global/`)
```json
{
  "common": {
    "actions": {
      "save": "Kaydet",
      "cancel": "İptal",
      "delete": "Sil",
      "edit": "Düzenle",
      "back": "Geri"
    },
    "status": {
      "active": "Aktif",
      "inactive": "Pasif"
    }
  },
  "table": {
    "actions": "İşlemler"
  },
  "navigation": {
    "dashboard": "Dashboard"
  }
}
```

### 16.2 Modül Çevirileri (`src/locales/modules/{module}/`)
```json
{
  "title": "Modül Başlığı",
  "menu": {
    "label": "Menü Etiketi"
  },
  "form": {
    "name": "Ad",
    "description": "Açıklama"
  },
  "apartments": {
    "title": "Daireler",
    "create": { "title": "Yeni Daire" }
  }
}
```

### 16.3 Kullanım Şablonu
```typescript
// İKİ NAMESPACE BİRDEN:
const { t } = useTranslation('modules/real-estate');
const { t: tGlobal } = useTranslation('global');

// Modül çevirisi
t('apartments.title')  // "Daireler"

// Global çeviri
tGlobal('common.actions.save')  // "Kaydet"
```

---

## 17. MEVCUT MODÜLLER

| Modül Slug | Açıklama |
|-----------|----------|
| `real-estate` | Gayrimenkul yönetimi |
| `accounting` | Muhasebe |
| `hr` | İnsan kaynakları |
| `production` | Üretim |
| `maintenance` | Bakım |
| `calendar` | Takvim |
| `notifications` | Bildirimler |
| `file-manager` | Dosya yöneticisi |
| `ai` | AI entegrasyonu |
| `license` | Lisans yönetimi |
| `web-builder` | Web sayfa oluşturucu |

---

## 18. NEXT.JS 16.1+ DEĞİŞİKLİKLERİ

### 18.1 Turbopack vs Webpack
Next.js 16+ sürümünde **Turbopack varsayılan** ama `webpack` config varsa çalışmaz!

**KURAL: `webpack` config varken Turbopack için `--turbopack` flag gerekli!**

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack",      // Turbopack kullan (hızlı)
    "dev:webpack": "next dev --webpack", // Webpack kullan (eski)
    "build": "next build"                // Build için webpack (otomatik)
  }
}
```

### 18.2 Turbopack File System Cache
Turbopack cache `.next` klasörünü 10GB+ boyutlara çıkarabilir.

**Ayarlar** (`next.config.ts`):
```typescript
experimental: {
  turbopackFileSystemCacheForDev: true,  // Dev için (varsayılan aktif)
  turbopackFileSystemCacheForBuild: false, // Build için (experimental)
}
```

**Disk doluyorsa:**
```bash
# Cache temizle
rm -rf .next

# Veya dev cache'i kapat (yavaşlar)
turbopackFileSystemCacheForDev: false
```

### 18.3 Cache API Değişiklikleri
```typescript
// ESKİ (Next.js 15)
import { unstable_cacheLife, unstable_cacheTag } from 'next/cache'

// YENİ (Next.js 16+)
import { cacheLife, cacheTag } from 'next/cache'

// Yeni API'ler
import { updateTag, refresh } from 'next/cache'
```

### 18.4 Image Optimizasyon Değişiklikleri
| Ayar | Eski Varsayılan | Yeni Varsayılan |
|------|-----------------|-----------------|
| `minimumCacheTTL` | 60 saniye | 14400 saniye (4 saat) |
| `imageSizes` | [16, 32, 48...] | 16 kaldırıldı |
| `qualities` | Tümü | Sadece [75] |

### 18.5 Async Request APIs (Breaking)
```typescript
// ESKİ - Senkron erişim kaldırıldı
const cookieStore = cookies()

// YENİ - Async zorunlu
const cookieStore = await cookies()
const headersList = await headers()
const { isEnabled } = await draftMode()
```

### 18.6 PPR → cacheComponents
```typescript
// ESKİ
experimental: { ppr: true }

// YENİ
cacheComponents: true
```

---

## 19. EMAIL SİSTEMİ VE KULLANICI AKTİVASYONU

### 19.1 Email Servisi
**Dosya**: `src/lib/email/EmailService.ts`

Merkezi email gönderim servisi. SMTP ayarlarını GeneralSettings'ten okur ve NotificationTemplate şablonlarını kullanır.

**Kullanım:**
```typescript
import { createEmailService } from '@/lib/email';

const emailService = createEmailService(tenantPrisma, tenantId, companyId);

// Aktivasyon maili
await emailService.sendActivationEmail(email, userName, activationUrl, 24);

// Hoşgeldin maili
await emailService.sendWelcomeEmail(email, userName);

// Şifre sıfırlama maili
await emailService.sendPasswordResetEmail(email, userName, resetUrl, 60);

// Şifre değişti bildirimi
await emailService.sendPasswordChangedEmail(email, userName);

// Şablon ile email
await emailService.sendWithTemplate(email, 'user_activation', {
  userName: 'John',
  activationUrl: 'https://...',
  activationExpiry: '24 saat',
});
```

### 19.2 Token Yardımcıları
**Dosya**: `src/lib/email/tokenUtils.ts`

```typescript
import {
  generateToken,          // 32 byte hex token
  generateNumericCode,    // 6 haneli sayısal kod
  getTokenExpiry,         // Saat bazlı süre (24 saat)
  getTokenExpiryMinutes,  // Dakika bazlı süre (60 dk)
  isTokenExpired,         // Token süresi dolmuş mu
  buildActivationUrl,     // Aktivasyon URL'i oluştur
  buildPasswordResetUrl,  // Şifre sıfırlama URL'i oluştur
  getBaseUrl,             // Uygulama base URL'ini al
} from '@/lib/email/tokenUtils';
```

### 19.3 User Model Alanları
**Dosya**: `prisma/core-base/user.prisma`

```prisma
// Email Verification & Activation
emailVerified           Boolean   @default(false)
activationToken         String?   @unique
activationTokenExpiry   DateTime?
activationSentAt        DateTime?
activatedAt             DateTime?

// Password Reset
passwordResetToken       String?   @unique
passwordResetTokenExpiry DateTime?
passwordResetSentAt      DateTime?
```

### 19.4 Auth API Endpoint'leri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/auth/register` | POST | Kullanıcı kaydı + aktivasyon maili |
| `/api/auth/activate` | GET/POST | Token kontrolü ve hesap aktivasyonu |
| `/api/auth/resend-activation` | POST | Yeni aktivasyon maili gönderme |
| `/api/auth/forgot-password` | POST | Şifre sıfırlama maili gönderme |
| `/api/auth/reset-password` | GET/POST | Token kontrolü ve şifre sıfırlama |

### 19.5 Auth Sayfaları

| Sayfa | Yol | Açıklama |
|-------|-----|----------|
| Aktivasyon | `/[locale]/auth/activate?token=xxx` | Hesap aktivasyonu |
| Şifremi Unuttum | `/[locale]/auth/forgot-password` | Şifre sıfırlama talebi |
| Şifre Sıfırlama | `/[locale]/auth/reset-password?token=xxx` | Yeni şifre belirleme |
| Aktivasyon Yeniden Gönder | `/[locale]/auth/resend-activation` | Yeni aktivasyon bağlantısı |

### 19.6 Email Template Tipleri
```typescript
type EmailTemplateType =
  | 'user_activation'      // Hesap aktivasyonu
  | 'welcome'              // Hoşgeldin
  | 'password_reset'       // Şifre sıfırlama
  | 'password_changed'     // Şifre değişti bildirimi
  | 'real_estate_lease_expiry'
  | 'real_estate_rent_reminder'
  | 'real_estate_payment_received'
  | 'real_estate_tenant_welcome'
  | 'real_estate_maintenance_update'
  | 'task_assignment'
  | 'urgent_alert'
  | 'system_update';
```

### 19.7 Email Akışı

**Kullanıcı Kaydı:**
1. Kullanıcı kayıt formunu doldurur
2. Sistem aktivasyon token'ı oluşturur (24 saat geçerli)
3. SMTP aktifse aktivasyon maili gönderilir
4. Kullanıcı maildeki linke tıklar
5. Hesap aktifleştirilir (`status: 'active'`, `emailVerified: true`)
6. Hoşgeldin maili gönderilir

**Şifre Sıfırlama:**
1. Kullanıcı e-posta adresini girer
2. Sistem reset token oluşturur (60 dakika geçerli)
3. Şifre sıfırlama maili gönderilir
4. Kullanıcı linke tıklayıp yeni şifre belirler
5. Şifre değişikliği onay maili gönderilir

### 19.8 SMTP Ayarları
SMTP ayarları `GeneralSettings` tablosundan okunur:
- `smtpEnabled` - SMTP aktif mi
- `smtpHost` - SMTP sunucu adresi
- `smtpPort` - Port (varsayılan: 587)
- `smtpEncryption` - TLS/SSL/None
- `smtpUsername` - Kullanıcı adı
- `smtpPassword` - Şifre
- `smtpFromName` - Gönderen adı
- `smtpFromEmail` - Gönderen e-posta

---

## 20. BİLDİRİM ŞABLONLARI SİSTEMİ

### 20.1 NotificationTemplate Modeli
**Dosya**: `prisma/extensions/files.prisma`

```prisma
model NotificationTemplate {
  id                    String   @id @default(uuid())
  tenantId              String
  companyId             String?

  // Temel bilgiler
  name                  String
  channel               String   // email, sms, push, whatsapp, telegram
  category              String?  // system, user, task, urgent, real_estate
  notificationType      String?  // user_activation, password_reset, vb.

  // Email alanları
  emailSubject          String?
  emailPlainText        String?
  emailHtmlTemplate     String?
  emailTemplateStyle    String?  // corporate, visionary, elegant, modern

  // Varsayılan ayarları
  isDefault             Boolean  @default(false)
  defaultForType        String?  // Bildirim tipi için varsayılan
  isActive              Boolean  @default(true)
}
```

### 20.2 Seed Şablonları
**Dosya**: `src/app/api/notification-templates/seed/route.ts`

"Hazır Şablonları Yükle" butonu ile 32+ şablon oluşturulur:
- Kullanıcı aktivasyonu, hoşgeldin, şifre sıfırlama
- Emlak: kira hatırlatma, ödeme alındı, kiracı hoşgeldin
- SMS, Push, WhatsApp, Telegram şablonları

### 20.3 Şablon Değişkenleri
```typescript
interface TemplateVariables {
  // Kullanıcı
  userName?: string;
  userEmail?: string;

  // Aktivasyon
  activationUrl?: string;
  activationCode?: string;
  activationExpiry?: string;

  // Şifre Sıfırlama
  resetUrl?: string;
  resetCode?: string;
  resetExpiry?: string;

  // Firma
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;

  // Tarih
  date?: string;   // Otomatik: bugünün tarihi
  year?: string;   // Otomatik: yıl

  // Emlak
  propertyName?: string;
  tenantName?: string;
  rentAmount?: string;
  currency?: string;
  dueDate?: string;
  // ... diğer emlak alanları
}
```

### 20.4 Kategori Filtreleme
Bildirim şablonları sayfasında kategoriye göre filtreleme:
- `system` - Sistem bildirimleri
- `user` - Kullanıcı bildirimleri
- `task` - Görev bildirimleri
- `urgent` - Acil bildirimler
- `real_estate` - Emlak bildirimleri

---

## 21. DOSYA KONUMLARI HIZLI REFERANS (Ek)

| Amaç | Dosya |
|------|-------|
| Email Servisi | `src/lib/email/EmailService.ts` |
| Token Yardımcıları | `src/lib/email/tokenUtils.ts` |
| Email Index | `src/lib/email/index.ts` |
| Kayıt API | `src/app/api/auth/register/route.ts` |
| Aktivasyon API | `src/app/api/auth/activate/route.ts` |
| Aktivasyon Yeniden Gönder | `src/app/api/auth/resend-activation/route.ts` |
| Şifremi Unuttum API | `src/app/api/auth/forgot-password/route.ts` |
| Şifre Sıfırlama API | `src/app/api/auth/reset-password/route.ts` |
| Aktivasyon Sayfası | `src/app/[locale]/auth/activate/page.tsx` |
| Şifremi Unuttum Sayfası | `src/app/[locale]/auth/forgot-password/page.tsx` |
| Şifre Sıfırlama Sayfası | `src/app/[locale]/auth/reset-password/page.tsx` |
| Aktivasyon Yeniden Gönder Sayfası | `src/app/[locale]/auth/resend-activation/page.tsx` |
| User Model | `prisma/core-base/user.prisma` |
| NotificationTemplate Model | `prisma/extensions/files.prisma` |
| Seed Route | `src/app/api/notification-templates/seed/route.ts` |

---

## 22. DATATABLE KULLANIM DOKÜMANTASYONU

### 22.1 DataTable Özellikleri

**Merkezi Bileşen**: `src/components/tables/DataTable.tsx`

| Özellik | Prop | Varsayılan | Açıklama |
|---------|------|------------|----------|
| Arama | `searchable` | `true` | Sütunlarda `searchable: true` olanlar aranır |
| Sıralama | `sortable` | `true` | Sütun başlığına tıkla: Yok → Asc → Desc → Yok |
| Filtre | `filters`, `onFilter` | - | FilterOption[] ile modal filtre |
| Kolon Ayarları | `showColumnSettings` | `true` | Göster/gizle, sıralama, renk |
| Export | `showExportIcons` | `false` | CSV, Excel, PDF, Word, HTML, Print |
| Audit | `showAuditHistory` | `false` | Değişiklik geçmişi popup |
| Seçim | `selectable` | `false` | Çoklu satır seçimi |
| Sayfalama | `defaultPageSize` | `10` | Sayfa başına kayıt |

### 22.2 DataTable Kullanan Sayfalar

#### REAL-ESTATE MODÜLÜ

| Sayfa | Dosya Yolu | URL | Arama | Sıralama | Filtre | Export | Audit |
|-------|-----------|-----|-------|----------|--------|--------|-------|
| **Daireler** | `src/modules/real-estate/components/ApartmentList.tsx` | `/[locale]/modules/real-estate/apartments` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Daire Detay (Bakım Tab) | `src/app/[locale]/modules/real-estate/apartments/[id]/ApartmentDetailPageClient.tsx` | `/[locale]/modules/real-estate/apartments/[id]` | - | ✓ | - | - | - |
| Email Kampanya Detay | `src/app/[locale]/modules/real-estate/email/campaigns/[id]/EmailCampaignDetailPageClient.tsx` | `/[locale]/modules/real-estate/email/campaigns/[id]` | - | - | - | - | - |

**Eksik DataTable Sayfaları:**
- Properties listesi
- Tenants listesi
- Leases listesi
- Payments listesi
- Maintenance listesi
- Staff listesi

#### ACCOUNTING MODÜLÜ

| Sayfa | Dosya Yolu | URL | Arama | Sıralama | Filtre | Export | Audit |
|-------|-----------|-----|-------|----------|--------|--------|-------|
| **Kasa Hareketleri** | `src/app/[locale]/modules/accounting/cash-transactions/CashTransactionsPageClient.tsx` | `/[locale]/modules/accounting/cash-transactions` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ödeme Yöntemleri | `src/app/[locale]/modules/accounting/settings/payment-methods/PaymentMethodsSettingsClient.tsx` | `/[locale]/modules/accounting/settings/payment-methods` | - | ✓ | - | - | - |

#### MANAGEMENT SAYFALARI

| Sayfa | Dosya Yolu | URL | Arama | Sıralama | Filtre | Export | ColSet | Audit |
|-------|-----------|-----|-------|----------|--------|--------|--------|-------|
| **Kullanıcılar** | `src/app/[locale]/management/users/UsersPageClient.tsx` | `/[locale]/management/users` | ✓ | ✓ | ✓ | ✓ | ❌ | ✓ |
| Firmalar | `src/app/[locale]/management/companies/CompaniesPageClient.tsx` | `/[locale]/management/companies` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Roller | `src/app/[locale]/management/roles/RolesPageClient.tsx` | `/[locale]/management/roles` | ✓ | ✓ | - | ✓ | ✓ | - |
| İzinler | `src/app/[locale]/management/permissions/PermissionsPageClient.tsx` | `/[locale]/management/permissions` | ✓ | ✓ | - | - | - | - |

#### ADMIN SAYFALARI

| Sayfa | Dosya Yolu | URL | Arama | Sıralama | Filtre | Export | ColSet | Audit |
|-------|-----------|-----|-------|----------|--------|--------|--------|-------|
| **Loglar** | `src/app/[locale]/admin/logs/LogsPageClient.tsx` | `/[locale]/admin/logs` | ✓ | ✓ | ⚠️ Manuel | ✓ | ✓ | - |
| Tenants | `src/app/[locale]/admin/tenants/TenantsPageClient.tsx` | `/[locale]/admin/tenants` | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Cache | `src/app/[locale]/admin/optimization/cache/CachePageClient.tsx` | `/[locale]/admin/optimization/cache` | ✓ | ✓ | - | - | - | - |

#### SETTINGS SAYFALARI

| Sayfa | Dosya Yolu | URL | Arama | Sıralama | Filtre | Export | ColSet | Audit |
|-------|-----------|-----|-------|----------|--------|--------|--------|-------|
| **Bildirim Şablonları** | `src/app/[locale]/settings/notification-templates/components/EmailTemplatesTab.tsx` | `/[locale]/settings/notification-templates` | ⚠️ Manuel | ✓ | ⚠️ Manuel | ❌ | ❌ | ✓ |
| **Export Şablonları** | `src/app/[locale]/settings/export-templates/ExportTemplatesPageClient.tsx` | `/[locale]/settings/export-templates` | ⚠️ Manuel | ✓ | ⚠️ Manuel | ❌ | ❌ | - |
| Lokasyonlar | `src/app/[locale]/settings/company/locations/LocationsPageClient.tsx` | `/[locale]/settings/company/locations` | ✓ | ✓ | - | ✓ | ✓ | ✓ |

#### CALENDAR MODÜLÜ

| Sayfa | Dosya Yolu | URL | Durum |
|-------|-----------|-----|-------|
| Randevular | `src/app/[locale]/modules/calendar/appointments/` | `/[locale]/modules/calendar/appointments` | DataTable Var |
| Etkinlikler | `src/app/[locale]/modules/calendar/events/` | `/[locale]/modules/calendar/events` | DataTable Var |

#### FILE MANAGER MODÜLÜ

| Sayfa | Dosya Yolu | URL | Durum |
|-------|-----------|-----|-------|
| Dashboard | `src/app/[locale]/modules/file-manager/dashboard/` | `/[locale]/modules/file-manager/dashboard` | DataTable Var |

#### WEB BUILDER MODÜLÜ

| Sayfa | Dosya Yolu | URL | Durum |
|-------|-----------|-----|-------|
| Analytics | `src/app/[locale]/modules/web-builder/analytics/` | `/[locale]/modules/web-builder/analytics` | DataTable Var |

### 22.3 DataTable KULLANMAYAN Modüller

**❌ HR MODÜLÜ** - Hiç DataTable yok
| Sayfa | Dosya Yolu | URL |
|-------|-----------|-----|
| Çalışanlar | `src/app/[locale]/modules/hr/employees/` | `/[locale]/modules/hr/employees` |
| Departmanlar | `src/app/[locale]/modules/hr/departments/` | `/[locale]/modules/hr/departments` |
| Pozisyonlar | `src/app/[locale]/modules/hr/positions/` | `/[locale]/modules/hr/positions` |
| İzinler | `src/app/[locale]/modules/hr/leaves/` | `/[locale]/modules/hr/leaves` |
| Vardiyalar | `src/app/[locale]/modules/hr/shifts/` | `/[locale]/modules/hr/shifts` |
| Maaşlar | `src/app/[locale]/modules/hr/payroll/` | `/[locale]/modules/hr/payroll` |
| Performans | `src/app/[locale]/modules/hr/performance/` | `/[locale]/modules/hr/performance` |
| Eğitimler | `src/app/[locale]/modules/hr/training/` | `/[locale]/modules/hr/training` |

**❌ MAINTENANCE MODÜLÜ** - Hiç DataTable yok
| Sayfa | Dosya Yolu | URL |
|-------|-----------|-----|
| İş Emirleri | `src/app/[locale]/modules/maintenance/work-orders/` | `/[locale]/modules/maintenance/work-orders` |
| Ekipmanlar | `src/app/[locale]/modules/maintenance/equipment/` | `/[locale]/modules/maintenance/equipment` |
| Bakım Planları | `src/app/[locale]/modules/maintenance/schedules/` | `/[locale]/modules/maintenance/schedules` |
| Parça Stok | `src/app/[locale]/modules/maintenance/inventory/` | `/[locale]/modules/maintenance/inventory` |
| Raporlar | `src/app/[locale]/modules/maintenance/reports/` | `/[locale]/modules/maintenance/reports` |

**❌ PRODUCTION MODÜLÜ** - Hiç DataTable yok
| Sayfa | Dosya Yolu | URL |
|-------|-----------|-----|
| Siparişler | `src/app/[locale]/modules/production/orders/` | `/[locale]/modules/production/orders` |
| Ürünler | `src/app/[locale]/modules/production/products/` | `/[locale]/modules/production/products` |
| İş İstasyonları | `src/app/[locale]/modules/production/workstations/` | `/[locale]/modules/production/workstations` |

### 22.4 Tespit Edilen Sorunlar

#### Sorun 1: Manuel Filtre Kullanımı
**Etkilenen Sayfalar:**
- `EmailTemplatesTab.tsx` - Filtre `useMemo` ile yapılıyor
- `ExportTemplatesPageClient.tsx` - Aynı durum
- `LogsPageClient.tsx` - Custom filter panel

**Sorun:** DataTable filter prop'u kullanılmıyor, bu yüzden:
- Filter modal açılmıyor
- Aktif filtre sayısı badge görünmüyor
- Filtre state localStorage'a kaydedilmiyor

#### Sorun 2: Column Settings Eksik
**Etkilenen Sayfalar:**
- `UsersPageClient.tsx` - `showColumnSettings` belirtilmemiş
- `EmailTemplatesTab.tsx` - `showColumnSettings` yok
- `ExportTemplatesPageClient.tsx` - `showColumnSettings` yok

#### Sorun 3: Export Icons Eksik
**Etkilenen Sayfalar:**
- `EmailTemplatesTab.tsx` - `showExportIcons` yok
- `ExportTemplatesPageClient.tsx` - `showExportIcons` yok

#### Sorun 4: Modül Seviyesinde DataTable Eksikliği
**Tam Eksik Modüller:**
- HR: 8+ liste sayfası, 0 DataTable
- Maintenance: 5+ liste sayfası, 0 DataTable
- Production: 3+ liste sayfası, 0 DataTable

### 22.5 DataTable Özellik Özet Tablosu

| Modül | Liste Sayfa | DataTable | Arama | Sıralama | Filtre | Export | Audit |
|-------|-------------|-----------|-------|----------|--------|--------|-------|
| Real-Estate | 10+ | 1 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Accounting | 5+ | 2 | ✓ | ✓ | ✓ | ✓ | ✓ |
| HR | 8+ | ❌ 0 | - | - | - | - | - |
| Maintenance | 5+ | ❌ 0 | - | - | - | - | - |
| Production | 3+ | ❌ 0 | - | - | - | - | - |
| Calendar | 2+ | 2 | ✓ | ✓ | ? | ? | ? |
| File Manager | 2+ | 1 | ✓ | ✓ | ? | ? | ? |
| Web Builder | 3+ | 1 | ✓ | ✓ | ? | ? | ? |
| Management | 4 | 4 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | 5+ | 3 | ✓ | ✓ | ⚠️ | ✓ | - |
| Settings | 8+ | 3 | ⚠️ | ✓ | ⚠️ | ⚠️ | ⚠️ |

**Açıklamalar:**
- ✓ = Tam çalışıyor
- ⚠️ = Manuel/Eksik implementasyon
- ❌ = Hiç yok
- ? = Doğrulanmadı

---

## 23. PARA BİRİMİ SİSTEMİ (Currency System)

### 23.1 Merkezi Currency Sabitleri
**Dosya**: `src/lib/constants/currency.ts`

```typescript
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, CURRENCY_SELECT_OPTIONS, getCurrencyLocale } from '@/lib/constants/currency';

// Desteklenen para birimleri
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { value: 'TRY', label: 'TRY - Türk Lirası', symbol: '₺', locale: 'tr-TR' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$', locale: 'en-US' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€', locale: 'de-DE' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£', locale: 'en-GB' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼', locale: 'ar-SA' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { value: 'RUB', label: 'RUB - Russian Ruble', symbol: '₽', locale: 'ru-RU' },
];

// Varsayılan para birimi
export const DEFAULT_CURRENCY = 'TRY';

// Select component için options
export const CURRENCY_SELECT_OPTIONS = SUPPORTED_CURRENCIES.map(c => ({
  value: c.value,
  label: c.label,
}));

// Para birimi kodundan locale al
export function getCurrencyLocale(code: string): string;
```

### 23.2 useCurrency Hook
**Dosya**: `src/hooks/useCurrency.ts`

Para birimi formatlaması için merkezi React hook. **`GeneralSettings.currency` değerini okur** (Ayarlar > Bölge ve Saat sayfasından ayarlanır). Demo verilerin hangi para birimi ile seed edildiğinden bağımsız olarak, bu ayar tüm formatlama işlemlerini belirler.

```typescript
import { useCurrency } from '@/hooks/useCurrency';

function MyComponent() {
  const {
    currency,           // Aktif para birimi kodu (GeneralSettings'ten, örn: 'USD')
    locale,             // Locale string (örn: 'en-US')
    formatCurrency,     // Para formatla fonksiyonu
    formatAmount,       // Sadece sayı formatla (symbol yok)
    currencyOptions,    // Select için options
    loading,            // Yükleniyor mu
  } = useCurrency();

  // Kullanım - Ayarlar'daki para birimine göre formatlar
  const price = formatCurrency(1500.50);        // "₺1.500,50" veya "$1,500.50"
  const priceUSD = formatCurrency(100, 'USD');  // Override ile: "$100.00"
}
```

**Akış:**
1. Kullanıcı **Ayarlar > Bölge ve Saat** sayfasından para birimini değiştirir
2. `GeneralSettings.currency` DB'de güncellenir
3. `CompanyContext` bu değeri `/api/general-settings`'ten çeker
4. `useCurrency` hook bu değeri kullanarak formatlama yapar
5. Tüm sayfalarda para birimi otomatik olarak güncellenir

### 23.3 Kullanım Kuralları

**✅ DOĞRU - useCurrency hook kullan:**
```typescript
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS, DEFAULT_CURRENCY } from '@/lib/constants/currency';

function PriceDisplay({ amount }: { amount: number }) {
  const { formatCurrency } = useCurrency();
  return <Text>{formatCurrency(amount)}</Text>;
}

function CurrencySelect({ value, onChange }) {
  return (
    <Select
      data={CURRENCY_SELECT_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
```

**❌ YANLIŞ - Hardcoded currency:**
```typescript
// YAPMA!
const formatted = amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

// YAPMA!
<Select data={['TRY', 'USD', 'EUR']} />

// YAPMA!
const currency = 'TRY';
```

### 23.4 Form'larda Varsayılan Currency

Yeni kayıt oluştururken varsayılan currency'yi GeneralSettings'ten al:

```typescript
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';

function ProductForm({ product }: { product?: Product }) {
  const { currency: defaultCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    currency: product?.currency || '', // Başlangıçta boş
  });

  // Yeni kayıt ise varsayılan currency'yi ayarla
  useEffect(() => {
    if (!product && defaultCurrency && !formData.currency) {
      setFormData(prev => ({ ...prev, currency: defaultCurrency }));
    }
  }, [product, defaultCurrency]);

  return (
    <Select
      label="Para Birimi"
      data={CURRENCY_SELECT_OPTIONS}
      value={formData.currency}
      onChange={(value) => setFormData({ ...formData, currency: value || defaultCurrency })}
    />
  );
}
```

### 23.5 Settings Sayfasında Currency Senkronizasyonu

Settings sayfasında form state'i API'den gelen settings ile senkronize edilmeli:

```typescript
// ❌ YANLIŞ - useState sadece bir kez initialize olur
const [formData, setFormData] = useState({
  currency: settings.currency || 'TRY', // settings boş olabilir!
});

// ✅ DOĞRU - useEffect ile senkronize et
const [formData, setFormData] = useState({
  currency: DEFAULT_CURRENCY,
});

useEffect(() => {
  if (settings && Object.keys(settings).length > 0) {
    setFormData({
      currency: settings.currency || DEFAULT_CURRENCY,
      // ... diğer alanlar
    });
  }
}, [settings]);
```

### 23.6 Server-Side Currency Kullanımı

Hook kullanılamayan server-side kodlarda (template-variables.ts gibi):

```typescript
import { getCurrencyLocale, DEFAULT_CURRENCY } from '@/lib/constants/currency';

interface VariableContext {
  currency?: string;
  locale?: string;
}

function processTemplate(content: string, context: VariableContext) {
  const currency = context.currency || DEFAULT_CURRENCY;
  const locale = context.locale || getCurrencyLocale(currency);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };

  // ...
}
```

### 23.7 Seed Dosyalarında Currency

⚠️ **ÖNEMLİ:** Demo verilerde `currency` alanı **belirtilmez**! Prisma şemasındaki `@default("TRY")` varsayılan değeri kullanılır. **Uygulama çalışırken para birimi formatlaması `GeneralSettings.currency` ayarına göre `useCurrency` hook ile yapılır.**

Seeder'larda currency alanını **belirtmeyin** - Prisma varsayılan değeri kullanır:

```typescript
// prisma/seed/modules/accounting.seed.ts
async seed(ctx: SeederContext): Promise<SeederResult> {
  const { tenantPrisma, tenantId, companyId } = ctx; // ❌ ctx.currency artık yok!

  await tenantPrisma.subscription.create({
    data: {
      // ...
      // currency alanı YOK - varsayılan "TRY" kullanılacak
      // currency: null, // ❌ YAPMA! TypeScript hatası verir
      // currency: 'TRY', // ❌ YAPMA! Hardcode etme
    },
  });
}
```

**Demo Seed CLI:**
```bash
# Locale sadece dili belirler - currency Prisma varsayılanını kullanır
TENANT_DATABASE_URL="..." npx tsx prisma/seed/demo-seed.ts --tenant-slug=demo --locale=de
# → Almanca demo veriler, currency="TRY" (varsayılan)

TENANT_DATABASE_URL="..." npx tsx prisma/seed/demo-seed.ts --tenant-slug=demo --locale=en
# → İngilizce demo veriler, currency="TRY" (varsayılan)
```

**Not:** Kullanıcı Ayarlar > Bölge ve Saat sayfasından para birimini değiştirdiğinde, `useCurrency` hook bu değeri okur ve tüm görüntüleme yeni para birimine göre formatlanır. DB'deki currency alanı değişmez, sadece görüntüleme formatı değişir.

### 23.8 Düzeltilen Dosyalar (2026-01-06)

| Modül | Dosya | Değişiklik |
|-------|-------|------------|
| **Core** | `src/lib/constants/currency.ts` | Merkezi currency sabitleri |
| **Core** | `src/hooks/useCurrency.ts` | Currency hook (GeneralSettings.currency okur) |
| **Settings** | `RegionTimeTab.tsx` | useEffect ile settings sync, CURRENCY_SELECT_OPTIONS |
| **HR** | `PayrollList.tsx`, `PayrollDetail.tsx` | useCurrency hook |
| **Production** | `ProductionDashboard.tsx`, `ProductForm.tsx` | useCurrency hook |
| **License** | `LicensePackageForm.tsx` | useCurrency hook, CURRENCY_SELECT_OPTIONS |
| **Maintenance** | `MaintenanceDashboard.tsx`, `MaintenanceRecordDetail.tsx`, `MaintenanceRecordList.tsx` | useCurrency hook |
| **Accounting** | `CashFlowDesignV1.tsx`, `CashFlowDesignV2.tsx`, `CashFlowDesignV3.tsx` | useCurrency hook |
| **Real-Estate** | `PaymentList.tsx` | formatCurrency(value, row.currency) |
| **Real-Estate** | `PaymentCards.tsx`, `PaymentQuickBoard.tsx` | currency prop eklendi |
| **Real-Estate** | `TenantDetail.tsx`, `ContractDetail.tsx`, `ContractTracking.tsx` | useCurrency hook |
| **Real-Estate API** | `payments/analytics/route.ts` | currency alanı eklendi |
| **Utils** | `template-variables.ts` | getCurrencyLocale, DEFAULT_CURRENCY |
| **Seed** | `accounting.seed.ts`, `hr.seed.ts`, `production.seed.ts`, `real-estate.seed.ts` | currency alanı kaldırıldı (varsayılan kullanılıyor) |
| **Seed** | `real-estate.seed.ts` | create→upsert (idempotent), Prisma relation fixes |
| **Setup API** | `demo-modules/route.ts` | checkStatus+unseed before seed (idempotent) |
| **Demo Data API** | `[slug]/demo-data/route.ts` | LOCALE_CURRENCIES kaldırıldı, currency references temizlendi |

---

## 24. DOSYA KONUMLARI HIZLI REFERANS (Güncel)

| Amaç | Dosya |
|------|-------|
| **Auth Hook** | `src/hooks/useAuth.ts` |
| **Layout Wrapper** | `src/components/layouts/LayoutWrapper.tsx` |
| **Currency Sabitleri** | `src/lib/constants/currency.ts` |
| **Currency Hook** | `src/hooks/useCurrency.ts` |
| Merkezi Tablo | `src/components/tables/DataTable.tsx` |
| Merkezi Modal | `src/components/modals/AlertModal.tsx` |
| Toast Bildirim | `src/hooks/useNotification.tsx` |
| Sayfa Header | `src/components/headers/CentralPageHeader.tsx` |
| Skeleton'lar | `src/components/skeletons/` |
| API withTenant | `src/lib/api/withTenant.ts` |
| API Response | `src/lib/api/response.ts` |
| i18n Client | `src/lib/i18n/client.ts` |
| Global Çeviriler | `src/locales/global/` |
| Modül Çevirileri | `src/locales/modules/` |
| Tema Context | `src/context/ThemeContext.tsx` |
| Company Context | `src/context/CompanyContext.tsx` |
| Demo Veri Locales | `prisma/seed/locales/` |
| Seeder Base | `prisma/seed/modules/base-seeder.ts` |
| Seeder CLI | `prisma/seed/modules/run-all.ts` |
| Modül Seeder'lar | `prisma/seed/modules/*.seed.ts` |
| Demo Seed (Standalone) | `prisma/seed/demo-seed.ts` |
| Email Servisi | `src/lib/email/EmailService.ts` |
| Token Yardımcıları | `src/lib/email/tokenUtils.ts` |

---

**Son Güncelleme**: 2026-01-06
**Platform Versiyonu**: 1.1.2
**Next.js Versiyonu**: 16.1.1
