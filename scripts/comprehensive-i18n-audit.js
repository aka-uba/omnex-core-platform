#!/usr/bin/env node

/**
 * Comprehensive i18n Audit Script
 * 
 * Checks for:
 * - Missing translations across all languages
 * - Duplicate keys
 * - Hardcoded strings
 * - Wrong/mismatched keys
 * - Key structure differences between locale files
 * - Date/time formatting issues
 * - Calendar view issues
 * - Date picker default language issues
 * - And more...
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'];

// Turkish characters for hardcoded detection
const TURKISH_CHARS = /[çğıöşüÇĞIİÖŞÜ]/;
const ARABIC_CHARS = /[ء-ي]/;
const GERMAN_CHARS = /[äöüßÄÖÜ]/;

// Common hardcoded patterns
const HARDCODED_PATTERNS = [
    /['"](Aralık|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4}['"]/gi,
    /['"](January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}['"]/gi,
    /['"](Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}['"]/gi,
    /placeholder=['"]Select date|Choose date|Pick date|Select...|Choose.../gi,
    /format=['"]DD\.MM\.YYYY|MM\/DD\/YYYY|YYYY-MM-DD/gi,
];

// Get all TypeScript/TSX files
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

// Get all keys from a JSON object recursively
function getAllKeys(obj, prefix = '') {
    const keys = [];
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return keys;
    }
    
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys.push(...getAllKeys(obj[key], fullKey));
        }
    });
    
    return keys;
}

// Get value by key path
function getValueByPath(obj, keyPath) {
    const parts = keyPath.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return undefined;
        }
    }
    
    return current;
}

// Check for hardcoded strings
function findHardcodedStrings(content, filePath) {
    const issues = [];
    const relativePath = path.relative(SRC_DIR, filePath);
    
    // Skip if it's a locale file, config, API routes, or setup/yedek directories
    if (relativePath.includes('locales/') || relativePath.includes('i18n/') ||
        relativePath.includes('(setup)') || relativePath.includes('yedek/') ||
        relativePath.includes('app/api/') || relativePath.startsWith('api/')) {
        return issues;
    }
    
    // Find Turkish hardcoded strings
    const turkishPattern = /['"]([^'"]*[çğıöşüÇĞIİÖŞÜ][^'"]*)['"]/g;
    let match;
    while ((match = turkishPattern.exec(content)) !== null) {
        const text = match[1];
        // Skip if it's a translation key (contains dot)
        if (text.includes('.')) continue;
        // Skip if it's a variable or function call
        if (text.includes('(') || text.includes('{') || text.includes('$') || text.includes('`')) continue;
        // Skip common false positives
        if (/^(true|false|null|undefined|className|style|href|src|alt|id|key|type|value|name|size|color|variant|icon|onClick|onChange|onSubmit|useTranslation|getServerTranslation)$/i.test(text)) continue;
        // Skip if it's a number or single character
        if (/^\d+$/.test(text) || text.length < 3) continue;
        // Skip if it's a URL or path
        if (text.startsWith('http') || text.startsWith('/') || text.includes('@')) continue;
        
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
            type: 'HARDCODED_TURKISH',
            file: relativePath,
            line: line,
            text: text,
        });
    }
    
    // Find hardcoded date patterns
    HARDCODED_PATTERNS.forEach(pattern => {
        const regex = new RegExp(pattern.source, 'gi');
        while ((match = regex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            issues.push({
                type: 'HARDCODED_DATE',
                file: relativePath,
                line: line,
                text: match[0],
            });
        }
    });
    
    // Find hardcoded English in non-English contexts
    const englishMonths = /['"](January|February|March|April|May|June|July|August|September|October|November|December)/gi;
    while ((match = englishMonths.exec(content)) !== null) {
        // Check if it's in a date picker or calendar component
        if (content.includes('DatePicker') || content.includes('Calendar') || content.includes('date')) {
            const line = content.substring(0, match.index).split('\n').length;
            issues.push({
                type: 'HARDCODED_ENGLISH_DATE',
                file: relativePath,
                line: line,
                text: match[0],
            });
        }
    }
    
    return issues;
}

// Analyze locale files
function analyzeLocaleFiles() {
    console.log('🔍 Comprehensive i18n Audit Starting...\n');
    
    const results = {
        missingTranslations: { tr: [], en: [], de: [], ar: [] },
        duplicateKeys: [],
        hardcodedStrings: [],
        keyStructureDifferences: [],
        wrongKeys: [],
        dateFormatIssues: [],
        calendarIssues: [],
    };
    
    // Get all modules
    const modules = ['global'];
    const modulesDir = path.join(LOCALES_DIR, 'modules');
    if (fs.existsSync(modulesDir)) {
        const moduleDirs = fs.readdirSync(modulesDir, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
        modules.push(...moduleDirs.map(m => `modules/${m}`));
    }
    
    console.log(`📁 Analyzing ${modules.length} modules...\n`);
    
    // Analyze each module
    modules.forEach(module => {
        const moduleDir = module === 'global' 
            ? path.join(LOCALES_DIR, 'global')
            : path.join(LOCALES_DIR, module.replace('modules/', ''));
        
        if (!fs.existsSync(moduleDir)) return;
        
        // Load all locale files
        const localeData = {};
        LOCALES.forEach(locale => {
            const filePath = path.join(moduleDir, `${locale}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    localeData[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (error) {
                    console.log(`   ⚠️  Error parsing ${module}/${locale}.json: ${error.message}`);
                }
            }
        });
        
        // Get all keys from TR (reference)
        const trKeys = localeData.tr ? getAllKeys(localeData.tr) : [];
        
        // Check for missing translations
        LOCALES.forEach(locale => {
            if (locale === 'tr') return; // TR is reference
            
            const localeKeys = localeData[locale] ? getAllKeys(localeData[locale]) : [];
            const missing = trKeys.filter(key => !localeKeys.includes(key));
            
            if (missing.length > 0) {
                results.missingTranslations[locale].push({
                    module,
                    count: missing.length,
                    keys: missing.slice(0, 20), // First 20 examples
                });
            }
        });
        
        // Check for duplicate keys in each locale
        LOCALES.forEach(locale => {
            if (!localeData[locale]) return;
            
            const keys = getAllKeys(localeData[locale]);
            const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
            
            if (duplicates.length > 0) {
                results.duplicateKeys.push({
                    module,
                    locale,
                    keys: [...new Set(duplicates)],
                });
            }
        });
        
        // Check for key structure differences
        const keySets = {};
        LOCALES.forEach(locale => {
            if (localeData[locale]) {
                keySets[locale] = new Set(getAllKeys(localeData[locale]));
            }
        });
        
        // Find keys that exist in some locales but not others
        const allKeys = new Set();
        Object.values(keySets).forEach(keys => {
            keys.forEach(key => allKeys.add(key));
        });
        
        allKeys.forEach(key => {
            const presentIn = LOCALES.filter(locale => keySets[locale] && keySets[locale].has(key));
            if (presentIn.length > 0 && presentIn.length < LOCALES.length) {
                const missingIn = LOCALES.filter(locale => !keySets[locale] || !keySets[locale].has(key));
                results.keyStructureDifferences.push({
                    module,
                    key,
                    presentIn,
                    missingIn,
                });
            }
        });
        
        // Check for wrong/hardcoded values in locale files
        LOCALES.forEach(locale => {
            if (locale === 'tr' || !localeData[locale]) return;
            
            trKeys.forEach(key => {
                const trValue = getValueByPath(localeData.tr, key);
                const localeValue = getValueByPath(localeData[locale], key);
                
                if (trValue && localeValue && typeof trValue === 'string' && typeof localeValue === 'string') {
                    // Check if locale value is hardcoded Turkish
                    if (TURKISH_CHARS.test(localeValue) && locale !== 'tr') {
                        results.wrongKeys.push({
                            module,
                            locale,
                            key,
                            value: localeValue,
                            issue: 'Turkish text in non-Turkish locale',
                        });
                    }
                    
                    // Check if English value is in non-English locale (might be intentional, but flag it)
                    if (locale === 'de' || locale === 'ar') {
                        const isEnglish = /^[A-Za-z\s]+$/.test(localeValue) && localeValue.length > 3;
                        const isTurkish = TURKISH_CHARS.test(localeValue);
                        if (isEnglish && !isTurkish && trValue !== localeValue) {
                            // Might be English fallback, check if it's same as EN
                            const enValue = getValueByPath(localeData.en, key);
                            if (enValue === localeValue) {
                                results.wrongKeys.push({
                                    module,
                                    locale,
                                    key,
                                    value: localeValue,
                                    issue: 'English text in non-English locale (might need translation)',
                                });
                            }
                        }
                    }
                }
            });
        });
    });
    
    // Analyze code files for hardcoded strings
    console.log('📄 Analyzing code files for hardcoded strings...\n');
    const codeFiles = getAllCodeFiles(SRC_DIR);
    let analyzedFiles = 0;
    
    codeFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const hardcoded = findHardcodedStrings(content, file);
        if (hardcoded.length > 0) {
            results.hardcodedStrings.push(...hardcoded);
        }
        analyzedFiles++;
        if (analyzedFiles % 100 === 0) {
            process.stdout.write(`   Analyzed ${analyzedFiles} files...\r`);
        }
    });
    
    console.log(`   ✅ Analyzed ${analyzedFiles} files\n`);
    
    // Check for date/calendar specific issues
    console.log('📅 Checking date/calendar issues...\n');
    codeFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(SRC_DIR, file);
        
        // Skip setup, yedek directories, and API routes
        if (relativePath.includes('(setup)') || relativePath.includes('yedek/') ||
            relativePath.includes('app/api/') || relativePath.startsWith('api/')) {
            return;
        }
        
        // Check for hardcoded locale in toLocaleDateString/toLocaleString
        const localePatterns = [
            /toLocaleDateString\s*\(\s*['"](tr-TR|en-US|de-DE|ar-SA)['"]/gi,
            /toLocaleString\s*\(\s*['"](tr-TR|en-US|de-DE|ar-SA)['"]/gi,
            /toLocaleDateString\s*\(\s*['"]tr-TR['"]/gi,
            /toLocaleString\s*\(\s*['"]tr-TR['"]/gi,
        ];
        
        localePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const line = content.substring(0, content.indexOf(match)).split('\n').length;
                    results.dateFormatIssues.push({
                        file: relativePath,
                        line: line,
                        issue: 'Hardcoded locale in toLocaleDateString/toLocaleString (should use dynamic locale)',
                        code: match.substring(0, 80),
                    });
                });
            }
        });
        
        // Check for dayjs format with hardcoded formats
        const dayjsFormatPattern = /dayjs\([^)]*\)\.format\s*\(\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = dayjsFormatPattern.exec(content)) !== null) {
            const format = match[1];
            // Check if format contains locale-specific patterns
            if (format.includes('DD.MM.YYYY') || format.includes('MM/DD/YYYY') || 
                format.includes('YYYY-MM-DD') || format.includes('DD/MM/YYYY')) {
                const line = content.substring(0, match.index).split('\n').length;
                results.dateFormatIssues.push({
                    file: relativePath,
                    line: line,
                    issue: 'Hardcoded date format in dayjs().format() (should use locale-aware formatting)',
                    format: format,
                });
            }
        }
        
        // Check for calendar month names in hardcoded strings
        if (content.includes('Calendar') || content.includes('calendar') || 
            content.includes('CalendarView') || content.includes('EventModal')) {
            const monthPattern = /['"](Aralık|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}['"]/gi;
            const matches = content.match(monthPattern);
            if (matches) {
                matches.forEach(match => {
                    const line = content.substring(0, content.indexOf(match)).split('\n').length;
                    results.calendarIssues.push({
                        file: relativePath,
                        line: line,
                        months: match,
                        issue: 'Hardcoded month name with year in calendar (should use i18n)',
                    });
                });
            }
            
            // Check for hardcoded weekday names
            const weekdayPattern = /['"](Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)['"]/gi;
            const weekdayMatches = content.match(weekdayPattern);
            if (weekdayMatches) {
                weekdayMatches.forEach(match => {
                    const line = content.substring(0, content.indexOf(match)).split('\n').length;
                    results.calendarIssues.push({
                        file: relativePath,
                        line: line,
                        weekdays: match,
                        issue: 'Hardcoded weekday name in calendar (should use i18n)',
                    });
                });
            }
        }
        
        // Check for DatePicker/DateInput components with hardcoded placeholders
        if (content.includes('DatePicker') || content.includes('DateInput') || 
            content.includes('DatePickerInput') || content.includes('DateTimePicker')) {
            // Check for hardcoded English placeholders
            const placeholderPatterns = [
                /placeholder\s*=\s*['"](Select date|Choose date|Pick date|Select...|Choose...|Pick...)[^'"]*['"]/gi,
                /placeholder\s*=\s*\{['"](Select date|Choose date|Pick date)[^'"]*['"]\}/gi,
            ];
            
            placeholderPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const line = content.substring(0, content.indexOf(match)).split('\n').length;
                        results.dateFormatIssues.push({
                            file: relativePath,
                            line: line,
                            placeholder: match,
                            issue: 'Hardcoded English placeholder in date picker (should use i18n key)',
                        });
                    });
                }
            });
            
            // Check if locale prop is hardcoded
            const hardcodedLocalePattern = /locale\s*=\s*['"](tr|en|de|ar)['"]/g;
            const localeMatches = content.match(hardcodedLocalePattern);
            if (localeMatches) {
                // Check if it's using a variable or hardcoded
                const contextMatches = content.match(/locale\s*=\s*\{[^}]*locale[^}]*\}/g);
                if (!contextMatches || contextMatches.length < localeMatches.length) {
                    localeMatches.forEach(match => {
                        const line = content.substring(0, content.indexOf(match)).split('\n').length;
                        results.dateFormatIssues.push({
                            file: relativePath,
                            line: line,
                            issue: 'Hardcoded locale prop in date picker (should use dynamic locale from i18n)',
                            code: match.substring(0, 50),
                        });
                    });
                }
            }
        }
        
        // Check for format prop with hardcoded date formats
        if (content.includes('format') && (content.includes('date') || content.includes('Date'))) {
            const formatMatches = content.match(/format\s*[:=]\s*['"]([^'"]+)['"]/g);
            if (formatMatches) {
                formatMatches.forEach(match => {
                    const format = match.match(/['"]([^'"]+)['"]/)[1];
                    if ((format.includes('MM') || format.includes('DD') || format.includes('YYYY')) &&
                        !format.includes('t(') && !format.includes('useTranslation')) {
                        const line = content.substring(0, content.indexOf(match)).split('\n').length;
                        results.dateFormatIssues.push({
                            file: relativePath,
                            line: line,
                            format: format,
                            issue: 'Hardcoded date format (should use locale-aware formatting)',
                        });
                    }
                });
            }
        }
    });
    
    // Generate report
    console.log('\n📊 COMPREHENSIVE I18N AUDIT REPORT\n');
    console.log('='.repeat(80));
    
    // Missing translations
    console.log('\n1️⃣  MISSING TRANSLATIONS:\n');
    let totalMissing = 0;
    ['en', 'de', 'ar'].forEach(locale => {
        const missing = results.missingTranslations[locale];
        const count = missing.reduce((sum, m) => sum + m.count, 0);
        totalMissing += count;
        
        if (count > 0) {
            console.log(`   ${locale.toUpperCase()}: ${count} missing keys`);
            missing.slice(0, 5).forEach(({ module, count: moduleCount, keys }) => {
                console.log(`      ${module}: ${moduleCount} keys`);
                if (keys.length > 0) {
                    console.log(`         Examples: ${keys.slice(0, 5).join(', ')}`);
                }
            });
            if (missing.length > 5) {
                console.log(`      ... and ${missing.length - 5} more modules`);
            }
        } else {
            console.log(`   ${locale.toUpperCase()}: ✅ All translations present`);
        }
    });
    console.log(`\n   📊 Total missing: ${totalMissing} keys\n`);
    
    // Duplicate keys
    console.log('2️⃣  DUPLICATE KEYS:\n');
    if (results.duplicateKeys.length > 0) {
        results.duplicateKeys.forEach(({ module, locale, keys }) => {
            console.log(`   ${module}/${locale}.json: ${keys.length} duplicates`);
            console.log(`      ${keys.slice(0, 5).join(', ')}`);
        });
    } else {
        console.log('   ✅ No duplicate keys found\n');
    }
    
    // Hardcoded strings
    console.log('3️⃣  HARDCODED STRINGS:\n');
    const hardcodedByType = {};
    results.hardcodedStrings.forEach(issue => {
        if (!hardcodedByType[issue.type]) {
            hardcodedByType[issue.type] = [];
        }
        hardcodedByType[issue.type].push(issue);
    });
    
    Object.keys(hardcodedByType).forEach(type => {
        const count = hardcodedByType[type].length;
        console.log(`   ${type}: ${count} occurrences`);
        hardcodedByType[type].slice(0, 5).forEach(issue => {
            console.log(`      ${issue.file}:${issue.line} - "${issue.text.substring(0, 50)}"`);
        });
        if (count > 5) {
            console.log(`      ... and ${count - 5} more`);
        }
    });
    if (results.hardcodedStrings.length === 0) {
        console.log('   ✅ No hardcoded strings found\n');
    }
    
    // Key structure differences
    console.log('\n4️⃣  KEY STRUCTURE DIFFERENCES:\n');
    if (results.keyStructureDifferences.length > 0) {
        const byModule = {};
        results.keyStructureDifferences.forEach(issue => {
            if (!byModule[issue.module]) {
                byModule[issue.module] = [];
            }
            byModule[issue.module].push(issue);
        });
        
        Object.keys(byModule).slice(0, 10).forEach(module => {
            const issues = byModule[module];
            console.log(`   ${module}: ${issues.length} keys with structure differences`);
            issues.slice(0, 3).forEach(issue => {
                console.log(`      ${issue.key}: present in [${issue.presentIn.join(', ')}], missing in [${issue.missingIn.join(', ')}]`);
            });
        });
        if (Object.keys(byModule).length > 10) {
            console.log(`   ... and ${Object.keys(byModule).length - 10} more modules`);
        }
    } else {
        console.log('   ✅ All locale files have consistent key structure\n');
    }
    
    // Wrong keys
    console.log('\n5️⃣  WRONG/INCONSISTENT KEYS:\n');
    if (results.wrongKeys.length > 0) {
        const byIssue = {};
        results.wrongKeys.forEach(issue => {
            if (!byIssue[issue.issue]) {
                byIssue[issue.issue] = [];
            }
            byIssue[issue.issue].push(issue);
        });
        
        Object.keys(byIssue).forEach(issueType => {
            const count = byIssue[issueType].length;
            console.log(`   ${issueType}: ${count} occurrences`);
            byIssue[issueType].slice(0, 5).forEach(issue => {
                console.log(`      ${issue.module}/${issue.locale}.json: ${issue.key} = "${issue.value.substring(0, 50)}"`);
            });
            if (count > 5) {
                console.log(`      ... and ${count - 5} more`);
            }
        });
    } else {
        console.log('   ✅ No wrong/inconsistent keys found\n');
    }
    
    // Date format issues
    console.log('\n6️⃣  DATE FORMAT ISSUES:\n');
    if (results.dateFormatIssues.length > 0) {
        // Group by file
        const byFile = {};
        results.dateFormatIssues.forEach(issue => {
            if (!byFile[issue.file]) {
                byFile[issue.file] = [];
            }
            byFile[issue.file].push(issue);
        });
        
        Object.keys(byFile).slice(0, 15).forEach(file => {
            const fileIssues = byFile[file];
            console.log(`   ${file}: ${fileIssues.length} issues`);
            fileIssues.slice(0, 3).forEach(issue => {
                console.log(`      Line ${issue.line || '?'}: ${issue.issue}`);
                if (issue.format) console.log(`         Format: ${issue.format}`);
                if (issue.placeholder) console.log(`         Placeholder: ${issue.placeholder}`);
                if (issue.code) console.log(`         Code: ${issue.code}`);
            });
            if (fileIssues.length > 3) {
                console.log(`      ... and ${fileIssues.length - 3} more in this file`);
            }
        });
        if (Object.keys(byFile).length > 15) {
            console.log(`   ... and ${Object.keys(byFile).length - 15} more files`);
        }
    } else {
        console.log('   ✅ No date format issues found\n');
    }
    
    // Calendar issues
    console.log('\n7️⃣  CALENDAR ISSUES:\n');
    if (results.calendarIssues.length > 0) {
        // Group by file
        const byFile = {};
        results.calendarIssues.forEach(issue => {
            if (!byFile[issue.file]) {
                byFile[issue.file] = [];
            }
            byFile[issue.file].push(issue);
        });
        
        Object.keys(byFile).slice(0, 10).forEach(file => {
            const fileIssues = byFile[file];
            console.log(`   ${file}: ${fileIssues.length} issues`);
            fileIssues.slice(0, 2).forEach(issue => {
                console.log(`      Line ${issue.line || '?'}: ${issue.issue}`);
                if (issue.months) console.log(`         Found: ${issue.months}`);
                if (issue.weekdays) console.log(`         Found: ${issue.weekdays}`);
            });
            if (fileIssues.length > 2) {
                console.log(`      ... and ${fileIssues.length - 2} more in this file`);
            }
        });
        if (Object.keys(byFile).length > 10) {
            console.log(`   ... and ${Object.keys(byFile).length - 10} more files`);
        }
    } else {
        console.log('   ✅ No calendar issues found\n');
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY:\n');
    console.log(`   Missing translations: ${totalMissing}`);
    console.log(`   Duplicate keys: ${results.duplicateKeys.length}`);
    console.log(`   Hardcoded strings: ${results.hardcodedStrings.length}`);
    console.log(`   Key structure differences: ${results.keyStructureDifferences.length}`);
    console.log(`   Wrong/inconsistent keys: ${results.wrongKeys.length}`);
    console.log(`   Date format issues: ${results.dateFormatIssues.length}`);
    console.log(`   Calendar issues: ${results.calendarIssues.length}`);
    console.log('\n✅ Audit complete!\n');
    
    return results;
}

if (require.main === module) {
    analyzeLocaleFiles();
}

module.exports = { analyzeLocaleFiles };

