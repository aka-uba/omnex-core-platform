# PostgreSQL Servisini Manuel Başlatma

## Yöntem 1: Services (Hizmetler) Penceresi (Önerilen)

1. **Windows + R** tuşlarına basın
2. `services.msc` yazın ve **Enter**'a basın
3. Açılan pencerede servis listesinde **PostgreSQL** ile ilgili servisleri arayın
4. Servisi bulun ve **sağ tıklayın** > **Start** (Başlat)

**Not:** Servis adı şunlardan biri olabilir:
- `postgresql-x64-15`
- `postgresql-x64-14`
- `PostgreSQL Server`
- `postgresql-15`

## Yöntem 2: pgAdmin Kullanarak (Alternatif)

PostgreSQL servisi çalışmasa bile, pgAdmin ile veritabanını oluşturabilirsiniz:

1. **pgAdmin**'i açın
2. Sol panelde **Servers** > **PostgreSQL** genişletin
3. Eğer bağlantı yoksa, **Servers**'a sağ tıklayın > **Create** > **Server**
4. **General** sekmesinde:
   - **Name**: `PostgreSQL` (veya istediğiniz bir isim)
5. **Connection** sekmesinde:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: PostgreSQL kurulumunda belirlediğiniz şifre
6. **Save** butonuna tıklayın

Bağlantı başarılı olursa, veritabanını oluşturabilirsiniz:
- **Databases**'e sağ tıklayın > **Create** > **Database**
- **Database name**: `omnex_core`
- **Save**

## Yöntem 3: PostgreSQL'i Manuel Başlatma

PostgreSQL'in `bin` klasöründen manuel başlatma:

```powershell
# PostgreSQL'in bin klasörüne gidin
cd "C:\Program Files\PostgreSQ\pgsql\bin"

# PostgreSQL'i başlatın (arka planda)
.\pg_ctl.exe start -D "C:\Program Files\PostgreSQ\pgsql\data"
```

**Not:** `data` klasörünün yolunu kendi kurulumunuza göre ayarlayın.

## Servis Durumunu Kontrol Etme

PostgreSQL'in çalışıp çalışmadığını kontrol edin:

```powershell
# Port 5432'yi dinleyen servisleri kontrol et
netstat -an | findstr 5432
```

Eğer çıktı görürseniz, PostgreSQL çalışıyor demektir.

## Veritabanı Oluşturma (Servis Çalıştıktan Sonra)

Servis başlatıldıktan sonra:

```bash
# Bağlantıyı test edin
npm run db:check

# Veritabanını oluşturun
npm run db:create
```

## Sorun Giderme

### Servis Bulunamıyor

PostgreSQL kurulumunda servis oluşturulmamış olabilir. Bu durumda:
1. PostgreSQL'i yeniden kurun ve "Install as Windows Service" seçeneğini işaretleyin
2. Veya pgAdmin kullanarak manuel bağlanın

### Port 5432 Kullanımda

Başka bir uygulama portu kullanıyor olabilir. PostgreSQL'in farklı bir portta çalışıp çalışmadığını kontrol edin.

### Şifre Hatırlamıyorum

PostgreSQL kurulumunda belirlediğiniz şifreyi hatırlamıyorsanız:
1. `pg_hba.conf` dosyasını düzenleyerek şifre gereksinimini kaldırabilirsiniz
2. Veya PostgreSQL'i yeniden kurun


