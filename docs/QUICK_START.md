# Hızlı Başlangıç - Veritabanı Oluşturma

## En Kolay Yöntem: Otomatik Script

```bash
npm run db:create
```

Bu script `.env` dosyanızdaki `PG_ADMIN_URL` bilgilerini kullanarak `omnex_core` database'ini otomatik oluşturur.

## Manuel Yöntemler

### 1. pgAdmin ile (En Kolay - GUI)

1. **pgAdmin**'i açın
2. Sol panelde **Servers** > **PostgreSQL** > **Databases**'e sağ tıklayın
3. **Create** > **Database** seçin
4. **Database name**: `omnex_core` yazın
5. **Save** butonuna tıklayın

✅ **Tamamlandı!**

### 2. psql Komut Satırı ile

**Windows PowerShell:**
```powershell
# Şifreyi environment variable olarak set edin
$env:PGPASSWORD="your_password"

# Database oluşturun
psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

**Windows CMD:**
```cmd
set PGPASSWORD=your_password
psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

### 3. .env Dosyasındaki Bilgileri Kullanarak

`.env` dosyanızdaki `PG_ADMIN_URL` değerini kontrol edin:

```env
PG_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres"
```

Bu bilgilere göre:

```bash
# User: postgres
# Password: password (yukarıdaki örnekten)
# Host: localhost
# Port: 5432

psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

## Veritabanı Oluşturulduktan Sonra

1. **Bağlantıyı test edin:**
   ```bash
   npm run db:check
   ```

2. **Migration çalıştırın:**
   ```bash
   npx prisma migrate dev --schema=prisma/core.schema.prisma --name init
   ```

3. **Seed çalıştırın (opsiyonel):**
   ```bash
   npm run db:seed:core
   ```

4. **İlk tenant'ı oluşturun:**
   ```bash
   npm run tenant:create -- --name="Test Company" --slug="test" --subdomain="test"
   ```

## Sorun Giderme

### "psql: command not found"

PostgreSQL'in `bin` klasörünü PATH'e ekleyin:
- Genellikle: `C:\Program Files\PostgreSQL\15\bin`
- Veya pgAdmin kullanın

### "password authentication failed"

`.env` dosyasındaki şifrenin doğru olduğundan emin olun.

### "could not connect to server"

1. PostgreSQL servisinin çalıştığını kontrol edin (Windows Services)
2. Host ve port bilgilerini kontrol edin


