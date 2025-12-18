#!/usr/bin/env node

/**
 * Fix hardcoded date formats and locales in code files
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Files to fix (from audit report)
const filesToFix = [
    'app/[locale]/modules/accounting/expenses/[id]/ExpenseDetailPageClient.tsx',
    'app/[locale]/modules/accounting/invoices/[id]/InvoiceDetailPageClient.tsx',
    'app/[locale]/modules/accounting/subscriptions/[id]/SubscriptionDetailPageClient.tsx',
    'app/[locale]/modules/production/orders/[id]/OrderDetailPageClient.tsx',
    'app/[locale]/modules/production/products/[id]/ProductDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/agreement-reports/[id]/AgreementReportDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/apartments/[id]/ApartmentDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/appointments/[id]/AppointmentDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/email/campaigns/[id]/EmailCampaignDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/properties/[id]/PropertyDetailPageClient.tsx',
    'app/[locale]/modules/real-estate/reports/ReportsPageClient.tsx',
    'app/[locale]/modules/real-estate/staff/[id]/StaffDetailPageClient.tsx',
    'app/[locale]/admin/tenant-licenses/[id]/TenantLicenseDetailPageClient.tsx',
    'modules/raporlar/components/ReportView.tsx',
];

function fixFile(filePath) {
    const fullPath = path.join(SRC_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Check if useParams is already imported
    const hasUseParams = content.includes("useParams") && content.includes("from 'next/navigation'");
    const hasUseParamsFromNext = content.includes("useParams") && content.includes("from 'next/navigation'");
    
    // Add useParams import if needed and file uses toLocaleString/toLocaleDateString
    if (!hasUseParams && !hasUseParamsFromNext && (content.includes('toLocaleString') || content.includes('toLocaleDateString'))) {
        // Find the last import statement
        const importMatch = content.match(/(import\s+.*?from\s+['"][^'"]+['"];?\s*\n)+/);
        if (importMatch) {
            const lastImport = importMatch[0].split('\n').filter(l => l.trim()).pop();
            const insertIndex = content.indexOf(lastImport) + lastImport.length;
            content = content.slice(0, insertIndex) + "\nimport { useParams } from 'next/navigation';" + content.slice(insertIndex);
            modified = true;
        }
    }
    
    // Replace hardcoded 'tr-TR' locale
    const trTRPattern = /toLocale(?:String|DateString)\s*\(\s*['"]tr-TR['"]/g;
    if (trTRPattern.test(content)) {
        // Check if locale setup already exists
        if (!content.includes('const localeMap') && !content.includes('dateLocale')) {
            // Find function component start
            const functionMatch = content.match(/(export\s+(?:function|const)\s+\w+\s*[({][^)]*\)\s*{)/);
            if (functionMatch) {
                const insertIndex = functionMatch.index + functionMatch[0].length;
                const localeSetup = `
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-SA',
  };
  const dateLocale = localeMap[locale] || 'tr-TR';
`;
                content = content.slice(0, insertIndex) + localeSetup + content.slice(insertIndex);
                modified = true;
            }
        }
        
        // Replace all 'tr-TR' with dateLocale
        content = content.replace(/toLocale(?:String|DateString)\s*\(\s*['"]tr-TR['"]/g, (match) => {
            return match.replace("'tr-TR'", 'dateLocale').replace('"tr-TR"', 'dateLocale');
        });
        modified = true;
    }
    
    // Replace hardcoded date formats in dayjs().format()
    const dayjsFormatPattern = /dayjs\([^)]*\)\.format\s*\(\s*['"](DD\.MM\.YYYY|DD\/MM\/YYYY|YYYY-MM-DD|DD\.MM\.YYYY HH:mm)['"]/g;
    if (dayjsFormatPattern.test(content)) {
        // For now, we'll leave dayjs formats as they might be intentional
        // But we can add a comment suggesting locale-aware formatting
        console.log(`   ⚠️  Found hardcoded dayjs format in ${filePath} - manual review needed`);
    }
    
    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    }
    
    return false;
}

console.log('🔧 Fixing hardcoded date formats and locales...\n');
let fixed = 0;
filesToFix.forEach(file => {
    if (fixFile(file)) {
        fixed++;
    }
});

console.log(`\n✅ Fixed ${fixed} files`);







