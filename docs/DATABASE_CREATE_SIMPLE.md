# Veritabanı Oluşturma - En Kolay Yöntem

## ✅ Önerilen: pgAdmin Kullanın (GUI - En Kolay)

### Adımlar:

1. **pgAdmin**'i açın (PostgreSQL ile birlikte gelir)

2. Sol panelde:
   - **Servers** > **PostgreSQL** genişletin
   - **Databases**'e **sağ tıklayın**

3. **Create** > **Database** seçin

4. Açılan pencerede:
   - **Database name**: `omnex_core` yazın
   - **Owner**: `postgres` (veya kendi kullanıcınız)
   - **Save** butonuna tıklayın

✅ **Tamamlandı!** Database oluşturuldu.

---

## Alternatif: psql Komut Satırı

Eğer `psql` komutunu kullanmak istiyorsanız:

### 1. psql'in Yolunu Bulun

PostgreSQL genellikle şu konumda kurulur:
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- `C:\Program Files\PostgreSQL\14\bin\psql.exe`
- `C:\Program Files\PostgreSQL\13\bin\psql.exe`

### 2. Tam Yol ile Çalıştırın

**PowerShell:**
```powershell
# Şifreyi set edin
$env:PGPASSWORD="your_password"

# Database oluşturun (15 yerine kendi versiyonunuzu yazın)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

**CMD:**
```cmd
set PGPASSWORD=your_password
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

### 3. Veya PATH'e Ekleyin

PostgreSQL'in `bin` klasörünü Windows PATH'e ekleyin, sonra normal komutları kullanabilirsiniz.

---

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

---

## Hızlı Kontrol

Veritabanının oluşturulduğunu kontrol etmek için pgAdmin'de:
- Sol panelde **Databases** altında `omnex_core` görünüyor mu?

Veya SQL Query Tool'da:
```sql
SELECT datname FROM pg_database WHERE datname = 'omnex_core';
```


