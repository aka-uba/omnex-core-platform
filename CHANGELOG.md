# Changelog

## Nasıl Çalışır? (How it Works)

Bu dosya, projedeki tüm önemli değişikliklerin kronolojik olarak tutulduğu kayıttır.

### Versiyonlama Formatı

Proje [SemVer](https://semver.org/lang/tr/) (Semantik Versiyonlama) yapısını takip eder:

- **MAJOR** (X.0.0): Geriye dönük uyumsuz API değişiklikleri
- **MINOR** (0.X.0): Geriye dönük uyumlu yeni özellikler
- **PATCH** (0.0.X): Geriye dönük uyumlu hata düzeltmeleri

### Değişiklik Türleri

- `✨ Yeni Özellikler (Features)`: Yeni eklenen özellikler
- `🐛 Düzeltmeler (Bug Fixes)`: Hata düzeltmeleri
- `🎨 Tasarım İyileştirmeleri (Design Improvements)`: Görsel düzenlemeler
- `🔧 Teknik İyileştirmeler (Technical Improvements)`: Kod yapısı, refactoring vb.
- `📝 Notlar (Notes)`: Genel notlar ve uyarılar

## [1.0.10] - 2025-11-27

### ✨ Yeni Özellikler (Features)

#### Modül Sistemi Yeniden Yapılandırma

- **YAML Configuration**:
  - Tüm modüller `module.config.yaml` formatına geçirildi
  - JSON Schema ile otomatik validasyon eklendi
  - Daha esnek ve okunaklı yapılandırma

- **UI İyileştirmeleri**:
  - Modül kartlarında Switch ile kolay aktivasyon/deaktivasyon
  - İkon seti entegrasyonu (`@tabler/icons-react`)
  - Gelişmiş ayarlar sayfası (Generic Settings Form)
  - Menü yapısı temizlendi ve optimize edildi

- **Teknik Altyapı**:
  - `ClientModuleLoader` ile client-side dinamik import desteği
  - Build hataları giderildi (`fs/promises` client-side usage fix)
  - Modül listeleme ve ayarlar sayfaları güncellendi

### 🐛 Düzeltmeler (Bug Fixes)

- **Build Error**: `ModuleLoader`'ın client component'lerde kullanılması sonucu oluşan build hatası giderildi.
- **UI Fixes**:
  - Modül kartlarındaki ikonların görünmemesi sorunu giderildi
  - Deaktivasyon butonu yerine Switch component'i eklendi
  - "Modül Listesi" menü başlığı "Modüller" olarak güncellendi

## [1.0.9] - 2025-11-27

### ✨ Yeni Özellikler (Features)

#### System Management Module (SuperAdmin)

- **Audit Logging System**:
  - Tüm kullanıcı ve sistem aktivitelerinin loglanması
  - Filtreleme (User, Tenant, Module, Action, Date)
  - Export desteği (CSV, JSON)
  - Log görüntüleme arayüzü
- **Backup & Restore System**:
  - Tenant bazlı veritabanı yedekleme (`pg_dump`)
  - Güvenli geri yükleme (Restore öncesi otomatik güvenlik yedeği)
  - Yedek indirme ve silme
  - Metadata takibi
- **System Monitoring**:
  - Anlık sunucu kaynak kullanımı (CPU, RAM, Disk)
  - Sunucu bilgileri (Uptime, OS, Arch)
  - Veritabanı sağlık durumu
- **Database Management**:
  - Veritabanı boyut ve bağlantı bilgileri
  - Bakım araçları (VACUUM, REINDEX) altyapısı

### 🔒 Güvenlik İyileştirmeleri (Security Improvements)

- **SuperAdmin Middleware**: Kritik yönetim sayfaları için ekstra güvenlik katmanı
- **Secure Restore Flow**: Veri kaybını önlemek için zorunlu güvenlik yedeği
- **Audit Trails**: Kritik işlemlerin (Backup, Restore, Export) loglanması

### 🔧 Teknik İyileştirmeler (Technical Improvements)

- **New Services**: `auditLogService`, `backupService`, `restoreService`, `systemMonitorService`
- **New Models**: `AuditLog`, `BackupMetadata`, `SystemMetric` (Core Database)
- **API Endpoints**: Yönetim paneli için yeni API endpoint'leri

## [1.0.8] - 2025-11-27

### ✨ Yeni Özellikler (Features)

#### JWT Authentication System

- **JWT Token Yönetimi**:
  - Access token ve refresh token desteği
  - Token-based authentication sistemi
  - Güvenli token doğrulama mekanizması
  
#### API Security Enhancements

- **Rate Limiting**: API endpoint'leri için istek sınırlama
- **Standardized API Responses**: Tüm API'ler için tutarlı response formatı
- **Auth Middleware**: JWT token doğrulama middleware'i

#### Environment Variables

- `.env.example` dosyası eklendi
- Tüm gerekli environment variable'lar dokümante edildi
- JWT, Redis, Email, Storage konfigürasyonları

### 🔒 Güvenlik İyileştirmeleri (Security Improvements)

#### Password Policy Updates

- **Super Admin Password**: Tüm tenant'larda `uba1453.2010*`
- **Tenant Admin Password**: Her firma için `omnex.fre.2520*`
- **Default User**: En düşük role (ClientUser), inactive status
- Seed script'leri yeni şifre politikasına göre güncellendi

#### Session Management

- Cookie-based session yönetimi
- Secure session oluşturma ve silme
- Session validation

### 📝 Dokümantasyon Güncellemeleri (Documentation Updates)

#### Yeni Dokümantasyon Bölümleri

- **Authentication & Security**: JWT, session management, password policies
- **Environment Variables**: Tüm env var'lar ve açıklamaları
- **API Response Format**: Standart response yapısı ve error code'ları
- **Deployment Guide**: Production deployment rehberi
- **Security Policy**: Güvenlik politikaları ve compliance

#### Versiyon Standardizasyonu

- Tüm dosyalarda versiyon 1.0.8 olarak güncellendi
- `package.json`, `CHANGELOG.md`, `version.txt`, `OMNEX_SAAS_DOKUMAN.md` senkronize edildi

### 🔧 Teknik İyileştirmeler (Technical Improvements)

#### API Response Standardization

- Tüm API endpoint'leri standart response formatı kullanıyor
- Success ve error response'ları tutarlı
- Pagination ve meta data desteği

#### Rate Limiting

- In-memory rate limiter implementasyonu
- Configurable request limits
- IP-based ve user-based limiting

### 📋 Notlar (Notes)

- Tüm değişiklikler geriye dönük uyumlu
- Mevcut authentication sistemi korundu, JWT eklentisi yapıldı
- Production için Redis cache entegrasyonu önerilir
- Dokümantasyon Türkçe ve İngilizce olarak güncellendi

---

## [1.0.3] - 2025-01-27

### 🎨 Tasarım İyileştirmeleri (Design Improvements)

#### Theme Customizer UI Yeniden Tasarlandı

- **Theme Customizer Component'i Güncellendi**:
  - `src/components/theme/ThemeCustomizer.tsx` component'i tamamen yeniden tasarlandı
  - Daha kompakt ve modern bir UI yapısı
  - Tüm bölümler scrollbar olmadan sığacak şekilde optimize edildi
  - Section başlıkları için uygun spacing ayarları
  - Footer butonları merkeze hizalandı ve font boyutları küçültüldü
  - Layout Style seçenekleri için icon'lar eklendi (Sidebar ve Top)
  - Color palette görsel seçim özelliği eklendi
  - Custom color input'lar için color picker entegrasyonu

- **Layout Style İyileştirmeleri**:
  - "Classic" → "Sidebar" olarak değiştirildi
  - "Horizontal" → "Top" olarak değiştirildi
  - Top layout preview'u yatay görünümde gösteriliyor
  - Layout preview kutularına uygun icon'lar eklendi
  - Sidebar icon'u direction'a göre dinamik olarak ters çevriliyor (LTR/RTL)

- **Yön (Direction) Seçenekleri İyileştirildi**:
  - LTR için `IconAlignLeft` icon'u kullanılıyor
  - RTL için `IconAlignRight` icon'u kullanılıyor
  - Daha anlamlı ve görsel icon seçimleri

- **Top Bar Scroll Seçenekleri İyileştirildi**:
  - "Sabit" için `IconLock` icon'u
  - "Gizli" için `IconEyeOff` icon'u
  - "Hover" için `IconPointer` icon'u
  - Tüm seçenekler yan yana, tek satırda gösteriliyor
  - Metinler tek satıra uygun hale getirildi

- **Theme Customizer Overlay Eklendi**:
  - Panel açıkken arka planda yarı saydam overlay gösteriliyor
  - Overlay'e tıklandığında panel kapanıyor
  - Panel içine tıklandığında kapanmıyor (stopPropagation)
  - Smooth fade-in animasyonu

#### Sidebar Animasyon İyileştirmeleri

- **Daraltma/Genişletme Animasyonları**:
  - Logo text için fade-in ve slide-in animasyonu
  - Section title'lar için fade-in ve slide-in animasyonu
  - Menu item'ları için fade-in ve slide-in animasyonu
  - Tüm animasyonlar birlikte ve hızlı (0.3s)
  - Transform mesafesi optimize edildi (5px)
  - Stagger effect kaldırıldı (daha akıcı görünüm)

- **Collapse/Expand Icon İyileştirmeleri**:
  - Icon renkleri sidebar background'a göre dinamik değişiyor
  - Hover efektleri iyileştirildi
  - Collapsed durumda icon pozisyonu düzeltildi (logo ile çakışmıyor)

#### Dark Mode Uyumluluk İyileştirmeleri

- **Reset Preferences Modal**:
  - Dark mode'da düzgün görünmesi için stiller eklendi
  - CSS değişkenleri kullanılarak dinamik renk yönetimi
  - z-index ayarı (Theme Customizer'ın üstünde)

- **Theme Customizer Drawer**:
  - Dark mode'da arka plan renkleri düzeltildi
  - Tüm içerik alanları dark mode'a uyumlu

- **Content Area**:
  - Dark mode'da içerik alanı arka planı düzeltildi
  - Text renkleri dark mode'a uyumlu

### 🐛 Düzeltmeler (Bug Fixes)

#### Otomatik Tema Seçeneği Düzeltildi

- **Sorun**: "Otomatik" tema seçeneği direkt koyuya geçiyordu, tarayıcı temasını takip etmiyordu
- **Kök Neden**: `MantineProvider`'da `defaultColorScheme="light"` ayarı otomatik modu engelliyordu
- **Çözüm**:
  - `MantineThemeWrapper` component'i iyileştirildi
  - Sistem tercihi (`window.matchMedia('(prefers-color-scheme: dark)')`) hemen okunuyor
  - Sistem tercihi değiştiğinde otomatik güncelleniyor
  - `defaultColorScheme` prop'u kaldırıldı

#### Header Theme Toggle Button

- **Sorun**: Header'daki dark/light icon çalışmıyordu
- **Çözüm**:
  - `handleThemeToggle` fonksiyonu `setThemeMode` çağrısı eklendi
  - Hem Mantine color scheme hem de ThemeContext state'i güncelleniyor

#### LTR/RTL Direction Sorunları

- **Sorun**: LTR seçildiğinde sidebar solda kalıyor, içerik sağa kayıyordu
- **Çözüm**:
  - `DirectionProvider`'a `key={direction}` prop'u eklendi (force re-render)
  - `useEffect` ile `document.documentElement.setAttribute('dir', direction)` eklendi
  - RTL-specific CSS stilleri eklendi

#### Menu ve Icon Renkleri

- **Sorun**: Menu ve menu icon renkleri seçenekleri çalışmıyordu
- **Çözüm**:
  - Dynamic color calculation eklendi
  - `getContrastColor` helper fonksiyonu eklendi
  - CSS değişkenleri ile dinamik renk yönetimi

#### Sidebar Background "Dark" Seçeneği

- **Sorun**: "Dark" seçeneği siyah yerine başka bir renk gösteriyordu
- **Çözüm**: `sidebarBackground === 'dark'` durumunda `#000000` kullanılıyor

#### Divider ve Section Title Renkleri

- **Sorun**: Divider'lar çok keskin görünüyordu, section title'lar dark mode'da görünmüyordu
- **Çözüm**:
  - Divider renkleri sidebar background'a göre dinamik hesaplanıyor
  - Section title renkleri daha görünür hale getirildi
  - Opacity değerleri optimize edildi (daha yumuşak görünüm)

#### ScrollArea Background

- **Sorun**: ScrollArea background'u sidebar background tercihine göre değişmiyordu
- **Çözüm**: `--scroll-area-bg` CSS değişkeni eklendi ve dinamik olarak hesaplanıyor

#### TopLayout Header Renkleri

- **Sorun**: TopLayout'ta menu rengi ve sidebar arka plan özelleştirmeleri çalışmıyordu
- **Çözüm**:
  - Header background ve menu text renkleri dinamik olarak hesaplanıyor
  - Dark mode'da custom tercihler override ediliyor (default dark renkler kullanılıyor)
  - Light mode'da header icon'ları dinamik renk değişimine uyumlu
  - Icon box ve search area background'ları dinamik renk değişimine uyumlu
  - Blur effect tüm renklerde korunuyor

#### Top Bar Scroll Behavior

- **Sorun**: "Gizli (Üzerine Gelince Görünür)" seçeneği sadece mouse tarayıcı dışına çıktığında çalışıyordu
- **Çözüm**:
  - Scroll event handling `requestAnimationFrame` ile optimize edildi
  - Mouse pozisyonu takibi eklendi (sayfa üstüne yakın olduğunda göster)
  - Smooth transition animasyonu eklendi

### 🔧 Teknik İyileştirmeler (Technical Improvements)

#### Theme Context Genişletildi

- `customMenuColor` ve `customSidebarColor` state'leri eklendi
- Tüm tema tercihleri localStorage'da saklanıyor
- `savePreferences` ve `resetPreferences` fonksiyonları eklendi

#### CSS Variables Sistemi

- Menu text ve icon renkleri için CSS değişkenleri
- Divider ve section title renkleri için CSS değişkenleri
- Logo icon renkleri için CSS değişkenleri
- Collapse icon renkleri için CSS değişkenleri
- ScrollArea background için CSS değişkenleri
- Header background ve icon background için CSS değişkenleri

#### Contrast Calculation

- `getContrastColor` helper fonksiyonu eklendi
- Custom renkler için otomatik kontrast hesaplama
- Luminance-based renk seçimi (siyah/beyaz)

#### Animation Optimizasyonları

- Stagger effect kaldırıldı (daha akıcı görünüm)
- Animasyon süreleri optimize edildi (0.3s)
- Transform mesafeleri azaltıldı (5px)

### 📝 Notlar (Notes)

- Tüm değişiklikler geriye dönük uyumlu
- Mevcut tema yapısı korundu
- Performance optimizasyonları yapıldı
- Dark mode tüm bileşenlerde tutarlı

---

## [1.0.2] - 2025-01-27

### ✨ Yeni Özellikler (Features)

#### CentralPageHeader i18n Desteği

- **CentralPageHeader Component'i Güncellendi**:
  - `src/components/headers/CentralPageHeader.tsx` component'ine tam i18n (internationalization) desteği eklendi
  - `useTranslation` hook'u entegre edildi
  - `namespace` prop'u eklendi (varsayılan: 'global')
  - `title` ve `description` prop'ları artık hem i18n key'leri hem de direkt metin kabul ediyor
  - `translate` helper fonksiyonu eklendi - nokta içeren string'leri otomatik olarak i18n key olarak algılıyor
  - Action button'ların `label` prop'ları da i18n ile çevriliyor

- **BreadcrumbNav Component'i Güncellendi**:
  - `src/components/headers/BreadcrumbNav.tsx` component'ine i18n desteği eklendi
  - Her breadcrumb item için ayrı `namespace` belirleme özelliği eklendi
  - `BreadcrumbItemComponent` helper component'i oluşturuldu (React hook kurallarına uyum için)
  - Breadcrumb label'ları artık i18n key'leri veya direkt metin olarak kullanılabiliyor
  - Default namespace desteği eklendi

- **useTranslation Hook Güncellendi**:
  - `src/lib/i18n/client.ts` hook'u üst dizindeki (Omnex-Sass) projeyle uyumlu hale getirildi
  - `fetch` API yerine `require` kullanarak translation dosyalarını yüklüyor
  - Translation dosyaları `src/locales/{namespace}/{locale}.json` yolundan yükleniyor
  - Cache mekanizması korundu (performans için)
  - Fallback mekanizması eklendi (default locale'e düşüş)
  - Async/await yerine senkron yükleme (cache ile optimize edildi)

- **Module Management Sayfaları Güncellendi**:
  - `src/modules/module-management/components/ModuleUpload.tsx`:
    - `CentralPageHeader` kullanımı güncellendi
    - `title` ve `description` prop'ları i18n key'leri olarak güncellendi
    - Breadcrumb'lar i18n key'leri kullanıyor
    - `namespace="modules/management"` eklendi
    - Tüm hardcoded string'ler `t()` fonksiyonu ile çevrildi
  - `src/modules/module-management/components/ModuleListing.tsx`:
    - `CentralPageHeader` kullanımı güncellendi
    - `title` ve `description` prop'ları i18n key'leri olarak güncellendi
    - Breadcrumb'lar i18n key'leri kullanıyor
    - Action button label'ı i18n key'i olarak güncellendi
    - `namespace="modules/management"` eklendi
    - Tüm hardcoded string'ler `t()` fonksiyonu ile çevrildi

- **Translation Dosyaları Oluşturuldu**:
  - `src/locales/modules/management/tr.json` - Türkçe çeviriler
  - `src/locales/modules/management/en.json` - İngilizce çeviriler
  - `src/locales/global/tr.json` - Global Türkçe çeviriler güncellendi
  - `src/locales/global/en.json` - Global İngilizce çeviriler güncellendi
  - Translation dosyaları modüler yapıda organize edildi

### 🐛 Düzeltmeler (Bug Fixes)

#### Translation Key'lerinin Görünmemesi Sorunu

- **Sorun**: Translation key'leri (örn: "modules.management.upload.title") çevrilmemiş olarak görünüyordu
- **Kök Neden**: `useTranslation` hook'u `fetch` API kullanıyordu ve Next.js client component'lerinde düzgün çalışmıyordu
- **Çözüm**:
  - `useTranslation` hook'u üst dizindeki projeyle uyumlu hale getirildi
  - `require` kullanarak translation dosyaları yükleniyor
  - Translation dosyaları `src/locales/` klasöründen yükleniyor
  - Cache mekanizması ile performans optimize edildi

#### BreadcrumbNav Hook Kuralı İhlali

- **Sorun**: `useTranslation` hook'u `map` fonksiyonu içinde kullanılıyordu (React hook kurallarına aykırı)
- **Çözüm**:
  - `BreadcrumbItemComponent` helper component'i oluşturuldu
  - Her breadcrumb item için ayrı component render ediliyor
  - Hook'lar artık component'in en üst seviyesinde çağrılıyor

### 🎨 Tasarım İyileştirmeleri (Design Improvements)

#### Global Scrollbar Stilleri Kaldırıldı

- **Değişiklik**: Özelleştirilmiş scrollbar stilleri kaldırıldı
- **Etkilenen Dosyalar**:
  - `omnex-core-platform/src/app/globals.css` - Tüm scrollbar stilleri kaldırıldı
  - `src/styles/globals.css` - Scrollbar stilleri kaldırıldı
- **Sonuç**: Artık tarayıcının varsayılan scrollbar stilleri kullanılıyor
- **Neden**: Kullanıcı tercihi - özelleştirilmiş scrollbar stilleri istenmiyordu

### 🔧 Teknik İyileştirmeler (Technical Improvements)

#### i18n Sistem Entegrasyonu

- CentralPageHeader ve BreadcrumbNav component'leri artık tam i18n desteğine sahip
- Translation key'leri otomatik algılanıyor (nokta içeren string'ler)
- Namespace desteği ile modül bazlı çeviriler mümkün
- Fallback mekanizması ile eksik çevirilerde key gösteriliyor
- Performans optimizasyonu (cache ile translation dosyaları tekrar yüklenmiyor)

#### Component Yapısı İyileştirmeleri

- BreadcrumbNav component'i React hook kurallarına uyumlu hale getirildi
- Helper component'ler ile kod organizasyonu iyileştirildi
- Type safety korundu (TypeScript tip tanımlamaları)

### 📝 Notlar (Notes)

- Tüm değişiklikler geriye dönük uyumlu
- Mevcut i18n yapısı korundu
- Translation dosyaları modüler yapıda organize edildi
- Üst dizindeki (Omnex-Sass) projeyle uyumluluk sağlandı

---

## [1.0.1] - 2025-01-27

### 🚀 Yeni Sistemler ve Modüller (New Systems and Modules)

#### Modül Yönetim Sistemi (Module Management System)

- **Modül Registry Sistemi**:
  - `src/lib/modules/registry.ts` - Modül kayıt ve yönetim sistemi
  - `src/lib/modules/types.ts` - Modül tip tanımlamaları (ModuleManifest, ModuleConfig, ModuleRegistration)
  - `src/lib/modules/loader.ts` - Dinamik modül yükleme sistemi
  - `src/lib/modules/icon-loader.tsx` - Modül ikon yükleme component'i

- **Modül Context ve Hook'lar**:
  - `src/context/ModuleContext.tsx` - Modül state yönetimi için React Context
  - `src/hooks/useModule.ts` - Modül işlemleri için custom hook
  - `src/hooks/useNotification.tsx` - Bildirim ve onay modal'ları için hook

- **Modül Yönetim Component'leri**:
  - `src/modules/module-management/components/ModuleCard.tsx` - Modül kartı component'i
    - Modül bilgileri (isim, versiyon, açıklama, durum)
    - Aktif/Pasif yapma butonları
    - Kaldırma (uninstall) işlemi
    - Ayarlar menüsü
  - `src/modules/module-management/components/ModuleListing.tsx` - Modül listeleme sayfası
    - Arama özelliği
    - Durum filtreleme (Active, Inactive, Installed)
    - Kategori filtreleme
    - Responsive grid layout
  - `src/modules/module-management/components/ModuleCardSkeleton.tsx` - Yükleme durumu için skeleton
  - `src/modules/module-management/components/ModuleUpload.tsx` - Modül yükleme sayfası
    - Drag & drop dosya yükleme
    - ZIP dosyası validasyonu
    - Modül manifest önizleme
    - Yükleme progress göstergesi

- **Modül Yönetim API Route'ları**:
  - `src/app/api/modules/route.ts` - Tüm modülleri listeleme (GET)
  - `src/app/api/modules/upload/route.ts` - Modül yükleme (POST)
  - `src/app/api/modules/[slug]/activate/route.ts` - Modül aktifleştirme (POST)
  - `src/app/api/modules/[slug]/deactivate/route.ts` - Modül pasifleştirme (POST)
  - `src/app/api/modules/[slug]/uninstall/route.ts` - Modül kaldırma (DELETE)

- **Modül Yönetim Sayfaları**:
  - `src/app/[locale]/modules/page.tsx` - Modül listeleme sayfası
  - `src/app/[locale]/modules/upload/page.tsx` - Modül yükleme sayfası

#### Dashboard Component'leri

- **Dashboard Widget'ları**:
  - `src/modules/dashboard/components/KPIStats.tsx` - KPI istatistik kartları
    - 4 adet KPI kartı (Views, Engagement, Conversion, Revenue)
    - Trend göstergeleri (yukarı/aşağı ok)
    - Yüzde değişim bilgisi
  - `src/modules/dashboard/components/ContentPerformance.tsx` - İçerik performans grafiği
    - Bar chart görünümü
    - Son gönderilerin görüntülenme sayıları
  - `src/modules/dashboard/components/UpcomingPosts.tsx` - Yaklaşan gönderiler listesi
    - Gönderi başlıkları
    - Tarih ve saat bilgileri
    - İkon gösterimi
  - `src/modules/dashboard/components/FinanceOverview.tsx` - Finans özeti
    - RingProgress ile dairesel grafik
    - Toplam gelir bilgisi
    - Kategori bazlı dağılım
  - `src/modules/dashboard/components/RecentActivity.tsx` - Son aktiviteler listesi
    - Aktivite mesajları
    - Zaman damgaları
    - İkon gösterimi
  - `src/modules/dashboard/components/DashboardSkeleton.tsx` - Dashboard yükleme durumu skeleton
- **Ana Dashboard Component'i**:
  - `src/modules/dashboard/Dashboard.tsx` - Tüm dashboard widget'larını birleştiren ana component
    - SimpleGrid layout
    - Sayfa başlığı ve "New Report" butonu
    - Loading state yönetimi

#### Modül Klasör Yapısı

- Aşağıdaki modül klasörleri oluşturuldu (her biri `components/` alt klasörü ile):
  - `src/modules/bakim/`
  - `src/modules/belgeler-ve-imza/`
  - `src/modules/egitim/`
  - `src/modules/insan-kaynaklari/`
  - `src/modules/muhasebe/`
  - `src/modules/musteri/`
  - `src/modules/randevu/`
  - `src/modules/sohbet/`
  - `src/modules/tedarikci/`
  - `src/modules/uretim/`
  - `src/modules/urun/`
  - `src/modules/vardiya/`
  - `src/modules/web-sayfa/`

#### Sidebar Menü Entegrasyonu

- Sidebar'a tüm modül menü öğeleri eklendi
- Core menu items ve module menu items ayrımı yapıldı
- Dinamik aktif modüller gösterimi eklendi
- Her menü öğesi için uygun ikonlar atandı
- Route'lar modül yapısına göre oluşturuldu

### 🐛 Düzeltmeler (Bug Fixes)

#### CSS Modules Uyumluluk Sorunları

- **Sorun**: CSS Modules dosyalarında Tailwind `@apply` direktifi kullanılamıyordu ve build hatası veriyordu.
- **Çözüm**: Tüm CSS Modules dosyalarındaki `@apply` direktifleri kaldırıldı ve standart CSS property'leri kullanıldı.
- **Etkilenen Dosyalar**:
  - `src/components/layouts/Sidebar.module.css`
  - `src/components/layouts/SidebarLayout.module.css`
  - `src/components/layouts/TopLayout.module.css`
- **Değişiklikler**:
  - Tailwind utility class'ları yerine standart CSS property'leri kullanıldı
  - Dark mode selector'ları `.dark` yerine `[data-mantine-color-scheme="dark"]` olarak güncellendi
  - `ring` gibi Tailwind özel class'ları `box-shadow` ile değiştirildi

### ✨ Yeni Özellikler (Features)

#### Sidebar Daraltma/Genişletme Özelliği

- Sidebar'a daraltma/genişletme butonu eklendi
- Daraltıldığında sidebar genişliği 16rem'den 4rem'e düşüyor
- Daraltıldığında sadece ikonlar görünüyor, metinler gizleniyor
- Smooth transition animasyonu eklendi (0.3s ease)
- Sağ üst köşede collapse/expand butonu eklendi
- `IconChevronLeft` ve `IconChevronRight` ikonları kullanıldı

#### Menü Öğeleri Geri Yükleme

- Tüm menü öğeleri geri eklendi:
  - **Core Menu Items**: Dashboard, AI Modülü, Takvim, Dosya Yöneticisi, Modül Yönetimi
  - **Module Menu Items**: Bakım, Belgeler ve İmza, Bildirimler, Eğitim, İnsan Kaynakları, Kullanıcılar, Lokasyonlar, Merkezi Veri Tablosu, Muhasebe, Müşteri, Randevu, Raporlar, Sohbet, Tedarikçi, Üretim, Ürün, Vardiya, Web Sayfa, Ayarlar ve Markalama, Support
  - **Active Dynamic Modules**: Aktif modüller dinamik olarak gösteriliyor
- Section başlıkları eklendi (Core Menu, Modules, Active Modules)
- Mantine `NavLink` component'i kullanıldı
- `ScrollArea` eklendi (uzun menüler için scroll desteği)
- `Divider` component'i ile section'lar arası ayrım eklendi

#### Footer Component Eklendi

- Yeni `Footer.tsx` component'i oluşturuldu
- Copyright metni: "© 2024 Omnex Core. All rights reserved."
- Footer linkleri: Privacy, Terms, Support
- Her iki layout'a (SidebarLayout ve TopLayout) footer eklendi
- Light/Dark mode desteği
- Backdrop blur efekti (header ile uyumlu)
- Responsive tasarım (linkler wrap olabilir)

### 🎨 Tasarım İyileştirmeleri (Design Improvements)

#### Header Tutarlılığı

- TopLayout header arka planı SidebarLayout ile aynı yapıldı:
  - Light mode: `rgba(245, 247, 248, 0.8)`
  - Dark mode: `rgba(15, 23, 42, 0.8)`
  - `backdrop-filter: blur(4px)` eklendi
- Border renkleri eşitlendi:
  - Light mode: `rgb(229, 231, 235)`
  - Dark mode: `rgba(255, 255, 255, 0.1)`
- Z-index değeri `10` olarak ayarlandı (SidebarLayout ile aynı)

#### Header Sticky Davranışı

- TopLayout header'ı `position: sticky` ve `top: 0` ile yukarıya yapıştırıldı
- Scroll sırasında header sabit kalıyor
- Parent container'lara `overflow: visible` eklendi (sticky'nin çalışması için)

#### Avatar Menü Birleştirme

- Her iki layout'ta da avatar menüsü Mantine `Menu` component'i kullanıyor
- Custom CSS menü kaldırıldı
- Menü öğeleri: My Profile, Account Settings, Sign Out
- "Sign Out" kırmızı renkte gösteriliyor
- Mantine `Avatar` component'i kullanılıyor (40px, rounded)

#### Action Button Stilleri

- TopLayout header ikonları SidebarLayout ile aynı stillere sahip:
  - Kare butonlar (2.5rem x 2.5rem)
  - Border radius: 0.5rem
  - Aynı hover efektleri
  - Aynı dark mode stilleri

### 🔧 Teknik İyileştirmeler (Technical Improvements)

#### Container Genişlik Düzeltmeleri

- TopLayout'ta Mantine Container'ın max-width'i override edildi
- Container artık tam genişlikte kullanılabiliyor
- Responsive padding eklendi:
  - Mobile: 1.5rem (24px)
  - Tablet (≥768px): 2rem (32px)
  - Desktop (≥1024px): 3rem (48px)
  - Large Desktop (≥1280px): 4rem (64px)
- TopLayout main padding'i kaldırıldı (padding artık Container içinde)

#### Layout Yapısı İyileştirmeleri

- `topLayout` ve `layoutContainer` overflow ayarları düzeltildi
- `min-height: 0` eklendi (flex overflow için)
- Footer için layout yapısı optimize edildi

### 📝 Notlar (Notes)

- Tüm değişiklikler geriye dönük uyumlu
- Mevcut işlevsellik korundu
- Performans iyileştirmeleri yapıldı

---

## [1.0.0] - 2025-11-23

### 📋 İlk Sürüm

- Changelog ve versiyonlama yapısının oluşturulması
- Proje yapısının kurulması
