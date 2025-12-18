#!/usr/bin/env node

/**
 * Comprehensive analysis of hardcoded texts in frontend components
 * 
 * Finds:
 * - Hardcoded Turkish texts
 * - Hardcoded English texts
 * - String literals in JSX
 * - Missing i18n usage
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Common Turkish words/patterns
const TURKISH_PATTERNS = [
  /\b(Sayfa|sayfa|Başlık|başlık|Açıklama|açıklama|Oluştur|oluştur|Sil|sil|Düzenle|düzenle|Görüntüle|görüntüle|Kaydet|kaydet|İptal|iptal|Ara|ara|Filtrele|filtrele|Seç|seç|Tümü|tümü|Aktif|aktif|Pasif|pasif|Başarılı|başarılı|Hata|hata|Uyarı|uyarı|Bilgi|bilgi|Onayla|onayla|Geri|geri|İleri|ileri|Yenile|yenile|Güncelle|güncelle|Export|export|İndir|indir|Yükle|yükle|Yazdır|yazdır|Toplam|toplam|Tamamlandı|tamamlandı|Beklemede|beklemede|Başarısız|başarısız|Oluşturuluyor|oluşturuluyor|Rapor|rapor|Raporlar|raporlar|İşlemler|işlemler|Durum|durum|Tarih|tarih|Saat|saat|Ad|ad|Soyad|soyad|Email|email|Telefon|telefon|Adres|adres|Şehir|şehir|İlçe|ilçe|Ülke|ülke|Aç|aç|Kapat|kapat|Ekle|ekle|Çıkar|çıkar|Göster|göster|Gizle|gizle|Sırala|sırala|Filtre|filtre|Arama|arama|Sonuç|sonuç|Kayıt|kayıt|Kayıtlar|kayıtlar|Gösteriliyor|gösteriliyor|Başına|başına|Toplam|toplam|Seçili|seçili|Seçim|seçim|Temizle|temizle|Uygula|uygula|İptal|iptal|Onayla|onayla|Sil|sil|Düzenle|düzenle|Görüntüle|görüntüle|Yeni|yeni|Eski|eski|Son|son|İlk|ilk|Önceki|önceki|Sonraki|sonraki|Sayfa|sayfa|Sayfalar|sayfalar|Toplam|toplam|Göster|göster|Gizle|gizle|Sırala|sırala|Filtre|filtre|Arama|arama|Sonuç|sonuç|Kayıt|kayıt|Kayıtlar|kayıtlar|Gösteriliyor|gösteriliyor|Başına|başına|Toplam|toplam|Seçili|seçili|Seçim|seçim|Temizle|temizle|Uygula|uygula|İptal|iptal|Onayla|onayla|Sil|sil|Düzenle|düzenle|Görüntüle|görüntüle|Yeni|yeni|Eski|eski|Son|son|İlk|ilk|Önceki|önceki|Sonraki|sonraki|Sayfa|sayfa|Sayfalar|sayfalar)\b/g,
  /['"](Sayfa|sayfa|Başlık|başlık|Açıklama|açıklama|Oluştur|oluştur|Sil|sil|Düzenle|düzenle|Görüntüle|görüntüle|Kaydet|kaydet|İptal|iptal|Ara|ara|Filtrele|filtrele|Seç|seç|Tümü|tümü|Aktif|aktif|Pasif|pasif|Başarılı|başarılı|Hata|hata|Uyarı|uyarı|Bilgi|bilgi|Onayla|onayla|Geri|geri|İleri|ileri|Yenile|yenile|Güncelle|güncelle|Export|export|İndir|indir|Yükle|yükle|Yazdır|yazdır|Toplam|toplam|Tamamlandı|tamamlandı|Beklemede|beklemede|Başarısız|başarısız|Oluşturuluyor|oluşturuluyor|Rapor|rapor|Raporlar|raporlar|İşlemler|işlemler|Durum|durum|Tarih|tarih|Saat|saat|Ad|ad|Soyad|soyad|Email|email|Telefon|telefon|Adres|adres|Şehir|şehir|İlçe|ilçe|Ülke|ülke|Aç|aç|Kapat|kapat|Ekle|ekle|Çıkar|çıkar|Göster|göster|Gizle|gizle|Sırala|sırala|Filtre|filtre|Arama|arama|Sonuç|sonuç|Kayıt|kayıt|Kayıtlar|kayıtlar|Gösteriliyor|gösteriliyor|Başına|başına|Toplam|toplam|Seçili|seçili|Seçim|seçim|Temizle|temizle|Uygula|uygula|İptal|iptal|Onayla|onayla|Sil|sil|Düzenle|düzenle|Görüntüle|görüntüle|Yeni|yeni|Eski|eski|Son|son|İlk|ilk|Önceki|önceki|Sonraki|sonraki|Sayfa|sayfa|Sayfalar|sayfalar)[^'"]*['"]/g,
];

// Common English words that should be translated
const ENGLISH_PATTERNS = [
  /\b(Page|page|Title|title|Description|description|Create|create|Delete|delete|Edit|edit|View|view|Save|save|Cancel|cancel|Search|search|Filter|filter|Select|select|All|all|Active|active|Inactive|inactive|Success|success|Error|error|Warning|warning|Info|info|Confirm|confirm|Back|back|Next|next|Refresh|refresh|Update|update|Export|export|Download|download|Upload|upload|Print|print|Total|total|Completed|completed|Pending|pending|Failed|failed|Generating|generating|Report|report|Reports|reports|Actions|actions|Status|status|Date|date|Time|time|Name|name|Email|email|Phone|phone|Address|address|City|city|District|district|Country|country|Open|open|Close|close|Add|add|Remove|remove|Show|show|Hide|hide|Sort|sort|Filter|filter|Search|search|Result|result|Record|record|Records|records|Showing|showing|Per|per|Total|total|Selected|selected|Selection|selection|Clear|clear|Apply|apply|Cancel|cancel|Confirm|confirm|Delete|delete|Edit|edit|View|view|New|new|Old|old|Last|last|First|first|Previous|previous|Next|next|Page|page|Pages|pages)\b/g,
];

// Get all TypeScript/TSX files
function getAllCodeFiles(dir) {
  const files = [];
  const extensions = ['.tsx', '.ts'];
  
  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && entry.name !== 'yedek' &&
            entry.name !== '.next' && entry.name !== 'dist' &&
            entry.name !== 'types' && entry.name !== '__tests__' &&
            entry.name !== '__mocks__') {
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

// Extract string literals from code
function extractStringLiterals(content) {
  const strings = [];
  
  // Match string literals: '...', "...", `...`
  const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  let match;
  
  while ((match = stringRegex.exec(content)) !== null) {
    const str = match[0];
    const value = str.slice(1, -1); // Remove quotes
    
    // Skip if it's a translation key (contains dots and looks like a key)
    if (value.includes('.') && /^[a-zA-Z]+\.[a-zA-Z]+/.test(value)) {
      continue;
    }
    
    // Skip if it's a URL, path, or technical string
    if (value.startsWith('http') || value.startsWith('/') || 
        value.startsWith('@/') || value.startsWith('./') ||
        value.match(/^[a-zA-Z0-9_]+$/)) {
      continue;
    }
    
    // Skip if it's a CSS class name
    if (value.includes(' ') && value.length < 50) {
      strings.push({
        value: value,
        line: content.substring(0, match.index).split('\n').length,
        context: getContext(content, match.index),
      });
    }
  }
  
  return strings;
}

// Get context around a match
function getContext(content, index, linesBefore = 2, linesAfter = 2) {
  const lines = content.split('\n');
  const lineIndex = content.substring(0, index).split('\n').length - 1;
  const start = Math.max(0, lineIndex - linesBefore);
  const end = Math.min(lines.length, lineIndex + linesAfter + 1);
  
  return lines.slice(start, end).map((line, i) => ({
    number: start + i + 1,
    content: line,
    isMatch: start + i === lineIndex,
  }));
}

// Check if file uses i18n
function usesI18n(content) {
  return content.includes('useTranslation') || 
         content.includes('t(') || 
         content.includes('tGlobal(') ||
         content.includes("from '@/lib/i18n/client'");
}

// Analyze a single file
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(SRC_DIR, filePath);
    
    // Skip if not a component/page file
    if (!content.includes('export') && !content.includes('function') && !content.includes('const')) {
      return null;
    }
    
    const strings = extractStringLiterals(content);
    const hasI18n = usesI18n(content);
    
    // Filter strings that look like user-facing text
    const userFacingStrings = strings.filter(s => {
      const value = s.value;
      
      // Must have at least 2 characters
      if (value.length < 2) return false;
      
      // Must contain at least one letter
      if (!/[a-zA-ZıİğĞüÜşŞöÖçÇ]/.test(value)) return false;
      
      // Skip if it's all uppercase (likely a constant)
      if (value === value.toUpperCase() && value.length < 10) return false;
      
      // Skip if it's a number
      if (/^\d+$/.test(value)) return false;
      
      // Skip if it's a single word that's likely a variable/function name
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) && value.length < 15) {
        // But include common UI words
        const uiWords = ['save', 'cancel', 'delete', 'edit', 'view', 'create', 'search', 'filter', 'select', 'all', 'active', 'inactive', 'success', 'error', 'warning', 'info', 'confirm', 'back', 'next', 'refresh', 'update', 'export', 'download', 'upload', 'print', 'total', 'completed', 'pending', 'failed', 'generating', 'report', 'reports', 'actions', 'status', 'date', 'time', 'name', 'email', 'phone', 'address', 'city', 'district', 'country', 'open', 'close', 'add', 'remove', 'show', 'hide', 'sort', 'filter', 'search', 'result', 'record', 'records', 'showing', 'per', 'total', 'selected', 'selection', 'clear', 'apply', 'cancel', 'confirm', 'delete', 'edit', 'view', 'new', 'old', 'last', 'first', 'previous', 'next', 'page', 'pages', 'kaydet', 'iptal', 'sil', 'düzenle', 'görüntüle', 'oluştur', 'ara', 'filtrele', 'seç', 'tümü', 'aktif', 'pasif', 'başarılı', 'hata', 'uyarı', 'bilgi', 'onayla', 'geri', 'ileri', 'yenile', 'güncelle', 'export', 'indir', 'yükle', 'yazdır', 'toplam', 'tamamlandı', 'beklemede', 'başarısız', 'oluşturuluyor', 'rapor', 'raporlar', 'işlemler', 'durum', 'tarih', 'saat', 'ad', 'soyad', 'email', 'telefon', 'adres', 'şehir', 'ilçe', 'ülke', 'aç', 'kapat', 'ekle', 'çıkar', 'göster', 'gizle', 'sırala', 'filtre', 'arama', 'sonuç', 'kayıt', 'kayıtlar', 'gösteriliyor', 'başına', 'toplam', 'seçili', 'seçim', 'temizle', 'uygula', 'iptal', 'onayla', 'sil', 'düzenle', 'görüntüle', 'yeni', 'eski', 'son', 'ilk', 'önceki', 'sonraki', 'sayfa', 'sayfalar'];
        return uiWords.includes(value.toLowerCase());
      }
      
      return true;
    });
    
    if (userFacingStrings.length === 0 && hasI18n) {
      return null; // File uses i18n, no hardcoded strings found
    }
    
    return {
      file: relativePath,
      hasI18n,
      hardcodedStrings: userFacingStrings,
      count: userFacingStrings.length,
    };
  } catch (error) {
    return { file: path.relative(SRC_DIR, filePath), error: error.message };
  }
}

// Main execution
console.log('🔍 Analyzing hardcoded texts in frontend components...\n');
console.log('='.repeat(80));
console.log('');

const files = getAllCodeFiles(SRC_DIR);
console.log(`📁 Scanning ${files.length} files...\n`);

const results = {
  withHardcoded: [],
  withoutI18n: [],
  errors: [],
};

files.forEach(file => {
  const result = analyzeFile(file);
  
  if (result && result.error) {
    results.errors.push(result);
  } else if (result && result.hardcodedStrings && result.hardcodedStrings.length > 0) {
    results.withHardcoded.push(result);
    
    if (!result.hasI18n) {
      results.withoutI18n.push(result);
    }
  }
});

// Sort by count
results.withHardcoded.sort((a, b) => b.count - a.count);
results.withoutI18n.sort((a, b) => b.count - a.count);

// Summary
console.log('='.repeat(80));
console.log('📊 SUMMARY\n');
console.log(`Total files scanned: ${files.length}`);
console.log(`Files with hardcoded texts: ${results.withHardcoded.length}`);
console.log(`Files without i18n: ${results.withoutI18n.length}`);
console.log(`Errors: ${results.errors.length}\n`);

// Top files with most hardcoded strings
if (results.withHardcoded.length > 0) {
  console.log('='.repeat(80));
  console.log('🔴 TOP 20 FILES WITH MOST HARDCODED TEXTS\n');
  
  results.withHardcoded.slice(0, 20).forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   Hardcoded strings: ${result.count}`);
    console.log(`   Uses i18n: ${result.hasI18n ? '✅' : '❌'}`);
    if (result.hardcodedStrings.length > 0) {
      const examples = result.hardcodedStrings.slice(0, 5).map(s => s.value);
      console.log(`   Examples: ${examples.join(', ')}`);
    }
    console.log('');
  });
}

// Files without i18n
if (results.withoutI18n.length > 0) {
  console.log('='.repeat(80));
  console.log('⚠️  FILES WITHOUT I18N (Priority fixes)\n');
  
  results.withoutI18n.slice(0, 30).forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   Hardcoded strings: ${result.count}`);
    if (result.hardcodedStrings.length > 0) {
      const examples = result.hardcodedStrings.slice(0, 3).map(s => `"${s.value}"`);
      console.log(`   Examples: ${examples.join(', ')}`);
    }
    console.log('');
  });
}

// Detailed report
console.log('='.repeat(80));
console.log('📋 DETAILED REPORT\n');
console.log(`Total hardcoded strings found: ${results.withHardcoded.reduce((sum, r) => sum + r.count, 0)}\n`);

// Group by directory
const byDirectory = {};
results.withHardcoded.forEach(result => {
  const dir = path.dirname(result.file);
  if (!byDirectory[dir]) {
    byDirectory[dir] = { files: [], total: 0 };
  }
  byDirectory[dir].files.push(result);
  byDirectory[dir].total += result.count;
});

const sortedDirs = Object.entries(byDirectory)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10);

if (sortedDirs.length > 0) {
  console.log('Top directories by hardcoded strings:');
  sortedDirs.forEach(([dir, data]) => {
    console.log(`  ${dir}: ${data.total} strings in ${data.files.length} files`);
  });
}

console.log('\n✅ Analysis complete!');
console.log('\n💡 Recommendations:');
console.log('  1. Fix files without i18n first (highest priority)');
console.log('  2. Add useTranslation hook to files missing it');
console.log('  3. Replace hardcoded strings with t() or tGlobal() calls');
console.log('  4. Add missing translation keys to locale files\n');







