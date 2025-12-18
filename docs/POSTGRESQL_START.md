# PostgreSQL Servisini Başlatma

## Windows'ta PostgreSQL Servisini Başlatma

### Yöntem 1: Services (Hizmetler) Penceresi

1. **Windows + R** tuşlarına basın
2. `services.msc` yazın ve Enter'a basın
3. Listede **PostgreSQL** servisini bulun (örnek: `postgresql-x64-15` veya `PostgreSQL Server`)
4. Sağ tıklayın ve **Start** (Başlat) seçin

### Yöntem 2: PowerShell (Yönetici olarak)

```powershell
# Servis adını bulun
Get-Service | Where-Object {$_.Name -like "*postgresql*"}

# Servisi başlatın (servis adını yukarıdaki komuttan alın)
Start-Service postgresql-x64-15
# veya
Start-Service "PostgreSQL Server"
```

### Yöntem 3: Komut İstemi (Yönetici olarak)

```cmd
net start postgresql-x64-15
```

## Servis Adını Bulma

PostgreSQL servisinin tam adını bulmak için:

```powershell
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
```

## Servis Durumunu Kontrol Etme

```powershell
Get-Service | Where-Object {$_.Name -like "*postgresql*"} | Select-Object Name, Status
```

## Servis Başlatıldıktan Sonra

1. **Veritabanını oluşturun:**
   ```bash
   npm run db:create
   ```

2. **Veya pgAdmin ile:**
   - pgAdmin'i açın
   - Databases'e sağ tıklayın > Create > Database
   - Name: `omnex_core`

3. **Bağlantıyı test edin:**
   ```bash
   npm run db:check
   ```

## Sorun Giderme

### "Access Denied" Hatası

PowerShell veya CMD'yi **Yönetici olarak** çalıştırın.

### Servis Bulunamıyor

PostgreSQL'in düzgün kurulduğundan emin olun. Kurulum sırasında servis oluşturulmuş olmalı.

### Port 5432 Kullanımda

Başka bir uygulama 5432 portunu kullanıyor olabilir. PostgreSQL'in farklı bir portta çalışıp çalışmadığını kontrol edin.


