# OMNEX - Next.js TypeScript Type-Safety Protocol

Bu dosya, OMNEX projesinde tip hatalarının birikmesini önlemek için zorunlu kuralları tanımlar.

## 🎯 AMAÇ

Uzun süreli geliştirme sırasında tip hatalarının birikmesini önlemek ve build sırasında patlamaları engellemek.

---

## 1. CURSOR TYPE-SAFETY MODE (ZORUNLU)

Her kod değişikliğinde AI şunları yapmalıdır:

### 1.1. Mental Type Check Simülasyonu
- Her değişiklikte `tsc --noEmit` mental simülasyonu yapılmalı
- Tüm import zinciri kontrol edilmeli (level-1 dependency)
- Tip sadeleştirme veya "inferred any" üretme YASAK

### 1.2. Tip Değişiklik Kuralları
- ❌ Tip kaldırma YASAK
- ❌ Interface azaltma YASAK
- ❌ Return type değiştirme YASAK (breaking change olmadan)
- ✅ Tip değişikliği yapılıyorsa tüm bağlı dosyalarda propagate edilmeli
- ✅ Tek satır bile değiştirilse bağımlı typelar tekrar değerlendirilmeli

### 1.3. Next.js Özel Kontroller
- Server/Client ayrımında tip kontrolü yapılmalı
- Route handler return type tutarsızlığı tespit edilmeli
- API contract → DTO → Zod uyumluluğu kontrol edilmeli

### 1.4. Bağımlılık Analizi
- Tüm import zincirini kontrol et (level-1 dependency)
- Tip değişikliği yapıyorsan tüm bağlı dosyalarda propagate et
- Tek satır bile değiştirilse bağımlı typelar tekrar değerlendir

---

## 2. GELİŞTİRME DÖNGÜSÜ (ZORUNLU)

### 2.1. Type Watch Açık Tutma
**KURAL**: Uzun geliştirme süreçlerinde `npm run typewatch` açık tutulmalıdır.

**Neden**: Build almadan tüm tip hatalarını ANINDA gösterir.

**Kullanım**:
```bash
# Ayrı terminalde açık tut
npm run typewatch
```

### 2.2. Geliştirme Akışı
1. ✅ `typewatch` açık
2. ✅ Cursor ile değişiklik yap
3. ✅ `typewatch` kırmızı → hemen düzelt
4. ✅ Dev server sadece UI test için açık
5. ❌ 30+ dakika build almadan geliştirme YOK

---

## 3. TİP KONTROLÜ KURALLARI

### 3.1. Import Kontrolü
- Tüm import'ların tip tanımları kontrol edilmeli
- Eksik tip tanımları tespit edilmeli
- Circular dependency kontrolü yapılmalı

### 3.2. Return Type Kontrolü
- Tüm fonksiyonların return type'ı açıkça belirtilmeli
- `any` kullanımı YASAK (exception: external library types)
- `unknown` kullanımı tercih edilmeli (any yerine)

### 3.3. API Contract Kontrolü
- API route'ların return type'ı tutarlı olmalı
- Zod schema → TypeScript DTO senkron olmalı
- Request/Response type'ları kontrol edilmeli

### 3.4. Server/Client Ayrımı
- Server component'lerde client-only hook'lar kullanılmamalı
- Client component'lerde server-only API'ler kullanılmamalı
- `'use client'` ve `'use server'` direktifleri doğru kullanılmalı

---

## 4. SİLENT BREAK PREVENTION

### 4.1. Otomatik Refactor Kontrolü
Cursor'un otomatik refactor'ları şunları kontrol etmeli:
- Import kaldırma → Tip bağımlılığı kontrolü
- Tip infer değişimi → Breaking change kontrolü
- Return type bozulması → Tüm kullanıcılar kontrol edilmeli
- Server/Client mix → Ayrım kontrolü
- Zod schema sync → Out-of-date kontrolü

### 4.2. Breaking Change Tespiti
- Tip değişikliği yapılıyorsa tüm kullanıcılar tespit edilmeli
- Geriye dönük uyumluluk kontrol edilmeli
- Migration path sağlanmalı

---

## 5. DEEP TYPE STABILITY MODE

### 5.1. Tip Propagasyon Kuralları
- Tip değişikliği yapılıyorsa tüm bağlı dosyalarda propagate edilmeli
- Tek satır bile değiştirilse bağımlı typelar tekrar değerlendirilmeli
- Import zinciri tam olarak takip edilmeli

### 5.2. Type Inference Kontrolü
- `any` inference tespit edilmeli
- `unknown` kullanımı tercih edilmeli
- Explicit type annotation tercih edilmeli

---

## 6. NEXT.JS ÖZEL KURALLAR

### 6.1. Route Handler Return Types
- Route handler'ların return type'ı tutarlı olmalı
- `NextResponse` kullanımı kontrol edilmeli
- Error response type'ları tutarlı olmalı

### 6.2. Server Actions
- Server action'ların return type'ı açıkça belirtilmeli
- Error handling type'ları tutarlı olmalı

### 6.3. API Contracts
- API route'ların request/response type'ları Zod schema ile senkron olmalı
- DTO type'ları Zod schema'dan generate edilmeli

---

## 7. CHECKLIST

Her kod değişikliğinde:

- [ ] `tsc --noEmit` mental simülasyonu yapıldı
- [ ] Tüm import zinciri kontrol edildi
- [ ] Tip değişikliği yapılıyorsa tüm bağımlı dosyalar güncellendi
- [ ] Return type tutarlılığı kontrol edildi
- [ ] Server/Client ayrımı kontrol edildi
- [ ] API contract → Zod → DTO senkron kontrol edildi
- [ ] Breaking change riski değerlendirildi
- [ ] `typewatch` açık ve hata yok

---

## 8. OPERATIONAL MODE ENTEGRASYONU

### DEV MODE
- `typewatch` açık tutulmalı (warning)
- Tip hataları hemen düzeltilmeli (warning)
- Build öncesi `npm run typecheck` çalıştırılmalı (warning)

### GUARDED MODE
- `typewatch` açık tutulmalı (BLOCKING)
- Tip hataları hemen düzeltilmeli (BLOCKING)
- Build öncesi `npm run typecheck` çalıştırılmalı (BLOCKING)
- Tüm tip kontrolleri geçmeli (BLOCKING)

---

END OF TYPE-SAFETY PROTOCOL









