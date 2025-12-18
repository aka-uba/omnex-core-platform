# PostgreSQL Servis ve Baglanti Kontrol Script (Basit Versiyon)
# Hata mesajlarını görmek için

$ErrorActionPreference = "Continue"

# Tüm hataları yakala
trap {
    Write-Host "[HATA] Beklenmeyen hata: $_" -ForegroundColor Red
    Write-Host "[HATA] Detay: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[HATA] Satir: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
    exit 1
}

Write-Host "[BILGI] PostgreSQL servisi araniyor..." -ForegroundColor Cyan

# PostgreSQL servislerini bul
$services = Get-Service | Where-Object {
    $_.DisplayName -like "*PostgreSQL*" -or 
    $_.Name -like "*postgresql*" -or
    $_.Name -like "*postgres*"
}

if ($services.Count -eq 0) {
    Write-Host "[UYARI] PostgreSQL servisi bulunamadi!" -ForegroundColor Yellow
    Write-Host "[BILGI] Servis kaydi olmadan manuel baslatma deneniyor..." -ForegroundColor Cyan
    
    # Manuel başlatma scriptini dene
    $manualScript = Join-Path $PSScriptRoot "start-postgresql-manual.ps1"
    if (Test-Path $manualScript) {
        Write-Host "[BILGI] Manuel baslatma scripti calistiriliyor: $manualScript" -ForegroundColor Cyan
        & $manualScript
        $manualExitCode = $LASTEXITCODE
        if ($manualExitCode -eq 0) {
            Write-Host "[BILGI] PostgreSQL manuel olarak baslatildi." -ForegroundColor Green
            Start-Sleep -Seconds 3
        } else {
            Write-Host "[HATA] PostgreSQL manuel baslatma basarisiz! Exit code: $manualExitCode" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[HATA] Manuel baslatma scripti bulunamadi: $manualScript" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[BILGI] Bulunan PostgreSQL servisleri:" -ForegroundColor Green
    $services | ForEach-Object {
        Write-Host "  - $($_.DisplayName) ($($_.Name)): $($_.Status)" -ForegroundColor Gray
    }
    
    # Servisleri baslat
    $runningService = $null
    foreach ($service in $services) {
        if ($service.Status -eq "Running") {
            $runningService = $service
            Write-Host "[BILGI] $($service.DisplayName) zaten calisiyor." -ForegroundColor Green
            break
        } else {
            Write-Host "[UYARI] $($service.DisplayName) calismiyor. Baslatiliyor..." -ForegroundColor Yellow
            try {
                Start-Service -Name $service.Name -ErrorAction Stop
                Start-Sleep -Seconds 3
                $service.Refresh()
                if ($service.Status -eq "Running") {
                    $runningService = $service
                    Write-Host "[BILGI] $($service.DisplayName) baslatildi." -ForegroundColor Green
                    break
                } else {
                    Write-Host "[UYARI] $($service.DisplayName) baslatilamadi. Durum: $($service.Status)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "[UYARI] $($service.DisplayName) baslatilamadi: $_" -ForegroundColor Yellow
            }
        }
    }
    
    if (-not $runningService) {
        Write-Host "[HATA] Calisan PostgreSQL servisi bulunamadi!" -ForegroundColor Red
        exit 1
    }
}

# Port 5432 baglantisini test et
Write-Host "[BILGI] PostgreSQL baglantisi test ediliyor (localhost:5432)..." -ForegroundColor Cyan

try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect("localhost", 5432, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($wait) {
        try {
            $tcpClient.EndConnect($connection)
            Write-Host "[BILGI] PostgreSQL baglantisi basarili (localhost:5432)" -ForegroundColor Green
            $tcpClient.Close()
        } catch {
            Write-Host "[HATA] PostgreSQL baglantisi kurulamadi: $_" -ForegroundColor Red
            $tcpClient.Close()
            exit 1
        }
    } else {
        Write-Host "[HATA] PostgreSQL port 5432'ye baglanilamadi (timeout)" -ForegroundColor Red
        $tcpClient.Close()
        exit 1
    }
} catch {
    Write-Host "[HATA] PostgreSQL baglanti testi basarisiz: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[BILGI] PostgreSQL kontrolu tamamlandi." -ForegroundColor Green
exit 0

