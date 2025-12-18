# Core File Manager System
## FAZ 0.1: Merkezi Dosya Yönetim Sistemi

Tüm modüllerin kullanacağı merkezi dosya yönetim sistemi.

## 📋 Genel Bakış

Core File Manager, tüm modüllerin dosya yönetimi ihtiyaçlarını karşılamak için tasarlanmış merkezi bir sistemdir. Her modül kendi dosyalarını yönetebilir ama sistem merkezi olarak çalışır.

## 🏗️ Mimari

### Dosya Yapısı

```
storage/
├── tenants/
│   ├── {tenantId}_{year}/
│   │   ├── module-files/
│   │   │   ├── notifications/
│   │   │   ├── accounting/
│   │   │   ├── hr/
│   │   │   ├── maintenance/
│   │   │   ├── file-manager/
│   │   │   └── ...
│   │   └── user-uploads/
│   │       └── {userId}/
```

### Dosya Yolu Formatı

```
tenants/{tenantId}/module-files/{module}/{entityType}/{date}/{uniqueId}_{filename}
```

Örnek:
```
tenants/acme_2025/module-files/accounting/invoices/2025-01-27/a1b2c3d4_invoice.pdf
```

## 🔧 Kullanım

### Backend (Service)

```typescript
import { CoreFileService } from '@/lib/core-file-manager/CoreFileService';
import { getTenantPrisma } from '@/lib/dbSwitcher';

const tenantPrisma = getTenantPrisma(tenantDbUrl);
const fileService = new CoreFileService(tenantPrisma);

// Dosya yükleme
const file = await fileService.uploadFile({
  tenantId: 'tenant-id',
  module: 'accounting',
  entityType: 'invoice',
  entityId: 'invoice-id',
  file: fileBuffer,
  userId: 'user-id',
});

// Dosya listesi
const files = await fileService.getFiles({
  tenantId: 'tenant-id',
  module: 'accounting',
  entityType: 'invoice',
});

// Dosya silme
await fileService.deleteFile(fileId, userId);
```

### Frontend (React Hook)

```typescript
import { useCoreFileManager } from '@/hooks/useCoreFileManager';

const { files, uploadFile, deleteFile, isLoading } = useCoreFileManager({
  tenantId: 'tenant-id',
  module: 'accounting',
  entityType: 'invoice',
  entityId: 'invoice-id',
  userId: 'user-id',
});

// Dosya yükleme
await uploadFile({
  file: selectedFile,
  title: 'Invoice Document',
  tags: ['invoice', '2024'],
});

// Dosya silme
await deleteFile(fileId);
```

### API Endpoints

- `GET /api/core-files` - Dosya listesi
- `POST /api/core-files` - Dosya yükleme
- `GET /api/core-files/[id]` - Dosya detayı
- `DELETE /api/core-files/[id]` - Dosya silme
- `GET /api/core-files/[id]/download` - Dosya indirme
- `POST /api/core-files/[id]/share` - Dosya paylaşımı

## 📦 Modül Entegrasyonu

### Muhasebe Modülü

```typescript
// Fatura dosyası yükleme
const invoiceFile = await fileService.uploadInvoice(
  tenantId,
  invoiceId,
  file,
  userId
);
```

### Bildirim Modülü

```typescript
// Bildirim eki yükleme
const attachment = await fileService.uploadNotificationAttachment(
  tenantId,
  notificationId,
  file,
  userId
);
```

### Bakım Modülü

```typescript
// Bakım dokümanı yükleme
const document = await fileService.uploadMaintenanceDocument(
  tenantId,
  maintenanceId,
  file,
  userId
);
```

## 🔐 İzin Kontrolü

Dosya erişim kontrolü `checkFileAccess` metodu ile yapılır:

```typescript
const hasAccess = await fileService.checkFileAccess(
  fileId,
  userId,
  'read' | 'write' | 'delete'
);
```

İzinler `FilePermissions` interface'i ile yönetilir:

```typescript
interface FilePermissions {
  read: string[];      // user/role IDs
  write: string[];     // user/role IDs
  delete: string[];    // user/role IDs
  share: string[];     // user/role IDs
  isPublic: boolean;   // Public erişim
}
```

## 📊 Veritabanı Modelleri

### CoreFile

- `id`: UUID
- `tenantId`: Tenant ID
- `module`: Modül adı ('accounting', 'notifications', etc.)
- `entityType`: Entity tipi ('invoice', 'contract', etc.)
- `entityId`: Entity ID
- `filename`: Dosya adı
- `originalName`: Orijinal dosya adı
- `path`: Relative path
- `fullPath`: Full path
- `size`: Dosya boyutu (bytes)
- `mimeType`: MIME type
- `extension`: Dosya uzantısı
- `permissions`: İzinler (JSON)
- `version`: Versiyon numarası
- `isLatest`: En son versiyon mu?

### FileShare

- `id`: UUID
- `fileId`: Dosya ID
- `sharedBy`: Paylaşan kullanıcı ID
- `sharedWith`: Paylaşılan kullanıcı/rol ID veya 'public'
- `permission`: 'view' | 'download' | 'edit'
- `expiresAt`: Son kullanma tarihi
- `accessCode`: Güvenli paylaşım kodu

## 🚀 Migration

Prisma migration oluşturma:

```bash
TENANT_DATABASE_URL="..." npx prisma migrate dev --schema=prisma/tenant.schema.prisma --name add_core_file_management
```

## 📝 Notlar

- Tüm dosyalar `storage/tenants/{tenantId}/module-files/` altında saklanır
- Dosya yolları tarih bazlı organize edilir (YYYY-MM-DD)
- Her dosya benzersiz bir ID ile adlandırılır
- Versiyon kontrolü desteklenir
- Paylaşım sistemi güvenli erişim kodları ile çalışır

## 🔄 Gelecek Geliştirmeler

- [ ] Klasör yapısı desteği (hierarchical folders)
- [ ] Dosya önizleme (preview)
- [ ] Toplu işlemler (bulk operations)
- [ ] Dosya arama ve filtreleme
- [ ] S3 entegrasyonu
- [ ] CDN entegrasyonu
- [ ] Dosya versiyonlama UI
- [ ] Paylaşım linkleri (public URLs)









