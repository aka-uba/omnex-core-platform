# PostgreSQL'i Durdur ve Windows Servisi Olarak Kaydet
# Yönetici olarak çalıştırın!

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL'i Servis Olarak Kaydetme" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Yönetici kontrolü
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[HATA] Bu script yonetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "[BILGI] PowerShell'i sag tiklayip 'Run as Administrator' secin." -ForegroundColor Yellow
    exit 1
}

# PostgreSQL kurulum dizinleri (otomatik bulma)
$possibleInstallPaths = @(
    "C:\Program Files\PostgreSQL\18",
    "C:\Program Files\PostgreSQL\17",
    "C:\Program Files\PostgreSQL\16",
    "C:\Program Files\PostgreSQL\15",
    "C:\Program Files\PostgreSQL\14",
    "C:\Program Files (x86)\PostgreSQL\18",
    "C:\Program Files (x86)\PostgreSQL\17"
)

$dataPath = $null
$binPath = $null
$pgctlPath = $null
$serviceName = $null
$installPath = $null

# PostgreSQL kurulumunu bul
Write-Host "[BILGI] PostgreSQL kurulumu araniyor..." -ForegroundColor Cyan
foreach ($path in $possibleInstallPaths) {
    if (Test-Path $path) {
        $testBinPath = Join-Path $path "bin"
        $testPgCtl = Join-Path $testBinPath "pg_ctl.exe"
        
        if (Test-Path $testPgCtl) {
            $installPath = $path
            $binPath = $testBinPath
            $pgctlPath = $testPgCtl
            $dataPath = Join-Path $path "data"
            
            # Versiyonu bul
            $versionMatch = $path -match "PostgreSQL\\(\d+)"
            if ($versionMatch) {
                $pgVersion = $matches[1]
                $serviceName = "postgresql-x64-$pgVersion"
            } else {
                $serviceName = "postgresql-x64-18"
            }
            
            Write-Host "[BILGI] PostgreSQL bulundu: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $pgctlPath) {
    Write-Host "[HATA] PostgreSQL kurulumu bulunamadi!" -ForegroundColor Red
    Write-Host "[BILGI] Lutfen PostgreSQL'in kurulu oldugundan emin olun." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $dataPath)) {
    Write-Host "[HATA] PostgreSQL data dizini bulunamadi: $dataPath" -ForegroundColor Red
    exit 1
}

$pidFile = Join-Path $dataPath "postmaster.pid"

Write-Host "[BILGI] PostgreSQL data dizini: $dataPath" -ForegroundColor Green
Write-Host "[BILGI] pg_ctl.exe: $pgctlPath" -ForegroundColor Gray
Write-Host ""

# 1. Çalışan PostgreSQL süreçlerini durdur
Write-Host "[BILGI] Calisan PostgreSQL surecleri kontrol ediliyor..." -ForegroundColor Cyan
$postgresProcesses = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if ($postgresProcesses) {
    Write-Host "[UYARI] Calisan PostgreSQL surecleri bulundu:" -ForegroundColor Yellow
    $postgresProcesses | ForEach-Object { Write-Host "  PID: $($_.Id) - $($_.ProcessName)" -ForegroundColor Gray }
    
    # Önce pg_ctl ile durdurmayı dene
    Write-Host "[BILGI] PostgreSQL durduruluyor (pg_ctl ile)..." -ForegroundColor Cyan
    try {
        & $pgctlPath stop -D $dataPath -m fast -w 2>&1 | Out-Null
        Start-Sleep -Seconds 3
    } catch {
        # Hata olsa bile devam et
    }
    
    # Hala çalışan süreçleri kontrol et ve zorla durdur
    $stillRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
    if ($stillRunning) {
        Write-Host "[UYARI] pg_ctl ile durdurulamadi, surecler zorla durduruluyor..." -ForegroundColor Yellow
        $stillRunning | ForEach-Object {
            Write-Host "  PID $($_.Id) durduruluyor..." -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 3
    }
    
    # Son kontrol
    $finalCheck = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
    if ($finalCheck) {
        Write-Host "[HATA] Bazı surecler hala calisiyor! PID: $($finalCheck.Id -join ', ')" -ForegroundColor Red
        Write-Host "[BILGI] Task Manager ile manuel olarak durdurun." -ForegroundColor Yellow
    } else {
        Write-Host "[BILGI] Tum PostgreSQL surecleri durduruldu." -ForegroundColor Green
    }
} else {
    Write-Host "[BILGI] Calisan PostgreSQL sureci bulunamadi." -ForegroundColor Green
}

# 2. Port 5432 kontrolü ve kullanan süreçleri durdur
Write-Host "[BILGI] Port 5432 kontrol ediliyor..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Port 5432'yi kullanan süreçleri bul
$netstatOutput = netstat -ano | findstr ":5432" | findstr "LISTENING"
if ($netstatOutput) {
    Write-Host "[UYARI] Port 5432 hala kullaniliyor!" -ForegroundColor Yellow
    Write-Host "[BILGI] Portu kullanan surec:" -ForegroundColor Cyan
    Write-Host $netstatOutput -ForegroundColor Gray
    
    # PID'leri çıkar ve durdur
    $pids = $netstatOutput | ForEach-Object {
        if ($_ -match '\s+(\d+)$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    if ($pids) {
        Write-Host "[BILGI] Port 5432'yi kullanan surecler durduruluyor..." -ForegroundColor Cyan
        foreach ($pid in $pids) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  PID $pid ($($proc.ProcessName)) durduruluyor..." -ForegroundColor Gray
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  PID $pid durdurulamadi: $_" -ForegroundColor Yellow
            }
        }
        Start-Sleep -Seconds 3
    }
    
    # Tekrar kontrol et
    $stillListening = netstat -ano | findstr ":5432" | findstr "LISTENING"
    if ($stillListening) {
        Write-Host "[HATA] Port 5432 hala kullaniliyor!" -ForegroundColor Red
        Write-Host "[BILGI] Lutfen manuel olarak durdurun veya bilgisayari yeniden baslatin." -ForegroundColor Yellow
    } else {
        Write-Host "[BILGI] Port 5432 bos." -ForegroundColor Green
    }
} else {
    Write-Host "[BILGI] Port 5432 bos." -ForegroundColor Green
}

# 3. postmaster.pid dosyasını sil
Write-Host "[BILGI] postmaster.pid dosyasi kontrol ediliyor..." -ForegroundColor Cyan
if (Test-Path $pidFile) {
    Write-Host "[UYARI] postmaster.pid dosyasi bulundu, siliniyor..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $pidFile -Force -ErrorAction Stop
        Write-Host "[BILGI] postmaster.pid dosyasi silindi." -ForegroundColor Green
    } catch {
        Write-Host "[HATA] postmaster.pid silinemedi: $_" -ForegroundColor Red
        Write-Host "[BILGI] Dosya kilitli olabilir. Devam ediliyor..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[BILGI] postmaster.pid dosyasi bulunamadi (normal)." -ForegroundColor Green
}

Write-Host ""

# 4. Mevcut servisi kontrol et ve sil
Write-Host "[BILGI] Mevcut servis kontrol ediliyor..." -ForegroundColor Cyan
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "[BILGI] Servis zaten kayitli: $serviceName" -ForegroundColor Yellow
    Write-Host "[BILGI] Servis durumu: $($existingService.Status)" -ForegroundColor Gray
    
    if ($existingService.Status -eq "Running") {
        Write-Host "[BILGI] Servis durduruluyor..." -ForegroundColor Cyan
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    }
    
    Write-Host "[BILGI] Servis siliniyor..." -ForegroundColor Cyan
    sc.exe delete $serviceName | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "[BILGI] Eski servis kaydi silindi." -ForegroundColor Green
} else {
    Write-Host "[BILGI] Mevcut servis kaydi bulunamadi." -ForegroundColor Green
}

Write-Host ""

# 5. Servis kaydını oluştur
Write-Host "[BILGI] PostgreSQL servis kaydi olusturuluyor..." -ForegroundColor Cyan
Write-Host "[BILGI] Servis adi: $serviceName" -ForegroundColor Gray
Write-Host "[BILGI] Data dizini: $dataPath" -ForegroundColor Gray
Write-Host ""

try {
    $registerArgs = @(
        "register",
        "-N", $serviceName,
        "-D", "`"$dataPath`"",
        "-w"
    )
    
    Write-Host "[BILGI] Komut: $pgctlPath $($registerArgs -join ' ')" -ForegroundColor Gray
    $process = Start-Process -FilePath $pgctlPath -ArgumentList $registerArgs -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "[BILGI] Servis kaydi basarili!" -ForegroundColor Green
        Write-Host ""
        
        # Servisi başlat
        Write-Host "[BILGI] Servis baslatiliyor..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        
        try {
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Seconds 5
            
            $service = Get-Service -Name $serviceName
            if ($service.Status -eq "Running") {
                Write-Host "[BILGI] PostgreSQL servisi basariyla baslatildi!" -ForegroundColor Green
                
                # Bağlantı testi
                Start-Sleep -Seconds 2
                try {
                    $tcpClient = New-Object System.Net.Sockets.TcpClient
                    $connection = $tcpClient.BeginConnect("localhost", 5432, $null, $null)
                    $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
                    if ($wait) {
                        $tcpClient.EndConnect($connection)
                        Write-Host "[BILGI] PostgreSQL baglantisi basarili (localhost:5432)" -ForegroundColor Green
                        $tcpClient.Close()
                    }
                } catch {
                    Write-Host "[UYARI] Baglanti testi basarisiz." -ForegroundColor Yellow
                }
                
            } else {
                Write-Host "[HATA] Servis baslatilamadi. Durum: $($service.Status)" -ForegroundColor Red
                
                # Log kontrolü
                $logFiles = Get-ChildItem -Path $dataPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($logFiles) {
                    Write-Host "[BILGI] Log dosyasi: $($logFiles.FullName)" -ForegroundColor Cyan
                    Write-Host "[BILGI] Son 15 satir:" -ForegroundColor Cyan
                    Get-Content $logFiles.FullName -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                }
                exit 1
            }
        } catch {
            Write-Host "[HATA] Servis baslatma hatasi: $_" -ForegroundColor Red
            Write-Host "[BILGI] Detay: $($_.Exception.Message)" -ForegroundColor Yellow
            
            # Log kontrolü
            $logFiles = Get-ChildItem -Path $dataPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($logFiles) {
                Write-Host "[BILGI] Log dosyasi: $($logFiles.FullName)" -ForegroundColor Cyan
                Get-Content $logFiles.FullName -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
            }
            exit 1
        }
        
        Write-Host ""
        Write-Host "[BILGI] Servis bilgileri:" -ForegroundColor Cyan
        Get-Service -Name $serviceName | Format-List Name, DisplayName, Status, StartType
        
    } else {
        Write-Host "[HATA] Servis kaydi basarisiz! (Exit Code: $($process.ExitCode))" -ForegroundColor Red
        Write-Host "[BILGI] Hata detaylari icin yukaridaki ciktiyi kontrol edin." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[HATA] Servis kaydi hatasi: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[BILGI] PostgreSQL servisi basariyla kaydedildi ve baslatildi!" -ForegroundColor Green
Write-Host "[BILGI] Artik Windows servisleri uzerinden yonetebilirsiniz:" -ForegroundColor Cyan
Write-Host "[BILGI]   - services.msc acin" -ForegroundColor Gray
Write-Host "[BILGI]   - 'postgresql-x64-18' servisini bulun" -ForegroundColor Gray
Write-Host ""

exit 0

