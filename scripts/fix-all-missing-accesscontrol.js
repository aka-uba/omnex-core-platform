#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');

// Read TR as reference
const trContent = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'tr.json'), 'utf8'));
const enContent = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

// Get all accessControl keys from TR
function getAllKeys(obj, prefix = '') {
    const keys = {};
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return keys;
    }
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(keys, getAllKeys(obj[key], fullKey));
        } else {
            keys[fullKey] = obj[key];
        }
    });
    return keys;
}

const trAccessControl = trContent.accessControl || {};
const enAccessControl = enContent.accessControl || {};

const trKeys = getAllKeys(trAccessControl, 'accessControl');
const enKeys = getAllKeys(enAccessControl, 'accessControl');

// Translations
const translations = {
    de: {
        'accessControl.ui.groups.export': 'Exportoptionen',
        'accessControl.ui.features': 'Funktionen',
        'accessControl.ui.features.create': 'Erstellen-Schaltfläche',
        'accessControl.ui.features.edit': 'Bearbeiten-Schaltfläche',
        'accessControl.ui.features.delete': 'Löschen-Schaltfläche',
        'accessControl.ui.features.export': 'Export-Schaltfläche',
        'accessControl.ui.features.import': 'Import-Schaltfläche',
        'accessControl.ui.features.bulk-actions': 'Massenaktionen',
        'accessControl.ui.features.column-visibility': 'Spaltensichtbarkeit',
        'accessControl.ui.features.density-toggle': 'Dichte-Umschalter',
        'accessControl.ui.features.fullscreen': 'Vollbildmodus',
        'accessControl.ui.features.advanced-filters': 'Erweiterte Filter',
        'accessControl.ui.features.saved-views': 'Gespeicherte Ansichten',
        'accessControl.ui.features.global-search': 'Globale Suche',
        'accessControl.ui.features.excel': 'Excel-Export',
        'accessControl.ui.features.pdf': 'PDF-Export',
        'accessControl.ui.features.csv': 'CSV-Export',
        'accessControl.ui.features.print': 'Drucken',
    },
    ar: {
        'accessControl.ui.groups.export': 'خيارات التصدير',
        'accessControl.ui.features': 'الميزات',
        'accessControl.ui.features.create': 'زر الإنشاء',
        'accessControl.ui.features.edit': 'زر التعديل',
        'accessControl.ui.features.delete': 'زر الحذف',
        'accessControl.ui.features.export': 'زر التصدير',
        'accessControl.ui.features.import': 'زر الاستيراد',
        'accessControl.ui.features.bulk-actions': 'الإجراءات المجمعة',
        'accessControl.ui.features.column-visibility': 'رؤية الأعمدة',
        'accessControl.ui.features.density-toggle': 'تبديل الكثافة',
        'accessControl.ui.features.fullscreen': 'وضع ملء الشاشة',
        'accessControl.ui.features.advanced-filters': 'مرشحات متقدمة',
        'accessControl.ui.features.saved-views': 'عروض محفوظة',
        'accessControl.ui.features.global-search': 'بحث عام',
        'accessControl.ui.features.excel': 'تصدير Excel',
        'accessControl.ui.features.pdf': 'تصدير PDF',
        'accessControl.ui.features.csv': 'تصدير CSV',
        'accessControl.ui.features.print': 'طباعة',
    },
};

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
}

function addMissingKeys(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = translations[locale];
    
    if (!content.accessControl) {
        content.accessControl = {};
    }
    
    let added = 0;
    Object.keys(keys).forEach(keyPath => {
        setNestedValue(content, keyPath, keys[keyPath]);
        added++;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${locale.toUpperCase()}: Added ${added} missing keys`);
}

console.log('🔧 Adding all missing accessControl keys...\n');
addMissingKeys('de');
addMissingKeys('ar');
console.log('\n✅ Done!');







