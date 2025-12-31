# Toplu Değişiklik Planı

> **Oluşturulma Tarihi**: 2025-12-31
> **Amaç**: Bu dosya, başka bir sohbette uygulanacak toplu değişikliklerin detaylı planını içerir.

---

## 1. SKELETON SİSTEMİ DÜZENLEMESİ

### 1.1 Mevcut Durum
- **Toplam PageClient dosyası**: ~133
- **ListPageSkeleton kullanan**: 2 dosya
- **DetailPageSkeleton kullanan**: 17 dosya
- **LoadingOverlay kullanan**: 4 dosya
- **Loading state'i olmayan**: ~90 dosya

### 1.2 Skeleton İçinde Header Olan (YANLIŞ - DÜZELTİLECEK)

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `src/app/[locale]/locations/LocationsPageSkeleton.tsx` | 7-11 | CentralPageHeader skeleton içinde render ediliyor |

**Düzeltme**: Header'ı skeleton dışına çıkar, loading conditional'ından bağımsız render et.

### 1.3 LoadingOverlay Kullanan Sayfalar (LoadingOverlay → Skeleton)

| Dosya | Satır |
|-------|-------|
| `src/app/[locale]/settings/general/GeneralSettingsPageClient.tsx` | 158 |
| `src/app/[locale]/settings/menu-management/MenuManagementPageClient.tsx` | - |
| `src/app/[locale]/settings/menu-management/footer/FooterCustomizationPageClient.tsx` | - |
| `src/app/[locale]/settings/notifications/NotificationSettingsPageClient.tsx` | - |

### 1.4 Loading State Olmayan Sayfalar (Skeleton Eklenecek)

**Liste Sayfaları** (ListPageSkeleton kullanacak):
```
src/app/[locale]/modules/accounting/expenses/ExpensesPageClient.tsx
src/app/[locale]/modules/accounting/invoices/InvoicesPageClient.tsx
src/app/[locale]/modules/accounting/subscriptions/SubscriptionsPageClient.tsx
src/app/[locale]/modules/hr/employees/EmployeesPageClient.tsx
src/app/[locale]/modules/hr/leaves/LeavesPageClient.tsx
src/app/[locale]/modules/hr/payroll/PayrollPageClient.tsx
src/app/[locale]/modules/production/orders/OrdersPageClient.tsx
src/app/[locale]/modules/production/products/ProductsPageClient.tsx
src/app/[locale]/modules/production/stock/StockPageClient.tsx
src/app/[locale]/modules/maintenance/records/MaintenanceRecordsPageClient.tsx
src/app/[locale]/modules/real-estate/apartments/ApartmentsPageClient.tsx
src/app/[locale]/modules/real-estate/properties/PropertiesPageClient.tsx
src/app/[locale]/modules/real-estate/tenants/TenantsPageClient.tsx
src/app/[locale]/modules/real-estate/contracts/ContractsPageClient.tsx
src/app/[locale]/modules/real-estate/payments/PaymentsPageClient.tsx
src/app/[locale]/modules/real-estate/staff/StaffPageClient.tsx
src/app/[locale]/modules/real-estate/appointments/AppointmentsPageClient.tsx
src/app/[locale]/management/users/UsersPageClient.tsx
src/app/[locale]/management/roles/RolesPageClient.tsx
src/app/[locale]/management/permissions/PermissionsPageClient.tsx
src/app/[locale]/management/companies/CompaniesPageClient.tsx
src/app/[locale]/admin/tenants/page.tsx
src/app/[locale]/admin/licenses/packages/page.tsx
src/app/[locale]/admin/licenses/types/page.tsx
src/app/[locale]/admin/licenses/tenants/page.tsx
```

**Uygulama Şablonu**:
```typescript
// Dosya başına ekle
import { ListPageSkeleton } from '@/components/skeletons/ListPageSkeleton';

// Component içinde
if (isLoading) {
  return <ListPageSkeleton />;
}
```

---

## 2. BİLDİRİM/MODAL DÜZENLEMESİ

### 2.1 Custom Modal → AlertModal Dönüştürülecek Dosyalar

| Dosya | Satır | Tip |
|-------|-------|-----|
| `src/app/[locale]/admin/backups/page.tsx` | ~467 | Delete confirmation |
| `src/app/[locale]/admin/licenses/packages/page.tsx` | ~290 | Delete confirmation |
| `src/app/[locale]/admin/licenses/tenants/page.tsx` | - | Delete confirmation |
| `src/app/[locale]/admin/licenses/types/page.tsx` | - | Delete confirmation |
| `src/app/[locale]/admin/tenants/page.tsx` | ~307 | Delete confirmation |
| `src/app/[locale]/admin/superadmin/backups/page.tsx` | - | Delete confirmation |
| `src/app/[locale]/locations/hierarchy/LocationHierarchyPageClient.tsx` | ~243 | Delete confirmation |
| `src/app/[locale]/settings/menu-management/components/MenuList.tsx` | ~398 | Delete confirmation |

### 2.2 Deprecated Hook (Kaldırılacak)

| Dosya | Açıklama |
|-------|----------|
| `src/hooks/useConfirmDialog.tsx` | AlertModal ile değiştirilecek, tüm kullanımlar güncellenmeli |

### 2.3 Korunacak Modaller (Form/Kompleks)

- `src/app/[locale]/modules/file-manager/components/modals/CreateFolderModal.tsx` - Form modal
- `src/app/[locale]/modules/file-manager/components/modals/RenameModal.tsx` - Form modal
- `src/app/[locale]/modules/file-manager/components/modals/MoveCopyModal.tsx` - Seçim modal
- `src/app/[locale]/modules/file-manager/components/modals/ShareModal.tsx` - Bilgi modal

---

## 3. DÜZENLE BUTONU STİLLERİ

### 3.1 Standart Stil
```typescript
{
  label: t('common.actions.edit'),
  icon: <IconEdit size={18} />,
  onClick: handleEdit,
  variant: 'filled',  // STANDART
  color: 'blue',      // STANDART
}
```

### 3.2 `variant="light"` Olan (→ `variant="filled"` olacak)

| Dosya | Satır |
|-------|-------|
| `src/app/[locale]/locations/[id]/LocationDetailPageClient.tsx` | 109 |
| `src/app/[locale]/modules/accounting/expenses/[id]/ExpenseDetailPageClient.tsx` | 80 |
| `src/app/[locale]/modules/accounting/invoices/[id]/InvoiceDetailPageClient.tsx` | 66 |
| `src/app/[locale]/modules/accounting/subscriptions/[id]/SubscriptionDetailPageClient.tsx` | 77 |
| `src/app/[locale]/modules/production/orders/[id]/OrderDetailPageClient.tsx` | 80 |
| `src/app/[locale]/modules/production/products/[id]/ProductDetailPageClient.tsx` | 65 |
| `src/app/[locale]/admin/tenant-licenses/[id]/TenantLicenseDetailPageClient.tsx` | 57 |
| `src/app/[locale]/admin/licenses/[id]/LicensePackageDetailPageClient.tsx` | 55 |
| `src/app/[locale]/admin/superadmin/licenses/[id]/LicensePackageDetailPageClient.tsx` | 55 |

### 3.3 `variant="outline"` Olan (→ `variant="filled"` olacak)

| Dosya | Satır |
|-------|-------|
| `src/app/[locale]/modules/real-estate/appointments/[id]/AppointmentDetailPageClient.tsx` | 87 |

### 3.4 Variant Belirtilmemiş (→ `variant="filled"` eklenecek)

| Dosya | Satır |
|-------|-------|
| `src/app/[locale]/modules/real-estate/properties/[id]/PropertyDetailPageClient.tsx` | 176-185 |
| `src/app/[locale]/modules/real-estate/contracts/[id]/ContractDetailPageClient.tsx` | 33-39 |
| `src/app/[locale]/modules/real-estate/contract-templates/[id]/ContractTemplateDetailPageClient.tsx` | 29-35 |

---

## 4. YENİLE BUTONU ANİMASYONLARI

### 4.1 Referans Pattern (SetupWizard.tsx)
```typescript
<IconRefresh
  size={18}
  style={isLoading ? { animation: 'spin 1s linear infinite' } : undefined}
/>
```

### 4.2 Animasyon Eklenecek Dosyalar

| Dosya | Satır | Tip |
|-------|-------|-----|
| `src/app/[locale]/settings/export-templates/components/ExportTemplateForm.tsx` | 511 | Auto-fill button |
| `src/components/auth/SessionTimeoutWarning.tsx` | 332 | Extend session button |
| `src/app/(setup)/setup/SecurityAudit.tsx` | 26 | Security audit |
| `src/app/(setup)/setup/ServerControl.tsx` | 31, 40, 48, 50, 65, 252 | Server control buttons |
| `src/app/[locale]/admin/optimization/cache/page.tsx` | 405 | Cache refresh |
| `src/app/[locale]/admin/optimization/performance/page.tsx` | 69 | Performance refresh |
| `src/app/[locale]/admin/tenants/page.tsx` | 264 | Tenants list refresh |
| `src/app/[locale]/admin/tenants/database/page.tsx` | 302 | Database refresh |
| `src/app/[locale]/management/companies/page.tsx` | 326 | Companies refresh |
| `src/modules/real-estate/components/TenantAnalytics.tsx` | 100 | Recalculate button |
| `src/modules/real-estate/components/ContractTracking.tsx` | 18 | Contract tracking |
| `src/modules/real-estate/components/UsageRightsPanel.tsx` | 28, 190 | Usage rights |
| `src/components/tables/ColumnSettingsModal.tsx` | 4 | Reset button |
| `src/modules/dashboard/Dashboard.tsx` | 39 | Dashboard refresh |

### 4.3 Uygulama Şablonu
```typescript
// State ekle
const [isRefreshing, setIsRefreshing] = useState(false);

// Handler güncelle
const handleRefresh = async () => {
  setIsRefreshing(true);
  await refetch();
  setIsRefreshing(false);
};

// Icon güncelle
<IconRefresh
  size={18}
  style={isRefreshing ? { animation: 'spin 1s linear infinite' } : undefined}
/>
```

---

## 5. DATATABLE VE İŞLEMLER SÜTUNU

### 5.1 DataTable Kullanmayan Dosyalar (Dönüştürülecek)

| Dosya | Mevcut | Hedef |
|-------|--------|-------|
| `src/modules/hr/components/EmployeeList.tsx` | Mantine Table | DataTable |
| `src/modules/hr/components/LeaveList.tsx` | Mantine Table | DataTable |
| `src/modules/hr/components/PayrollList.tsx` | Mantine Table | DataTable |
| `src/modules/production/components/ProductList.tsx` | Mantine Table | DataTable |
| `src/modules/production/components/ProductionOrderList.tsx` | Mantine Table | DataTable |
| `src/modules/production/components/StockMovementList.tsx` | Mantine Table | DataTable (read-only) |
| `src/modules/maintenance/components/MaintenanceRecordList.tsx` | Mantine Table | DataTable |

### 5.2 DataTable Action Icon Standartları

**Mevcut Standart (Korunacak)**:
```typescript
// ActionIcon stilleri - TÜM DataTable dosyalarında tutarlı
<Group gap="xs" justify="flex-end">
  <Tooltip label={t('view')} withArrow>
    <ActionIcon variant="subtle" color="blue" onClick={...}>
      <IconEye size={18} />
    </ActionIcon>
  </Tooltip>
  <Tooltip label={t('edit')} withArrow>
    <ActionIcon variant="subtle" color="gray" onClick={...}>
      <IconEdit size={18} />
    </ActionIcon>
  </Tooltip>
  <Tooltip label={t('delete')} withArrow>
    <ActionIcon variant="subtle" color="red" onClick={...}>
      <IconTrash size={18} />
    </ActionIcon>
  </Tooltip>
</Group>
```

### 5.3 Menu-Based Actions (Tespit Edilmedi)
Hiçbir DataTable dosyasında Menu/Dropdown tabanlı işlemler bulunmadı. Tümü ActionIcon kullanıyor.

---

## 6. UYGULAMA ÖNCELİK SIRASI

### Yüksek Öncelik
1. LocationsPageSkeleton header düzeltmesi (1 dosya)
2. Custom Modal → AlertModal dönüşümü (8 dosya)
3. Düzenle butonu stilleri (13 dosya)

### Orta Öncelik
4. Yenile butonu animasyonları (14+ dosya)
5. DataTable dönüşümleri (7 dosya)

### Düşük Öncelik
6. Loading state olmayan sayfalara skeleton ekleme (~90 dosya)

---

## 7. NOTLAR

- Geri butonlarına dokunulmayacak
- Dark mode etkilenmeyecek
- Her değişiklik için i18n çevirileri kontrol edilecek
- Test edilmeden commit yapılmayacak

---

**Son Güncelleme**: 2025-12-31
