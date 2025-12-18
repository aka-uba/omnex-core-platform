# .env Dosyası Düzeltme

## Sorun

Migration sırasında şu hata alıyorsunuz:
```
Error: P1010: User `user` was denied access on the database `omnex_core.public`
```

## Çözüm

`.env` dosyanızdaki `CORE_DATABASE_URL` değerini güncelleyin:

### Önceki (Yanlış):
```env
CORE_DATABASE_URL="postgresql://user:password@localhost:5432/omnex_core?schema=public"
```

### Doğru:
```env
CORE_DATABASE_URL="postgresql://postgres:password@localhost:5432/omnex_core?schema=public"
```

**Önemli:** 
- `user` yerine `postgres` kullanın
- `password` yerine PostgreSQL kurulumunda belirlediğiniz şifreyi yazın
- Eğer şifre belirlemediyseniz, şifre kısmını boş bırakın: `postgresql://postgres@localhost:5432/omnex_core`

## Tüm .env Değerleri

```env
# Core Database (postgres kullanıcısı ile)
CORE_DATABASE_URL="postgresql://postgres:your_password@localhost:5432/omnex_core?schema=public"

# Tenant DB Template (__DB_NAME__ placeholder'ı runtime'da değiştirilir)
TENANT_DB_TEMPLATE_URL="postgresql://postgres:your_password@localhost:5432/__DB_NAME__?schema=public"

# PostgreSQL Admin (Database oluşturma için - postgres kullanıcısı)
PG_ADMIN_URL="postgresql://postgres:your_password@localhost:5432/postgres"
```

**Not:** `your_password` yerine PostgreSQL kurulumunda belirlediğiniz şifreyi yazın. Şifre yoksa sadece `postgresql://postgres@localhost:5432/...` şeklinde yazın.

## Şifre Belirleme (Eğer Şifre Yoksa)

PostgreSQL'de şifre belirlemek için:

```sql
-- psql ile bağlanın
psql -U postgres

-- Şifre belirleyin
ALTER USER postgres PASSWORD 'your_password';
```

Veya pgAdmin'den:
1. Login/Group Roles > postgres > sağ tıklayın > Properties
2. Definition sekmesinde Password girin
3. Save

