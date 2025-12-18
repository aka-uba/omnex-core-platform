# Seed Data Bilgileri

Bu dosya, seed script'i tarafından oluşturulan varsayılan veriler hakkında bilgi içerir.

## 🔑 Varsayılan Giriş Bilgileri

Tüm kullanıcılar için varsayılan şifre: **`Omnex123!`**

### Kullanıcılar

1. **Super Admin**
   - Email: `admin@omnexcore.com`
   - Şifre: `Omnex123!`
   - Rol: SuperAdmin
   - Durum: Aktif

2. **Agency Manager**
   - Email: `agency@omnexcore.com`
   - Şifre: `Omnex123!`
   - Rol: AgencyUser
   - Durum: Aktif

3. **Client User**
   - Email: `client@omnexcore.com`
   - Şifre: `Omnex123!`
   - Rol: ClientUser
   - Durum: Aktif

## 🏢 Oluşturulan Veriler

### Agency
- **Ad**: Omnex Agency
- **Email**: info@omnex.com
- **Telefon**: +90 212 555 0000

### Company
- **Ad**: Omnex Core
- **Sektör**: Software & Technology
- **Website**: https://omnexcore.com
- **Durum**: Active

### BrandKit
- **Logo URL**: /logo.png
- **Renk Paleti**: 
  - Primary: #0066cc
  - Secondary: #6c757d
  - Success: #28a745
  - Danger: #dc3545
  - Warning: #ffc107
  - Info: #17a2b8
- **Font**: Inter, sans-serif

### Roller
1. **SuperAdmin** - Tüm sistem özelliklerine tam erişim
2. **AgencyUser** - Müşteri, içerik ve planlama yönetimi
3. **ClientUser** - İçerik görüntüleme ve yorum yapma

### İzinler (25 adet)
- Client Management (4 izin)
- Content Management (4 izin)
- Scheduling (3 izin)
- AI (3 izin)
- Finance (3 izin)
- User Management (4 izin)
- Module Management (4 izin)

## 🔄 Seed Script'ini Çalıştırma

```bash
npm run db:seed
```

Bu komut:
- Mevcut verileri günceller (upsert)
- Yeni veriler oluşturur
- İlişkileri kurar

## ⚠️ Önemli Notlar

1. **Şifreler**: ✅ Tüm şifreler bcrypt ile hash'lenmiştir (10 rounds)
2. **Güvenlik**: Production ortamında mutlaka şifreleri değiştirin
3. **Veri**: Seed script'i idempotent'tir (birden fazla çalıştırılabilir, mevcut verileri günceller)
4. **Hash**: Şifreler `bcrypt.hash(password, 10)` ile hash'lenmiştir

## 🔐 Şifre Değiştirme

Production'da kullanıcı şifrelerini değiştirmek için:

1. Prisma Studio kullanın:
```bash
npm run db:studio
```

2. Veya API endpoint'i kullanın:
```bash
PATCH /api/users/[id]
```

3. Veya doğrudan veritabanında güncelleyin (bcrypt hash ile)

