# Icon Sistemi Dokümantasyonu

## Genel Bakış

Omnex Core Platform'da ikonlar için Tabler Icons kütüphanesi kullanılmaktadır. Sistem, hem modül ikonlarını hem de menü öğesi ikonlarını destekler.

## Bileşenler

### 1. ModuleIcon (`src/lib/modules/icon-loader.tsx`)

Tabler icon adını alıp ilgili ikonu render eden bileşen.

```tsx
import { ModuleIcon } from '@/lib/modules/icon-loader';

// Kullanım
<ModuleIcon icon="Building" size={24} />
<ModuleIcon icon="Dashboard" size={32} />
```

**Özellikler:**
- `icon`: String olarak ikon adı (örn: "Building", "Dashboard", "Apps")
- `size`: İkon boyutu (piksel)
- `fallback`: İkon bulunamazsa gösterilecek alternatif (opsiyonel)

**Desteklenen Format:**
- `"Building"` → `IconBuilding`
- `"IconBuilding"` → `IconBuilding`
- `"building"` → `IconBuilding` (case-insensitive)

### 2. IconPicker (`src/components/common/IconPicker.tsx`)

Kullanıcının 5000+ Tabler ikonundan seçim yapmasını sağlayan modal bileşen.

```tsx
import { IconPicker } from '@/components/common/IconPicker';

<IconPicker
  value={selectedIcon}
  onChange={(iconName) => setSelectedIcon(iconName)}
  opened={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Özellikler:**
- Kategorilere göre filtreleme (Navigation, Communication, Business, vb.)
- Arama özelliği
- Popüler ikonlar öncelikli sıralama
- ForwardRef component desteği (Tabler v3+)

### 3. IconPickerButton (`src/components/common/IconPicker.tsx`)

IconPicker'ı tetikleyen buton bileşeni.

```tsx
import { IconPickerButton } from '@/components/common/IconPicker';

<IconPickerButton
  value={icon}
  onChange={setIcon}
  label="İkon Seç"
  placeholder="İkon seçin..."
/>
```

## API Endpoints

### PUT `/api/modules/[slug]/icon`

Modül ikonunu günceller (Tabler icon adı olarak).

**Request:**
```json
{
  "icon": "Building"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "icon": "Building" },
  "message": "Module icon updated successfully"
}
```

**İşlem:**
1. `module.config.yaml` dosyasını okur
2. `icon` alanını günceller
3. Dosyayı yeniden yazar

### POST `/api/modules/[slug]/icon`

Özel ikon dosyası yükler (PNG, JPG, SVG, WebP).

**Request:** FormData
- `icon`: File (max 2MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/modules/real-estate/icon-1702654321.png",
    "fileName": "icon-1702654321.png"
  }
}
```

## Dosya Yapısı

```
src/
├── lib/modules/
│   └── icon-loader.tsx          # ModuleIcon bileşeni
├── components/common/
│   └── IconPicker.tsx           # IconPicker ve IconPickerButton
├── modules/
│   └── [module-slug]/
│       └── module.config.yaml   # icon: "Building" alanı
└── app/api/modules/[slug]/
    └── icon/
        └── route.ts             # PUT ve POST endpoints
```

## module.config.yaml İkon Tanımı

```yaml
name: Real Estate
slug: real-estate
version: 1.0.0
icon: Building              # Tabler icon adı
# veya
icon: /uploads/modules/real-estate/custom-icon.png  # Özel dosya yolu
```

## Menü Öğelerinde İkon Kullanımı

### useMenuItems Hook (`src/components/layouts/hooks/useMenuItems.ts`)

`iconMap` objesi string ikon adlarını React component'lerine map eder:

```typescript
const iconMap: Record<string, React.ComponentType> = {
  Dashboard: IconDashboard,
  Building: IconBuilding,
  Users: IconUsers,
  Settings: IconSettings,
  // ... 50+ ikon
};
```

### Menü Tanımında İkon

```typescript
{
  label: "Dashboard",
  href: "/dashboard",
  icon: "Dashboard",  // String olarak
  order: 1
}
```

## Event Sistemi

### modules-updated Event

Modül ikonu değiştiğinde tetiklenir:

```typescript
// Tetikleme
window.dispatchEvent(new CustomEvent('modules-updated'));

// Dinleme (ModuleContext'te)
window.addEventListener('modules-updated', handleModulesUpdated);
```

### menu-updated Event

Menü değiştiğinde sidebar'ı güncellemek için:

```typescript
window.dispatchEvent(new CustomEvent('menu-updated'));
```

## ForwardRef Component Desteği

Tabler Icons v3+ forwardRef kullanır. Bileşen tespiti:

```typescript
// Eski yöntem (çalışmaz)
typeof icon === 'function'

// Yeni yöntem
typeof icon === 'function' ||
(typeof icon === 'object' && icon !== null && '$$typeof' in icon)
```

## Kategoriler (IconPicker)

```typescript
const ICON_CATEGORIES = {
  'Navigation': ['Home', 'Menu', 'Arrow', 'Chevron', ...],
  'Communication': ['Mail', 'Message', 'Phone', 'Chat', ...],
  'Business': ['Briefcase', 'Building', 'Office', ...],
  'Charts': ['Chart', 'Graph', 'Analytics', ...],
  'Technology': ['Code', 'Database', 'Server', ...],
  'Security': ['Lock', 'Shield', 'Key', ...],
  'Actions': ['Plus', 'Edit', 'Trash', 'Save', ...],
};
```

## Kullanım Örnekleri

### ModuleSettingsPage'de İkon Değiştirme

```tsx
const handleModuleIconChange = async (iconName: string) => {
  const response = await fetch(`/api/modules/${module.slug}/icon`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ icon: iconName }),
  });

  if (response.ok) {
    setModuleIcon(iconName);
    window.dispatchEvent(new CustomEvent('modules-updated'));
    window.dispatchEvent(new CustomEvent('menu-updated'));
  }
};
```

### Sidebar'da İkon Render

```tsx
// useMenuItems hook'tan gelen menu item
{menuItems.map(item => (
  <NavLink
    key={item.href}
    label={item.label}
    leftSection={<item.icon size={20} />}  // Component olarak
  />
))}
```

## Sorun Giderme

### İkon Görünmüyor
1. İkon adının doğru olduğundan emin olun (case-sensitive değil ama "Icon" prefix'i opsiyonel)
2. `iconMap`'te tanımlı olduğunu kontrol edin
3. Tabler Icons'ta mevcut olduğunu doğrulayın

### İkon Picker'da 0 İkon
1. ForwardRef component tespitinin doğru olduğundan emin olun
2. `$$typeof` kontrolünün yapıldığını doğrulayın

### İkon Kaydedilmiyor
1. API endpoint'inin çalıştığını kontrol edin
2. `module.config.yaml` dosyasının yazılabilir olduğundan emin olun
3. Console'da hata mesajlarını kontrol edin
