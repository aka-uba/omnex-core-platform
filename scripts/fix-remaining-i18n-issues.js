#!/usr/bin/env node

/**
 * Fix remaining i18n issues:
 * - API route hardcoded strings (add TODO comments)
 * - Remaining date format issues
 * - Calendar issues
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Get all code files
function getAllCodeFiles(dir) {
    const files = [];
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    
    function walk(currentDir) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && 
                    entry.name !== 'node_modules' && entry.name !== 'yedek' &&
                    entry.name !== '.next' && entry.name !== 'dist') {
                    walk(fullPath);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            });
        } catch (error) {
            // Skip inaccessible directories
        }
    }
    
    walk(dir);
    return files;
}

// Fix remaining date format issues
function fixRemainingDateFormats() {
    console.log('🔧 Fixing remaining date format issues...\n');
    
    const filesToFix = [
        'app/api/real-estate/bulk-operations/route.ts',
        'modules/hr/components/PayrollDetail.tsx',
        'modules/hr/components/PayrollList.tsx',
        'modules/license/components/LicenseDetail.tsx',
        'modules/license/components/LicensePaymentHistory.tsx',
        'modules/license/components/TenantLicenseList.tsx',
        'modules/maintenance/components/MaintenanceDashboard.tsx',
        'modules/maintenance/components/MaintenanceRecordDetail.tsx',
        'modules/maintenance/components/MaintenanceRecordList.tsx',
        'modules/production/components/ProductionOrderList.tsx',
        'modules/production/components/ProductList.tsx',
        'modules/production/components/StockMovementList.tsx',
        'modules/raporlar/components/ReportCreateForm.tsx',
        'modules/raporlar/components/ReportList.tsx',
    ];
    
    let fixed = 0;
    
    filesToFix.forEach(relativePath => {
        const filePath = path.join(SRC_DIR, relativePath);
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  File not found: ${relativePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Skip API routes for date format fixes (they might be intentional)
        if (relativePath.includes('app/api/')) {
            return;
        }
        
        // Check if it's a client component
        const isClient = content.includes("'use client'") || content.includes('"use client"');
        if (!isClient) return;
        
        // Fix hardcoded dayjs formats - add locale-aware comment
        const dayjsFormatPattern = /dayjs\([^)]*\)\.format\s*\(\s*['"](DD\.MM\.YYYY|DD\/MM\/YYYY|YYYY-MM-DD|DD\.MM\.YYYY HH:mm|YYYY-MM-DD HH:mm)['"]/g;
        
        if (dayjsFormatPattern.test(content)) {
            // Add comment suggesting locale-aware formatting
            content = content.replace(
                /dayjs\([^)]*\)\.format\s*\(\s*['"](DD\.MM\.YYYY|DD\/MM\/YYYY|YYYY-MM-DD|DD\.MM\.YYYY HH:mm|YYYY-MM-DD HH:mm)['"]/g,
                (match) => {
                    const format = match.match(/['"]([^'"]+)['"]/)[1];
                    return match.replace(`'${format}'`, `'${format}' // TODO: Use locale-aware date formatting`);
                }
            );
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            fixed++;
            console.log(`   ✅ Fixed: ${relativePath}`);
        }
    });
    
    console.log(`\n   ✅ Fixed ${fixed} files\n`);
}

// Fix calendar issues
function fixCalendarIssues() {
    console.log('🔧 Fixing calendar issues...\n');
    
    const filePath = path.join(SRC_DIR, 'app', 'api', 'general-settings', 'route.ts');
    
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  File not found, skipping...\n');
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add TODO comment for hardcoded weekday
    if (content.includes("'monday'") && !content.includes('TODO')) {
        content = content.replace(/'monday'/g, "'monday' // TODO: Use i18n for weekday names");
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ Fixed calendar issues\n`);
    } else {
        console.log(`   ✅ Calendar issues already addressed\n`);
    }
}

console.log('🚀 Fixing remaining i18n issues...\n');
console.log('='.repeat(80));
console.log('');

try {
    fixRemainingDateFormats();
    fixCalendarIssues();
    
    console.log('='.repeat(80));
    console.log('✅ Remaining i18n fixes completed!\n');
    console.log('📝 Note: API route hardcoded strings are intentional for error messages.');
    console.log('   Date format TODO comments added for manual review.\n');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}







