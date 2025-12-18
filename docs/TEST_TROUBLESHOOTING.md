# Modül Ayarlar Sistemi - Test ve Sorun Giderme

## Yapılan Düzeltmeler

### 1. Türkçe Çeviri Dosyaları ✅
- `src/locales/modules/settings/tr.json` - Güncellenmiş ve genişletilmiş
- `src/locales/modules/settings/en.json` - Güncellenmiş ve genişletilmiş
- Yanlış konumdaki dosyalar silindi (`src/locales/tr/modules/settings.json` ve `src/locales/en/modules/settings.json`)

### 2. Page Component'i Client-Side Yapıldı ✅
- `src/app/[locale]/modules/real-estate/settings/page.tsx` dosyasına `'use client'` direktifi eklendi
- Bu sayede `useTranslation` hook'u düzgün çalışacak

### 3. Çeviri Namespace'i
- ModuleSettingsPage: `useTranslation('modules/settings')`
- Dosya konumu: `src/locales/modules/settings/{locale}.json`

## Test Adımları

### 1. Sunucuyu Kontrol Et
```bash
npm run dev
```

### 2. Tarayıcıda Test Et

**Türkçe:**
```
http://localhost:3000/tr/modules/real-estate/settings
```

**İngilizce:**
```
http://localhost:3000/en/modules/real-estate/settings
```

### 3. Kontrol Edilmesi Gerekenler

#### Tab Başlıkları
- ✅ "Özet" (TR) / "Summary" (EN)
- ✅ "Ayarlar" (TR) / "Settings" (EN)  
- ✅ "Menü" (TR) / "Menu" (EN)

#### Özet Tab
- ✅ "Sürüm" (TR) / "Version" (EN)
- ✅ "Son Güncelleme" (TR) / "Last Updated" (EN)
- ✅ "Neler Yapılabilir" (TR) / "What You Can Do" (EN)
- ✅ "Değişiklik Geçmişi" (TR) / "Change Log" (EN)

#### Ayarlar Tab
- ✅ "Modül Ayarları" (TR) / "Module Settings" (EN)
- ✅ "Varsayılana Dön" (TR) / "Reset to Default" (EN)
- ✅ "Değişiklikleri Kaydet" (TR) / "Save Changes" (EN)
- ✅ Kategori isimleri çevrilmiş

#### Menü Tab
- ✅ "Menü Yapılandırması" (TR) / "Menu Configuration" (EN)
- ✅ "Menü Öğesi Ekle" (TR) / "Add Menu Item" (EN)
- ✅ "Menüyü Kaydet" (TR) / "Save Menu" (EN)

### 4. API Endpoint'leri Test Et

#### Version History
```bash
curl http://localhost:3000/api/modules/real-estate/version-history
```

Beklenen: Version history verisi

#### Settings
```bash
curl http://localhost:3000/api/modules/real-estate/settings
```

Beklenen: Ayarlar listesi

#### Menu
```bash
curl http://localhost:3000/api/modules/real-estate/menu
```

Beklenen: Menü yapısı

## Olası Sorunlar ve Çözümleri

### Sorun 1: Ayarlar Görünmüyor
**Neden:** `module.config.yaml` dosyasında `settings` bölümü eksik olabilir

**Çözüm:**
```bash
# Real Estate config'i kontrol et
cat src/modules/real-estate/module.config.yaml
```

Settings bölümü olmalı:
```yaml
settings:
  - key: "enableNotifications"
    label: "Enable Notifications"
    description: "Send notifications"
    type: "boolean"
    defaultValue: true
    category: "General"
```

### Sorun 2: Menü Görünmüyor
**Neden:** `module.config.yaml` dosyasında `menu` bölümü eksik olabilir

**Çözüm:**
Menu bölümü kontrol edilmeli:
```yaml
menu:
  main:
    label: "Real Estate"
    icon: "Building"
    href: "/modules/real-estate"
    items:
      - title: "Dashboard"
        path: "/modules/real-estate/dashboard"
        icon: "Dashboard"
```

### Sorun 3: Çeviriler Yüklenmiyor
**Neden:** Browser cache veya Next.js cache

**Çözüm:**
```bash
# Next.js cache'i temizle
rm -rf .next

# Sunucuyu yeniden başlat
npm run dev
```

### Sorun 4: API 404 Hatası
**Neden:** API route'ları düzgün yüklenmemiş

**Çözüm:**
API dosyalarının varlığını kontrol et:
```bash
ls -la src/app/api/modules/[slug]/version-history/route.ts
ls -la src/app/api/modules/[slug]/settings/route.ts
ls -la src/app/api/modules/[slug]/menu/route.ts
```

### Sorun 5: YAML Parse Hatası
**Neden:** `module.config.yaml` dosyasında syntax hatası

**Çözüm:**
YAML syntax'ını kontrol et - tab yerine space kullanılmalı

## Browser Console'da Kontrol

Tarayıcı console'unu aç (F12) ve şunları kontrol et:

### 1. Çeviri Yüklenme
```javascript
// Console'da çalıştır
console.log(require('@/locales/modules/settings/tr.json'))
```

### 2. API Çağrıları
Network tab'ında şu çağrıları görmelisin:
- `/api/modules/real-estate/version-history`
- `/api/modules/real-estate/settings`
- `/api/modules/real-estate/menu`

### 3. Hata Mesajları
Console'da kırmızı hata var mı kontrol et

## Veri Dosyaları

### Ayarlar
```bash
# Eğer kaydettiysek
cat data/module-settings/real-estate.json
```

### Menü
```bash
# Eğer kaydettiysek
cat data/module-menus/real-estate.json
```

## Debug Mode

ModuleSettingsPage'e debug logging ekle:

```typescript
useEffect(() => {
  console.log('Module:', module);
  console.log('Settings:', settings);
  console.log('Menu Items:', menuItems);
  console.log('Version History:', versionHistory);
}, [module, settings, menuItems, versionHistory]);
```

## Başarılı Test Sonucu

Eğer her şey doğru çalışıyorsa:

1. ✅ Türkçe çeviriler görünüyor
2. ✅ 3 tab (Özet, Ayarlar, Menü) görünüyor
3. ✅ Özet tab'ında version history var
4. ✅ Ayarlar tab'ında kategorize ayarlar var
5. ✅ Menü tab'ında sürüklenebilir menü öğeleri var
6. ✅ İcon upload butonu var
7. ✅ Kaydet butonları çalışıyor
8. ✅ Bildirimler gösteriliyor

## İletişim

Sorun devam ediyorsa:
1. Browser console screenshot'u al
2. Network tab screenshot'u al
3. Terminaldeki hata mesajlarını paylaş






