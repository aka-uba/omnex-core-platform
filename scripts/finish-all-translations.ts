#!/usr/bin/env tsx

/**
 * Finish all translations by using Turkish locale as the source of truth
 * For every key in Turkish file, ensure it's properly translated in other languages
 * Remove all [TODO: Translate] tags and Turkish characters
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Turkish characters
const TURKISH_CHARS = /[ığüşöçİĞÜŞÖÇ]/;

function isTurkishText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Remove [TODO: Translate] prefix
  const cleanText = text.replace(/^\[TODO: Translate\]\s*/, '');
  
  // Check for Turkish characters
  if (TURKISH_CHARS.test(cleanText)) return true;
  
  return false;
}

// Load Turkish locale file and use it as reference for all translations
function loadTurkishReference(trFilePath: string): any {
  try {
    const content = fs.readFileSync(trFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not parse Turkish file: ${error}`);
    return null;
  }
}

// Get value by path
function getValueByPath(obj: any, keyPath: string): string | null {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return typeof current === 'string' ? current : null;
}

// Set value by path
function setValueByPath(obj: any, keyPath: string, value: string): void {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

// Get all keys from object
function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Simple word-by-word translation using Turkish as reference
// For complex translations, we'll use the Turkish text as-is but mark it for manual review
function translateFromTurkish(trText: string, targetLang: 'en' | 'de' | 'ar'): string {
  if (!trText || typeof trText !== 'string') return trText;
  
  // Common translations that we can do automatically
  const commonTranslations: Record<string, Record<string, string>> = {
    en: {
      'Daire': 'Apartment', 'daire': 'apartment',
      'Üniteleri': 'Units', 'üniteleri': 'units',
      'yönetin': 'manage', 'Yönetin': 'Manage',
      'Yeni bir daire oluşturun': 'Create a new apartment',
      'Daire bilgilerini düzenleyin': 'Edit apartment information',
      'Daire Detayları': 'Apartment Details',
      'Daire detaylarını görüntüleyin': 'View apartment details',
      'Yatak Odası Sayısı': 'Number of Bedrooms',
      'İnternet Hızı': 'Internet Speed',
      'Isıtma Sistemleri': 'Heating Systems',
      'Isıtma Giderleri': 'Heating Costs',
      'Kullanım Hakları': 'Usage Rights',
      'Isıtma ve İnternet': 'Heating and Internet',
      'Aylık Maliyetler': 'Monthly Costs',
      'Yayınlandı': 'Published',
      'Yeşil': 'Green',
      'Etkinlik başarıyla silindi': 'Event deleted successfully',
      'Bu etkinliği silmek istediğinizden emin misiniz?': 'Are you sure you want to delete this event?',
      'Finansal Genel Bakış': 'Financial Overview',
      'Seçilenleri Sil': 'Delete Selected',
      'Boyut (Küçük-Büyük)': 'Size (Small-Large)',
      'Boyut (Büyük-Küçük)': 'Size (Large-Small)',
      'Aç': 'Open',
      'Dosyayı Aç': 'Open File',
      'Paylaşım bağlantısı': 'Share link',
      'Not: Bu bağlantıya erişmek için kimlik doğrulama gereklidir.': 'Note: Authentication is required to access this link.',
      'Klasörü oluşturmak istediğiniz dizini seçin': 'Select the directory where you want to create the folder',
      'Dosya için kısa bir açıklama ekleyin...': 'Add a brief description for the file...',
      'Kimlerin görüntüleyebileceğini ve bu dosyanın neyle ilişkili olduğunu kontrol edin': 'Control who can view and what this file is associated with',
      'Herkese Açık': 'Public',
      'Proje ile İlişkilendir': 'Associate with Project',
      'Silme Onayı': 'Delete Confirmation',
      'dosyasını silmek istediğinizden emin misiniz?': 'Are you sure you want to delete the file',
      'Bu işlem geri alınamaz.': 'This action cannot be undone.',
      'Başarıyla silindi': 'Successfully deleted',
      'Geçersiz klasör adı': 'Invalid folder name',
      'Bu dosya türü için önizleme mevcut değil.': 'Preview not available for this file type.',
      'Sunucu belirtilen süre sonra otomatik olarak durdurulacak. 0 = süresiz': 'Server will automatically stop after the specified time. 0 = unlimited',
      'Öğe silindi': 'Item deleted',
      'Kiracılar ve modüller arasında dosyaları yönetin': 'Manage files between tenants and modules',
      'Hedef seçin': 'Select destination',
      'Export belgeleri için özel başlık ve alt bilgi şablonları oluşturun ve yönetin': 'Create and manage custom header and footer templates for export documents',
      'Bu şablonu silmek istediğinize emin misiniz?': 'Are you sure you want to delete this template?',
      '20 hazır şablon oluşturulacak. Devam etmek istiyor musunuz?': '20 ready templates will be created. Do you want to continue?',
      'Şablon başarıyla silindi': 'Template deleted successfully',
      'Şablon silinirken bir hata oluştu': 'An error occurred while deleting the template',
      'Henüz logo eklenmedi': 'No logos added yet',
      'Başlık Ekle': 'Add Header',
      'Henüz başlık eklenmedi': 'No headers added yet',
      'Henüz alt bilgi eklenmedi': 'No footers added yet',
      'Lisans Geçmişi': 'License History',
      'Bu paketi silmek istediğinize emin misiniz?': 'Are you sure you want to delete this package?',
    },
    de: {
      'Daire': 'Wohnung', 'daire': 'wohnung',
      'Üniteleri': 'Einheiten', 'üniteleri': 'einheiten',
      'yönetin': 'verwalten', 'Yönetin': 'Verwalten',
      'Yeni bir daire oluşturun': 'Neue Wohnung erstellen',
      'Daire bilgilerini düzenleyin': 'Wohnungsinformationen bearbeiten',
      'Daire Detayları': 'Wohnungsdetails',
      'Daire detaylarını görüntüleyin': 'Wohnungsdetails anzeigen',
      'Yatak Odası Sayısı': 'Anzahl der Schlafzimmer',
      'İnternet Hızı': 'Internetgeschwindigkeit',
      'Isıtma Sistemleri': 'Heizungssysteme',
      'Isıtma Giderleri': 'Heizkosten',
      'Kullanım Hakları': 'Nutzungsrechte',
      'Isıtma ve İnternet': 'Heizung und Internet',
      'Aylık Maliyetler': 'Monatliche Kosten',
      'Yayınlandı': 'Veröffentlicht',
      'Yeşil': 'Grün',
      'Etkinlik başarıyla silindi': 'Ereignis erfolgreich gelöscht',
      'Bu etkinliği silmek istediğinizden emin misiniz?': 'Möchten Sie dieses Ereignis wirklich löschen?',
      'Finansal Genel Bakış': 'Finanzielle Übersicht',
      'Seçilenleri Sil': 'Ausgewählte löschen',
      'Boyut (Küçük-Büyük)': 'Größe (Klein-Groß)',
      'Boyut (Büyük-Küçük)': 'Größe (Groß-Klein)',
      'Aç': 'Öffnen',
      'Dosyayı Aç': 'Datei öffnen',
      'Paylaşım bağlantısı': 'Freigabelink',
      'Not: Bu bağlantıya erişmek için kimlik doğrulama gereklidir.': 'Hinweis: Authentifizierung ist erforderlich, um auf diesen Link zuzugreifen.',
      'Klasörü oluşturmak istediğiniz dizini seçin': 'Wählen Sie das Verzeichnis aus, in dem Sie den Ordner erstellen möchten',
      'Dosya için kısa bir açıklama ekleyin...': 'Fügen Sie eine kurze Beschreibung für die Datei hinzu...',
      'Kimlerin görüntüleyebileceğini ve bu dosyanın neyle ilişkili olduğunu kontrol edin': 'Steuern Sie, wer anzeigen kann und womit diese Datei verknüpft ist',
      'Herkese Açık': 'Öffentlich',
      'Proje ile İlişkilendir': 'Mit Projekt verknüpfen',
      'Silme Onayı': 'Löschbestätigung',
      'dosyasını silmek istediğinizden emin misiniz?': 'Möchten Sie die Datei wirklich löschen',
      'Bu işlem geri alınamaz.': 'Diese Aktion kann nicht rückgängig gemacht werden.',
      'Başarıyla silindi': 'Erfolgreich gelöscht',
      'Geçersiz klasör adı': 'Ungültiger Ordnername',
      'Bu dosya türü için önizleme mevcut değil.': 'Vorschau für diesen Dateityp nicht verfügbar.',
      'Sunucu belirtilen süre sonra otomatik olarak durdurulacak. 0 = süresiz': 'Server wird nach der angegebenen Zeit automatisch gestoppt. 0 = unbegrenzt',
      'Öğe silindi': 'Element gelöscht',
      'Kiracılar ve modüller arasında dosyaları yönetin': 'Dateien zwischen Mietern und Modulen verwalten',
      'Hedef seçin': 'Ziel auswählen',
      'Export belgeleri için özel başlık ve alt bilgi şablonları oluşturun ve yönetin': 'Erstellen und verwalten Sie benutzerdefinierte Kopf- und Fußzeilenvorlagen für Exportdokumente',
      'Bu şablonu silmek istediğinize emin misiniz?': 'Möchten Sie diese Vorlage wirklich löschen?',
      '20 hazır şablon oluşturulacak. Devam etmek istiyor musunuz?': '20 fertige Vorlagen werden erstellt. Möchten Sie fortfahren?',
      'Şablon başarıyla silindi': 'Vorlage erfolgreich gelöscht',
      'Şablon silinirken bir hata oluştu': 'Fehler beim Löschen der Vorlage',
      'Henüz logo eklenmedi': 'Noch keine Logos hinzugefügt',
      'Başlık Ekle': 'Kopfzeile hinzufügen',
      'Henüz başlık eklenmedi': 'Noch keine Kopfzeilen hinzugefügt',
      'Henüz alt bilgi eklenmedi': 'Noch keine Fußzeilen hinzugefügt',
      'Lisans Geçmişi': 'Lizenzverlauf',
      'Bu paketi silmek istediğinize emin misiniz?': 'Möchten Sie dieses Paket wirklich löschen?',
    },
    ar: {
      'Daire': 'شقة', 'daire': 'شقة',
      'Üniteleri': 'الوحدات', 'üniteleri': 'الوحدات',
      'yönetin': 'إدارة', 'Yönetin': 'إدارة',
      'Yeni bir daire oluşturun': 'إنشاء شقة جديدة',
      'Daire bilgilerini düzenleyin': 'تعديل معلومات الشقة',
      'Daire Detayları': 'تفاصيل الشقة',
      'Daire detaylarını görüntüleyin': 'عرض تفاصيل الشقة',
      'Yatak Odası Sayısı': 'عدد غرف النوم',
      'İnternet Hızı': 'سرعة الإنترنت',
      'Isıtma Sistemleri': 'أنظمة التدفئة',
      'Isıtma Giderleri': 'تكاليف التدفئة',
      'Kullanım Hakları': 'حقوق الاستخدام',
      'Isıtma ve İnternet': 'التدفئة والإنترنت',
      'Aylık Maliyetler': 'التكاليف الشهرية',
      'Yayınlandı': 'منشور',
      'Yeşil': 'أخضر',
      'Etkinlik başarıyla silindi': 'تم حذف الحدث بنجاح',
      'Bu etkinliği silmek istediğinizden emin misiniz?': 'هل أنت متأكد أنك تريد حذف هذا الحدث؟',
      'Finansal Genel Bakış': 'نظرة عامة مالية',
      'Seçilenleri Sil': 'حذف المحدد',
      'Boyut (Küçük-Büyük)': 'الحجم (صغير-كبير)',
      'Boyut (Büyük-Küçük)': 'الحجم (كبير-صغير)',
      'Aç': 'فتح',
      'Dosyayı Aç': 'فتح الملف',
      'Paylaşım bağlantısı': 'رابط المشاركة',
      'Not: Bu bağlantıya erişmek için kimlik doğrulama gereklidir.': 'ملاحظة: يتطلب المصادقة للوصول إلى هذا الرابط.',
      'Klasörü oluşturmak istediğiniz dizini seçin': 'اختر الدليل الذي تريد إنشاء المجلد فيه',
      'Dosya için kısa bir açıklama ekleyin...': 'أضف وصفاً موجزاً للملف...',
      'Kimlerin görüntüleyebileceğini ve bu dosyanın neyle ilişkili olduğunu kontrol edin': 'التحكم في من يمكنه العرض وما يرتبط بهذا الملف',
      'Herkese Açık': 'عام',
      'Proje ile İlişkilendir': 'ربط بالمشروع',
      'Silme Onayı': 'تأكيد الحذف',
      'dosyasını silmek istediğinizden emin misiniz?': 'هل أنت متأكد أنك تريد حذف الملف',
      'Bu işlem geri alınamaz.': 'لا يمكن التراجع عن هذا الإجراء.',
      'Başarıyla silindi': 'تم الحذف بنجاح',
      'Geçersiz klasör adı': 'اسم المجلد غير صالح',
      'Bu dosya türü için önizleme mevcut değil.': 'معاينة غير متاحة لهذا النوع من الملفات.',
      'Sunucu belirtilen süre sonra otomatik olarak durdurulacak. 0 = süresiz': 'سيتم إيقاف الخادم تلقائياً بعد الوقت المحدد. 0 = غير محدود',
      'Öğe silindi': 'تم حذف العنصر',
      'Kiracılar ve modüller arasında dosyaları yönetin': 'إدارة الملفات بين المستأجرين والوحدات',
      'Hedef seçin': 'اختر الوجهة',
      'Export belgeleri için özel başlık ve alt bilgi şablonları oluşturun ve yönetin': 'إنشاء وإدارة قوالب رأس وتذييل مخصصة لمستندات التصدير',
      'Bu şablonu silmek istediğinize emin misiniz?': 'هل أنت متأكد أنك تريد حذف هذا القالب؟',
      '20 hazır şablon oluşturulacak. Devam etmek istiyor musunuz?': 'سيتم إنشاء 20 قالباً جاهزاً. هل تريد المتابعة؟',
      'Şablon başarıyla silindi': 'تم حذف القالب بنجاح',
      'Şablon silinirken bir hata oluştu': 'حدث خطأ أثناء حذف القالب',
      'Henüz logo eklenmedi': 'لم تتم إضافة شعارات بعد',
      'Başlık Ekle': 'إضافة رأس',
      'Henüz başlık eklenmedi': 'لم تتم إضافة رؤوس بعد',
      'Henüz alt bilgi eklenmedi': 'لم تتم إضافة تذييلات بعد',
      'Lisans Geçmişi': 'سجل الترخيص',
      'Bu paketi silmek istediğinize emin misiniz?': 'هل أنت متأكد أنك تريد حذف هذه الحزمة؟',
    },
  };
  
  const translations = commonTranslations[targetLang];
  if (!translations) return trText;
  
  // Try direct match
  if (translations[trText]) {
    return translations[trText];
  }
  
  // Try word-by-word replacement
  let translated = trText;
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const turkish of sortedKeys) {
    const regex = new RegExp(`\\b${turkish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translated = translated.replace(regex, translations[turkish]);
  }
  
  // If still contains Turkish, use the Turkish text as fallback (but this shouldn't happen in production)
  // For now, we'll return the Turkish text so it can be manually translated
  if (TURKISH_CHARS.test(translated)) {
    // Return Turkish text - this will be caught and handled
    return trText;
  }
  
  return translated;
}

async function main() {
  console.log('🔄 Finishing all translations from Turkish locale files...\n');
  
  // Find all locale files
  const allLocaleFiles = await glob('**/*.json', {
    cwd: LOCALES_DIR,
    ignore: ['**/node_modules/**'],
  });
  
  // Group files by namespace
  const namespaceMap: Record<string, Record<string, string>> = {};
  
  for (const file of allLocaleFiles) {
    const dir = path.dirname(file);
    const lang = path.basename(file, '.json');
    const namespace = dir.replace(/\\/g, '/');
    
    if (!namespaceMap[namespace]) {
      namespaceMap[namespace] = {};
    }
    namespaceMap[namespace][lang] = file;
  }
  
  const totals: Record<string, { translated: number; total: number; needsManual: number }> = {
    en: { translated: 0, total: 0, needsManual: 0 },
    de: { translated: 0, total: 0, needsManual: 0 },
    ar: { translated: 0, total: 0, needsManual: 0 },
  };
  
  const needsManualReview: Array<{ namespace: string; lang: string; key: string; trValue: string }> = [];
  
  // Process each namespace
  for (const namespace in namespaceMap) {
    const files = namespaceMap[namespace];
    const trFile = files['tr'];
    
    if (!trFile) {
      continue;
    }
    
    // Load Turkish reference
    const trFilePath = path.join(LOCALES_DIR, trFile);
    const trData = loadTurkishReference(trFilePath);
    
    if (!trData) {
      continue;
    }
    
    const trKeys = getAllKeys(trData);
    
    // Process each target language
    for (const lang of ['en', 'de', 'ar'] as const) {
      const langFile = files[lang];
      if (!langFile) continue;
      
      const langFilePath = path.join(LOCALES_DIR, langFile);
      let langData: any;
      let changed = false;
      
      try {
        const langContent = fs.readFileSync(langFilePath, 'utf-8');
        langData = JSON.parse(langContent);
      } catch (error) {
        console.warn(`⚠️  Could not parse ${langFile}: ${error}`);
        continue;
      }
      
      let translated = 0;
      let total = 0;
      let needsManual = 0;
      
      // For each key in Turkish file, ensure it's properly translated
      for (const key of trKeys) {
        const trValue = getValueByPath(trData, key);
        if (!trValue || typeof trValue !== 'string') continue;
        
        total++;
        
        const langValue = getValueByPath(langData, key);
        
        // If key doesn't exist, or contains Turkish text, or has TODO prefix, translate it
        if (!langValue || isTurkishText(langValue) || langValue.startsWith('[TODO: Translate]')) {
          const translatedValue = translateFromTurkish(trValue, lang);
          
          // If translation still contains Turkish, it needs manual review
          if (TURKISH_CHARS.test(translatedValue)) {
            needsManual++;
            needsManualReview.push({ namespace, lang, key, trValue });
            // Use Turkish text as fallback for now
            setValueByPath(langData, key, trValue);
          } else {
            setValueByPath(langData, key, translatedValue);
            translated++;
          }
          changed = true;
        }
      }
      
      if (changed) {
        // Write updated language file
        fs.writeFileSync(langFilePath, JSON.stringify(langData, null, 2) + '\n', 'utf-8');
        console.log(`✅ ${namespace} (${lang.toUpperCase()}): Translated ${translated}/${total} keys (${needsManual} need manual review)`);
      } else if (total > 0) {
        console.log(`✅ ${namespace} (${lang.toUpperCase()}): All keys already translated (${total} keys checked)`);
      }
      
      totals[lang].translated += translated;
      totals[lang].total += total;
      totals[lang].needsManual += needsManual;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  EN: Translated ${totals.en.translated}/${totals.en.total} keys (${totals.en.needsManual} need manual review)`);
  console.log(`  DE: Translated ${totals.de.translated}/${totals.de.total} keys (${totals.de.needsManual} need manual review)`);
  console.log(`  AR: Translated ${totals.ar.translated}/${totals.ar.total} keys (${totals.ar.needsManual} need manual review)`);
  console.log(`  Total: ${totals.en.translated + totals.de.translated + totals.ar.translated} keys translated`);
  
  if (needsManualReview.length > 0) {
    console.log(`\n⚠️  ${needsManualReview.length} keys need manual review`);
    const reportPath = path.join(__dirname, '..', 'needs-manual-translation.json');
    fs.writeFileSync(reportPath, JSON.stringify(needsManualReview, null, 2), 'utf-8');
    console.log(`📝 Manual review list saved to: ${reportPath}`);
  }
  
  console.log('\n✅ Complete!');
}

if (require.main === module) {
  main().catch(console.error);
}






