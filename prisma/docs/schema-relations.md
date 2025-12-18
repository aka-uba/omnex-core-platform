# Cross-Module Relation Policy

Bu doküman, modüler Prisma schema mimarisinde modüller arası ilişkilerin nasıl yönetileceğini tanımlar.

## Kullanılan Script'ler

Bu doküman aşağıdaki script'ler tarafından kullanılır:

- **`scripts/validate-relations.js`**: Cross-module relation politikasını kontrol eder
  - Whitelist kontrolü yapar
  - İhlalleri tespit eder (DEV MODE: warning, GUARDED MODE: block)
  - Relation integrity check yapar

## Genel Prensipler

1. **Core Base ve Extensions Her Zaman Erişilebilir**: Tüm modüller core-base ve extensions modellerine doğrudan erişebilir.
2. **Modül-Modül İlişkileri Kısıtlı**: Modüller arası doğrudan ilişkiler yalnızca whitelist'te tanımlı olanlar için izin verilir.
3. **Aynı Modül İçi İlişkiler Serbest**: Bir modül kendi içindeki modeller arasında serbestçe ilişki kurabilir.

## İzin Verilen İlişkiler

### ✅ Core Base → Her Yer
Tüm modüller core-base modellerine erişebilir:
- `User`
- `Company`
- `Role`
- `PermissionDefinition`
- `UserPermission`
- `PagePermission`
- `Menu`
- `MenuItem`
- `MenuLocation`
- `MenuLocationAssignment`
- `FooterCustomization`
- `LicenseNotification`
- `AccessControlConfiguration`

### ✅ Extensions → Her Yer
Tüm modüller extensions modellerine erişebilir:
- `AuditLog`
- `Notification`
- `Attachment`
- `CoreFile`
- `FileShare`
- `AIGeneration`
- `AIHistory`
- `EntityMeta`
- `TenantSchemaRegistry`
- `FormConfig`
- `ExportTemplate`
- `Report`

### ✅ Whitelisted Module → Module Relations

Aşağıdaki modül-modül ilişkileri açıkça izin verilmiştir:

#### Accounting → HR
**Neden**: Payroll entegrasyonu
**Kullanım**: Accounting modülü HR modülündeki `Employee` ve `Payroll` verilerine erişebilir.

#### Maintenance → Real Estate
**Neden**: Property maintenance
**Kullanım**: Maintenance modülü Real Estate modülündeki `Property` ve `Apartment` verilerine erişebilir.

#### Production → Accounting
**Neden**: Cost tracking
**Kullanım**: Production modülü Accounting modülündeki `Invoice` ve `Expense` verilerine erişebilir.

#### Production → Real Estate
**Neden**: Location-based production
**Kullanım**: Production modülü Real Estate modülündeki `Location` verilerine erişebilir.

## Yasaklanan İlişkiler

### ❌ Module → Module (Whitelist Dışı)
Whitelist'te olmayan modül-modül ilişkileri yasaktır:
- `Chat → HR` ❌
- `Web Builder → Accounting` ❌
- `Real Estate → Production` ❌

### ❌ Module → Module Internal Models
Modüller, diğer modüllerin internal (dokümante edilmemiş) modellerine erişemez.

## Yeni İlişki Ekleme Süreci

Yeni bir modül-modül ilişkisi eklemek için:

1. **Mimari Onay**: İlişkinin mimari olarak gerekli olduğunu kanıtlayın.
2. **Dokümantasyon**: `prisma/docs/schema-relations.md` dosyasını güncelleyin.
3. **Whitelist Güncelleme**: `scripts/validate-relations.js` dosyasındaki `WHITELISTED_RELATIONS` array'ini güncelleyin.
4. **Module Contract**: İlgili modüllerin `prisma/docs/module-contracts/` dokümantasyonunu güncelleyin.
5. **Test**: İlişkinin doğru çalıştığını test edin.

## Örnekler

### ✅ İzin Verilen: Accounting → User
```prisma
// modules/accounting/accounting.prisma
model Invoice {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

### ✅ İzin Verilen: HR → Notification
```prisma
// modules/hr/hr.prisma
// Notification extension'ı kullanılabilir
```

### ✅ İzin Verilen: Accounting → HR (Whitelisted)
```prisma
// modules/accounting/accounting.prisma
model PayrollExpense {
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
}
```

### ❌ Yasak: Chat → HR (Whitelist Dışı)
```prisma
// modules/chat/chat.prisma
// ❌ Employee modeline doğrudan erişim yasak
// ✅ Bunun yerine User modelini kullanın
```

## Validation

İlişki politikası `scripts/validate-relations.js` script'i tarafından otomatik olarak kontrol edilir:
- **DEV MODE**: İhlaller uyarı olarak gösterilir
- **GUARDED MODE**: İhlaller build'i durdurur

## Notlar

- Tüm modüller `User` ve `Company` modellerine erişebilir (core-base)
- Tüm modüller extensions modellerine erişebilir
- Modül-modül ilişkileri için whitelist zorunludur
- Yeni ilişki eklemek için yukarıdaki süreci takip edin


















