import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  context: string;
  type: 'turkish' | 'english' | 'mixed';
}

// Turkish character patterns
const turkishChars = /[ığüşöçİĞÜŞÖÇ]/;

// Common Turkish words/phrases that should be translated
const turkishPatterns = [
  /\b(kaydet|kaydetme|kaydedildi|kaydediliyor)\b/gi,
  /\b(iptal|iptal et|iptal edildi)\b/gi,
  /\b(sil|silme|silindi|siliniyor)\b/gi,
  /\b(düzenle|düzenleme|düzenlendi)\b/gi,
  /\b(oluştur|oluşturma|oluşturuldu)\b/gi,
  /\b(görüntüle|görüntüleme)\b/gi,
  /\b(ara|arama|arandı)\b/gi,
  /\b(filtre|filtrele|filtrelendi)\b/gi,
  /\b(başarılı|başarısız|hata|uyarı|bilgi)\b/gi,
  /\b(yükle|yükleme|yüklendi)\b/gi,
  /\b(indir|indirme|indirildi)\b/gi,
  /\b(dışa aktar|export|dışa aktarma)\b/gi,
  /\b(içe aktar|import|içe aktarma)\b/gi,
  /\b(yazdır|yazdırma|yazdırıldı)\b/gi,
  /\b(tarih|saat|zaman)\b/gi,
  /\b(ad|isim|başlık|açıklama)\b/gi,
  /\b(durum|statü|aktif|pasif)\b/gi,
  /\b(tamamlandı|beklemede|onaylandı|reddedildi)\b/gi,
  /\b(müşteri|kullanıcı|rol|izin)\b/gi,
  /\b(modül|sayfa|menü|ayar)\b/gi,
  /\b(ekle|ekleme|eklendi)\b/gi,
  /\b(güncelle|güncelleme|güncellendi)\b/gi,
  /\b(seç|seçme|seçildi)\b/gi,
  /\b(temizle|temizleme|temizlendi)\b/gi,
  /\b(uygula|uygulama|uygulandı)\b/gi,
  /\b(onayla|onaylama|onaylandı)\b/gi,
  /\b(kapat|kapatma|kapatıldı)\b/gi,
  /\b(gönder|gönderme|gönderildi)\b/gi,
  /\b(geri|ileri|önceki|sonraki)\b/gi,
  /\b(tümü|hiçbiri|hepsi)\b/gi,
  /\b(evet|hayır|tamam)\b/gi,
  /\b(veri|bilgi|içerik)\b/gi,
  /\b(bulunamadı|yüklenemedi|hata oluştu)\b/gi,
  /\b(yükleniyor|işleniyor|bekleniyor)\b/gi,
  /\b(başarıyla|başarısız|hata)\b/gi,
  /\b(oluşturuldu|güncellendi|silindi)\b/gi,
  /\b(gerekli|zorunlu|opsiyonel)\b/gi,
  /\b(adres|telefon|e-posta|email)\b/gi,
  /\b(şehir|ülke|posta kodu)\b/gi,
  /\b(fatura|ödeme|gider|abonelik)\b/gi,
  /\b(tutar|fiyat|miktar|toplam)\b/gi,
  /\b(para birimi|kur|döviz)\b/gi,
  /\b(rapor|dashboard|panel)\b/gi,
  /\b(ayarlar|yapılandırma|tercihler)\b/gi,
  /\b(profil|hesap|kullanıcı bilgileri)\b/gi,
  /\b(çıkış|giriş|kayıt)\b/gi,
  /\b(şifre|kullanıcı adı|email)\b/gi,
  /\b(unut|hatırla|giriş yap)\b/gi
];

// Common English words that should be translated
const englishPatterns = [
  /\b(save|cancel|delete|edit|create|view)\b/gi,
  /\b(search|filter|sort|refresh|reset)\b/gi,
  /\b(success|error|warning|info|loading)\b/gi,
  /\b(upload|download|export|import|print)\b/gi,
  /\b(date|time|name|title|description)\b/gi,
  /\b(status|active|inactive|pending|completed)\b/gi,
  /\b(customer|user|role|permission|module)\b/gi,
  /\b(add|update|remove|select|clear|apply)\b/gi,
  /\b(confirm|close|submit|back|next|previous)\b/gi,
  /\b(all|none|yes|no|ok|required|optional)\b/gi,
  /\b(data|information|content|not found|failed)\b/gi,
  /\b(loading|processing|waiting|successfully)\b/gi,
  /\b(created|updated|deleted|required|optional)\b/gi,
  /\b(address|phone|email|city|country|postal)\b/gi,
  /\b(invoice|payment|expense|subscription)\b/gi,
  /\b(amount|price|quantity|total|currency)\b/gi,
  /\b(report|dashboard|settings|configuration)\b/gi,
  /\b(profile|account|user information)\b/gi,
  /\b(logout|login|register|password|username)\b/gi,
  /\b(forgot|remember|sign in|sign up)\b/gi,
];

// Check if text is inside a string literal
function isInStringLiteral(line: string, index: number): boolean {
  // Check if we're inside quotes
  const before = line.substring(0, index);
  const after = line.substring(index);
  
  // Count unescaped quotes before this position
  const singleQuotes = (before.match(/'/g) || []).length - (before.match(/\\'/g) || []).length;
  const doubleQuotes = (before.match(/"/g) || []).length - (before.match(/\\"/g) || []).length;
  
  // Check if we're inside template literals
  const backticks = (before.match(/`/g) || []).length - (before.match(/\\`/g) || []).length;
  
  // Simple check: if odd number of quotes, we're inside a string
  return (singleQuotes % 2 === 1) || (doubleQuotes % 2 === 1) || (backticks % 2 === 1);
}

// Check if text is in a comment
function isInComment(line: string, index: number): boolean {
  const before = line.substring(0, index);
  return before.includes('//') || before.includes('/*') || before.includes('*');
}

// Check if text is in JSX comment
function isInJSXComment(line: string, index: number): boolean {
  const before = line.substring(0, index);
  return before.includes('{/*') || before.includes('*/}');
}

// Check if text is already using i18n
function isUsingI18n(line: string, index: number): boolean {
  const before = line.substring(0, index);
  const after = line.substring(index);
  
  // Check for t('...'), t("..."), tGlobal('...'), etc.
  const i18nPatterns = [
    /t\(['"`]/,
    /tGlobal\(['"`]/,
    /\.t\(['"`]/,
    /translate\(['"`]/,
  ];
  
  // Check if we're inside an i18n call
  for (const pattern of i18nPatterns) {
    const regexPattern = pattern.source + '[^\'"`]*$';
    const match = before.match(new RegExp(regexPattern));
    if (match) {
      // Check if the closing quote is after our text
      const remaining = before.substring(match.index! + match[0].length) + after;
      const quoteMatch = remaining.match(/['"`]/);
      if (quoteMatch && quoteMatch.index! < 50) {
        return true;
      }
    }
  }
  
  return false;
}

// Extract hardcoded texts from a file
function findHardcodedTexts(filePath: string): HardcodedText[] {
  const results: HardcodedText[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip empty lines and lines that are only whitespace
      if (!line.trim()) continue;
      
      // Check for Turkish characters
      let match;
      const turkishRegex = /["'`]([^"'`]*[ığüşöçİĞÜŞÖÇ][^"'`]*)["'`]/g;
      while ((match = turkishRegex.exec(line)) !== null) {
        const text = match[1];
        const index = match.index;
        
        // Skip if in comment
        if (isInComment(line, index) || isInJSXComment(line, index)) continue;
        
        // Skip if already using i18n
        if (isUsingI18n(line, index)) continue;
        
        // Skip if it's a URL, path, or technical identifier
        if (text.includes('://') || text.includes('@') || text.includes('\\') || text.match(/^[a-zA-Z0-9._-]+$/)) {
          continue;
        }
        
        // Skip very short texts (likely identifiers)
        if (text.length < 3) continue;
        
        // Get context (surrounding lines)
        const context = [
          i > 0 ? lines[i - 1].trim() : '',
          line.trim(),
          i < lines.length - 1 ? lines[i + 1].trim() : ''
        ].filter(l => l).join('\n');
        
        results.push({
          file: filePath,
          line: lineNum,
          text: text,
          context: context,
          type: 'turkish'
        });
      }
      
      // Check for common Turkish patterns
      for (const pattern of turkishPatterns) {
        while ((match = pattern.exec(line)) !== null) {
          const text = match[0];
          const index = match.index;
          
          // Skip if in comment
          if (isInComment(line, index) || isInJSXComment(line, index)) continue;
          
          // Skip if already using i18n
          if (isUsingI18n(line, index)) continue;
          
          // Check if it's in a string literal
          if (!isInStringLiteral(line, index)) continue;
          
          // Skip if it's a variable name or function name
          if (line[index - 1] && /[a-zA-Z0-9_]/.test(line[index - 1])) continue;
          if (line[index + text.length] && /[a-zA-Z0-9_]/.test(line[index + text.length])) continue;
          
          // Get context
          const context = [
            i > 0 ? lines[i - 1].trim() : '',
            line.trim(),
            i < lines.length - 1 ? lines[i + 1].trim() : ''
          ].filter(l => l).join('\n');
          
          results.push({
            file: filePath,
            line: lineNum,
            text: text,
            context: context,
            type: 'turkish'
          });
        }
      }
      
      // Check for common English patterns (that should be translated)
      for (const pattern of englishPatterns) {
        while ((match = pattern.exec(line)) !== null) {
          const text = match[0];
          const index = match.index;
          
          // Skip if in comment
          if (isInComment(line, index) || isInJSXComment(line, index)) continue;
          
          // Skip if already using i18n
          if (isUsingI18n(line, index)) continue;
          
          // Check if it's in a string literal
          if (!isInStringLiteral(line, index)) continue;
          
          // Skip if it's a variable name or function name
          if (line[index - 1] && /[a-zA-Z0-9_]/.test(line[index - 1])) continue;
          if (line[index + text.length] && /[a-zA-Z0-9_]/.test(line[index + text.length])) continue;
          
          // Get context
          const context = [
            i > 0 ? lines[i - 1].trim() : '',
            line.trim(),
            i < lines.length - 1 ? lines[i + 1].trim() : ''
          ].filter(l => l).join('\n');
          
          results.push({
            file: filePath,
            line: lineNum,
            text: text,
            context: context,
            type: 'english'
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  
  return results;
}

async function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Finding hardcoded texts in code...\n');
  
  // Find all code files
  const codeFiles = await glob('**/*.{tsx,ts}', {
    cwd: srcDir,
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/api/**',
      '**/locales/**',
      '**/i18n/**',
      '**/*.d.ts',
      '**/scripts/**',
    ],
  });
  
  console.log(`Scanning ${codeFiles.length} files...\n`);
  
  const allHardcoded: HardcodedText[] = [];
  const byFile: Record<string, HardcodedText[]> = {};
  
  for (const file of codeFiles) {
    const fullPath = path.join(srcDir, file);
    const results = findHardcodedTexts(fullPath);
    
    if (results.length > 0) {
      allHardcoded.push(...results);
      byFile[file] = results;
    }
  }
  
  // Generate report
  const report = {
    summary: {
      totalFiles: codeFiles.length,
      filesWithHardcoded: Object.keys(byFile).length,
      totalHardcoded: allHardcoded.length,
      turkish: allHardcoded.filter(h => h.type === 'turkish').length,
      english: allHardcoded.filter(h => h.type === 'english').length,
    },
    byFile: Object.entries(byFile).map(([file, texts]) => ({
      file,
      count: texts.length,
      texts: texts.map(t => ({
        line: t.line,
        text: t.text,
        type: t.type,
        context: t.context
      }))
    })),
    allHardcoded: allHardcoded.map(h => ({
      file: h.file.replace(process.cwd() + path.sep, ''),
      line: h.line,
      text: h.text,
      type: h.type,
      context: h.context
    }))
  };
  
  // Save report
  const reportPath = path.join(process.cwd(), 'hardcoded-texts-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('=== Summary ===');
  console.log(`Total files scanned: ${report.summary.totalFiles}`);
  console.log(`Files with hardcoded texts: ${report.summary.filesWithHardcoded}`);
  console.log(`Total hardcoded texts: ${report.summary.totalHardcoded}`);
  console.log(`  - Turkish: ${report.summary.turkish}`);
  console.log(`  - English: ${report.summary.english}`);
  console.log(`\nReport saved to: hardcoded-texts-report.json`);
  
  // Print top files with most hardcoded texts
  const topFiles = Object.entries(byFile)
    .map(([file, texts]) => ({ file, count: texts.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  if (topFiles.length > 0) {
    console.log('\n=== Top 20 Files with Hardcoded Texts ===');
    for (const { file, count } of topFiles) {
      console.log(`${file}: ${count} hardcoded texts`);
    }
  }
}

main().catch(console.error);

