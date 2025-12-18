# PostgreSQL Servis Yönetimi Scriptleri

Bu klasörde PostgreSQL'i Windows servisi olarak yönetmek için kullanılabilecek scriptler bulunmaktadır.

## Scriptler

### 1. `add-postgresql-to-services.bat`
**En Kolay Yöntem** - Batch dosyası, UAC penceresi açılır.

PostgreSQL'i Windows servisi olarak kaydetmek için:
```batch
scripts\add-postgresql-to-services.bat
```

### 2. `stop-and-register-service.ps1`
**Ana PowerShell Script** - Yönetici olarak çalıştırın.

PostgreSQL'i durdurur, temizler ve Windows servisi olarak kaydeder:
```powershell
# Yönetici olarak PowerShell açın
.\scripts\stop-and-register-service.ps1
```

**Ne yapar:**
- Çalışan PostgreSQL süreçlerini durdurur
- Port 5432'yi kullanan süreçleri temizler
- `postmaster.pid` dosyasını siler
- Eski servis kaydını siler (varsa)
- Yeni servis kaydını oluşturur
- Servisi başlatır

### 3. `check-postgresql-simple.ps1`
PostgreSQL servis durumunu kontrol eder ve gerekirse başlatır.

```powershell
.\scripts\check-postgresql-simple.ps1
```

## Kullanım Senaryoları

### Senaryo 1: İlk Kurulum
PostgreSQL yüklü ama Windows servisi olarak kayıtlı değil:

```batch
scripts\add-postgresql-to-services.bat
```

veya

```powershell
# Yönetici olarak PowerShell açın
.\scripts\stop-and-register-service.ps1
```

### Senaryo 2: PostgreSQL Çalışıyor Ama Servis Görünmüyor
PostgreSQL `pg_ctl` ile başlatılmış, servis olarak kayıtlı değil:

```powershell
# Yönetici olarak PowerShell açın
.\scripts\stop-and-register-service.ps1
```

Bu script otomatik olarak:
- Çalışan PostgreSQL'i durdurur
- Port 5432'yi temizler
- `postmaster.pid` dosyasını siler
- Servis kaydını oluşturur
- Servisi başlatır

## Otomatik Kullanım

`start-dev.bat` dosyası otomatik olarak:
1. PostgreSQL servisini kontrol eder
2. Servis yoksa veya çalışmıyorsa manuel başlatmayı dener
3. Sorun varsa kullanıcıya bilgi verir

## Servis Bilgileri

Servis kaydı oluşturulduktan sonra:
- **Servis Adı:** `postgresql-x64-18` (veya versiyon numarasına göre)
- **Yönetim:** Windows Services (services.msc)
- **Otomatik Başlatma:** Bilgisayar açılışında otomatik başlar

## Sorun Giderme

### "Failed to start service" Hatası
1. `postmaster.pid` dosyasını kontrol edin
2. Port 5432'nin kullanılıp kullanılmadığını kontrol edin
3. Log dosyalarını kontrol edin: `C:\Program Files\PostgreSQL\18\data\*.log`

### Port 5432 Kullanımda
```powershell
# Portu kullanan süreçleri bul
netstat -ano | findstr ":5432"

# Süreci durdur (PID'yi değiştirin)
Stop-Process -Id <PID> -Force
```

### Servis Görünmüyor
```powershell
# Servisleri kontrol et
Get-Service | Where-Object {$_.Name -like "*postgresql*"}

# Servis kaydını yeniden oluştur
.\scripts\stop-and-register-service.ps1
```

### Servis Başlatılamıyor
```powershell
# Servisi durdur
Stop-Service postgresql-x64-18 -Force

# postmaster.pid dosyasını sil
Remove-Item "C:\Program Files\PostgreSQL\18\data\postmaster.pid" -Force

# Servisi tekrar başlat
Start-Service postgresql-x64-18
```

## Notlar

- Tüm scriptler PostgreSQL kurulumunu otomatik bulur (C:\Program Files\PostgreSQL\*)
- Scriptler farklı PostgreSQL versiyonlarını destekler (14, 15, 16, 17, 18)
- Servis kaydı oluşturmak için yönetici yetkisi gereklidir
- Manuel başlatma (pg_ctl) servis kaydı gerektirmez

