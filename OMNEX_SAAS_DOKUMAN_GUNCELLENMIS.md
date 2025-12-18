# Omnex SaaS Platform - Güncel Durum Dokümantasyonu

**Son Güncelleme Tarihi:** 2025-12-01  
**Versiyon:** 1.0.10  
**Platform Adı:** Omnex-Core - Agency Operating System

---

## 📋 İçindekiler

1. [Platform Genel Bakış](#platform-genel-bakış)
2. [Versiyon Bilgisi](#versiyon-bilgisi)
3. [Teknoloji Yığını](#teknoloji-yığını)
4. [Temel Altyapı](#temel-altyapı)
5. [Multi-Tenant Mimarisi](#multi-tenant-mimarisi)
6. [Modül Sistemi](#modül-sistemi)
7. [Mevcut Modüller ve Durumları](#mevcut-modüller-ve-durumları)
8. [API Yapısı](#api-yapısı)
9. [Veritabanı Sistemi](#veritabanı-sistemi)
10. [Erişim Kontrol Sistemi](#erişim-kontrol-sistemi)
11. [Kimlik Doğrulama ve Güvenlik](#kimlik-doğrulama-ve-güvenlik)
12. [Sistem Yönetimi](#sistem-yönetimi)
13. [UI/UX Özellikleri](#uiux-özellikleri)
14. [Uluslararasılaştırma (i18n)](#uluslararasılaştırma-i18n)
15. [Tema Sistemi](#tema-sistemi)
16. [Son Güncellemeler](#son-güncellemeler)
17. [Geliştirme Ortamı](#geliştirme-ortamı)

---

## Platform Genel Bakış

**Omnex Core Platform**, ajansların birden fazla müşteri şirketini yönetebileceği, AI içerik üretebileceği, gönderi planlayabileceği ve finans yönetimi yapabileceği kapsamlı bir SaaS (Software as a Service) platformudur.

### Temel Özellikler

- ✅ **Multi-Tenant Mimarisi**: Her firma için ayrı veritabanı (tam veri izolasyonu)
- ✅ **Modüler Yapı**: 20+ modül ile genişletilebilir sistem
- ✅ **Merkezi Sistemler**: Dosya yönetimi, AI servisi, export sistemi, yetki yönetimi
- ✅ **Rol Tabanlı Erişim Kontrolü (RBAC)**: Detaylı izin yönetimi
- ✅ **Çoklu Dil Desteği**: Türkçe, İngilizce, Almanca, Arapça (RTL desteği)
- ✅ **Tema Sistemi**: Dark/Light mode, özelleştirilebilir renkler
- ✅ **Responsive Tasarım**: Mobil, tablet ve desktop uyumlu

---

## Versiyon Bilgisi

### Mevcut Versiyon: 1.0.10 (2025-11-27)

**Son Güncellemeler:**

#### v1.0.10 - Modül Sistemi Yeniden Yapılandırma
- ✅ Tüm modüller `module.config.yaml` formatına geçirildi
- ✅ JSON Schema ile otomatik validasyon
- ✅ Modül kartlarında Switch ile aktivasyon/deaktivasyon
- ✅ İkon seti entegrasyonu (`@tabler/icons-react`)
- ✅ Client-side dinamik import desteği

#### v1.0.9 - Sistem Yönetimi Modülü
- ✅ Audit Logging System
- ✅ Backup & Restore System
- ✅ System Monitoring
- ✅ Database Management

#### v1.0.8 - JWT Authentication & Security
- ✅ JWT Token Yönetimi
- ✅ API Security Enhancements (Rate Limiting)
- ✅ Password Policy Updates
- ✅ Session Management

**Önceki Versiyonlar:**
- v1.0.3 - Theme Customizer UI Yeniden Tasarımı
- v1.0.2 - i18n Desteği
- v1.0.1 - Modül Yönetim Sistemi
- v1.0.0 - İlk Sürüm

---

## Teknoloji Yığını

### Frontend Framework
- **Next.js 16.0.3** (App Router)
- **React 19.2.0** & **React DOM 19.2.0**
- **TypeScript 5**

### UI Kütüphaneleri
- **Mantine UI v8.3.9**
  - @mantine/core, @mantine/dates, @mantine/dropzone
  - @mantine/form, @mantine/hooks, @mantine/modals
  - @mantine/notifications
- **Tailwind CSS v4** (layout utilities için)
- **CSS Modules** (bileşen bazlı stiller)
- **@tabler/icons-react v3.35.0** (2000+ ikon)

### Veritabanı ve ORM
- **Prisma v5.22.0**
- **@prisma/client v5.22.0**
- **PostgreSQL** (Multi-Tenant)
- **bcryptjs v3.0.3** (Password hashing)

### State Management & Data Fetching
- **@tanstack/react-query v5.90.10**
- **React Context API**

### Form & Validation
- **react-hook-form v7.66.1**
- **@hookform/resolvers v5.2.2**
- **zod v4.1.12**

### Diğer Kütüphaneler
- **dayjs v1.11.19** (Tarih/saat işlemleri)
- **next-intl v4.5.6** (i18n)
- **jsonwebtoken v9.0.2** (JWT)
- **exceljs v4.4.0** (Excel işleme)
- **jspdf v3.0.4** (PDF oluşturma)
- **docx v9.5.1** (Word belgesi)
- **framer-motion v12.23.24** (Animasyonlar)
- **recharts v3.5.1** (Grafikler)

---

## Temel Altyapı

### 1. Layout Sistemi

#### Sidebar Layout
- Sol tarafta daraltılabilir/genişletilebilir sidebar
- Genişlik: 16rem (genişletilmiş), 4rem (daraltılmış)
- Smooth transition animasyonları (0.3s ease)
- ScrollArea desteği
- Section bazlı menü organizasyonu
- Dinamik renk yönetimi

#### Top Layout
- Üstte sticky header
- Horizontal menü navigasyonu
- Mobil hamburger menü
- Backdrop blur efekti
- Responsive container padding

### 2. Routing Sistemi

#### Locale-Based Routing
- URL yapısı: `/{locale}/{route}`
- Desteklenen locale'ler: `tr`, `en`, `de`, `ar`
- Varsayılan locale: `tr`
- RTL desteği: Arapça için otomatik

#### Route Yapısı
```
/[locale]/
  ├── /                    # Ana sayfa
  ├── /dashboard           # Dashboard
  ├── /modules             # Modül sayfaları
  │   ├── /ai
  │   ├── /file-manager
  │   ├── /notifications
  │   ├── /calendar
  │   ├── /chat
  │   ├── /reports
  │   ├── /license
  │   ├── /web-builder
  │   └── /[other-modules]
  ├── /users               # Kullanıcı yönetimi
  ├── /roles               # Rol yönetimi
  ├── /permissions         # İzin yönetimi
  ├── /settings            # Ayarlar
  │   ├── /add-company
  │   ├── /menu-management
  │   └── /access-control
  ├── /locations           # Lokasyon yönetimi
  └── /login               # Giriş sayfaları
      ├── /super-admin
      └── /admin
```

---

## Multi-Tenant Mimarisi

### Mimari Model
**Shared Codebase + Per-Tenant Database + Subdomain/Path Routing + Tenant Context**

### Temel Bileşenler

#### 1. Core Database (PostgreSQL)
- **Amaç**: Platform yönetimi, tenant metadata, agency bilgileri
- **Schema**: `prisma/core.schema.prisma`
- **Modeller**: Tenant, Agency, Module, ModulePermission, TenantModule, AuditLog, BackupMetadata

#### 2. Tenant Databases (PostgreSQL)
- **Amaç**: Her tenant için ayrı database, tam veri izolasyonu
- **Schema**: `prisma/tenant.schema.prisma`
- **Modeller**: User, Company, Notification, Report, Role, PermissionDefinition, vb.
- **İsimlendirme**: `tenant_{slug}_{year}` (örn: `tenant_acme_2025`)

#### 3. Routing Sistemi
- **Production**: Subdomain routing (`acme.onwindos.com`)
- **Staging**: Subdomain + path fallback
- **Development**: Path-based routing (`localhost:3000/tenant/acme`)

#### 4. Yearly Database Rotation
- Yıl bazlı database isimlendirme
- Yeni yıl başında yeni DB oluşturulur
- Eski DB'ler arşivlenebilir

### Dual Admin System

#### Super Admin
- **Email**: `admin@omnexcore.com`
- **Username**: `superadmin`
- **Password**: `uba1453.2010*`
- **Rol**: SuperAdmin
- **Kapsam**: Tüm tenant'larda mevcut

#### Tenant Admin
- **Email**: `admin@{tenant-slug}.com`
- **Username**: `admin`
- **Password**: `omnex.fre.2520*`
- **Rol**: SuperAdmin
- **Kapsam**: Sadece kendi tenant'ında

---

## Modül Sistemi

### Modül Yapılandırması

Tüm modüller `module.config.yaml` formatında yapılandırılmıştır:

```yaml
name: "module-name"
version: "1.0.0"
displayName:
  tr: "Modül Adı"
  en: "Module Name"
description:
  tr: "Modül açıklaması"
  en: "Module description"
icon: "IconName"
category: "category"
status: "active" | "inactive" | "installed" | "error"
dependencies: []
```

### Modül İşlemleri

- **Yükleme (Install)**: ZIP dosyası yükleme, manifest validasyonu
- **Aktifleştirme (Activate)**: Bağımlılık kontrolü, menü entegrasyonu
- **Pasifleştirme (Deactivate)**: Modül devre dışı bırakma
- **Kaldırma (Uninstall)**: Modül dosyalarını silme

### Modül Registry Sistemi

- `src/lib/modules/registry.ts` - Modül kayıt sistemi
- `src/lib/modules/loader.ts` - Dinamik yükleme
- `src/lib/modules/types.ts` - Tip tanımlamaları
- JSON Schema validasyonu (`ajv`)

---

## Mevcut Modüller ve Durumları

### ✅ Tamamlanan Modüller

#### 1. Dashboard Modülü ✅
- KPI istatistikleri
- İçerik performans grafikleri
- Finans özeti
- Son aktiviteler
- Yaklaşan gönderiler

#### 2. AI Modülü ✅
- Metin üretici
- Kod üretici
- Görsel üretici
- Ses üretici
- Video üretici
- **Route**: `/modules/ai`

#### 3. Modül Yönetimi ✅
- Modül listeleme
- Modül yükleme
- Modül aktifleştirme/pasifleştirme
- Modül kaldırma
- Modül arama ve filtreleme
- **Route**: `/modules`

#### 4. Bakım Modülü ✅ (FAZ 2 - 2025-01-29)
- Bakım kayıtları CRUD (MaintenanceRecord)
- Dashboard ve analytics (`/modules/maintenance/dashboard`)
- Takvim entegrasyonu
- Bildirim entegrasyonu
- Merkezi dosya yönetimi entegrasyonu
- i18n desteği (tr, en, de, ar)

#### 5. İnsan Kaynakları Modülü ✅ (FAZ 2 - 2025-01-29)
- Personel yönetimi (Employee CRUD)
- İzin yönetimi (Leave CRUD)
- Bordro yönetimi (Payroll CRUD)
- i18n desteği
- **Route**: `/modules/hr`

#### 6. Lisans Servisi Modülü ✅ (FAZ 3 - 2025-01-29)
- Lisans paket yönetimi (LicensePackage CRUD)
- Tenant lisans yönetimi (TenantLicense CRUD)
- Ödeme takibi (LicensePayment CRUD)
- Admin interface
- Tenant interface
- Otomatik bildirim sistemi
- i18n desteği
- **Route**: `/modules/license`

#### 7. Sohbet Modülü ✅ (FAZ 3 - 2025-01-29)
- Chat odaları yönetimi (ChatRoom CRUD)
- Mesajlaşma sistemi (ChatMessage CRUD)
- Real-time mesajlaşma (polling - 5 saniye interval)
- Dosya paylaşımı desteği
- Bildirim entegrasyonu
- Sayfa dışı panel modal sohbet sistemi
- **Route**: `/modules/chat`

#### 8. Üretim & Ürün Modülü ✅ (FAZ 2 - 2025-01-28)
- Üretim planlama
- Ürün yönetimi
- BOM (Bill of Materials) yönetimi
- Stok takibi
- Üretim adımları takibi
- Dashboard ve analytics
- **Route**: `/modules/production`

#### 9. Muhasebe Modülü ✅ (FAZ 2 - 2025-01-29)
- Abonelik sistemi
- Fatura yönetimi
- Ödeme takibi
- Gider yönetimi
- Dashboard ve analytics
- Raporlama sistemi
- Export entegrasyonu (Excel, PDF, CSV)
- Bildirim entegrasyonu
- **Route**: `/modules/accounting`

#### 10. Web Builder Modülü ✅ (FAZ 3 - 2025-01-30)
- Drag & drop website builder
- Modül widget'ları
- SEO yönetimi
- Widget registry sistemi
- Modül widget entegrasyonu
- SEO preview sistemi
- Sayfa önizleme sistemi
- Yayınlama sistemi
- **Route**: `/modules/web-builder`

#### 11. Emlak Modülü ✅ (FAZ 2 - 2025-01-28)
- Emlak yönetimi
- Sözleşme yönetimi
- Ödeme takibi
- Randevu yönetimi
- **Route**: `/modules/real-estate`

### 🔄 Geliştirme Aşamasında

#### 12. Bildirimler Modülü ✅
- Sistem bildirimleri yönetimi
- Bildirim oluşturma/düzenleme
- Bildirim listeleme ve filtreleme
- Global ve kullanıcı bazlı bildirimler
- **Route**: `/modules/notifications`

#### 13. Kullanıcılar Modülü ✅
- Kullanıcı CRUD işlemleri
- Kullanıcı profil yönetimi
- Kullanıcı durumu yönetimi
- Rol ve ajans atama
- **Route**: `/users`

#### 14. Raporlar Modülü ✅
- Rapor oluşturma ve yönetimi
- Rapor tipi registry sistemi
- Dinamik filtreleme
- Görselleştirme desteği
- Export işlemleri
- **Route**: `/modules/reports`

#### 15. Takvim Modülü ✅
- Olay takvimi
- Ay/Hafta/Gün görünümleri
- Olay yönetimi
- Tarih navigasyonu
- **Route**: `/modules/calendar`

#### 16. Dosya Yöneticisi Modülü ✅
- Dosya ve klasör yönetimi
- Grid/List görünüm modları
- Dosya yükleme/indirme
- Dosya paylaşımı
- Dosya önizleme
- **Route**: `/modules/file-manager`

### 📋 Planlanan Modüller

- Belgeler ve İmza Modülü
- Eğitim Modülü
- Müşteri Modülü
- Randevu Modülü
- Tedarikçi Modülü
- Ürün Modülü
- Vardiya Modülü
- Web Sayfa Modülü

---

## API Yapısı

### Authentication API
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/register` - Kayıt

### Modül API
- `GET /api/modules` - Modül listesi
- `POST /api/modules/upload` - Modül yükleme
- `POST /api/modules/[slug]/activate` - Aktifleştirme
- `POST /api/modules/[slug]/deactivate` - Pasifleştirme
- `DELETE /api/modules/[slug]/uninstall` - Kaldırma

### Kullanıcı API
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Kullanıcı oluşturma
- `GET /api/users/[id]` - Kullanıcı detayı
- `PUT /api/users/[id]` - Kullanıcı güncelleme
- `DELETE /api/users/[id]` - Kullanıcı silme

### Rol ve İzin API
- `GET /api/roles` - Rol listesi
- `POST /api/roles` - Rol oluşturma
- `GET /api/permissions` - İzin listesi
- `GET /api/permissions/check` - İzin kontrolü

### Tenant API
- `GET /api/tenants` - Tenant listesi
- `POST /api/tenants` - Tenant oluşturma
- `GET /api/tenants/[id]` - Tenant detayı
- `POST /api/tenants/[id]/export` - Export
- `POST /api/tenants/[id]/import` - Import

### Sistem Yönetimi API (SuperAdmin)
- `GET /api/admin/audit-logs` - Audit log listesi
- `GET /api/admin/backups` - Yedek listesi
- `POST /api/admin/backups` - Yedek oluşturma
- `POST /api/admin/backups/[id]/restore` - Geri yükleme
- `GET /api/admin/system/info` - Sistem bilgileri
- `GET /api/admin/system/metrics` - Sistem metrikleri

### Modül Özel API'ler

#### Muhasebe API
- `GET /api/accounting/invoices` - Fatura listesi
- `POST /api/accounting/invoices` - Fatura oluşturma
- `GET /api/accounting/expenses` - Gider listesi
- `GET /api/accounting/analytics` - Analitik

#### Üretim API
- `GET /api/production/products` - Ürün listesi
- `GET /api/production/bom` - BOM listesi
- `GET /api/production/orders` - Sipariş listesi
- `GET /api/production/analytics` - Analitik

#### Emlak API
- `GET /api/real-estate/properties` - Emlak listesi
- `GET /api/real-estate/contracts` - Sözleşme listesi
- `GET /api/real-estate/payments` - Ödeme listesi

#### HR API
- `GET /api/hr/employees` - Personel listesi
- `GET /api/hr/leaves` - İzin listesi
- `GET /api/hr/payrolls` - Bordro listesi

#### Bakım API
- `GET /api/maintenance/records` - Bakım kayıtları
- `GET /api/maintenance/analytics` - Analitik

#### Chat API
- `GET /api/chat/rooms` - Chat odaları
- `GET /api/chat/messages` - Mesajlar
- `POST /api/chat/messages` - Mesaj gönderme

#### Dosya Yöneticisi API
- `GET /api/file-manager/files` - Dosya listesi
- `POST /api/file-manager/upload` - Dosya yükleme
- `POST /api/file-manager/create-folder` - Klasör oluşturma
- `DELETE /api/file-manager/delete` - Dosya silme

### API Response Formatı

Tüm API'ler standart response formatı kullanır:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}
```

---

## Veritabanı Sistemi

### Prisma ORM

- **Type-Safe Queries**: TypeScript tip güvenliği
- **Schema Management**: Prisma schema ile yönetim
- **Migration Support**: Versiyonlanmış değişiklikler
- **Dual Schema System**: Core ve Tenant için ayrı schema'lar

### Core Database Schema

**Modeller:**
- `Tenant` - Tenant metadata
- `Agency` - Ajans bilgileri
- `Module` - Modül tanımları
- `ModulePermission` - Modül izinleri
- `TenantModule` - Tenant-modül ilişkileri
- `AuditLog` - Audit kayıtları
- `BackupMetadata` - Yedek metadata
- `SystemMetric` - Sistem metrikleri

### Tenant Database Schema

**Modeller:**
- `User` - Kullanıcılar
- `Company` - Şirketler
- `Role` - Roller
- `PermissionDefinition` - İzin tanımları
- `UserPermission` - Kullanıcı izinleri
- `Notification` - Bildirimler
- `Report` - Raporlar
- `AuditLog` - Audit kayıtları
- Modül özel modeller (Employee, Invoice, Product, vb.)

### Migration Sistemi

- `prisma migrate dev` - Development migration
- `prisma migrate deploy` - Production migration
- `prisma db push` - Schema push (development)

---

## Erişim Kontrol Sistemi

### Access Control Panel

**URL**: `/settings/access-control`  
**Erişim**: Sadece `SuperAdmin` ve `Admin` (Tenant Admin) rolleri

### Kapsam (Scope) Yönetimi

Ayarlar üç farklı seviyede yapılandırılabilir:
1. **Tenant (Firma)**: Varsayılan ayarlar
2. **Role (Rol)**: Belirli bir role sahip kullanıcılar için
3. **User (Kullanıcı)**: Belirli bir kullanıcı için

**Öncelik Mantığı**: `User > Role > Tenant`

### Yönetilebilir Alanlar

#### 1. Modül Erişimi (Module Access)
- Modüllerin aktif/pasif durumu
- Modül içi özelliklerin kontrolü

#### 2. Menü Görünürlüğü (Menu Visibility)
- Menü öğelerinin görünürlüğü
- Sürükle-bırak ile menü sıralaması
- Menü gruplarının yönetimi

#### 3. UI Özellikleri (UI Features)
- **Aksiyon Butonları**: Create, Edit, Delete, Export
- **Veri Tablosu**: Toplu işlemler, sütun görünürlüğü
- **Filtreleme**: Gelişmiş filtreler, kayıtlı görünümler
- **Dışa Aktarma**: Excel, PDF, CSV

#### 4. Düzen Özelleştirme (Layout Customization)
- **Sidebar**: Genişlik, arka plan rengi, pozisyon
- **Top Layout**: Yükseklik, arka plan rengi, sticky
- **Content Area**: Maksimum genişlik, dolgu, arka plan
- **Footer**: Görünürlük, yükseklik, arka plan

### Teknik Altyapı

- **Veritabanı**: `AccessControlConfiguration` modeli
- **API**: `/api/access-control` endpoint'leri
- **Middleware**: Rol tabanlı koruma
- **Hook**: `useAccessControl` hook'u
- **Entegrasyon**: `useMenuItems` hook'u ile menü entegrasyonu

---

## Kimlik Doğrulama ve Güvenlik

### JWT Authentication System

- **Access Token**: Kısa süreli (15 dakika)
- **Refresh Token**: Uzun süreli (7 gün)
- **Token-based Authentication**: Güvenli doğrulama
- **Session Management**: Cookie-based session

### Password Policy

- **Super Admin**: `uba1453.2010*`
- **Tenant Admin**: `omnex.fre.2520*`
- **Default User**: En düşük role, inactive status

### API Security

- **Rate Limiting**: İstek sınırlama
- **Standardized Responses**: Tutarlı response formatı
- **Auth Middleware**: JWT token doğrulama
- **IP-based Limiting**: IP bazlı sınırlama

### Güvenlik Özellikleri

- **Veri İzolasyonu**: Her tenant'ın verileri ayrı database'de
- **Cross-Tenant Erişim**: Middleware tarafından engellenir
- **Audit Logging**: Tüm aktiviteler loglanır
- **Secure Restore Flow**: Veri kaybını önlemek için zorunlu güvenlik yedeği

---

## Sistem Yönetimi

### Audit Logging System

- Tüm kullanıcı ve sistem aktivitelerinin loglanması
- Filtreleme (User, Tenant, Module, Action, Date)
- Export desteği (CSV, JSON)
- Log görüntüleme arayüzü

### Backup & Restore System

- Tenant bazlı veritabanı yedekleme (`pg_dump`)
- Güvenli geri yükleme (Restore öncesi otomatik güvenlik yedeği)
- Yedek indirme ve silme
- Metadata takibi

### System Monitoring

- Anlık sunucu kaynak kullanımı (CPU, RAM, Disk)
- Sunucu bilgileri (Uptime, OS, Arch)
- Veritabanı sağlık durumu

### Database Management

- Veritabanı boyut ve bağlantı bilgileri
- Bakım araçları (VACUUM, REINDEX) altyapısı

---

## UI/UX Özellikleri

### Login Sayfaları

#### Super Admin Login
- **URL**: `/{locale}/login/super-admin`
- Firma seçimi (zorunlu)
- Dönem seçimi (opsiyonel)
- Responsive tasarım
- Glassmorphism efekti

#### Admin Login
- **URL**: `/{locale}/login/admin`
- Dönem seçimi (opsiyonel)
- Responsive tasarım
- Glassmorphism efekti

### Theme Customizer

- **Layout Style**: Sidebar / Top
- **Direction**: LTR / RTL
- **Color Scheme**: Light / Dark / Auto
- **Custom Colors**: Menu, Sidebar, Header
- **Top Bar Scroll**: Sabit / Gizli / Hover

### Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- Mobile-first yaklaşım

---

## Uluslararasılaştırma (i18n)

### Desteklenen Diller

- **Türkçe (tr)**: Varsayılan
- **İngilizce (en)**
- **Almanca (de)**
- **Arapça (ar)**: RTL desteği

### Translation Yapısı

```
src/locales/
  ├── global/
  │   ├── tr.json
  │   ├── en.json
  │   ├── de.json
  │   └── ar.json
  ├── modules/
  │   ├── management/
  │   ├── ai/
  │   └── ...
  └── ...
```

### Kullanım

```typescript
import { useTranslation } from '@/lib/i18n/client';

const { t } = useTranslation('namespace');
const title = t('key');
```

---

## Tema Sistemi

### Dark/Light Mode

- **Light Mode**: Varsayılan açık tema
- **Dark Mode**: Koyu tema
- **Auto Mode**: Sistem tercihini takip eder

### Özelleştirilebilir Renkler

- Menu text ve icon renkleri
- Sidebar background
- Header background
- Custom color picker

### CSS Variables

Tüm tasarım token'ları CSS custom properties olarak:
- `--menu-text-color`
- `--sidebar-bg`
- `--header-bg`
- vb.

---

## Son Güncellemeler

### 2025-11-27 - v1.0.10

#### Modül Sistemi Yeniden Yapılandırma
- ✅ Tüm modüller YAML formatına geçirildi
- ✅ JSON Schema validasyonu
- ✅ Switch ile aktivasyon/deaktivasyon
- ✅ İkon seti entegrasyonu
- ✅ Client-side dinamik import

### 2025-11-27 - v1.0.9

#### Sistem Yönetimi Modülü
- ✅ Audit Logging System
- ✅ Backup & Restore System
- ✅ System Monitoring
- ✅ Database Management

### 2025-11-27 - v1.0.8

#### JWT Authentication & Security
- ✅ JWT Token Yönetimi
- ✅ API Security Enhancements
- ✅ Password Policy Updates
- ✅ Session Management

### 2025-01-30 - Web Builder Modülü

- ✅ Widget registry sistemi
- ✅ Modül widget entegrasyonu
- ✅ SEO yönetimi
- ✅ Yayınlama sistemi

### 2025-01-29 - Modül Tamamlamaları

- ✅ Bakım Modülü
- ✅ İnsan Kaynakları Modülü
- ✅ Lisans Servisi Modülü
- ✅ Sohbet Modülü
- ✅ Muhasebe Modülü

### 2025-01-28 - Üretim & Emlak Modülleri

- ✅ Üretim & Ürün Modülü
- ✅ Emlak Modülü

---

## Geliştirme Ortamı

### Gereksinimler

- **Node.js**: v20+
- **PostgreSQL**: v14+
- **npm** veya **yarn**

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Veritabanı oluştur
npm run db:create

# Migration'ları uygula
npm run db:migrate

# Seed data
npm run db:seed

# Development server
npm run dev
```

### Script'ler

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npm run db:seed

# Tenant Management
npm run tenant:create
npm run tenant:list
npm run tenant:delete
npm run tenant:export
npm run tenant:import

# Admin
npm run admin:sync
npm run admin:verify
```

### Environment Variables

Gerekli environment variable'lar `.env.example` dosyasında dokümante edilmiştir:

- `DATABASE_URL` - Core database connection
- `TENANT_DATABASE_URL` - Tenant database template
- `JWT_SECRET` - JWT secret key
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - NextAuth URL

---

## Gelecek Geliştirmeler

### Planlanan Özellikler

- [ ] Real-time özellikler (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit ve integration testleri
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Monitoring ve logging sistemi

### Modül Geliştirme Planları

- [ ] Belgeler ve İmza Modülü
- [ ] Eğitim Modülü
- [ ] Müşteri Modülü
- [ ] Randevu Modülü
- [ ] Tedarikçi Modülü
- [ ] Ürün Modülü
- [ ] Vardiya Modülü
- [ ] Web Sayfa Modülü

---

## Destek ve Dokümantasyon

### Dokümantasyon Dosyaları

- `OMNEX_SAAS_DOKUMAN.md` - Ana dokümantasyon (eski)
- `OMNEX_SAAS_DOKUMAN_GUNCELLENMIS.md` - Bu dosya (güncel)
- `CHANGELOG.md` - Versiyon geçmişi
- `README.md` - Proje README
- `docs/` - Ek dokümantasyonlar

### Versiyonlama

Proje SemVer (Semantic Versioning) yapısını takip eder:
- **MAJOR** (X.0.0): Geriye dönük uyumsuz API değişiklikleri
- **MINOR** (0.X.0): Geriye dönük uyumlu yeni özellikler
- **PATCH** (0.0.X): Geriye dönük uyumlu hata düzeltmeleri

---

## Lisans

Bu proje private bir projedir ve tüm hakları saklıdır.

---

**Son Güncelleme:** 2025-12-01  
**Versiyon:** 1.0.10  
**Dokümantasyon Versiyonu:** 2.0











