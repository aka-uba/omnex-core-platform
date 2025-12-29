#!/bin/bash

# Güvenlik Raporlarını GitHub'dan Çekme Script'i
# Kullanım: ./scripts/fetch-security-reports.sh

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Omnex Core Platform - Güvenlik Durumu Raporu${NC}"
echo "=================================================="
echo ""

# GitHub CLI kontrolü
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) kurulu değil!${NC}"
    echo "Kurulum için: https://cli.github.com/"
    exit 1
fi

# 1. Dependabot PR'ları
echo -e "${YELLOW}📋 Dependabot PR'ları:${NC}"
DEPENDABOT_PRS=$(gh pr list --label "dependencies" --json number,title,updatedAt,url 2>/dev/null || echo "[]")
if [ "$DEPENDABOT_PRS" = "[]" ]; then
    echo -e "${GREEN}✅ Açık Dependabot PR'ı yok${NC}"
else
    echo "$DEPENDABOT_PRS" | jq -r '.[] | "  #\(.number): \(.title) (\(.updatedAt[:10]))"'
    echo ""
    echo -e "${BLUE}PR'ları incelemek için:${NC}"
    echo "  gh pr list --label \"dependencies\""
fi

echo ""

# 2. Son Security Audit Workflow
echo -e "${YELLOW}🔐 Son Security Audit Çalıştırması:${NC}"
LATEST_RUN=$(gh run list --workflow="Security Audit" --limit 1 --json databaseId,conclusion,createdAt,status 2>/dev/null || echo "[]")
if [ "$LATEST_RUN" != "[]" ]; then
    RUN_ID=$(echo "$LATEST_RUN" | jq -r '.[0].databaseId')
    CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
    CREATED_AT=$(echo "$LATEST_RUN" | jq -r '.[0].createdAt[:10]')

    if [ "$CONCLUSION" = "success" ]; then
        echo -e "  ${GREEN}✅ Başarılı${NC} - $CREATED_AT (Run #$RUN_ID)"
    elif [ "$CONCLUSION" = "failure" ]; then
        echo -e "  ${RED}❌ Başarısız${NC} - $CREATED_AT (Run #$RUN_ID)"
        echo -e "  ${BLUE}Detayları görüntüle:${NC} gh run view $RUN_ID"
    else
        echo -e "  ⏳ Durum: $CONCLUSION - $CREATED_AT (Run #$RUN_ID)"
    fi
else
    echo -e "${YELLOW}⚠️  Security Audit workflow henüz çalışmamış${NC}"
fi

echo ""

# 3. Güvenlik Alertleri (Dependabot Alerts)
echo -e "${YELLOW}⚠️  Aktif Güvenlik Alertleri:${NC}"
REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -n "$REPO_NAME" ]; then
    ALERTS=$(gh api "/repos/$REPO_NAME/dependabot/alerts" --jq '[.[] | select(.state == "open")] | length' 2>/dev/null || echo "0")

    if [ "$ALERTS" = "0" ]; then
        echo -e "${GREEN}✅ Aktif güvenlik alerti yok${NC}"
    else
        echo -e "${RED}❌ $ALERTS aktif alert bulundu!${NC}"
        echo ""
        gh api "/repos/$REPO_NAME/dependabot/alerts" --jq '.[] | select(.state == "open") | {
            number: .number,
            severity: .security_advisory.severity,
            package: .security_vulnerability.package.name,
            summary: .security_advisory.summary
        }' 2>/dev/null | jq -r '"  Alert #\(.number): [\(.severity | ascii_upcase)] \(.package) - \(.summary)"'
    fi
else
    echo -e "${YELLOW}⚠️  Repository bilgisi alınamadı${NC}"
fi

echo ""

# 4. Locale npm audit
echo -e "${YELLOW}🔍 Locale NPM Audit:${NC}"
if npm audit --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kritik/yüksek seviye güvenlik açığı yok${NC}"
else
    echo -e "${RED}❌ Güvenlik açıkları tespit edildi!${NC}"
    echo ""
    npm audit --audit-level=high || true
fi

echo ""

# 5. Güncel olmayan paketler
echo -e "${YELLOW}📦 Güncel Olmayan Paketler:${NC}"
OUTDATED=$(npm outdated 2>/dev/null || echo "")
if [ -z "$OUTDATED" ]; then
    echo -e "${GREEN}✅ Tüm paketler güncel${NC}"
else
    echo "$OUTDATED"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📊 Özet Komutlar:${NC}"
echo ""
echo "  Dependabot PR'ları:        gh pr list --label \"dependencies\""
echo "  Security Audit Sonuçları:  gh run list --workflow=\"Security Audit\""
echo "  Manuel Audit:              npm audit"
echo "  Paket Güncellemeleri:      npm outdated"
echo ""
echo -e "${GREEN}✅ Rapor tamamlandı!${NC}"
