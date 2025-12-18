# Layout & Navigation Architecture

## Overview

Bu doküman OMNEX SaaS Platform için layout ve navigasyon mimarisini tanımlar.

## Mimari Yapı

```
┌─────────────────────────────────────────────────────────────────┐
│                        LayoutProvider                            │
│    (Context: config, theme, responsive breakpoints)              │
├─────────────────────────────────────────────────────────────────┤
│                        LayoutWrapper                             │
│         (Layout türüne göre doğru layout'u seçer)                │
├────────────────┬────────────────┬───────────────────────────────┤
│   TopLayout    │  SidebarLayout │      MobileLayout             │
│   (top header) │  (sol menü)    │   (mobil responsive)          │
└────────────────┴────────────────┴───────────────────────────────┘
```

---

## Dosya Yapısı

```
src/components/layouts/
├── LayoutWrapper.tsx          # Ana layout switch
├── core/
│   ├── LayoutConfig.ts        # Layout yapılandırma tipleri
│   ├── LayoutProvider.tsx     # Context provider
│   └── LayoutResolver.tsx     # Config çözümleme
├── hooks/
│   ├── useMenuItems.ts        # Merkezi menü hook'u
│   ├── useLayoutData.ts       # Layout veri yönetimi
│   └── useLayoutSync.ts       # DB senkronizasyon
├── shared/
│   ├── ContentArea.tsx        # İçerik alanı
│   ├── Footer.tsx             # Footer component
│   └── colorUtils.ts          # Renk hesaplama utilities
├── top/
│   ├── TopLayout.tsx          # Top layout container
│   ├── TopHeader.tsx          # Top header (logo, user menu)
│   ├── TopNavigation.tsx      # Yatay navigasyon menüsü
│   └── TopNavigation.module.css
├── sidebar/
│   ├── SidebarLayout.tsx      # Sidebar layout container
│   ├── Sidebar.tsx            # Sol menü component
│   └── Sidebar.module.css
├── mobile/
│   ├── MobileLayout.tsx       # Mobil layout
│   ├── MobileHeader.tsx       # Mobil header
│   └── MobileMenu.tsx         # Mobil menü (drawer)
└── configurator/
    └── ThemeConfigurator.tsx  # Tema ayarları paneli
```

---

## Layout Türleri

### 1. TopLayout (Yatay Menü)

```
┌─────────────────────────────────────────────────────────────────┐
│ Logo │ Dashboard │ Emlak │ Muhasebe │ ... │ ●●● │  User Menu    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        Content Area                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Bileşenler:**
- `TopHeader.tsx` - Logo, user menu, ayarlar
- `TopNavigation.tsx` - Yatay navigasyon menüsü
- Overflow menü (●●●) - Sığmayan menü öğeleri

**Özellikler:**
- Responsive genişlik hesaplama
- Hover ile dropdown alt menüler
- Soft navigation (router.push)
- Kontrollü menü state

### 2. SidebarLayout (Dikey Menü)

```
┌──────────┬──────────────────────────────────────────────────────┐
│  Logo    │                    Header                             │
├──────────┤──────────────────────────────────────────────────────┤
│          │                                                       │
│ Dashboard│                                                       │
│ Emlak    │                  Content Area                         │
│ Muhasebe │                                                       │
│ ...      │                                                       │
│          │                                                       │
│ [◀]      │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

**Bileşenler:**
- `Sidebar.tsx` - Sol menü (collapse/expand)
- `SidebarLayout.tsx` - Layout container

**Özellikler:**
- Collapse/Expand toggle
- Accordion alt menüler
- Next.js Link (soft navigation)
- Scroll area

### 3. MobileLayout

```
┌─────────────────────────────────────────┐
│ [☰]        Logo           [User]        │
├─────────────────────────────────────────┤
│                                         │
│              Content Area               │
│                                         │
└─────────────────────────────────────────┘

     Drawer Menu (☰ tıklandığında)
┌─────────────────────────────────────────┐
│ Dashboard                               │
│ Emlak                                   │
│   ├─ Properties                         │
│   ├─ Apartments                         │
│   └─ ...                                │
│ Muhasebe                                │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## Menü Sistemi (useMenuItems)

### Veri Akışı

```
┌─────────────────────────────────────────────────────────────────┐
│                        useMenuItems()                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User Role Kontrolü (SuperAdmin/Admin/User)                   │
│  2. Default Menus (role bazlı)                                   │
│  3. Active Modules (ModuleContext'ten)                           │
│  4. Managed Menus (API: /api/menu-resolver/{location})           │
│  5. Available Pages (API: /api/menu-management/available-pages)  │
├─────────────────────────────────────────────────────────────────┤
│                    Merge & Filter & Sort                         │
├─────────────────────────────────────────────────────────────────┤
│                      MenuItem[] output                           │
└─────────────────────────────────────────────────────────────────┘
```

### MenuItem Interface

```typescript
interface MenuItem {
  id?: string;                  // Benzersiz ID
  label: string;                // Görünen metin
  href: string;                 // Navigasyon path'i
  icon: ComponentType;          // Tabler icon component
  order: number;                // Sıralama
  children?: MenuItem[];        // Alt menü öğeleri
  group?: string;               // Grup adı (divider için)
  moduleSlug?: string;          // Modül takibi için
}
```

### Menü Grupları

| Grup | Açıklama | Görünürlük |
|------|----------|------------|
| (boş) | Dashboard, ana sayfalar | Herkes |
| `Firma Yönetimi` | Kullanıcılar, Roller, Ayarlar | Admin+ |
| `Super Admin` | Lisans, Companies | SuperAdmin |
| `module` | Modül menüleri | Modül aktifse |

### Location Parametresi

```typescript
useMenuItems('sidebar')  // Sidebar için menüler
useMenuItems('top')      // Top navigation için menüler
```

---

## Navigasyon Stratejisi

### Soft Navigation (Önerilen)

```typescript
// TopNavigation.tsx
const router = useRouter();

const navigateTo = useCallback((href: string) => {
  setMenuOpened(false);  // Menüyü kapat
  router.push(href);     // Soft navigation
}, [router]);
```

### Next.js Link

```typescript
// Sidebar.tsx
<NavLink
  component={Link}
  href={getHref(item.href)}
  active={isActive}
/>
```

### YANLIŞ: window.location.href

```typescript
// ❌ KULLANMAYIN - Full page reload yapar
window.location.href = href;
```

---

## Theme & Config Sistemi

### LayoutConfig

```typescript
interface LayoutConfig {
  layoutType: 'top' | 'sidebar';
  themeMode: 'light' | 'dark' | 'auto';
  direction: 'ltr' | 'rtl';
  layoutSource: 'default' | 'user' | 'role' | 'company';

  sidebar?: {
    width: number;
    background: 'light' | 'dark' | 'gradient' | 'custom';
    customColor?: string;
  };

  top?: {
    height: number;
    background: 'light' | 'dark' | 'gradient' | 'custom';
    customColor?: string;
  };

  contentArea?: {
    maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    padding: { top, right, bottom, left };
  };
}
```

### Config Yükleme Sırası

```
1. localStorage (instant render)
2. API/DB (background load)
3. LayoutResolver (merge & resolve)
```

### Config Kaydetme

```typescript
const { applyChanges, saveConfig } = useLayout();

// Anlık uygulama (localStorage + state)
applyChanges({ themeMode: 'dark' });

// DB'ye kaydetme
await saveConfig('user');
```

---

## Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
};
```

### Kullanım

```typescript
const { isMobile, isTablet, isDesktop } = useLayout();

// veya
const currentLayout = isMobile ? 'mobile' : config.layoutType;
```

---

## Overflow Menü (TopNavigation)

### Nasıl Çalışır?

1. `ResizeObserver` ile navigation genişliği izlenir
2. Her menü öğesinin genişliği hesaplanır
3. Sığmayan öğeler `overflowItems` array'ine alınır
4. `●●●` butonu ile dropdown menü gösterilir

```typescript
// Visible ve overflow items
const visibleItems = allMenuItems.slice(0, visibleCount);
const overflowItems = allMenuItems.slice(visibleCount);
```

### Kontrollü Menü State

```typescript
const [menuOpened, setMenuOpened] = useState(false);

<Menu
  opened={menuOpened}
  onChange={setMenuOpened}
>
```

---

## Best Practices

### 1. Menü Öğesi Ekleme

```typescript
// default-menus.config.ts veya menu-management API
{
  id: 'my-menu',
  label: { tr: 'Menüm', en: 'My Menu' },
  href: '/my-path',
  icon: 'Dashboard',
  order: 10,
  group: 'module',
}
```

### 2. Alt Menü Ekleme

```typescript
{
  id: 'parent-menu',
  label: 'Ana Menü',
  href: '/parent',
  icon: 'Folder',
  order: 10,
  children: [
    {
      id: 'child-1',
      label: 'Alt Menü 1',
      href: '/parent/child-1',
      icon: 'File',
      order: 1,
    },
  ],
}
```

### 3. Dinamik Rotaları Filtreleme

```typescript
// useMenuItems.ts - otomatik filtreleme
const hasDynamicRoute = (href: string) => {
  if (/\[.*\]/.test(href)) return true;       // [id], [slug]
  if (href.includes('/create')) return true;  // create sayfaları
  if (href.includes('/edit')) return true;    // edit sayfaları
  return false;
};
```

---

## Troubleshooting

### Sayfa Yenileniyor (Full Reload)

**Sorun:** Top menüden tıklayınca sayfa yenileniyor
**Çözüm:** `window.location.href` yerine `router.push()` kullanın

### Menü Kapanmıyor

**Sorun:** Menü öğesine tıklayınca menü açık kalıyor
**Çözüm:** `closeOnItemClick` kaldırın veya kontrollü state kullanın

### Alt Menü Tıklanamıyor

**Sorun:** Overflow menüsünde alt menü öğeleri çalışmıyor
**Çözüm:** `onClick` handler'da `navigateTo()` kullanın

---

## İlgili Dosyalar

- `src/components/layouts/top/TopNavigation.tsx`
- `src/components/layouts/sidebar/Sidebar.tsx`
- `src/components/layouts/hooks/useMenuItems.ts`
- `src/components/layouts/core/LayoutProvider.tsx`
- `src/config/default-menus.config.ts`
