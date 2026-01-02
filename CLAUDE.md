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
- `prisma/extensions/audit.prisma` - AuditLog modeli
- `src/lib/services/auditLogService.ts` - Audit servis katmanı
- `src/app/api/audit-logs/route.ts` - REST API endpoint

**Özellikler:**
- Her satır için değişiklik geçmişi gösterimi
- Son 5 işlem popup'ta görüntülenir
- Kim, ne zaman, hangi işlemi yaptı bilgisi
- Değişen alanlar ve eski/yeni değerler

**DataTable Entegrasyonu:**
```tsx
<DataTable
  showAuditHistory={true}       // Audit ikonu göster
  auditEntityName="Apartment"   // Entity adı (model adı ile aynı olmalı)
  auditIdKey="id"               // Satır ID key
  onAuditViewAll={(entityId) => {}} // Opsiyonel: Tüm geçmişi gör callback
/>
```

**API Kullanımı:**
```
GET /api/audit-logs?entity=Apartment&entityId=xxx&pageSize=5
```

**AuditLog Kaydetme - Yöntem 1: Helper Fonksiyonları (Önerilen):**
```typescript
import { getAuditContext, logCreate, logUpdate, logDelete } from '@/lib/api/auditHelper';

// Handler başında audit context al
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

**AuditLog Kaydetme - Yöntem 2: Merkezi CRUD Wrapper:**
```typescript
// src/app/api/real-estate/apartments/route.ts
import { createAuditedCrud } from '@/lib/api/withAuditedCrud';

const crud = createAuditedCrud({
  entity: 'Apartment',
  module: 'real-estate',
});

export const POST = crud.create(async (prisma, data, context) => {
  return await prisma.apartment.create({
    data: { ...data, tenantId: context.tenantId, companyId: context.companyId },
  });
});

// src/app/api/real-estate/apartments/[id]/route.ts
export const PATCH = crud.update(async (prisma, id, data, existing, context) => {
  return await prisma.apartment.update({ where: { id }, data });
});

export const DELETE = crud.delete(async (prisma, id, existing, context) => {
  await prisma.apartment.delete({ where: { id } });
});
```

**i18n Keys (global namespace):**
- `audit.title` → "Değişiklik Geçmişi"
- `audit.recentChanges` → "Son Değişiklikler"
- `audit.viewAll` → "Tüm Geçmişi Gör"
- `audit.noHistory` → "Henüz değişiklik yok"
- `audit.actions.create` → "Oluşturuldu"
- `audit.actions.update` → "Güncellendi"
- `audit.actions.delete` → "Silindi"

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

Demo veriler için çoklu dil ve para birimi desteği:

**Desteklenen Diller:**
| Locale | Para Birimi | Ülke | Açıklama |
|--------|-------------|------|----------|
| `tr` | TRY | TR | Türkçe (varsayılan) |
| `en` | USD | US | İngilizce |
| `de` | EUR | DE | Almanca |
| `ar` | SAR | SA | Arapça |

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
    ├── run-all.ts           # CLI runner (--locale parametresi)
    └── *.seed.ts            # Modül seeder'ları
```

**CLI Kullanımı:**
```bash
# Almanca demo veriler ile seed (EUR para birimi)
TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=demo --locale=de

# Mevcut locale'leri listele
npx tsx prisma/seed/modules/run-all.ts --list-locales

# Belirli modülü seed et
npx tsx prisma/seed/modules/run-all.ts --tenant-slug=demo --locale=en --module=real-estate
```

**Seeder'da Localized Veri Kullanımı:**
```typescript
async seed(ctx: SeederContext): Promise<SeederResult> {
  const { demoData, currency, locale } = ctx;

  // Lokalize edilmiş mülk verileri
  const properties = demoData.realEstate.properties;

  // Lokalize edilmiş kiracı isimleri
  const tenants = demoData.realEstate.tenants;

  // Para birimi (TRY, EUR, USD, SAR)
  const paymentCurrency = currency;

  // Ülke kodu
  const country = demoData.country; // TR, DE, US, SA
}
```

**Demo Veri JSON Yapısı:**
```json
{
  "locale": "de",
  "currency": "EUR",
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
- ✅ Para birimi için `ctx.currency` kullan (`'TRY'` yerine)
- ✅ Ülke kodu için `demoData.country` kullan
- ✅ Yeni locale eklerken tüm seeder'ları güncelle
- ❌ Seeder'da doğrudan dil/para birimi hardcode etme

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

**Son Güncelleme**: 2026-01-01
**Platform Versiyonu**: 1.0.9
**Next.js Versiyonu**: 16.1.1
