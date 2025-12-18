# Modül Ayarlar Sistemi - Güncellemeler

## ✅ Tamamlanan Yeni Özellikler

### 1. ✅ Icon/Resim Upload Desteği
- **Özellik**: Modül iconlarını özel resim yükleyebilme
- **Desteklenen Formatlar**: PNG, JPG, SVG, WebP
- **Maksimum Dosya Boyutu**: 2MB
- **Konum**: Header'da avatar üzerine upload butonu
- **API**: `POST /api/modules/[slug]/icon`
- **Depolama**: `public/uploads/modules/[slug]/`

### 2. ✅ Ayarlar Kaydetme ve Bildirimler
- **Özellik**: Ayarlar dosya sistemine kaydediliyor
- **Depolama**: `data/module-settings/[slug].json`
- **Bildirimler**: 
  - Başarılı kayıt bildirimi (yeşil)
  - Hata durumunda kırmızı bildirim
- **API Güncellemesi**: 
  - GET: Kaydedilmiş ayarları yükler, yoksa varsayılanları döner
  - POST: Ayarları JSON dosyasına yazar

### 3. ✅ Menü Kalıcılığı
- **Özellik**: Menü değişiklikleri kalıcı olarak saklanıyor
- **Depolama**: `data/module-menus/[slug].json`
- **Davranış**:
  - İlk yük: `module.config.yaml`'dan okur
  - Kaydedilince: `data/module-menus/` klasörüne yazar
  - Sonraki yüklemelerde: Kaydedilmiş menüyü kullanır
- **API Güncellemesi**:
  - GET: Önce kaydedilmiş menüyü arar, yoksa config'ten okur
  - POST: Menüyü JSON olarak kaydeder
  - DELETE: Kaydedilmiş menüyü siler (varsayılana döner)

### 4. ✅ Varsayılana Dön Butonu
- **Konum**: Menü sekmesinde, sağ üst köşede
- **İşlev**: Kaydedilmiş özel menüyü siler
- **Davranış**: Menüyü `module.config.yaml`'daki orijinal haline döndürür
- **Bildirim**: Başarılı reset mesajı gösterir

### 5. ✅ Türkçe Çeviriler
- **Dosyalar**:
  - `src/locales/tr/modules/settings.json` (Türkçe)
  - `src/locales/en/modules/settings.json` (İngilizce)
- **Kapsam**: Tüm UI metinleri çevrildi
- **Çeviri Anahtarları**:
  - `moduleSettings.tabs.*` - Tab başlıkları
  - `moduleSettings.summary.*` - Özet tab
  - `moduleSettings.settings.*` - Ayarlar tab
  - `moduleSettings.menu.*` - Menü tab
  - `moduleSettings.icon.*` - Icon upload mesajları

### 6. ✅ Veritabanı Şeması (Opsiyonel)
- **Dosya**: `prisma/module-settings.schema.prisma`
- **Modeller**:
  - `ModuleSetting` - Ayarları saklar
  - `ModuleMenu` - Menü yapısını saklar
  - `ModuleIcon` - Yüklenen iconları saklar
- **Not**: Şu anda dosya sistemi kullanılıyor, gelecekte veritabanına geçiş için hazır

## 📁 Yeni Dosya Yapısı

```
project/
├── src/
│   ├── modules/
│   │   └── module-management/
│   │       └── components/
│   │           └── ModuleSettingsPage.tsx  ✨ GÜNCELLEME
│   ├── locales/
│   │   ├── tr/
│   │   │   └── modules/
│   │   │       └── settings.json           ✨ YENİ
│   │   └── en/
│   │       └── modules/
│   │           └── settings.json           ✨ YENİ
│   ├── lib/
│   │   └── modules/
│   │       ├── versionReader.ts
│   │       └── menuBuilder.ts              ✨ YENİ
│   └── app/
│       └── api/
│           └── modules/
│               ├── [slug]/
│               │   ├── icon/
│               │   │   └── route.ts        ✨ YENİ
│               │   ├── settings/
│               │   │   └── route.ts        ✨ GÜNCELLEME
│               │   └── menu/
│               │       └── route.ts        ✨ GÜNCELLEME
│               └── menus/
│                   └── all/
│                       └── route.ts        ✨ YENİ
├── data/                                    ✨ YENİ
│   ├── module-settings/
│   │   └── [slug].json                     # Kaydedilmiş ayarlar
│   └── module-menus/
│       └── [slug].json                     # Kaydedilmiş menüler
├── public/
│   └── uploads/
│       └── modules/                        ✨ YENİ
│           └── [slug]/
│               └── icon-*.{png,jpg,svg}    # Yüklenen iconlar
└── prisma/
    └── module-settings.schema.prisma       ✨ YENİ
```

## 🔄 API Endpoints

### 1. Icon Upload
```
POST /api/modules/{slug}/icon
```
- **Giriş**: FormData with 'icon' file
- **Çıkış**: 
```json
{
  "success": true,
  "data": {
    "url": "/uploads/modules/real-estate/icon-1234567890.png",
    "fileName": "icon-1234567890.png"
  }
}
```

### 2. Settings
```
GET /api/modules/{slug}/settings
POST /api/modules/{slug}/settings
```
- **GET Response**: Kaydedilmiş veya varsayılan ayarlar
- **POST Body**: Array of settings with key-value pairs

### 3. Menu
```
GET /api/modules/{slug}/menu
POST /api/modules/{slug}/menu
DELETE /api/modules/{slug}/menu
```
- **GET Response**: Kaydedilmiş veya varsayılan menü + `isCustom` flag
- **POST Body**: Menu structure
- **DELETE**: Varsayılana döndürür

### 4. All Menus
```
GET /api/modules/menus/all
```
- **Response**: Tüm modüllerin menülerini hiyerarşik yapıda

## 🎨 UI İyileştirmeleri

### Icon Upload
```
┌─────────────────────────────────────┐
│  [Avatar]  Module Name              │
│    [↑]     Description               │
│           Version | Author           │
│  [Upload Icon]  Max: 2MB           │
└─────────────────────────────────────┘
```

### Ayarlar Tab
```
┌────────────────────────────────────────┐
│  Module Settings     [Reset] [Save]    │
├────────────────────────────────────────┤
│  ▼ General (2 ayar)                    │
│    • Enable Notifications  [●─○]      │
│    • Default Language      [Select ▼] │
│                                        │
│  ▼ Payments (3 ayar)                   │
│    • Currency              [USD ▼]     │
│    • Reminder Days         [7]         │
└────────────────────────────────────────┘
```

### Menü Tab
```
┌─────────────────────────────────────────────┐
│  Menu Configuration                         │
│  [Reset] [Add Item] [Save]                 │
├─────────────────────────────────────────────┤
│  ≡ Dashboard        →↓ 👁 🗑               │
│    ≡ Properties     →↓ 👁 🗑               │
│      ≡ Apartments   →↓ 👁 🗑 (indented)   │
└─────────────────────────────────────────────┘
```

## 🚀 Kullanım

### Real Estate Modülü Örneği

1. **Icon Upload**:
```typescript
// Kullanıcı header'daki upload butonuna tıklar
// PNG/JPG/SVG dosyası seçer
// Otomatik yüklenir ve avatar güncellenir
```

2. **Ayarları Değiştir**:
```typescript
// Settings tab'ına git
// İstediğin ayarı değiştir (switch, input, select vb.)
// "Değişiklikleri Kaydet" butonuna tıkla
// Başarı bildirimi görüntülenir
```

3. **Menüyü Özelleştir**:
```typescript
// Menu tab'ına git
// Menü öğelerini sürükle-bırak ile sırala
// → ← butonları ile girinti ayarla
// 👁 ile görünürlük değiştir
// Öğeye tıklayarak detayları düzenle
// "Menüyü Kaydet" butonuna tıkla
```

4. **Varsayılana Dön**:
```typescript
// Menu tab'ında "Varsayılana Dön" butonuna tıkla
// Onay ver
// Menü module.config.yaml'daki haline döner
```

## 📝 Dikkat Edilmesi Gerekenler

### Dosya İzinleri
```bash
# Data klasörleri yazılabilir olmalı
chmod -R 755 data/
chmod -R 755 public/uploads/
```

### .gitignore
```gitignore
# Kullanıcı verilerini git'e ekleme
data/module-settings/
data/module-menus/
public/uploads/modules/
```

### Yedekleme
Kullanıcı ayarları ve menüleri önemli, düzenli yedekleme yapılmalı:
```bash
# Ayarları yedekle
cp -r data/ backup/data-$(date +%Y%m%d)/
```

## 🐛 Bilinen Sınırlamalar

1. **Dosya Sistemi**: Şu anda ayarlar dosya sisteminde, production için veritabanına geçiş önerilir
2. **Eşzamanlılık**: Aynı anda birden fazla kullanıcı aynı modül ayarlarını değiştirirse son yazan kazanır
3. **Yetkilendirme**: API endpoint'leri için auth middleware eklenmeli
4. **Validasyon**: Menü ve ayar değerleri için daha güçlü validasyon gerekli

## ✅ Test Listesi

- [x] Icon upload çalışıyor
- [x] Icon dosya tipi kontrolü
- [x] Icon boyut kontrolü (2MB)
- [x] Ayarlar kaydediliyor
- [x] Ayarlar yüklendiğinde kaydedilmiş değerler gösteriliyor
- [x] Bildirimler görüntüleniyor
- [x] Menü sürükle-bırak çalışıyor
- [x] Menü girinti ayarları çalışıyor
- [x] Menü kaydediliyor
- [x] Varsayılana dön çalışıyor
- [x] Türkçe çeviriler aktif
- [x] Tüm UI elementleri çevrilmiş

## 🎯 Sonraki Adımlar

### Diğer Modüller İçin Uyarlama
1. Accounting modülü
2. HR modülü  
3. AI modülü
4. File Manager
5. Notifications
6. Web Builder

Her modül için:
- `version.txt` oluştur
- `module.config.yaml`'a settings ekle
- Settings sayfası route'u oluştur

### Gelecek İyileştirmeler
- [ ] Veritabanı entegrasyonu
- [ ] Yetkilendirme ve izin kontrolü
- [ ] Menü önizleme
- [ ] Toplu modül ayarları
- [ ] Ayar import/export
- [ ] Menü şablonları

## 📊 Özet

**Real Estate modülü için tam özellikli, profesyonel modül ayarlar sistemi tamamlandı!**

- ✅ 6/6 özellik tamamlandı
- ✅ Türkçe dil desteği
- ✅ Icon upload
- ✅ Kalıcı ayarlar
- ✅ Kalıcı menü yapısı
- ✅ Varsayılana dön
- ✅ Bildirim sistemi

Sistem şimdi diğer modüllere uyarlanmaya hazır!






