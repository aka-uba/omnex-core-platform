# AI Schema Rules

Bu doküman, AI asistanlarının (Cursor, GitHub Copilot, vb.) Prisma schema ile etkileşim kurarken uyması gereken kuralları tanımlar.

## Kullanılan Script'ler

Bu doküman aşağıdaki script'ler tarafından kullanılır:

- **`scripts/validate-relations.js`**: Module-module relation kontrolü yapar (whitelist kontrolü)
- **`scripts/validate-tenant-bound.js`**: Tenant-bound validation yapar
- **`scripts/validate-module-contracts.js`**: Module contract güncellemelerini kontrol eder
- **`scripts/merge-schemas.js`**: Schema merge sırasında duplicate model ve broken relation kontrolü yapar

## Kesin Kurallar

### ❌ Yeni Model Ekleyemez
AI yeni model ekleyemez. Yeni model eklemek için:
1. İnsan onayı şarttır
2. Module contract dokümantasyonu güncellenmelidir
3. Relation policy dokümantasyonu güncellenmelidir
4. Schema version bump gerekir

**Örnek**:
```prisma
// ❌ AI bunu yapamaz
model NewModel {
  id String @id @default(uuid())
  // ...
}
```

### ❌ Module-Module Relation Kuramaz
AI modüller arası doğrudan ilişki kuramaz. Whitelist kontrolü gerekir.

**Örnek**:
```prisma
// ❌ AI bunu yapamaz (whitelist kontrolü gerekli)
// modules/chat/chat.prisma
model ChatMessage {
  employeeId String
  employee   Employee @relation(...) // HR modülüne erişim
}
```

### ❌ Speculative Field Ekleyemez
AI "ileride lazım olur" diye alan ekleyemez. Bunun yerine `EntityMeta` kullanılmalı.

**Örnek**:
```prisma
// ❌ AI bunu yapamaz
model Property {
  futureField String? // "İleride lazım olur"
}

// ✅ Bunun yerine EntityMeta kullanılmalı
// EntityMeta tablosuna kaydedilir
```

## İzin Verilen İşlemler

### ✅ Mevcut Model Alanlarını Ekleyebilir/Değiştirebilir
AI mevcut modellerin alanlarını ekleyebilir veya değiştirebilir.

**Örnek**:
```prisma
// ✅ AI bunu yapabilir
model Property {
  newField String? // Mevcut modele yeni alan ekleme
}
```

### ✅ EntityMeta Tablosunu Kullanabilir
AI speculative fields için EntityMeta tablosunu kullanabilir.

**Örnek**:
```prisma
// ✅ AI bunu yapabilir
// EntityMeta extension'ı kullanılabilir
// Speculative fields için EntityMeta kullanılır
```

### ✅ Core-Base ve Extensions Modellerini Kullanabilir
AI core-base ve extensions modellerini kullanabilir.

**Örnek**:
```prisma
// ✅ AI bunu yapabilir
// modules/accounting/accounting.prisma
model Invoice {
  userId String
  user   User @relation(...) // Core-base model
}
```

## Yeni Model Ekleme Süreci

AI yeni model eklemek istediğinde:

1. **İnsan Onayı**: AI kullanıcıya yeni model önerisini sunar
2. **Module Contract**: `prisma/docs/module-contracts/{module-slug}.md` güncellenir
3. **Relation Policy**: `prisma/docs/schema-relations.md` güncellenir (gerekirse)
4. **Schema Version**: Schema version bump yapılır
5. **Validation**: Tüm validation script'leri çalıştırılır

## Örnek Senaryolar

### Senaryo 1: Yeni Alan Ekleme
**Soru**: "Property modeline yeni bir alan eklemek istiyorum"
**Cevap**: ✅ İzin verilir. Mevcut modele alan eklenebilir.

### Senaryo 2: Yeni Model Ekleme
**Soru**: "Yeni bir PropertyImage modeli eklemek istiyorum"
**Cevap**: ❌ İzin verilmez. İnsan onayı ve dokümantasyon güncellemesi gerekir.

### Senaryo 3: Cross-Module Relation
**Soru**: "Chat modülünden HR modülündeki Employee'ye erişmek istiyorum"
**Cevap**: ❌ İzin verilmez. Whitelist kontrolü gerekir.

### Senaryo 4: Speculative Field
**Soru**: "Property modeline 'futureFeature' alanı eklemek istiyorum"
**Cevap**: ❌ İzin verilmez. EntityMeta kullanılmalı.

## Validation

AI kuralları `scripts/validate-relations.js` ve `scripts/validate-tenant-bound.js` script'leri tarafından otomatik olarak kontrol edilir:
- **DEV MODE**: İhlaller uyarı olarak gösterilir
- **GUARDED MODE**: İhlaller build'i durdurur

## Önemli Notlar

1. **AI Yeni Model Ekleyemez**: Yeni model için insan onayı şarttır
2. **Module-Module Relation Yasak**: Whitelist kontrolü gerekir
3. **Speculative Field Yasak**: EntityMeta kullanılmalı
4. **Mevcut Modeller Genişletilebilir**: Mevcut modellere alan eklenebilir
5. **Core-Base ve Extensions Kullanılabilir**: Tüm modüller bu sistemlere erişebilir

## AI Asistanları İçin Özet

- ✅ Mevcut modellere alan ekleyebilirsiniz
- ✅ Core-base ve extensions modellerini kullanabilirsiniz
- ✅ EntityMeta kullanabilirsiniz
- ❌ Yeni model ekleyemezsiniz
- ❌ Module-module relation kuramazsınız
- ❌ Speculative field ekleyemezsiniz


















