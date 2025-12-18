# Dynamic Form Builder
## FAZ 0.5: Dinamik Form Builder Sistemi

Her sayfada kullanılabilecek dinamik form builder sistemi.

## 📋 Genel Bakış

Dynamic Form Builder, her modül ve entity için özelleştirilebilir formlar oluşturmayı sağlar. Form alanları dinamik olarak yönetilir ve anlık güncellenir.

## 🏗️ Mimari

### Form Config Model

- `FormConfig` Prisma modeli
- Module ve entity type bazlı form yönetimi
- Versiyon kontrolü
- JSON field definitions

### Form Builder Service

- Form config CRUD işlemleri
- Field validation
- Version management

### Form Renderer

- Dinamik field rendering
- Field dependencies
- Conditional visibility
- Validation

## 🔧 Kullanım

### Backend (Service)

```typescript
import { FormBuilderService } from '@/lib/form-builder/FormBuilderService';

const formService = new FormBuilderService(tenantPrisma);

// Get form config
const form = await formService.getFormConfigByEntity(
  tenantId,
  'accounting',
  'invoice'
);

// Create form config
const newForm = await formService.createFormConfig(tenantId, {
  module: 'accounting',
  entityType: 'invoice',
  name: 'Invoice Form',
  fields: [...],
});
```

### Frontend (React Hook)

```typescript
import { useFormConfigByEntity } from '@/hooks/useFormBuilder';
import { FormRenderer } from '@/components/form-builder/FormRenderer';

// Get form config
const { data: formConfig } = useFormConfigByEntity('accounting', 'invoice');

// Render form
<FormRenderer
  fields={formConfig?.fields || []}
  onSubmit={handleSubmit}
  options={{
    layout: 'grid',
    columns: 2,
  }}
/>
```

## 📝 Field Types

- `text` - Text input
- `textarea` - Multi-line text
- `number` - Number input
- `email` - Email input
- `password` - Password input
- `date` - Date picker
- `datetime` - DateTime picker
- `time` - Time picker
- `select` - Dropdown
- `multiselect` - Multi-select
- `checkbox` - Checkbox
- `radio` - Radio buttons
- `switch` - Toggle switch
- `file` - File upload
- `image` - Image upload
- `color` - Color picker
- `url` - URL input
- `tel` - Phone input
- `hidden` - Hidden field

## 🔗 Field Dependencies

Fields can depend on other fields:

```typescript
{
  dependencies: [{
    field: 'type',
    condition: 'equals',
    value: 'premium',
    action: 'show' // or 'hide', 'enable', 'disable', 'require'
  }]
}
```

## ✅ Validation

Built-in validation support:

- Required fields
- Min/Max length
- Min/Max values
- Pattern matching
- Custom validation

## 🚀 API Endpoints

- `GET /api/forms` - List form configs
- `POST /api/forms` - Create form config
- `GET /api/forms/[id]` - Get form config
- `PATCH /api/forms/[id]` - Update form config
- `DELETE /api/forms/[id]` - Delete form config
- `GET /api/forms/entity` - Get form by entity

## 📝 Notlar

- Form configs are versioned
- Only active versions are returned by default
- Field dependencies are evaluated in real-time
- Validation runs on submit

## 🔄 Gelecek Geliştirmeler

- [ ] Form Builder UI (drag & drop)
- [ ] Field templates
- [ ] Form preview
- [ ] Form submission tracking
- [ ] Conditional logic builder
- [ ] Field groups/sections
- [ ] Multi-step forms









