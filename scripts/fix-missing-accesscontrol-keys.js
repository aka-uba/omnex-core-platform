#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');

// Missing keys for DE and AR
const missingKeys = {
    de: {
        'accessControl.modules.configuringFor': 'Modulzugriff konfigurieren für: {{scope}}',
        'accessControl.ui.groups.buttons': 'Aktionsschaltflächen',
        'accessControl.ui.groups.datatable': 'Datentabelle',
        'accessControl.ui.groups.filters': 'Filterung & Suche',
    },
    ar: {
        'accessControl.modules.configuringFor': 'تكوين وصول الوحدة لـ: {{scope}}',
        'accessControl.ui.groups.buttons': 'أزرار الإجراءات',
        'accessControl.ui.groups.datatable': 'جدول البيانات',
        'accessControl.ui.groups.filters': 'التصفية والبحث',
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
    const keys = missingKeys[locale];
    
    let added = 0;
    Object.keys(keys).forEach(keyPath => {
        setNestedValue(content, keyPath, keys[keyPath]);
        added++;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${locale.toUpperCase()}: Added ${added} missing keys`);
}

console.log('🔧 Adding missing accessControl keys...\n');
addMissingKeys('de');
addMissingKeys('ar');
console.log('\n✅ Done!');







