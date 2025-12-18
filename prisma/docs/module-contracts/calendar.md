# Module Contract: Calendar

Bu doküman, Calendar modülünün public API'sini ve bağımlılıklarını tanımlar.

## Kullanılan Script'ler

Bu doküman aşağıdaki script'ler tarafından kullanılır:

- **`scripts/validate-module-contracts.js`**: Module contract güncellemelerini kontrol eder
  - Git diff ile schema değişikliklerini tespit eder
  - `prisma/modules/calendar/` değişmişse
  - `prisma/docs/module-contracts/calendar.md` güncellenmiş mi kontrol eder
  - DEV MODE: Güncellenmemişse → warning
  - GUARDED MODE: Güncellenmemişse → block

## Genel Bilgiler

- **Module Slug**: `calendar`
- **Schema Path**: `prisma/modules/calendar/calendar.prisma`
- **Last Updated**: 2025-12-08
- **Migration**: `20251208000310_calendar_add_calendar_event_model`

## Public Models

Aşağıdaki modeller dış modüller tarafından kullanılabilir:

### CalendarEvent
**Açıklama**: Takvim etkinliklerini temsil eden model. Tüm modüller tarafından kullanılabilir.
**Kullanım**: 
- Diğer modüller (real-estate, maintenance, hr, vb.) kendi etkinliklerini oluşturabilir
- `module` alanı ile hangi modüle ait olduğu belirtilir
- `locationId` alanı ile lokasyon bilgisi string olarak saklanır (relation yok)
**Relations**: 
- `User` (cross-cutting concern) - Event creator/owner
- `Location` (string ID, relation yok) - Real Estate modülündeki lokasyon

**Alanlar**:
- `id`: UUID (primary key)
- `tenantId`: String (required) - Multi-tenant isolation
- `companyId`: String (required) - Multi-company isolation
- `title`: String (required) - Etkinlik başlığı
- `description`: String? - Etkinlik açıklaması
- `date`: DateTime (required) - Etkinlik tarihi
- `client`: String? - Müşteri adı veya ID
- `status`: String (default: 'scheduled') - 'draft', 'scheduled', 'published', 'needs-revision', 'cancelled'
- `color`: String? (default: 'blue') - 'yellow', 'green', 'red', 'blue', 'purple', 'slate'
- `locationId`: String? - Real Estate modülündeki Location ID (string olarak, relation yok)
- `userId`: String? - Event creator/owner (User relation)
- `module`: String? - İlişkili modül (e.g., 'real-estate', 'maintenance', 'hr')
- `metadata`: Json? - Ek veriler (reminder, attendees, notes, vb.)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto)

**Index'ler**:
- `@@index([tenantId, companyId])` - Multi-tenant/company filtering
- `@@index([userId])` - User-based queries
- `@@index([locationId])` - Location-based queries
- `@@index([date])` - Date-based queries
- `@@index([status])` - Status filtering
- `@@index([module])` - Module-based queries
- `@@index([createdAt])` - Time-based sorting

## Internal Models

Bu modül şu anda internal model içermemektedir.

## Dependencies

Bu modül şu modüllere bağımlıdır:

- **Core Base**: 
  - `User` - Event creator/owner için relation
- **Extensions**: 
  - (Şu anda kullanılmıyor, gelecekte `Notification` kullanılabilir)
- **Modules**: 
  - (Şu anda doğrudan module relation yok, sadece string ID'ler kullanılıyor)

## Dependents

Bu modüle bağımlı olan modüller:

- (Şu anda yok, ancak tüm modüller CalendarEvent'i kullanabilir)

## Cross-Module Relations

Bu modülün diğer modüllerle ilişkileri:

- **Real Estate Module**: 
  - `locationId` alanı ile Real Estate modülündeki `Location` modeline string ID ile referans verir
  - Doğrudan relation yok (whitelist'te olmadığı için)
  - `module: 'real-estate'` ile real estate etkinlikleri işaretlenebilir

- **Maintenance Module**:
  - `module: 'maintenance'` ile maintenance etkinlikleri işaretlenebilir
  - Bakım randevuları için kullanılabilir

- **HR Module**:
  - `module: 'hr'` ile HR etkinlikleri işaretlenebilir
  - İş görüşmeleri, eğitimler için kullanılabilir

## Migration History

### 20251208000310_calendar_add_calendar_event_model
**Tarih**: 2025-12-08
**Açıklama**: Calendar modülü için ilk migration. `CalendarEvent` modeli oluşturuldu.
**Değişiklikler**:
- `CalendarEvent` tablosu oluşturuldu
- Tüm alanlar ve index'ler eklendi
- `User` foreign key eklendi
- Multi-tenant ve multi-company desteği eklendi

## Notlar

- **Multi-Tenant Uyumlu**: Tüm işlemler `tenantId` ve `companyId` ile izole edilir
- **Location Relation Yok**: Real Estate modülündeki `Location` modeline doğrudan relation yok, sadece string ID kullanılır (whitelist kuralı)
- **Module Field**: `module` alanı ile hangi modüle ait olduğu belirtilir, bu sayede modül bazlı filtreleme yapılabilir
- **Metadata Field**: `metadata` JSON alanı ile esnek veri saklama yapılabilir (reminder, attendees, notes, vb.)
- **Status Values**: Status değerleri: 'draft', 'scheduled', 'published', 'needs-revision', 'cancelled'
- **Color Values**: Renk değerleri: 'yellow', 'green', 'red', 'blue', 'purple', 'slate'
- **Demo Seeder**: `prisma/seed/demo-seed.ts` dosyasında 10 adet demo calendar event oluşturulur
- **API Routes**: `/api/calendar/events` endpoint'i ile CRUD işlemleri yapılabilir
- **React Query Hooks**: `useCalendarEvents`, `useCalendarEvent`, `useCreateCalendarEvent`, `useUpdateCalendarEvent`, `useDeleteCalendarEvent` hook'ları mevcuttur

## Kullanım Örnekleri

### Real Estate Modülünden Etkinlik Oluşturma
```typescript
// Real Estate modülü, bir property görüntüleme randevusu için calendar event oluşturabilir
const event = await prisma.calendarEvent.create({
  data: {
    tenantId: tenant.id,
    companyId: company.id,
    title: 'Property Viewing - Deniz Apartmanı',
    description: 'Müşteri ile property görüntüleme randevusu',
    date: new Date('2025-12-15T14:00:00Z'),
    client: 'ABC Şirketi',
    status: 'scheduled',
    color: 'blue',
    locationId: property.locationId, // String ID
    userId: currentUser.id,
    module: 'real-estate',
    metadata: {
      propertyId: property.id,
      appointmentType: 'viewing'
    }
  }
});
```

### Maintenance Modülünden Bakım Randevusu
```typescript
// Maintenance modülü, bir bakım randevusu için calendar event oluşturabilir
const event = await prisma.calendarEvent.create({
  data: {
    tenantId: tenant.id,
    companyId: company.id,
    title: 'Equipment Maintenance - CNC Machine',
    description: 'CNC makinesi için periyodik bakım',
    date: new Date('2025-12-20T09:00:00Z'),
    status: 'scheduled',
    color: 'green',
    locationId: equipment.locationId, // String ID
    userId: technician.id,
    module: 'maintenance',
    metadata: {
      equipmentId: equipment.id,
      maintenanceType: 'preventive'
    }
  }
});
```

## Dikkat Edilmesi Gerekenler

1. **Location Relation**: `Location` modeline doğrudan relation yok, sadece string ID kullanılır. Bu nedenle location bilgisi manuel olarak kontrol edilmelidir.

2. **Module Field**: `module` alanı opsiyoneldir ancak modül bazlı filtreleme için önerilir.

3. **Metadata Field**: `metadata` JSON alanı esnek veri saklama için kullanılabilir, ancak schema validation yapılmaz.

4. **Status Transitions**: Status değişiklikleri için business logic uygulanmalıdır (örneğin, 'cancelled' status'üne geçiş).

5. **Multi-Tenant Isolation**: Tüm query'lerde `tenantId` ve `companyId` filtresi zorunludur.















