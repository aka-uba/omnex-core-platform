# Varsayılan Menü Hiyerarşisi

Bu dokümantasyon, OMNEX SaaS Platform'un varsayılan menü yapısını hiyerarşik olarak gösterir.

**Kaynak**: `src/config/default-menus.config.ts`

---

## 📋 MENÜ GRUPLARI

Menüler 4 ana gruba ayrılmıştır:
1. **Kullanıcı Menüleri** (`user`) - Tüm kullanıcılar için
2. **Firma Yönetimi** (`company`) - SuperAdmin ve Admin için
3. **Super Admin** (`superadmin`) - Sadece SuperAdmin için
4. **Ayarlar** (`settings`) - Tüm kullanıcılar için

---

## 1. KULLANICI MENÜLERİ (user)

### 1.1. Dashboard (Sıra: 0)
**Erişim**: SuperAdmin, Admin, ClientUser  
**Route**: `/dashboard`  
**Icon**: Dashboard

#### Alt Menüler:
- **Genel Bakış** (Sıra: 0)
  - Route: `/dashboard`
  - Icon: Dashboard

- **Analizler** (Sıra: 1)
  - Route: `/dashboard/analytics`
  - Icon: ChartBar

- **Raporlar** (Sıra: 2)
  - Route: `/dashboard/reports`
  - Icon: Report

---

## 2. FİRMA YÖNETİMİ (company)

### 2.1. Firmalar (Sıra: 10)
**Erişim**: Sadece SuperAdmin  
**Route**: `/management/companies`  
**Icon**: Building

#### Alt Menüler:
- **Tüm Firmalar** (Sıra: 0)
  - Route: `/management/companies`
  - Icon: Building

- **Yeni Firma Oluştur** (Sıra: 1)
  - Route: `/management/companies/create`
  - Icon: Building

- **Firma Ekle** (Sıra: 2)
  - Route: `/settings/add-company`
  - Icon: Building

### 2.2. Lokasyonlar (Sıra: 11)
**Erişim**: SuperAdmin, Admin  
**Route**: `/settings/company/locations`  
**Icon**: MapPin

#### Alt Menüler:
- **Lokasyon Listesi** (Sıra: 0)
  - Route: `/settings/company/locations`
  - Icon: MapPin

- **Hiyerarşi Yapılandırması** (Sıra: 1)
  - Route: `/settings/company/locations`
  - Icon: Apps

### 2.3. Kullanıcılar (Sıra: 12)
**Erişim**: SuperAdmin, Admin  
**Route**: `/management/users`  
**Icon**: Users

#### Alt Menüler:
- **Kullanıcı Listesi** (Sıra: 0)
  - Route: `/management/users`
  - Icon: Users

- **Roller** (Sıra: 1)
  - Route: `/management/roles`
  - Icon: Shield

- **İzinler** (Sıra: 2)
  - Route: `/management/permissions`
  - Icon: Shield

### 2.4. Lisansım (Sıra: 13)
**Erişim**: SuperAdmin, Admin  
**Route**: `/settings/license`  
**Icon**: CreditCard

#### Alt Menüler:
- **Lisans Bilgileri** (Sıra: 0)
  - Route: `/settings/license`
  - Icon: CreditCard

- **Lisans Geçmişi** (Sıra: 1)
  - Route: `/settings/license/history`
  - Icon: History

### 2.5. Erişim Kontrolü (Sıra: 14)
**Erişim**: SuperAdmin, Admin  
**Route**: `/settings/access-control`  
**Icon**: Shield  
**Alt Menü Yok**

---

## 3. SUPER ADMIN (superadmin)

### 3.1. Merkezi Sistemler (Sıra: 80)
**Erişim**: Sadece SuperAdmin  
**Route**: `/admin/core-systems`  
**Icon**: Server

#### Alt Menüler:
- **Dosya Yönetimi** (Sıra: 0)
  - Route: `/admin/core-systems/files`
  - Icon: Folder

- **AI Servisi** (Sıra: 1)
  - Route: `/admin/core-systems/ai`
  - Icon: Brain

- **Bildirimler** (Sıra: 2)
  - Route: `/admin/core-systems/notifications`
  - Icon: Bell

### 3.2. Tenant Yönetimi (Sıra: 81)
**Erişim**: Sadece SuperAdmin  
**Route**: `/admin/tenants`  
**Icon**: Database

#### Alt Menüler:
- **Tenant Listesi** (Sıra: 0)
  - Route: `/admin/tenants`
  - Icon: Database

- **Veritabanı Yönetimi** (Sıra: 1)
  - Route: `/admin/tenants/database`
  - Icon: Database

### 3.3. Sistem Yönetimi (Sıra: 80)
**Erişim**: Sadece SuperAdmin  
**Route**: `/admin/system`  
**Icon**: Server

#### Alt Menüler:
- **Sistem Durumu** (Sıra: 0)
  - Route: `/admin/system`
  - Icon: Server

- **Yedekleme** (Sıra: 1)
  - Route: `/admin/backups`
  - Icon: Database

- **Sistem Logları** (Sıra: 2)
  - Route: `/admin/logs`
  - Icon: FileText

### 3.4. Optimizasyon (Sıra: 82)
**Erişim**: Sadece SuperAdmin  
**Route**: `/admin/optimization`  
**Icon**: ChartBar

#### Alt Menüler:
- **Performans** (Sıra: 0)
  - Route: `/admin/optimization/performance`
  - Icon: ChartBar

- **Cache Yönetimi** (Sıra: 1)
  - Route: `/admin/optimization/cache`
  - Icon: Server

- **Veritabanı Bakımı** (Sıra: 2)
  - Route: `/admin/optimization/database`
  - Icon: Database

### 3.5. Modül Yönetimi (Sıra: 90)
**Erişim**: Sadece SuperAdmin  
**Route**: `/modules`  
**Icon**: Apps

#### Alt Menüler:
- **Modül Listesi** (Sıra: 0)
  - Route: `/modules`
  - Icon: Apps

- **Yeni Modül Yükle** (Sıra: 1)
  - Route: `/modules/upload`
  - Icon: Upload

---

## 4. AYARLAR (settings)

### 4.1. Ayarlar (Sıra: 95)
**Erişim**: SuperAdmin, Admin, ClientUser  
**Route**: `/settings`  
**Icon**: Settings

#### Alt Menüler:
- **Menü Yönetimi** (Sıra: 0)
  - Route: `/settings/menu-management`
  - Icon: Menu2

- **Footer Özelleştirme** (Sıra: 1)
  - Route: `/settings/menu-management/footer`
  - Icon: LayoutFooter

- **Firma Bilgileri** (Sıra: 2)
  - Route: `/settings/company`
  - Icon: Building

- **Export Şablonları** (Sıra: 3)
  - Route: `/settings/export-templates`
  - Icon: FileExport

- **Profil Ayarları** (Sıra: 4)
  - Route: `/settings/profile`
  - Icon: UserCircle

---

## 📊 ÖZET İSTATİSTİKLER

- **Toplam Menü Öğesi**: 20 ana menü
- **Toplam Alt Menü**: 28 alt menü öğesi
- **Toplam Menü Öğesi**: 48 menü öğesi

### Rol Bazında Erişim:
- **SuperAdmin**: Tüm menüler (20 ana + 28 alt = 48 öğe)
- **Admin**: 6 ana menü + 12 alt menü = 18 öğe
- **ClientUser**: 2 ana menü + 4 alt menü = 6 öğe

### Grup Bazında Dağılım:
- **Kullanıcı Menüleri**: 1 ana menü (3 alt menü)
- **Firma Yönetimi**: 5 ana menü (12 alt menü)
- **Super Admin**: 5 ana menü (13 alt menü)
- **Ayarlar**: 1 ana menü (5 alt menü)

---

## 🔄 NOTLAR

1. **Modül Menüleri**: Bu liste sadece varsayılan core menüleri içerir. Aktif modüllerden gelen menüler (`module.config.yaml` dosyalarından) otomatik olarak eklenir.

2. **Rol Filtreleme**: Menüler kullanıcı rolüne göre otomatik filtrelenir (`getDefaultMenusByRole` fonksiyonu).

3. **Çoklu Dil Desteği**: Tüm menü label'ları çoklu dil desteğine sahiptir (tr, en).

4. **Sıralama**: Menüler `order` değerine göre sıralanır (düşükten yükseğe).

5. **Hiyerarşi**: Maksimum 2 seviye desteklenir (ana menü → alt menü).

---

**Son Güncelleme**: 2025-12-02  
**Dokümantasyon Versiyonu**: 1.0.0

















