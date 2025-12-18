# Multi-Tenant Setup Checklist

## ✅ Tamamlanan Adımlar

1. ✅ Environment variables (.env dosyası hazırlandı)
2. ✅ Core Prisma Client generate edildi
3. ✅ Tenant Prisma Client generate edildi

## 🔄 Şu An Yapılması Gerekenler

### 1. PostgreSQL Bağlantısını Kontrol Et

`.env` dosyanızda şu değerlerin doğru olduğundan emin olun:

```env
CORE_DATABASE_URL="postgresql://user:password@localhost:5432/omnex_core?schema=public"
TENANT_DB_TEMPLATE_URL="postgresql://user:password@localhost:5432/__DB_NAME__?schema=public"
PG_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres"
```

**Önemli:**
- `user`, `password`, `localhost`, `5432` değerlerini kendi PostgreSQL ayarlarınıza göre güncelleyin
- PostgreSQL servisinin çalıştığından emin olun
- `omnex_core` database'inin var olduğundan veya oluşturulabileceğinden emin olun

### 2. Core Database Oluşturma

PostgreSQL'de core database'i oluşturun:

```sql
CREATE DATABASE omnex_core;
```

Veya psql ile:
```bash
psql -U postgres -c "CREATE DATABASE omnex_core;"
```

### 3. Core Database Migration

Migration'ı uygulayın:

```bash
npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
```

### 4. İlk Agency Oluşturma (Opsiyonel)

Core DB'ye ilk agency'yi ekleyin (tenant oluştururken kullanmak için):

```bash
# Prisma Studio ile
npx prisma studio --schema=prisma/core.schema.prisma

# Veya seed script ile (eğer varsa)
```

### 5. İlk Tenant Oluşturma

İlk tenant'ı oluşturun:

```bash
pnpm tenant:create --name="Test Company" --slug="test" --subdomain="test"
```

## 🔍 Sorun Giderme

### "Can't reach database server" Hatası

1. PostgreSQL servisinin çalıştığını kontrol edin:
   ```bash
   # Windows
   services.msc (PostgreSQL servisini kontrol edin)
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Bağlantı bilgilerini test edin:
   ```bash
   psql -U postgres -h localhost -p 5432
   ```

3. `.env` dosyasındaki değerleri kontrol edin

### "Database does not exist" Hatası

Core database'i oluşturun:
```sql
CREATE DATABASE omnex_core;
```

### Migration Hatası

Eğer migration sırasında hata alırsanız:
1. Database'in boş olduğundan emin olun
2. Prisma migration lock dosyasını kontrol edin
3. Gerekirse `prisma migrate reset` ile sıfırlayın (DİKKAT: Tüm veriler silinir)

## 📝 Sonraki Adımlar

Migration başarılı olduktan sonra:
1. İlk agency'yi oluşturun (opsiyonel)
2. İlk tenant'ı oluşturun
3. Tenant DB'nin başarıyla oluşturulduğunu kontrol edin
4. Test kullanıcısı ile giriş yapmayı deneyin


