# PostgreSQL Veritabanı Oluşturma Rehberi

## Yöntem 1: psql Komut Satırı (Önerilen)

### Windows PowerShell/CMD:

```bash
# PostgreSQL'e bağlanın (PG_ADMIN_URL'deki bilgileri kullanın)
psql -U postgres -h localhost -p 5432

# Veya şifreyi doğrudan belirtin
psql -U postgres -h localhost -p 5432 -d postgres
```

Bağlandıktan sonra:

```sql
-- Core database oluşturun
CREATE DATABASE omnex_core;

-- Çıkış
\q
```

### Tek Satırda (Şifre ile):

```bash
# Windows PowerShell
$env:PGPASSWORD="your_password"; psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"

# Windows CMD
set PGPASSWORD=your_password && psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

## Yöntem 2: pgAdmin (GUI)

1. **pgAdmin**'i açın
2. Sol panelde **Servers** > **PostgreSQL** > **Databases**'e sağ tıklayın
3. **Create** > **Database** seçin
4. **Database name**: `omnex_core` yazın
5. **Save** butonuna tıklayın

## Yöntem 3: SQL Dosyası ile

`create-database.sql` dosyası oluşturun:

```sql
CREATE DATABASE omnex_core;
```

Sonra çalıştırın:

```bash
psql -U postgres -h localhost -p 5432 -f create-database.sql
```

## Yöntem 4: Node.js Script ile

Aşağıdaki script'i kullanabilirsiniz:

```bash
node scripts/create-core-db.js
```

## .env Dosyasındaki Bilgileri Kullanma

`.env` dosyanızdaki `PG_ADMIN_URL` değerini kullanarak:

**Örnek .env:**
```env
PG_ADMIN_URL="postgresql://postgres:mypassword@localhost:5432/postgres"
```

Bu durumda:
- **User**: `postgres`
- **Password**: `mypassword`
- **Host**: `localhost`
- **Port**: `5432`

Komut:
```bash
psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE omnex_core;"
```

## Veritabanının Oluşturulduğunu Kontrol Etme

```bash
# Veritabanlarını listele
psql -U postgres -h localhost -p 5432 -l

# Veya bağlanıp kontrol edin
psql -U postgres -h localhost -p 5432 -d postgres
\l
```

## Sorun Giderme

### "psql: command not found"

PostgreSQL'in PATH'e eklendiğinden emin olun:
- Windows: PostgreSQL kurulum klasörünü PATH'e ekleyin (örn: `C:\Program Files\PostgreSQL\15\bin`)
- Veya pgAdmin ile SQL Query Tool kullanın

### "password authentication failed"

`.env` dosyasındaki şifrenin doğru olduğundan emin olun.

### "could not connect to server"

1. PostgreSQL servisinin çalıştığını kontrol edin
2. Host ve port bilgilerini kontrol edin
3. Firewall ayarlarını kontrol edin


