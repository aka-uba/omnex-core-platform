# 🔐 Güvenlik Politikası ve Otomatik Kontroller

Bu dokümantasyon, Omnex Core Platform projesi için güvenlik açıklarının otomatik kontrolü ve yönetimi hakkında bilgi içerir.

## 📋 İçindekiler

- [Otomatik Güvenlik Kontrolleri](#otomatik-güvenlik-kontrolleri)
- [GitHub'dan Locale Bilgi Çekme](#githubdan-locale-bilgi-çekme)
- [Manuel Kontroller](#manuel-kontroller)
- [Güvenlik Açığı Bildirimi](#güvenlik-açığı-bildirimi)
- [Güncelleme Süreci](#güncelleme-süreci)

---

## 🤖 Otomatik Güvenlik Kontrolleri

Projemizde 3 seviye otomatik güvenlik kontrolü bulunmaktadır:

### 1. **Dependabot** (`.github/dependabot.yml`)

**Ne yapar:**
- Her Pazartesi 09:00'da tüm npm paketlerini kontrol eder
- Güvenlik açıkları için otomatik PR oluşturur
- Patch ve minor güncellemeler için ayrı PR'lar açar

**Nasıl çalışır:**
```yaml
- Haftalık tarama (Pazartesi 09:00)
- Otomatik PR oluşturma
- Etiketleme: "dependencies", "automated"
- Maksimum 10 açık PR
```

**PR'ları görüntüleme:**
```bash
# GitHub'dan Dependabot PR'larını listele
gh pr list --label "dependencies"

# Belirli bir PR'ı inceleme
gh pr view <PR_NUMBER>

# PR'ı locale çekme
gh pr checkout <PR_NUMBER>
```

### 2. **GitHub Actions - Security Audit** (`.github/workflows/security-audit.yml`)

**Tetiklenme koşulları:**
- ✅ Her push (main, develop, feature/*)
- ✅ Her pull request
- ✅ Haftalık otomatik (Pazartesi 09:00)
- ✅ Manuel tetikleme

**Yaptığı kontroller:**
1. **NPM Audit:** High ve critical seviye açıklar
2. **Dependency Review:** PR'larda bağımlılık incelemesi
3. **Trivy Scan:** Gelişmiş güvenlik taraması

**Sonuçları görüntüleme:**

```bash
# 1. GitHub Actions sonuçlarını görüntüleme
gh run list --workflow="Security Audit"

# 2. Son çalıştırmanın detaylarını görme
gh run view <RUN_ID>

# 3. Audit raporunu indirme
gh run download <RUN_ID> -n security-audit-results

# 4. İndirilen raporu okuma
cat audit.json | jq '.vulnerabilities'
```

### 3. **GitHub Security Alerts**

GitHub otomatik olarak güvenlik açıklarını tespit eder ve bildirir.

---

## 📥 GitHub'dan Locale Bilgi Çekme

### Dependabot PR'larını Locale Çekme

```bash
# 1. Tüm Dependabot PR'larını listele
gh pr list --label "dependencies" --json number,title,url

# 2. Belirli bir PR'ı checkout et
gh pr checkout <PR_NUMBER>

# 3. Değişiklikleri incele
git diff main

# 4. Testleri çalıştır
npm install
npm test
npm run build

# 5. Sorun yoksa merge et
gh pr merge <PR_NUMBER> --squash
```

### Security Audit Raporlarını İndirme

```bash
# 1. Son audit çalıştırmasını bul
LATEST_RUN=$(gh run list --workflow="Security Audit" --limit 1 --json databaseId --jq '.[0].databaseId')

# 2. Raporu indir
gh run download $LATEST_RUN -n security-audit-results

# 3. Raporu oku (jq gerekli)
cat audit.json | jq '
  {
    metadata: .metadata,
    vulnerabilities: .vulnerabilities | length,
    critical: [.vulnerabilities[] | select(.severity == "critical")] | length,
    high: [.vulnerabilities[] | select(.severity == "high")] | length
  }
'
```

### Güvenlik Alertlerini Çekme

```bash
# GitHub CLI ile güvenlik alertlerini görüntüleme
gh api /repos/{owner}/{repo}/dependabot/alerts \
  --jq '.[] | {
    number: .number,
    state: .state,
    severity: .security_advisory.severity,
    package: .security_vulnerability.package.name,
    summary: .security_advisory.summary
  }'
```

### Script ile Otomatik İndirme

Proje klasörünüzde bir script oluşturun:

```bash
# scripts/fetch-security-reports.sh
#!/bin/bash

echo "🔍 Güvenlik raporları çekiliyor..."

# Dependabot PR'ları
echo "📋 Dependabot PR'ları:"
gh pr list --label "dependencies" --json number,title,updatedAt

# Son security audit
echo ""
echo "🔐 Son Security Audit:"
LATEST_RUN=$(gh run list --workflow="Security Audit" --limit 1 --json databaseId,conclusion,createdAt --jq '.[0]')
echo $LATEST_RUN | jq '.'

# Güvenlik alertleri
echo ""
echo "⚠️  Aktif Güvenlik Alertleri:"
gh api /repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/dependabot/alerts \
  --jq '.[] | select(.state == "open") | {severity: .security_advisory.severity, package: .security_vulnerability.package.name}'

echo ""
echo "✅ Raporlar tamamlandı!"
```

**Kullanım:**
```bash
chmod +x scripts/fetch-security-reports.sh
./scripts/fetch-security-reports.sh
```

---

## 🔧 Manuel Kontroller

### Locale Güvenlik Kontrolü

```bash
# 1. Tüm bağımlılıkları kontrol et
npm audit

# 2. Sadece production bağımlılıkları
npm audit --production

# 3. Sadece kritik ve yüksek seviye
npm audit --audit-level=high

# 4. Otomatik düzeltme (dikkatli kullanın!)
npm audit fix

# 5. Major versiyonları da dahil et
npm audit fix --force

# 6. Detaylı rapor
npm audit --json > audit-report.json
```

### Paket Güncellik Kontrolü

```bash
# Güncel olmayan paketleri listele
npm outdated

# İnteraktif güncelleme
npx npm-check-updates --interactive

# Tüm paketleri en son versiyona güncelle (DİKKATLİ!)
npx npm-check-updates -u
npm install
```

---

## 🚨 Güvenlik Açığı Bildirimi

### Kritik Güvenlik Açıkları (CVE-2025-55182 gibi)

**Acil durumlarda yapılacaklar:**

1. **Locale güncelleme:**
```bash
# Güvenli versiyona güncelle
npm install react@19.2.3 react-dom@19.2.3

# Test et
npm test
npm run build

# Commit et
git add package.json package-lock.json
git commit -m "security: Update React to 19.2.3 (CVE-2025-55182)"
git push
```

2. **Production'a hızlı deploy:**
```bash
# Build al
npm run build

# Deploy et (metodunuza göre)
# Örn: npm run deploy:production
```

3. **Ekibi bilgilendir:**
   - GitHub Issue oluştur
   - Slack/Teams bildirimi gönder
   - Changelog güncelle

---

## 📅 Güncelleme Süreci

### Haftalık Rutin (Otomatik)

**Her Pazartesi 09:00:**
1. Dependabot çalışır → PR oluşturur
2. Security Audit workflow çalışır → Rapor üretir
3. GitHub Security Alert kontrol eder

### Aylık Rutin (Manuel)

```bash
# 1. Tüm güvenlik raporlarını çek
./scripts/fetch-security-reports.sh

# 2. Manuel audit
npm audit
npm outdated

# 3. Dependabot PR'larını incele ve merge et
gh pr list --label "dependencies"

# 4. Gerekirse major güncellemeler yap
npx npm-check-updates --interactive
```

### Acil Güncelleme (Kritik CVE)

```bash
# 1. Hızlı güncelleme
npm install <package>@<safe-version>

# 2. Test
npm test && npm run build

# 3. Commit ve push
git add .
git commit -m "security: Fix <CVE-ID>"
git push

# 4. Acil deploy
npm run deploy:production
```

---

## 🛠️ GitHub CLI Kurulumu

GitHub'dan bilgi çekmek için GitHub CLI gereklidir:

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install --id GitHub.cli

# Kimlik doğrulama
gh auth login
```

---

## 📊 Dashboard Komutları

Tüm güvenlik durumunu görüntülemek için:

```bash
# Hızlı özet
echo "=== GÜVENLIK DURUMU ==="
echo ""
echo "📋 Açık Dependabot PR'ları:"
gh pr list --label "dependencies" --json number,title --jq 'length'
echo ""
echo "⚠️  Aktif Alertler:"
gh api /repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/dependabot/alerts \
  --jq '[.[] | select(.state == "open")] | length'
echo ""
echo "✅ Son Audit:"
npm audit --audit-level=high || echo "Güvenlik açıkları mevcut!"
```

---

## 📝 Notlar

- **Dependabot PR'ları** otomatik oluşturulur ama manuel merge gerektirir
- **Security Audit** başarısız olursa CI/CD pipeline durur
- **Kritik açıklar** için anında bildirim almak isterseniz GitHub Notifications'ı açın
- **package-lock.json** her zaman commit edilmelidir

---

## 🔗 Faydalı Linkler

- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [CVE Database](https://cve.mitre.org/)
- [Snyk Vulnerability DB](https://security.snyk.io/)

---

**Son Güncelleme:** 2025-12-29
**Proje:** Omnex Core Platform
**Sorumlular:** Development Team
