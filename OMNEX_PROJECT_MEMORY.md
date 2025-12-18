# OMNEX PROJECT MEMORY

> Project Name: OMNEX SaaS Platform  
> Last Updated: [Elle değiştir]  
> Current Phase: [Örn: Core Development, Module Expansion]  
> Active Context: [Örn: Web Builder Module, CRM Module]

---

## 1. PROJECT VISION & GOALS

- Core Concept:
  Çok kiracılı (multi-tenant), modüler, ajans ve SaaS yönetim sistemi.

- Target Audience:
  Dijital ajanslar, yazılım firmaları, SaaS platformları.

- Success Criteria:
  - Modüller bağımsız çalışabilmeli
  - Tenant izolasyonu tam olmalı
  - RBAC %100 güvenilir olmalı
  - i18n her yerde zorunlu olmalı

---

## 2. TECH STACK & ZORUNLU KISITLAR

- Frontend: Next.js (App Router)
- Backend: NestJS
- ORM: Prisma
- Auth: JWT + Refresh Token
- UI: Merkezi Modal, Table, Form, Export sistemleri
- i18n: Global + Modul bazlı namespace
- Cache: Merkezi cache sistemi

### KESİN YASAKLAR:
- Core sistemlere izinsiz müdahale
- Yetki sistemi atlanması
- i18n’siz UI
- Tenant kontrolü olmadan veri işlemi

---

## 3. ARCHITECTURE & MODÜL YAPISI

- /core → Sistem çekirdeği (dokunulmaz)
- /modules → Tüm iş modülleri
- /shared → Ortak bileşenler
- /i18n → Dil dosyaları
- /permissions → Roller ve yetkiler
- /exports → Excel, PDF, CSV sistemleri

KURAL:
Her yeni iş özelliği = Yeni Modül veya mevcut modül içinde izole edilir.

---

## 4. ACTIVE RULES (DEĞİŞMEZ YASALAR)

1. i18n olmadan UI OLMAZ.
2. Permission olmadan API OLMAZ.
3. Tenant kontrolü olmadan DB sorgusu OLMAZ.
4. Her modül kendi export sistemine uyumlu olmak ZORUNDA.
5. Her değişiklik zincirleme etki açısından analiz edilir.

---

## 5. PROGRESS & ROADMAP

- [x] Core Sistem Kurulumu
- [x] Auth & Role Sistemi
- [x] Merkezi Modal & Table
- [ ] Web Builder Module
- [ ] CRM Module
- [ ] Finans & Faturalama
- [ ] AI Content Systems

---

## 6. DECISION LOG & ANTI-PATTERNS

### Kararlar:
- Prisma multi-tenant yapısı zorunlu olacak.
- i18n tüm modüllerde namespace bazlı olacak.

### Anti-Pattern’ler:
- Permission’ı frontend’den kontrol etmek → YASAK
- Core bileşenleri kopyalayıp düzenlemek → YASAK
- Hard-coded metin → YASAK


> Operational Mode: DEV | GUARDED
> Active Schema Version: vX.X.X
