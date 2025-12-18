import * as fs from 'fs';
import * as path from 'path';

interface I18nKeyUsage {
  file: string;
  keys: string[];
  namespace?: string;
  missingKeys: string[];
}

interface MissingKeysReport {
  missingKeys: {
    global?: string[];
    [key: string]: string[] | undefined;
  };
  keyUsage: I18nKeyUsage[];
}

// Load JSON file safely
function loadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

// Save JSON file safely with proper formatting
function saveJsonFile(filePath: string, data: any): void {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    throw error;
  }
}

// Set nested value in object
function setNestedValue(obj: any, keyPath: string, value: string): void {
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
  // Only set if not already exists
  if (!(lastKey in current)) {
    current[lastKey] = value;
  }
}

// Filter valid keys (exclude invalid patterns)
function isValidKey(key: string): boolean {
  // Exclude: single characters, numbers, special chars, paths, URLs, etc.
  if (key.length < 2) return false;
  if (/^[0-9]+$/.test(key)) return false;
  if (/^[^a-zA-Z]/.test(key)) return false;
  if (key.includes('/') && !key.startsWith('modules/')) return false;
  if (key.includes('@')) return false;
  if (key.includes('://')) return false;
  if (key.includes('\\')) return false;
  if (key.startsWith('.')) return false;
  if (key === 'empty' || key === 'loading' || key === 'error' || key === 'success') return true; // Common keys
  if (key.includes(' ')) return false; // No spaces in keys
  return true;
}

// Generate placeholder translation based on key
function generatePlaceholder(key: string): string {
  // Extract last part of key
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Common patterns
  if (lastPart.includes('Placeholder')) {
    return `${lastPart.replace('Placeholder', '')} girin...`;
  }
  if (lastPart.includes('Description')) {
    return `${lastPart.replace('Description', '')} açıklaması`;
  }
  if (lastPart.includes('Title')) {
    return parts.length > 1 ? parts[parts.length - 2] : lastPart.replace('Title', '');
  }
  if (lastPart.includes('Label')) {
    return lastPart.replace('Label', '');
  }
  if (lastPart === 'loading') return 'Yükleniyor...';
  if (lastPart === 'error') return 'Hata';
  if (lastPart === 'success') return 'Başarılı';
  if (lastPart === 'empty') return 'Veri bulunamadı';
  if (lastPart === 'noData') return 'Veri bulunamadı';
  if (lastPart === 'noResults') return 'Sonuç bulunamadı';
  if (lastPart === 'required') return 'Gerekli';
  if (lastPart === 'notFound') return 'Bulunamadı';
  if (lastPart === 'actions') return 'İşlemler';
  if (lastPart === 'table') return 'Tablo';
  if (lastPart === 'filter') return 'Filtre';
  if (lastPart === 'form') return 'Form';
  if (lastPart === 'status') return 'Durum';
  if (lastPart === 'title') return 'Başlık';
  if (lastPart === 'description') return 'Açıklama';
  if (lastPart === 'name') return 'Ad';
  if (lastPart === 'email') return 'E-posta';
  if (lastPart === 'phone') return 'Telefon';
  if (lastPart === 'address') return 'Adres';
  if (lastPart === 'date') return 'Tarih';
  if (lastPart === 'time') return 'Saat';
  if (lastPart === 'amount') return 'Tutar';
  if (lastPart === 'price') return 'Fiyat';
  if (lastPart === 'quantity') return 'Miktar';
  if (lastPart === 'total') return 'Toplam';
  if (lastPart === 'subtotal') return 'Ara Toplam';
  if (lastPart === 'tax') return 'Vergi';
  if (lastPart === 'currency') return 'Para Birimi';
  if (lastPart === 'payment') return 'Ödeme';
  if (lastPart === 'invoice') return 'Fatura';
  if (lastPart === 'expense') return 'Gider';
  if (lastPart === 'subscription') return 'Abonelik';
  if (lastPart === 'customer') return 'Müşteri';
  if (lastPart === 'client') return 'Müşteri';
  if (lastPart === 'user') return 'Kullanıcı';
  if (lastPart === 'role') return 'Rol';
  if (lastPart === 'permission') return 'İzin';
  if (lastPart === 'module') return 'Modül';
  if (lastPart === 'location') return 'Konum';
  if (lastPart === 'category') return 'Kategori';
  if (lastPart === 'type') return 'Tip';
  if (lastPart === 'active') return 'Aktif';
  if (lastPart === 'inactive') return 'Pasif';
  if (lastPart === 'pending') return 'Beklemede';
  if (lastPart === 'completed') return 'Tamamlandı';
  if (lastPart === 'failed') return 'Başarısız';
  if (lastPart === 'cancelled') return 'İptal Edildi';
  if (lastPart === 'approved') return 'Onaylandı';
  if (lastPart === 'rejected') return 'Reddedildi';
  if (lastPart === 'draft') return 'Taslak';
  if (lastPart === 'sent') return 'Gönderildi';
  if (lastPart === 'paid') return 'Ödendi';
  if (lastPart === 'overdue') return 'Vadesi Geçmiş';
  if (lastPart === 'suspended') return 'Askıya Alındı';
  if (lastPart === 'expired') return 'Süresi Dolmuş';
  if (lastPart === 'createdAt') return 'Oluşturulma Tarihi';
  if (lastPart === 'updatedAt') return 'Güncellenme Tarihi';
  if (lastPart === 'startDate') return 'Başlangıç Tarihi';
  if (lastPart === 'endDate') return 'Bitiş Tarihi';
  if (lastPart === 'dueDate') return 'Vade Tarihi';
  if (lastPart === 'paymentDate') return 'Ödeme Tarihi';
  if (lastPart === 'expenseDate') return 'Gider Tarihi';
  if (lastPart === 'invoiceDate') return 'Fatura Tarihi';
  if (lastPart === 'invoiceNumber') return 'Fatura Numarası';
  if (lastPart === 'paymentNumber') return 'Ödeme Numarası';
  if (lastPart === 'orderNumber') return 'Sipariş Numarası';
  if (lastPart === 'reference') return 'Referans';
  if (lastPart === 'notes') return 'Notlar';
  if (lastPart === 'method') return 'Yöntem';
  if (lastPart === 'cycle') return 'Döngü';
  if (lastPart === 'billingCycle') return 'Faturalama Döngüsü';
  if (lastPart === 'basePrice') return 'Temel Fiyat';
  if (lastPart === 'commission') return 'Komisyon';
  if (lastPart === 'rate') return 'Oran';
  if (lastPart === 'taxRate') return 'Vergi Oranı';
  if (lastPart === 'taxAmount') return 'Vergi Tutarı';
  if (lastPart === 'taxNumber') return 'Vergi Numarası';
  if (lastPart === 'taxOffice') return 'Vergi Dairesi';
  if (lastPart === 'iban') return 'IBAN';
  if (lastPart === 'bankName') return 'Banka Adı';
  if (lastPart === 'accountHolder') return 'Hesap Sahibi';
  if (lastPart === 'registrationNumber') return 'Sicil Numarası';
  if (lastPart === 'mersisNumber') return 'MERSİS Numarası';
  if (lastPart === 'foundedYear') return 'Kuruluş Yılı';
  if (lastPart === 'employeeCount') return 'Çalışan Sayısı';
  if (lastPart === 'capital') return 'Sermaye';
  if (lastPart === 'website') return 'Web Sitesi';
  if (lastPart === 'industry') return 'Sektör';
  if (lastPart === 'city') return 'Şehir';
  if (lastPart === 'state') return 'İl/İlçe';
  if (lastPart === 'country') return 'Ülke';
  if (lastPart === 'postalCode') return 'Posta Kodu';
  if (lastPart === 'emergencyContact') return 'Acil Durum İletişimi';
  if (lastPart === 'emergencyPhone') return 'Acil Durum Telefonu';
  if (lastPart === 'hireDate') return 'İşe Alınma Tarihi';
  if (lastPart === 'department') return 'Departman';
  if (lastPart === 'position') return 'Pozisyon';
  if (lastPart === 'employeeId') return 'Çalışan ID';
  if (lastPart === 'manager') return 'Yönetici';
  if (lastPart === 'agency') return 'Acenta';
  if (lastPart === 'profilePicture') return 'Profil Resmi';
  if (lastPart === 'defaultLanguage') return 'Varsayılan Dil';
  if (lastPart === 'defaultLayout') return 'Varsayılan Düzen';
  if (lastPart === 'defaultTheme') return 'Varsayılan Tema';
  if (lastPart === 'credentials') return 'Kimlik Bilgileri';
  if (lastPart === 'password') return 'Şifre';
  if (lastPart === 'confirmPassword') return 'Şifre Onayı';
  if (lastPart === 'fullName') return 'Ad Soyad';
  if (lastPart === 'username') return 'Kullanıcı Adı';
  if (lastPart === 'lastActive') return 'Son Aktif';
  if (lastPart === 'cv') return 'CV';
  if (lastPart === 'uploadCv') return 'CV Yükle';
  if (lastPart === 'contract') return 'Sözleşme';
  if (lastPart === 'idCard') return 'Kimlik Kartı';
  if (lastPart === 'passport') return 'Pasaport';
  if (lastPart === 'documents') return 'Belgeler';
  if (lastPart === 'personal') return 'Kişisel';
  if (lastPart === 'contact') return 'İletişim';
  if (lastPart === 'work') return 'İş';
  if (lastPart === 'preferences') return 'Tercihler';
  if (lastPart === 'tabs') return 'Sekmeler';
  if (lastPart === 'create') return 'Oluştur';
  if (lastPart === 'edit') return 'Düzenle';
  if (lastPart === 'delete') return 'Sil';
  if (lastPart === 'update') return 'Güncelle';
  if (lastPart === 'save') return 'Kaydet';
  if (lastPart === 'cancel') return 'İptal';
  if (lastPart === 'view') return 'Görüntüle';
  if (lastPart === 'back') return 'Geri';
  if (lastPart === 'export') return 'Dışa Aktar';
  if (lastPart === 'import') return 'İçe Aktar';
  if (lastPart === 'print') return 'Yazdır';
  if (lastPart === 'download') return 'İndir';
  if (lastPart === 'upload') return 'Yükle';
  if (lastPart === 'search') return 'Ara';
  if (lastPart === 'filter') return 'Filtre';
  if (lastPart === 'sort') return 'Sırala';
  if (lastPart === 'refresh') return 'Yenile';
  if (lastPart === 'reset') return 'Sıfırla';
  if (lastPart === 'clear') return 'Temizle';
  if (lastPart === 'apply') return 'Uygula';
  if (lastPart === 'confirm') return 'Onayla';
  if (lastPart === 'close') return 'Kapat';
  if (lastPart === 'submit') return 'Gönder';
  if (lastPart === 'next') return 'İleri';
  if (lastPart === 'previous') return 'Önceki';
  if (lastPart === 'all') return 'Tümü';
  if (lastPart === 'none') return 'Hiçbiri';
  if (lastPart === 'select') return 'Seç';
  if (lastPart === 'choose') return 'Seçin';
  if (lastPart === 'enter') return 'Girin';
  if (lastPart === 'selectAll') return 'Tümünü Seç';
  if (lastPart === 'deselectAll') return 'Tümünü Kaldır';
  if (lastPart === 'bulkActions') return 'Toplu İşlemler';
  if (lastPart === 'bulkExport') return 'Toplu Dışa Aktar';
  if (lastPart === 'bulkDelete') return 'Toplu Sil';
  if (lastPart === 'selected') return 'Seçili';
  if (lastPart === 'selectedCount') return 'Seçili Sayısı';
  if (lastPart === 'pagination') return 'Sayfalama';
  if (lastPart === 'recordsPerPage') return 'Sayfa Başına Kayıt';
  if (lastPart === 'showing') return 'Gösteriliyor';
  if (lastPart === 'of') return 'toplam';
  if (lastPart === 'page') return 'Sayfa';
  if (lastPart === 'total') return 'Toplam';
  if (lastPart === 'count') return 'Sayı';
  if (lastPart === 'no') return 'Hayır';
  if (lastPart === 'yes') return 'Evet';
  if (lastPart === 'true') return 'Evet';
  if (lastPart === 'false') return 'Hayır';
  if (lastPart === 'enabled') return 'Etkin';
  if (lastPart === 'disabled') return 'Devre Dışı';
  if (lastPart === 'isActive') return 'Aktif';
  if (lastPart === 'isDefault') return 'Varsayılan';
  if (lastPart === 'isRequired') return 'Gerekli';
  if (lastPart === 'isOptional') return 'Opsiyonel';
  if (lastPart === 'hasImage') return 'Resim Var';
  if (lastPart === 'hasFile') return 'Dosya Var';
  if (lastPart === 'hasAttachment') return 'Ek Var';
  if (lastPart === 'hasLink') return 'Link Var';
  if (lastPart === 'hasVideo') return 'Video Var';
  if (lastPart === 'hasAudio') return 'Ses Var';
  if (lastPart === 'hasDocument') return 'Belge Var';
  if (lastPart === 'hasSpreadsheet') return 'Tablo Var';
  if (lastPart === 'hasPresentation') return 'Sunum Var';
  if (lastPart === 'hasArchive') return 'Arşiv Var';
  if (lastPart === 'hasCode') return 'Kod Var';
  if (lastPart === 'hasText') return 'Metin Var';
  if (lastPart === 'hasHtml') return 'HTML Var';
  if (lastPart === 'hasCss') return 'CSS Var';
  if (lastPart === 'hasJs') return 'JavaScript Var';
  if (lastPart === 'hasJson') return 'JSON Var';
  if (lastPart === 'hasXml') return 'XML Var';
  if (lastPart === 'hasYaml') return 'YAML Var';
  if (lastPart === 'hasMarkdown') return 'Markdown Var';
  if (lastPart === 'hasPdf') return 'PDF Var';
  if (lastPart === 'hasWord') return 'Word Var';
  if (lastPart === 'hasExcel') return 'Excel Var';
  if (lastPart === 'hasPowerpoint') return 'PowerPoint Var';
  if (lastPart === 'hasImage') return 'Resim Var';
  if (lastPart === 'hasVideo') return 'Video Var';
  if (lastPart === 'hasAudio') return 'Ses Var';
  if (lastPart === 'hasArchive') return 'Arşiv Var';
  if (lastPart === 'hasCode') return 'Kod Var';
  if (lastPart === 'hasText') return 'Metin Var';
  if (lastPart === 'hasHtml') return 'HTML Var';
  if (lastPart === 'hasCss') return 'CSS Var';
  if (lastPart === 'hasJs') return 'JavaScript Var';
  if (lastPart === 'hasJson') return 'JSON Var';
  if (lastPart === 'hasXml') return 'XML Var';
  if (lastPart === 'hasYaml') return 'YAML Var';
  if (lastPart === 'hasMarkdown') return 'Markdown Var';
  if (lastPart === 'hasPdf') return 'PDF Var';
  if (lastPart === 'hasWord') return 'Word Var';
  if (lastPart === 'hasExcel') return 'Excel Var';
  if (lastPart === 'hasPowerpoint') return 'PowerPoint Var';
  
  // Default: capitalize and add Turkish suffix
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

// Add missing keys to a namespace file
function addMissingKeysToNamespace(namespace: string, missingKeys: string[], localesDir: string): void {
  // Determine file path
  let filePath: string;
  if (namespace === 'global') {
    filePath = path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    filePath = path.join(localesDir, 'modules', moduleName, 'tr.json');
  } else {
    console.log(`Skipping unknown namespace: ${namespace}`);
    return;
  }

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const json = loadJsonFile(filePath);
  if (!json) {
    console.log(`Failed to load: ${filePath}`);
    return;
  }

  let addedCount = 0;
  for (const key of missingKeys) {
    if (!isValidKey(key)) {
      continue;
    }

    // Check if key already exists
    const keys = key.split('.');
    let current = json;
    let exists = true;
    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        exists = false;
        break;
      }
      current = current[k];
    }
    if (exists && typeof current === 'string') {
      continue; // Key already exists
    }

    // Add key with placeholder
    const placeholder = generatePlaceholder(key);
    setNestedValue(json, key, placeholder);
    addedCount++;
  }

  if (addedCount > 0) {
    saveJsonFile(filePath, json);
    console.log(`✓ Added ${addedCount} keys to ${namespace}`);
  } else {
    console.log(`- No new keys added to ${namespace}`);
  }
}

async function main() {
  const reportPath = path.join(process.cwd(), 'i18n-keys-analysis.json');
  const localesDir = path.join(process.cwd(), 'src', 'locales');

  if (!fs.existsSync(reportPath)) {
    console.error('Analysis report not found. Please run the analysis script first.');
    process.exit(1);
  }

  const report = loadJsonFile(reportPath) as MissingKeysReport;
  if (!report || !report.missingKeys) {
    console.error('Invalid report format');
    process.exit(1);
  }

  console.log('Adding missing i18n keys...\n');

  // Process global namespace
  if (report.missingKeys.global && report.missingKeys.global.length > 0) {
    const validKeys = report.missingKeys.global.filter(isValidKey);
    if (validKeys.length > 0) {
      addMissingKeysToNamespace('global', validKeys, localesDir);
    }
  }

  // Process module namespaces
  for (const [namespace, missingKeys] of Object.entries(report.missingKeys)) {
    if (namespace === 'global') continue;
    if (!missingKeys || missingKeys.length === 0) continue;

    const validKeys = missingKeys.filter(isValidKey);
    if (validKeys.length > 0) {
      addMissingKeysToNamespace(namespace, validKeys, localesDir);
    }
  }

  console.log('\n✓ Done!');
}

main().catch(console.error);






