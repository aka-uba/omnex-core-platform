# Layouts - Dokümantasyon

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Kurulum ve Kullanım](#kurulum-ve-kullanım)
4. [Bileşenler](#bileşenler)
5. [Veri Yönetimi](#veri-yönetimi)
6. [Yapılandırma](#yapılandırma)
7. [API Referansı](#api-referansı)
8. [Örnekler](#örnekler)

---

## 🎯 Genel Bakış

Layouts, Omnex Core Platform için geliştirilmiş modern, özelleştirilebilir ve performanslı bir layout sistemidir. Sistem, kullanıcıların, rollerin ve firmaların kendi layout tercihlerini kaydetmesine ve yönetmesine olanak tanır.

### Özellikler

- ✅ **3 Farklı Layout Tipi**: Sidebar, Top Navigation, Mobile
- ✅ **Hibrit Veri Yönetimi**: LocalStorage + Database (instant apply + persistence)
- ✅ **Responsive Tasarım**: Otomatik mobile/tablet/desktop algılama
- ✅ **Tema Desteği**: Light, Dark, Auto (sistem tercihi)
- ✅ **RTL/LTR Desteği**: Çok dilli uygulamalar için
- ✅ **Öncelik Sistemi**: User > Role > Company > Default
- ✅ **Instant Apply**: Değişiklikler anında uygulanır
- ✅ **Debounced Sync**: Performans için debounced database senkronizasyonu
- ✅ **Otomatik Renk Uyumu**: Arka plan rengine göre text/icon renkleri otomatik hesaplanır (sadece light mode)

---

## 🏗️ Mimari

### Dosya Yapısı

```
layouts/
├── core/                    # Çekirdek sistem
│   ├── LayoutConfig.ts      # Tip tanımları ve varsayılanlar
│   ├── LayoutProvider.tsx   # Context Provider ve state yönetimi
│   └── LayoutResolver.ts    # Öncelik bazlı config çözümleme
├── hooks/                   # Custom hooks
│   ├── useLayoutData.ts     # Hibrit veri yönetimi (DB + localStorage)
│   ├── useLayoutSync.ts     # Debounced database senkronizasyonu
│   └── useMenuItems.ts      # Merkezi menü kaynağı (Sidebar ve TopNavigation için)
├── sidebar/                 # Sidebar layout bileşenleri
│   ├── Sidebar.tsx
│   ├── Sidebar.module.css
│   ├── SidebarLayout.tsx
│   └── SidebarLayout.module.css
├── top/                     # Top navigation layout bileşenleri
│   ├── TopHeader.tsx
│   ├── TopHeader.module.css
│   ├── TopLayout.tsx
│   ├── TopLayout.module.css
│   ├── TopNavigation.tsx
│   └── TopNavigation.module.css
├── mobile/                  # Mobile layout bileşenleri
│   ├── MobileHeader.tsx
│   ├── MobileHeader.module.css
│   ├── MobileLayout.tsx
│   ├── MobileLayout.module.css
│   ├── MobileMenu.tsx
│   └── MobileMenu.module.css
├── shared/                  # Ortak bileşenler
│   ├── ContentArea.tsx      # Özelleştirilebilir içerik alanı
│   ├── Footer.tsx
│   └── colorUtils.ts        # Renk kontrast hesaplama utilities
├── configurator/            # Tema özelleştirici
│   ├── ThemeConfigurator.tsx
│   └── ThemeConfigurator.module.css
└── LayoutWrapper.tsx        # Ana wrapper - layout seçimi
```

### Veri Akışı

```
┌─────────────────────────────────────────────────────────────┐
│                    LayoutWrapper                             │
│  (Layout seçimi: Sidebar/Top/Mobile)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  LayoutProvider                              │
│  • State yönetimi                                            │
│  • Theme/Direction uygulama                                  │
│  • Responsive breakpoint algılama                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│useLayoutData │ │useLayoutSync │ │LayoutResolver│
│              │ │              │ │              │
│• DB Load     │ │• Debounced   │ │• Priority    │
│• LocalStorage│ │  DB Save     │ │  Resolution  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Veri Yönetimi Stratejisi

**Local-First + Background Sync Pattern:**

1. **İlk Render**: LocalStorage'dan hızlıca yükle (instant)
2. **Background**: Database'den yükle ve karşılaştır
3. **Değişiklik**: 
   - State'i güncelle → instant render
   - LocalStorage'a yaz → instant persistence
   - Debounced DB sync → background persistence

**Öncelik Sırası (LayoutResolver):**
```
User Config > Role Config > Company Config > Default Config
```

---

## 🚀 Kurulum ve Kullanım

### 1. LayoutWrapper'ı Root Layout'a Ekleyin

```tsx
// app/layout.tsx
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
```

### 2. useLayout Hook'unu Kullanın

```tsx
import { useLayout } from '@/components/layouts/core/LayoutProvider';

function MyComponent() {
  const { 
    config, 
    applyChanges, 
    currentLayout,
    isMobile,
    isTablet,
    isDesktop 
  } = useLayout();

  // Layout yapılandırmasını değiştir
  const handleThemeChange = () => {
    applyChanges({
      themeMode: 'dark',
    });
  };

  return (
    <div>
      <p>Current Layout: {currentLayout}</p>
      <p>Theme: {config.themeMode}</p>
      <button onClick={handleThemeChange}>Toggle Theme</button>
    </div>
  );
}
```

---

## 🧩 Bileşenler

### LayoutWrapper

Ana wrapper bileşeni. Layout seçimini yapar ve LayoutProvider'ı sağlar.

**Props:**
- `children: ReactNode` - Sayfa içeriği

**Özellikler:**
- Login/Register/Welcome sayfalarını otomatik atlar (layoutsuz)
- Responsive layout seçimi (mobile → MobileLayout)
- LayoutProvider ile sarmalar

### LayoutProvider

Context provider. Tüm layout state'ini ve yapılandırmasını yönetir.

**Props:**
- `children: ReactNode`
- `userId?: string` - Kullanıcı ID (veritabanı senkronizasyonu için)
- `userRole?: string` - Kullanıcı rolü (rol bazlı config için)
- `companyId?: string` - Firma ID (firma bazlı config için)

**Context API:**
```tsx
interface LayoutContextType {
  currentLayout: LayoutType;        // 'sidebar' | 'top' | 'mobile'
  config: LayoutConfig;              // Mevcut yapılandırma
  setConfig: (config: LayoutConfig) => void;
  applyChanges: (changes: Partial<LayoutConfig>) => void;
  loadConfig: () => Promise<void>;
  saveConfig: (scope: 'user' | 'role' | 'company') => Promise<void>;
  loading: boolean;
  error: Error | null;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
```

### SidebarLayout

Sol tarafta sabit sidebar içeren layout.

**Özellikler:**
- Collapsible sidebar
- Header (arama, bildirimler, dil seçici, tema toggle)
- Sidebar toggle button (ok iconları ile):
  - Normal durumda: Sola ok (sidebar'ı daraltmak için)
  - Dar durumda: Sağa ok (sidebar'ı genişletmek için)
- ContentArea (özelleştirilebilir padding/margin/width)
- Footer (opsiyonel)
- ThemeConfigurator

### TopLayout

Üstte navigasyon menüsü içeren layout.

**Özellikler:**
- Top header (logo, navigasyon, arama, kullanıcı menüsü)
- Desktop: Arama alanı header içinde
- Mobil/Tablet: Arama iconu ile header altında arama alanı
- Horizontal navigation menu (dinamik görünen menü sayısı, overflow menüsü)
- ContentArea
- Footer (opsiyonel)
- ThemeConfigurator

### MobileLayout

Mobil cihazlar için optimize edilmiş layout.

**Özellikler:**
- Hamburger menu
- Responsive header (hamburger, arama, bildirimler, dil, tema, kullanıcı menüsü)
- Arama alanı (header altında, arama iconuna tıklandığında görünür)
- Drawer menu (merkezi menü öğeleri ile, alt menü desteği)
- Bottom navigation (opsiyonel)
- Tüm header iconları tutarlı stil (aynı boyut, hover efektleri)
- Dark mode'da global dark stillerdeki gri tonları kullanır (`--bg-card-dark`, `--text-primary-dark`)

### TopNavigation

TopLayout için horizontal navigasyon menüsü.

**Özellikler:**
- Dinamik görünen menü sayısı (ekran genişliğine göre)
- ResizeObserver ile otomatik yeniden hesaplama
- Overflow menüsü ("..." butonu) - görünmeyen menü öğeleri için
- Merkezi menü kaynağı (`useMenuItems`) kullanımı
- Alt menü desteği (dropdown menüler)
- Hover ve active durumları
- Tek satır görünüm (menü öğeleri 2 satıra bölünmez)
- Dinamik overflow menü genişliği (en uzun label'a göre)
- Overflow menü scroll desteği (max-height: 400px, scrollbar sol tarafta)

**Davranış:**
- Ekran küçüldükçe görünen menü sayısı azalır
- Ekran genişledikçe görünen menü sayısı artar
- Görünmeyen menü öğeleri otomatik olarak overflow menüsüne taşınır
- Menü öğeleri her zaman tek satırda kalır (`wrap="nowrap"`, `flex-shrink: 0`)
- "..." butonu 2. satıra geçmez
- Overflow menüsü içeriğe göre otomatik genişler
- Overflow menüsü çok uzun olduğunda scroll ile görüntülenir

### ContentArea

Özelleştirilebilir içerik alanı. Padding, margin ve width ayarlarını destekler.

**Responsive:**
- Mobile, tablet ve desktop için ayrı ayarlar
- Otomatik breakpoint algılama
- PC, Tablet, Mobile için ayrı genişlik ve padding ayarları
- Maksimum genişlik ayarı (100% genişlik seçildiğinde otomatik kaldırılır)
- Otomatik ortalama (maksimum genişlik varsa ve margin ayarlanmamışsa)

### ThemeConfigurator

Tema özelleştirme paneli. Kullanıcıların layout ayarlarını değiştirmesine olanak tanır.

**Özellikler:**
- Layout tipi seçimi (Sidebar/Top)
- Tema modu (Light/Dark/Auto)
- Yön seçimi (LTR/RTL)
- Sidebar ayarları (genişlik, arka plan, renk)
- Top layout ayarları (yükseklik, scroll davranışı)
- İçerik alanı ayarları (PC, Tablet, Mobile için ayrı padding, margin, width)
  - Responsive tabs (PC, Tablet, Mobile) - sadece iconlar
  - Genişlik ayarları (px veya %)
  - Maksimum genişlik ayarı (100% genişlik seçildiğinde otomatik kaldırılır)
  - Padding ayarları (üst, sağ, alt, sol)
- Kaydetme ve sıfırlama
- Varsayılan olarak açık panel
- Sabit, sağ hizalı, yuvarlatılmış toggle button (spinning icon)

**Otomatik Renk Uyumu:**
- Arka plan rengi değiştirildiğinde, tüm içerikler (iconlar, başlıklar, menüler, scroll alanları) otomatik olarak uyumlu renklere dönüşür
- Sadece light mode için çalışır (dark mode'a dokunulmaz)
- WCAG kontrast standartlarına uygun renk hesaplama

---

## 💾 Veri Yönetimi

### Hibrit Strateji

Sistem, performans ve kullanıcı deneyimi için hibrit bir veri yönetimi stratejisi kullanır:

#### 1. LocalStorage (Instant)
- **Amaç**: Hızlı ilk render ve instant persistence
- **Kullanım**: 
  - İlk yüklemede hızlıca config'i göster
  - Değişiklikleri anında kaydet
- **Key**: `omnex-layout-config-v2`

#### 2. Database (Background Sync)
- **Amaç**: Kalıcı depolama ve çoklu cihaz senkronizasyonu
- **Kullanım**:
  - Background'da yükle ve karşılaştır
  - Debounced sync (500ms) ile kaydet
- **API Endpoint**: `/api/layout/config`

#### 3. Öncelik Sistemi (LayoutResolver)
```
User Config (en yüksek öncelik)
  ↓
Role Config
  ↓
Company Config
  ↓
Default Config (en düşük öncelik)
```

### useLayoutData Hook

Hibrit veri yönetimi hook'u.

**Özellikler:**
- LocalStorage'dan hızlı yükleme
- Database'den async yükleme
- Otomatik öncelik çözümleme
- Hata yönetimi

**Kullanım:**
```tsx
const {
  config,
  setConfig,
  loading,
  error,
  loadConfig,
  saveConfig,
} = useLayoutData({ userId, userRole, companyId });
```

### useLayoutSync Hook

Debounced database senkronizasyonu hook'u.

**Özellikler:**
- 500ms debounce (varsayılan)
- Otomatik değişiklik algılama
- Background sync
- Duplicate save önleme

**Kullanım:**
```tsx
useLayoutSync({
  config,
  scope: 'user',
  userId,
  userRole,
  companyId,
  debounceMs: 500,
  enabled: true,
});
```

---

## ⚙️ Yapılandırma

### LayoutConfig Interface

```typescript
interface LayoutConfig {
  layoutType: 'sidebar' | 'top' | 'mobile';
  themeMode: 'light' | 'dark' | 'auto';
  direction: 'ltr' | 'rtl';
  footerVisible: boolean;
  sidebar?: SidebarConfig;
  top?: TopConfig;
  mobile?: MobileConfig;
  contentArea?: ContentAreaConfig;
  layoutSource?: 'role' | 'user' | 'company' | 'default';
}
```

### SidebarConfig

```typescript
interface SidebarConfig {
  background: 'light' | 'dark' | 'brand' | 'gradient' | 'custom';
  customColor?: string;
  width: number;              // 200-320px arası
  minWidth?: number;
  maxWidth?: number;
  collapsed: boolean;
  menuColor: 'light' | 'dark' | 'auto' | 'custom';
  customMenuColor?: string;
  logoPosition?: 'top' | 'center' | 'bottom';
  logoSize?: 'small' | 'medium' | 'large';
  hoverEffects?: boolean;
}
```

### TopConfig

```typescript
interface TopConfig {
  background: 'light' | 'dark' | 'brand' | 'gradient' | 'custom';
  customColor?: string;
  height?: number;             // 48-96px arası
  scrollBehavior: 'fixed' | 'hidden' | 'hidden-on-hover';
  sticky?: boolean;
  menuColor: 'light' | 'dark' | 'auto' | 'custom';
  customMenuColor?: string;
  logoPosition?: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
}
```

### MobileConfig

```typescript
interface MobileConfig {
  headerHeight: number;        // 48-80px arası
  iconSize: number;            // 20-32px arası
  menuAnimation: 'slide' | 'fade' | 'drawer';
  bottomBarVisible: boolean;
  iconSpacing: number;
}
```

### ContentAreaConfig

```typescript
interface ContentAreaConfig {
  width: {
    value: number;
    unit: 'px' | '%';
    min?: number;
    max?: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  responsive: {
    mobile?: { width?, padding?, margin? };
    tablet?: { width?, padding?, margin? };
  };
}
```

### Varsayılan Değerler

```typescript
DEFAULT_LAYOUT_CONFIG = {
  layoutType: 'sidebar',
  themeMode: 'auto',
  direction: 'ltr',
  footerVisible: true,
  sidebar: {
    background: 'light',
    width: 260,
    minWidth: 200,
    maxWidth: 320,
    collapsed: false,
    menuColor: 'auto',
    logoPosition: 'top',
    logoSize: 'medium',
    hoverEffects: true,
  },
  top: {
    background: 'light',
    height: 64,
    scrollBehavior: 'fixed',
    sticky: true,
    logoPosition: 'left',
    logoSize: 'medium',
  },
  mobile: {
    headerHeight: 56,
    iconSize: 24,
    menuAnimation: 'drawer',
    bottomBarVisible: false,
    iconSpacing: 8,
  },
  contentArea: {
    width: { value: 100, unit: '%', min: 320, max: 1920 },
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    responsive: {
      mobile: { padding: { top: 16, right: 16, bottom: 16, left: 16 } },
      tablet: { padding: { top: 20, right: 20, bottom: 20, left: 20 } },
    },
  },
};
```

---

## 📚 API Referansı

### useLayout Hook

Layout context'ine erişim sağlar.

```tsx
const {
  currentLayout,      // 'sidebar' | 'top' | 'mobile'
  config,            // LayoutConfig
  setConfig,         // (config: LayoutConfig) => void
  applyChanges,      // (changes: Partial<LayoutConfig>) => void
  loadConfig,        // () => Promise<void>
  saveConfig,        // (scope: 'user' | 'role' | 'company') => Promise<void>
  loading,           // boolean
  error,            // Error | null
  isMobile,         // boolean
  isTablet,         // boolean
  isDesktop,        // boolean
} = useLayout();
```

### applyChanges

Kısmi config değişikliklerini anında uygular.

```tsx
// Tema değiştir
applyChanges({ themeMode: 'dark' });

// Sidebar genişliğini değiştir
applyChanges({
  sidebar: {
    ...config.sidebar,
    width: 280,
  },
});

// Birden fazla değişiklik
applyChanges({
  themeMode: 'dark',
  direction: 'rtl',
  footerVisible: false,
});
```

**Davranış:**
1. State'i anında güncelle → instant render
2. LocalStorage'a yaz → instant persistence
3. Debounced DB sync → background persistence

### saveConfig

Config'i belirtilen scope'a kaydeder.

```tsx
// Kullanıcı ayarları olarak kaydet
await saveConfig('user');

// Rol ayarları olarak kaydet
await saveConfig('role');

// Firma ayarları olarak kaydet
await saveConfig('company');
```

### LayoutResolver

Öncelik bazlı config çözümleme.

```tsx
// Tüm config'leri yükle
const configs = await LayoutResolver.loadAllConfigs({
  userId,
  userRole,
  companyId,
});

// Öncelik sırasına göre çözümle
const { config, source } = LayoutResolver.resolve({
  userId,
  userRole,
  companyId,
  ...configs,
});
```

---

## 💡 Örnekler

### Tema Değiştirme

```tsx
function ThemeToggle() {
  const { config, applyChanges } = useLayout();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const handleToggle = () => {
    const newTheme = config.themeMode === 'dark' ? 'light' : 'dark';
    applyChanges({ themeMode: newTheme });
    setColorScheme(newTheme);
  };

  return (
    <button onClick={handleToggle}>
      {config.themeMode === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### Sidebar Genişliğini Ayarlama

```tsx
function SidebarWidthSlider() {
  const { config, applyChanges } = useLayout();

  return (
    <input
      type="range"
      min={200}
      max={320}
      value={config.sidebar?.width || 260}
      onChange={(e) => {
        applyChanges({
          sidebar: {
            ...config.sidebar,
            width: parseInt(e.target.value),
          },
        });
      }}
    />
  );
}
```

### Layout Tipini Değiştirme

```tsx
function LayoutSwitcher() {
  const { config, applyChanges, isMobile } = useLayout();

  if (isMobile) {
    return null; // Mobile'da layout değiştirilemez
  }

  return (
    <div>
      <button
        onClick={() => applyChanges({ layoutType: 'sidebar' })}
        disabled={config.layoutType === 'sidebar'}
      >
        Sidebar
      </button>
      <button
        onClick={() => applyChanges({ layoutType: 'top' })}
        disabled={config.layoutType === 'top'}
      >
        Top
      </button>
    </div>
  );
}
```

### Responsive İçerik Alanı

```tsx
function MyPage() {
  const { config, isMobile, isTablet } = useLayout();

  // ContentArea otomatik olarak responsive ayarları uygular
  return (
    <div>
      <h1>My Page</h1>
      <p>Current device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
      <p>Content padding: {config.contentArea?.padding.top}px</p>
    </div>
  );
}
```

### Custom Layout Config

```tsx
function CustomLayoutSetup() {
  const { applyChanges, saveConfig } = useLayout();

  const setupCustomLayout = async () => {
    // Özel layout yapılandırması
    applyChanges({
      layoutType: 'sidebar',
      themeMode: 'dark',
      direction: 'ltr',
      sidebar: {
        background: 'custom',
        customColor: '#1a1a1a',
        width: 280,
        collapsed: false,
        menuColor: 'custom',
        customMenuColor: '#4a9eff',
      },
      contentArea: {
        width: { value: 90, unit: '%', min: 800, max: 1400 },
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      },
    });

    // Kullanıcı ayarları olarak kaydet
    await saveConfig('user');
  };

  return <button onClick={setupCustomLayout}>Apply Custom Layout</button>;
}
```

---

## 🔧 Geliştirme Notları

### Breakpoints

```typescript
BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
}
```

### LocalStorage Keys

```typescript
STORAGE_KEYS = {
  layoutConfig: 'omnex-layout-config-v2',
  layoutConfigTimestamp: 'omnex-layout-config-timestamp',
}
```

### API Endpoints

**GET** `/api/layout/config?scope=user&userId={userId}`
- Kullanıcı config'ini getirir

**GET** `/api/layout/config?scope=role&role={role}`
- Rol config'ini getirir

**GET** `/api/layout/config?scope=company&companyId={companyId}`
- Firma config'ini getirir

**POST** `/api/layout/config`
```json
{
  "config": LayoutConfig,
  "scope": "user" | "role" | "company",
  "userId": string,
  "role": string,
  "companyId": string
}
```

---

## 🎨 Tema ve Stil

### Otomatik Renk Uyumu

Sistem, arka plan rengi değiştirildiğinde otomatik olarak uyumlu text ve icon renkleri hesaplar. Bu özellik **sadece light mode** için çalışır ve dark mode'a dokunmaz.

#### Nasıl Çalışır?

1. **Arka Plan Analizi**: Arka plan renginin açık/koyu olup olmadığı WCAG luminance hesaplaması ile belirlenir
2. **Kontrast Hesaplama**: Arka plan rengine göre en iyi kontrasta sahip text/icon rengi hesaplanır
3. **Otomatik Uygulama**: Tüm içerikler (logo, başlıklar, menüler, iconlar, scroll alanları) otomatik olarak güncellenir

#### Desteklenen Bileşenler

**Sidebar:**
- Logo icon arka planı ve rengi
- Logo başlık ve alt başlık rengi
- Menü linkleri (normal, hover, active)
- Menü alt öğeleri (nested submenu items)
- Collapse icon rengi (ActionIcon)
- Scroll alanı renkleri
- Scrollbar renkleri (thumb, track, corner)
- Sidebar border (kenar çizgisi)
- Collapsed durumunda icon kutuları (kare, ortalanmış)
- Collapsed durumunda ince scrollbar

**Top Header:**
- Logo başlık rengi
- Navigasyon menü linkleri (normal, hover, active)
- Navigasyon menü iconları (ModuleIcon'lar)
- Arama çubuğu arka planı ve rengi
- Arama icon rengi (IconSearch)
- Arama kutusu placeholder rengi (otomatik kontrast hesaplama)
- NotificationBell icon rengi (IconBell, normal ve hover)
- LanguageSelector icon rengi (IconWorld, normal ve hover)
- Action button'lar (tema toggle - IconSun/IconMoon)
- ActionIcon'lar (layout switch - IconLayoutSidebar, kutu rengi, icon rengi, hover durumu)
- More button (overflow menü butonu, normal ve hover)
- Menu dropdown iconları (user menu ve overflow menu içindeki iconlar)
- Tüm iconların varsayılan, hover ve active durumları
- Hover efektleri (transform, box-shadow ile daha belirgin)

#### Kullanım

```tsx
// Arka plan rengi değiştirildiğinde otomatik çalışır
applyChanges({
  sidebar: {
    ...config.sidebar,
    background: 'custom',
    customColor: '#1a1a1a', // Koyu renk
    // Tüm içerikler otomatik olarak açık renklere dönüşür
  },
});
```

#### Color Utilities

`colorUtils.ts` dosyası aşağıdaki fonksiyonları sağlar:

```typescript
// Arka plan rengine göre text rengi
getContrastTextColor(backgroundColor: string): string

// Arka plan rengine göre icon rengi
getContrastIconColor(backgroundColor: string): string

// Hover arka plan rengi
getHoverBackgroundColor(backgroundColor: string, isDark: boolean): string

// Active arka plan rengi
getActiveBackgroundColor(backgroundColor: string, isDark: boolean): string

// Border rengi
getContrastBorderColor(backgroundColor: string, isDark: boolean): string

// Placeholder rengi (arama kutusu için)
getPlaceholderColor(backgroundColor: string, isDark: boolean): string

// Arka plan renginin koyu olup olmadığını kontrol et
isDarkBackground(backgroundColor: string): boolean

// Background type'a göre gerçek renk kodunu al
getBackgroundColor(backgroundType: BackgroundType, customColor?: string): string
```

#### Önemli Notlar

- ⚠️ **Sadece Light Mode**: Bu özellik sadece light mode için çalışır. Dark mode'da varsayılan stiller korunur.
- ⚠️ **Mobile'a Dokunulmaz**: Mobile layout'ta bu özellik aktif değildir.
- ⚠️ **Layout Bağımsız**: Hangi layout aktifse (Sidebar veya Top), sadece o layout'un renkleri güncellenir.
- ✅ **WCAG Uyumlu**: Tüm renk hesaplamaları WCAG kontrast standartlarına uygundur.
- ✅ **Instant Apply**: Renk değişiklikleri anında uygulanır, sayfa yenileme gerekmez.
- ✅ **Menü Alanı Uyumu**: Sidebar menü alanı arka planı, ana sidebar arka planı ile aynı renkte olur (light mode'da).

---

## 🎨 Tema ve Stil

### Dark Mode Renkleri (Google Dark Theme)

Sistem, Google'ın dark theme renk paletini kullanır:

- **Primary Background**: `#202124` (koyu gri)
- **Secondary Background**: `#303134` (orta gri)
- **Card/Surface**: `#303134` (orta gri)
- **Tertiary**: `#3c4043` (açık gri)
- **Text Primary**: `#e8eaed` (açık gri)
- **Text Secondary**: `#9aa0a6` (orta gri)
- **Border**: `#5f6368` (gri)

### CSS Variables

Tüm renkler CSS custom properties olarak tanımlanır:

```css
[data-mantine-color-scheme="dark"] {
  --bg-primary-dark: #202124;
  --bg-secondary-dark: #303134;
  --bg-card-dark: #303134;
  --bg-tertiary-dark: #3c4043;
  --bg-surface-dark: #303134;
  --text-primary-dark: #e8eaed;
  --text-secondary-dark: #9aa0a6;
  --border-color-dark: #5f6368;
}
```

### Dark Mode Koruması

Dark mode'da tüm bileşenler `!important` ile korunur ve otomatik renk hesaplaması dark mode'u etkilemez:

- ✅ **Sidebar**: Tüm elementler (logo, menü, scroll alanı, iconlar) dark mode stillerini kullanır
- ✅ **Top Header**: Tüm elementler (logo, arama, iconlar, navigasyon) dark mode stillerini kullanır
- ✅ **SidebarLayout Header**: Tüm iconlar ve arama kutusu dark mode stillerini kullanır
- ✅ **TopLayout Header**: Tüm iconlar ve arama kutusu dark mode stillerini kullanır
- ✅ **ContentArea**: İçerik alanı dark mode stillerini kullanır
- ✅ **MobileLayout**: Mobile layout dark mode stillerini kullanır (global dark stillerdeki gri tonlar: `--bg-card-dark: #303134`, `--text-primary-dark: #e8eaed`)

**Önemli**: Light mode'da tema özelleştirmeleri ile arka plan rengi değiştirildiğinde, dark mode'a hiçbir şekilde dokunulmaz. Dark mode her zaman global dark stillerini kullanır.

---

## 🐛 Sorun Giderme

### Config Yüklenmiyor

1. LocalStorage'ı kontrol edin: `localStorage.getItem('omnex-layout-config-v2')`
2. API endpoint'lerinin çalıştığından emin olun
3. Browser console'da hata mesajlarını kontrol edin

### Değişiklikler Uygulanmıyor

1. `applyChanges` fonksiyonunun doğru çağrıldığından emin olun
2. Config'in doğru formatta olduğunu kontrol edin
3. LocalStorage'a yazıldığını doğrulayın

### Database Sync Çalışmıyor

1. `useLayoutSync` hook'unun `enabled: true` olduğundan emin olun
2. `userId`'nin mevcut olduğunu kontrol edin
3. API endpoint'inin doğru çalıştığını test edin

---

## 📝 Changelog

### v2.4.0
- ✅ **Mobile Menü Dark Mode**: Mobile menü dark mode'da global dark stillerdeki gri tonları kullanıyor
  - Arka plan: `--bg-card-dark: #303134` (gri ton)
  - Hover: `--bg-secondary-dark: #3c4043` (gri ton)
  - Metin: `--text-primary-dark: #e8eaed`
  - Border: `--border-color-dark: #5f6368`
  - Drawer body, ScrollArea ve tüm padding alanları gri tonlarda
- ✅ **Top Navigation Menü İyileştirmeleri**:
  - Dinamik görünen menü sayısı hesaplaması iyileştirildi (daha doğru genişlik tahmini)
  - Menü öğeleri tek satırda kalıyor (`wrap="nowrap"`, `flex-shrink: 0`)
  - "..." butonu 2. satıra geçmiyor
  - Overflow menüsü dinamik genişlik (en uzun label'a göre)
  - Overflow menüsü scroll desteği (max-height: 400px, scrollbar sol tarafta)
  - Menü öğeleri tek satırda görünüyor (`white-space: nowrap`)
- ✅ **ModuleIcon Güncellemesi**: React component desteği eklendi
  - Artık hem string hem React component kabul ediyor
  - Component geçildiğinde direkt render ediliyor
  - String geçildiğinde mevcut dinamik yükleme mantığı kullanılıyor

### v2.3.0
- ✅ **Mobil ve Tablet Arama Desteği**: Mobil ve tablet cihazlarda arama iconuna tıklandığında header altında arama alanı gösteriliyor
  - MobileLayout: Header altında slide-down animasyonlu arama alanı
  - TopLayout: Mobil ve tablet için arama iconu, desktop için arama alanı header içinde
  - Arama alanı otomatik focus alıyor
  - Arama açıkken icon aktif görünüyor
- ✅ **Mobil Header Icon Standardizasyonu**: Tüm mobil header iconları aynı stile sahip
  - Aynı boyut (44x44px)
  - Aynı hover efektleri
  - Açık/koyu modda tutarlı görünüm
  - NotificationBell ve LanguageSelector iconları da aynı stile uyumlu
- ✅ **TopLayout Dinamik Menü**: TopLayout navigasyon menüsü ekrana göre dinamik olarak görünen menü sayısını ayarlıyor
  - Ekran küçüldükçe görünen menü sayısı azalır
  - Ekran genişledikçe görünen menü sayısı artar
  - Görünmeyen menü öğeleri "..." overflow menüsüne taşınıyor
  - ResizeObserver ile otomatik yeniden hesaplama
- ✅ **MobileMenu Merkezi Menü Entegrasyonu**: MobileMenu artık merkezi menü öğelerini (`useMenuItems`) kullanıyor
  - Alt menü desteği (Collapse ile)
  - Chevron iconları ile alt menü toggle
  - Merkezi menü sistemi ile tutarlılık

### v2.2.0
- ✅ **Layout Sistemi Devreye Alındı**: `layouts-v2` klasörü `layouts` olarak yeniden adlandırıldı ve sistem layout yolu güncellendi
- ✅ **Merkezi Menü Sistemi**: Eski sidebar menüleri (`layouts-orj`) merkezi menü sistemine (`useMenuItems`) eklendi
- ✅ **Demo Menüler Kaldırıldı**: Test amaçlı demo menüler kaldırıldı, gerçek menü öğeleri eklendi
- ✅ **Top Layout Menü Boşlukları**: Menü öğeleri arasındaki boşluklar azaltıldı (2 satır sorunu çözüldü)
  - Group gap: `xs` → `4px`
  - Navigation gap: `0.5rem` → `0.25rem`
  - NavLink padding: `0.5rem 1rem` → `0.375rem 0.75rem`
  - Font size: `0.875rem` → `0.8125rem`
- ✅ **Icon Formatı Düzeltildi**: Icon isimleri "Icon" prefix'i olmadan kullanılıyor (ModuleIcon otomatik ekliyor)
- ✅ **ModuleIcon Güncellendi**: `iconName` prop desteği eklendi (geriye dönük uyumluluk için)
- ✅ **Hydration Hatası Düzeltildi**: Server/client render uyumsuzluğu giderildi
  - `mounted` state eklendi (server-side'da false, client-side'da true)
  - Inline style'lar sadece client-side'da uygulanıyor
  - Auto mode'da tarayıcı tercihine göre dark/light moda geçiyor
- ✅ **Auto Mode Düzeltildi**: Auto mode'da tarayıcı tercihine göre dark/light moda geçiyor, kendi özel stilleri yok
- ✅ **Tema Özelleştirici Güncellendi**:
  - Panel genişliği: `360px` → `300px`
  - Özel renk seçenekleri eklendi (renk paleti - 17 renk)
  - Padding grubu 2 sütun 2 satır düzenine alındı
- ✅ **Alt Menü Renk Uyumu**: Top layout alt menüleri TopLayout arka planına göre otomatik renk uyumu
  - Gradyan tercihinde alt menü arka planı beyaz
  - Hover ve border renkleri TopLayout arka planına göre hesaplanıyor

### v2.1.2
- ✅ **Icon Standardizasyonu**: Tüm header iconları (TopHeader ve SidebarLayout) aynı merkezi stili kullanıyor
- ✅ **Dark Mode Icon Kutuları Kaldırıldı**: Dark mode'da tüm iconlar transparent arka plan ve border kullanıyor (kutu şekli yok)
- ✅ **Sidebar Toggle Icon Güncellendi**: Hamburger menü iconu (IconMenu2) yerine ok iconları kullanılıyor
  - Normal durumda (sidebar açık): Sola ok (IconChevronLeft) - sidebar'ı daraltmak için
  - Dar durumda (sidebar collapsed): Sağa ok (IconChevronRight) - sidebar'ı genişletmek için
- ✅ **expandSidebarButton Sadeleştirildi**: Kutu stilleri kaldırıldı, sadece icon rengi ve hover efekti kaldı
- ✅ **mobileMenuButton Kaldırıldı**: Artık tek button (expandSidebarButton) hem açık hem dar durumda kullanılıyor
- ✅ **Merkezi Icon Stili**: TopHeader ve SidebarLayout'da tüm iconlar için ortak stil tanımları
  - Light mode: Transparent arka plan ve border
  - Dark mode: Transparent arka plan ve border (kutu şekli yok)
  - Hover: Transform ve box-shadow efekti

### v2.1.1
- ✅ **Dark Mode Koruması**: Tüm bileşenlere dark mode için `!important` eklendi
- ✅ **Menü Alanı Uyumu**: Sidebar menü alanı arka planı artık ana sidebar ile aynı renkte (light mode'da)
- ✅ **Top Header Search**: Dark mode'da search input metni ve placeholder renkleri düzeltildi
- ✅ **Layout Icon**: Dark mode'da layout switch iconu düzeltildi (ActionIcon inline style override)
- ✅ **İçerik Alanı**: Dark mode'da içerik alanlarına `!important` eklendi
- ✅ **Mobile Layout**: Dark mode'da mobile layout stillerine `!important` eklendi

### v2.1.0
- ✅ **Otomatik Renk Uyumu**: Arka plan rengine göre otomatik text/icon renk hesaplama
- ✅ **Color Utilities**: WCAG uyumlu kontrast hesaplama fonksiyonları
- ✅ **Light Mode Only**: Otomatik renk uyumu sadece light mode için çalışır
- ✅ **Layout Bağımsız**: Sidebar ve Top header için ayrı ayrı renk yönetimi
- ✅ **Scrollbar Desteği**: Scrollbar renkleri otomatik uyumlu (thumb, track, corner)
- ✅ **Border Desteği**: Sidebar border renkleri otomatik uyumlu
- ✅ **ActionIcon Desteği**: ActionIcon'ların kutu, icon ve hover renkleri otomatik uyumlu
- ✅ **Nested Menu Desteği**: Alt menü öğelerinin renkleri otomatik uyumlu
- ✅ **Collapsed Sidebar**: Daraltılmış sidebar'da icon kutuları kare ve ortalanmış
- ✅ **Collapsed Scrollbar**: Daraltılmış sidebar'da scrollbar inceltilmiş (4px)
- ✅ **Top Header Icon Desteği**: Top header'daki tüm iconlar otomatik renk uyumuna dahil
  - Search icon (IconSearch)
  - NotificationBell icon (IconBell) - Normal button yapısına dönüştürüldü
  - LanguageSelector icon (IconWorld)
  - Layout switch icon (IconLayoutSidebar)
  - Theme toggle icon (IconSun/IconMoon)
  - Navigation menu iconları (ModuleIcon'lar)
  - More button ve overflow menu iconları
  - User menu dropdown iconları (IconUser, IconSettings, IconLogout)
- ✅ **Placeholder Renk Desteği**: Arama kutusu placeholder rengi otomatik kontrast hesaplama ile uyumlu
- ✅ **Geliştirilmiş Hover Efektleri**: Tüm iconlarda hover durumunda transform ve box-shadow efektleri (daha belirgin görünüm)
- ✅ **Hover Opacity İyileştirmesi**: Hover arka plan renklerinin opacity değerleri artırıldı (0.1 → 0.15 açık, 0.15 → 0.2 koyu)

### v2.0.0
- ✅ Hibrit veri yönetimi (LocalStorage + Database)
- ✅ Instant apply + debounced sync
- ✅ Öncelik bazlı config çözümleme (User > Role > Company > Default)
- ✅ Google Dark Theme renk paleti
- ✅ Responsive breakpoint algılama
- ✅ ThemeConfigurator ile görsel özelleştirme
- ✅ RTL/LTR desteği
- ✅ 3 layout tipi (Sidebar, Top, Mobile)

---

## 📞 Destek

Sorularınız veya önerileriniz için:
- GitHub Issues
- İç dokümantasyon
- Geliştirici ekibi

---

## 🎯 Menü Sistemi

### Merkezi Menü Kaynağı

Sistem, `useMenuItems` hook'u ile merkezi bir menü yönetimi sağlar. Bu hook, Sidebar, TopNavigation ve MobileMenu için aynı menü verisini sağlar.

**Özellikler:**
- ✅ **Merkezi Yönetim**: Tüm menü öğeleri tek bir yerden yönetilir
- ✅ **Otomatik Sıralama**: Menü öğeleri `order` değerine göre sıralanır
- ✅ **Alt Menü Desteği**: Nested menu items desteği
- ✅ **Module Entegrasyonu**: Aktif modüller otomatik olarak menüye eklenir
- ✅ **Icon Desteği**: ModuleIcon ile dinamik icon yükleme
- ✅ **Layout Bağımsız**: Sidebar, TopNavigation ve MobileMenu aynı menü kaynağını kullanır

**Menü Yapısı:**

```typescript
interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<any> | string;  // React component veya icon ismi
  order: number;
  children?: MenuItem[]; // Alt menü öğeleri
}
```

**Not:** Icon artık hem React component hem string olabilir. Component geçildiğinde direkt render edilir, string geçildiğinde ModuleIcon ile dinamik yüklenir.

**Kullanım:**

```tsx
import { useMenuItems } from '@/components/layouts/hooks/useMenuItems';

function MyComponent() {
  const menuItems = useMenuItems();
  
  return (
    <nav>
      {menuItems.map((item) => (
        <Link href={item.href} key={item.href}>
          <ModuleIcon iconName={item.icon} size={20} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

**Layout Entegrasyonu:**

- **Sidebar**: Merkezi menü öğelerini sidebar'da gösterir, alt menüler collapse ile açılır/kapanır
- **TopNavigation**: Merkezi menü öğelerini horizontal menüde gösterir, ekrana göre dinamik görünen menü sayısı, overflow menüsü
- **MobileMenu**: Merkezi menü öğelerini drawer menüde gösterir, alt menüler collapse ile açılır/kapanır, chevron iconları ile toggle

**Mevcut Menü Öğeleri:**

**Core Menüler:**
- Dashboard (Genel Bakış, Analizler, Raporlar)
- Kullanıcılar (Kullanıcılar, Roller, İzinler)
- Bildirimler
- Takvim
- Dosya Yöneticisi
- AI Modülü (Metin, Görsel, Kod, Ses, Video Oluşturucu)
- Raporlar (Ana Sayfa, Tüm Sayfalar)
- Sohbet Modülü

**Modül Menüleri:**
- Vardiya Modülü
- Randevu Modülü
- Eğitim Modülü
- Belgeler ve İmza Modülü
- Ürün Modülü
- Üretim Modülü
- Müşteri Modülü
- Tedarikçi Modülü
- Muhasebe Modülü
- İnsan Kaynakları Modülü
- Bakım Modülü
- Web Sayfa Modülü
- Modül Yönetimi (Modül Listesi, Yeni Modül Yükle)
- Ayarlar ve Markalama (Lokasyonlar)
- Support

**Aktif Modüller:**
- Context'ten gelen aktif modüller otomatik olarak menüye eklenir
- Sıralama: Core → Module → Active Modules

---

**Son Güncelleme**: 2024

