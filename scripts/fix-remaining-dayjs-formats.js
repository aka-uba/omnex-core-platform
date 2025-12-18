#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Files with dayjs format issues
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
];

function fixFile(filePath) {
    const fullPath = path.join(SRC_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Check if date-format utils are imported
    const hasDateFormatImport = content.includes("from '@/lib/utils/date-format'");
    
    // Add import if needed and file uses dayjs().format()
    if (!hasDateFormatImport && content.includes('dayjs') && content.includes('.format(')) {
        // Find dayjs import
        const dayjsImportMatch = content.match(/import\s+dayjs\s+from\s+['"][^'"]+['"];?\s*\n/);
        if (dayjsImportMatch) {
            const insertIndex = dayjsImportMatch.index + dayjsImportMatch[0].length;
            content = content.slice(0, insertIndex) + "import { getDateFormat, getDateTimeFormat } from '@/lib/utils/date-format';\n" + content.slice(insertIndex);
            modified = true;
        }
    }
    
    // Check if useParams is imported (for locale)
    const hasUseParams = content.includes("useParams") && content.includes("from 'next/navigation'");
    
    // Add useParams if needed
    if (!hasUseParams && content.includes('dayjs') && content.includes('.format(')) {
        const importMatch = content.match(/(import\s+.*?from\s+['"][^'"]+['"];?\s*\n)+/);
        if (importMatch) {
            const lastImport = importMatch[0].split('\n').filter(l => l.trim()).pop();
            const insertIndex = content.indexOf(lastImport) + lastImport.length;
            content = content.slice(0, insertIndex) + "\nimport { useParams } from 'next/navigation';\n" + content.slice(insertIndex);
            modified = true;
        }
    }
    
    // Add locale setup if needed
    if (!content.includes('const dateLocale') && !content.includes('getDateFormat(') && content.includes('dayjs') && content.includes('.format(')) {
        // Find function component start
        const functionMatch = content.match(/(export\s+(?:function|const)\s+\w+\s*[({][^)]*\)\s*{)/);
        if (functionMatch) {
            const insertIndex = functionMatch.index + functionMatch[0].length;
            const localeSetup = `
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
`;
            content = content.slice(0, insertIndex) + localeSetup + content.slice(insertIndex);
            modified = true;
        }
    }
    
    // Replace hardcoded date formats
    const formatReplacements = [
        { pattern: /\.format\s*\(\s*['"]DD\.MM\.YYYY['"]/g, replacement: `.format(getDateFormat(locale))` },
        { pattern: /\.format\s*\(\s*['"]DD\/MM\/YYYY['"]/g, replacement: `.format(getDateFormat(locale))` },
        { pattern: /\.format\s*\(\s*['"]YYYY-MM-DD['"]/g, replacement: `.format(getDateFormat(locale))` },
        { pattern: /\.format\s*\(\s*['"]DD\.MM\.YYYY HH:mm['"]/g, replacement: `.format(getDateTimeFormat(locale))` },
        { pattern: /\.format\s*\(\s*['"]DD\/MM\/YYYY HH:mm['"]/g, replacement: `.format(getDateTimeFormat(locale))` },
    ];
    
    formatReplacements.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
            content = content.replace(pattern, replacement);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    }
    
    return false;
}

console.log('🔧 Fixing remaining dayjs format issues...\n');
let fixed = 0;
filesToFix.forEach(file => {
    if (fixFile(file)) {
        fixed++;
    }
});

console.log(`\n✅ Fixed ${fixed} files`);







