# Access Control System
## FAZ 0.4: Merkezi Yetki Yönetimi Sistemi

Tüm modüllerin kullanacağı merkezi yetki yönetim sistemi.

## 📋 Genel Bakış

Access Control System, tüm modüllerin yetki ihtiyaçlarını karşılamak için tasarlanmış merkezi bir sistemdir. Feature registry, rol yönetimi, kullanıcı özelleştirmeleri destekler.

## 🏗️ Mimari

### Feature Registry

Tüm özellikler merkezi bir registry'de tanımlanır:

```typescript
FEATURE_REGISTRY = {
  MODULES: {
    AI: { key: 'module.ai', components: {...} },
    ACCOUNTING: { key: 'module.accounting', components: {...} },
    // ...
  },
  LAYOUTS: { ... },
  UI_COMPONENTS: { ... },
  FEATURES: { ... },
}
```

### Permission Service

- Role-based permissions
- User-specific permissions
- Permission expiration
- Resource-based permissions

## 🔧 Kullanım

### Backend (Service)

```typescript
import { PermissionService } from '@/lib/access-control/PermissionService';

const permissionService = new PermissionService(tenantPrisma);

// Check permission
const hasAccess = await permissionService.hasPermission({
  userId: 'user-id',
  permissionKey: 'accounting.invoice.create',
});

// Grant permission
await permissionService.grantPermission(
  'user-id',
  'accounting.invoice.create',
  'admin-id',
  expiresAt // optional
);

// Get user permissions
const permissions = await permissionService.getUserPermissions('user-id');
```

### Frontend (React Hook)

```typescript
import { useAccess } from '@/lib/access-control/hooks/useAccess';

const { hasAccess, canCreate, canEdit, canDelete } = useAccess();

// Check access
if (hasAccess('accounting.invoice.create')) {
  // Show create button
}

// Helper methods
if (canCreate('invoice')) {
  // Show create invoice button
}

// Conditional rendering
{withAccess('accounting.invoice.delete', <DeleteButton />)}
```

### Access Provider

```typescript
import { AccessProvider } from '@/lib/access-control/providers/AccessProvider';

<AccessProvider userId={user.id} role={user.role}>
  <App />
</AccessProvider>
```

## 🔐 Role-Based Permissions

### SuperAdmin
- All permissions (`*`)
- Full system access

### AgencyUser
- Module access (AI, Accounting, File Manager, etc.)
- Common actions (create, edit, delete, export)
- Feature access (export, file operations)

### ClientUser
- Limited module access (File Manager, Notifications)
- View-only actions
- Limited feature access

## 📊 Permission Structure

### Format
```
module.action.resource
```

### Examples
- `module.ai` - AI module access
- `ai.text.generate` - Text generation
- `accounting.invoice.create` - Create invoice
- `ui.button.delete` - Delete button
- `feature.export.excel` - Excel export

## 🚀 API Endpoints

- `GET /api/permissions/user/[userId]` - Get user permissions
- `POST /api/permissions/check` - Check permission
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create permission definition

## 📝 Notlar

- SuperAdmin always has all permissions
- Permissions can expire
- Module-level permissions grant access to all components
- Custom user permissions override role permissions

## 🔄 Gelecek Geliştirmeler

- [ ] Permission groups
- [ ] Dynamic permission assignment
- [ ] Permission inheritance
- [ ] Audit logging for permission changes
- [ ] Permission templates
- [ ] Resource-level permissions (row-level security)









