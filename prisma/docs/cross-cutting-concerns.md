# Cross-Cutting Concerns

Bu doküman, tüm modüllerin kullanabileceği merkezi sistemleri tanımlar.

## Kullanılan Script'ler

Bu doküman referans amaçlıdır ve aşağıdaki script'ler tarafından kullanılabilir:

- **`scripts/validate-relations.js`**: Core-base ve extensions modellerine erişim kontrolü yapar
- **`scripts/merge-schemas.js`**: Schema merge sırasında core-base ve extensions'ı öncelikli olarak birleştirir

## Merkezi Sistemler

Aşağıdaki sistemler tüm modüller tarafından kullanılabilir:

### 1. User Management (core-base/user.prisma)
**Modeller**: `User`
**Kullanım**: Tüm modüller kullanıcı bilgilerine erişebilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
model MyModel {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

### 2. Company Management (core-base/company.prisma)
**Modeller**: `Company`
**Kullanım**: Tüm modüller şirket bilgilerine erişebilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
model MyModel {
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}
```

### 3. Notifications (extensions/notifications.prisma)
**Modeller**: `Notification`, `Attachment`
**Kullanım**: Tüm modüller bildirim gönderebilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// Notification extension'ı kullanılabilir
// API üzerinden bildirim gönderilebilir
```

### 4. File Management (extensions/files.prisma)
**Modeller**: `CoreFile`, `FileShare`
**Kullanım**: Tüm modüller dosya yönetimi yapabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// CoreFile extension'ı kullanılabilir
// Dosya upload/download işlemleri yapılabilir
```

### 5. Audit Logging (extensions/audit.prisma)
**Modeller**: `AuditLog`
**Kullanım**: Tüm modüller audit log yazabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// AuditLog extension'ı kullanılabilir
// Tüm önemli işlemler loglanabilir
```

### 6. AI Services (extensions/ai.prisma)
**Modeller**: `AIGeneration`, `AIHistory`
**Kullanım**: Tüm modüller AI servislerini kullanabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// AIGeneration extension'ı kullanılabilir
// AI destekli özellikler eklenebilir
```

### 7. Chat (modules/chat/chat.prisma)
**Modeller**: `ChatRoom`, `ChatMessage`
**Kullanım**: Tüm modüller chat özelliklerini kullanabilir (public API).

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// ChatRoom ve ChatMessage modelleri kullanılabilir
// Modül içi chat özellikleri eklenebilir
```

### 8. Reports (extensions/notifications.prisma)
**Modeller**: `Report`
**Kullanım**: Tüm modüller rapor oluşturabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// Report extension'ı kullanılabilir
// Modül özel raporlar oluşturulabilir
```

### 9. Meta Tables (extensions/meta.prisma)
**Modeller**: `EntityMeta`
**Kullanım**: Tüm modüller speculative fields için EntityMeta kullanabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// EntityMeta extension'ı kullanılabilir
// "İleride lazım olur" alanlar için kullanılır
```

### 10. Calendar (modules/calendar/calendar.prisma)
**Modeller**: `CalendarEvent`
**Kullanım**: Tüm modüller takvim etkinlikleri oluşturabilir.

**Örnek Kullanım**:
```prisma
// Herhangi bir modülde
// CalendarEvent modeli kullanılabilir
// module alanı ile hangi modüle ait olduğu belirtilir
// locationId alanı ile lokasyon bilgisi string olarak saklanır (relation yok)
```

## Kullanım Örnekleri

### Accounting → User
```prisma
// modules/accounting/accounting.prisma
model Invoice {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

### HR → Notification
```prisma
// modules/hr/hr.prisma
// Notification extension'ı kullanılabilir
// API üzerinden bildirim gönderilebilir
```

### Real Estate → CoreFile
```prisma
// modules/real-estate/real-estate.prisma
// CoreFile extension'ı kullanılabilir
// Property ve Apartment için dosya yönetimi yapılabilir
```

### Production → AuditLog
```prisma
// modules/production/production.prisma
// AuditLog extension'ı kullanılabilir
// Production işlemleri loglanabilir
```

### Real Estate → CalendarEvent
```prisma
// modules/real-estate/real-estate.prisma
// CalendarEvent modeli kullanılabilir
// Property görüntüleme randevuları için kullanılabilir
// module: 'real-estate' ile işaretlenir
```

### Maintenance → CalendarEvent
```prisma
// modules/maintenance/maintenance.prisma
// CalendarEvent modeli kullanılabilir
// Bakım randevuları için kullanılabilir
// module: 'maintenance' ile işaretlenir
```

## Önemli Notlar

1. **Core Base ve Extensions Her Zaman Erişilebilir**: Tüm modüller bu sistemlere doğrudan erişebilir.
2. **Modül-Modül İlişkileri Kısıtlı**: Modüller arası doğrudan ilişkiler için `prisma/docs/schema-relations.md` dosyasına bakın.
3. **EntityMeta Kullanımı**: Speculative fields için EntityMeta kullanın, schema'ya yeni alan eklemeyin.

## Yeni Cross-Cutting Concern Ekleme

Yeni bir cross-cutting concern eklemek için:

1. **Extension Oluştur**: `prisma/extensions/` altında yeni bir dosya oluşturun.
2. **Dokümantasyon**: Bu dosyayı güncelleyin.
3. **Module Contracts**: İlgili modüllerin contract'larını güncelleyin.




