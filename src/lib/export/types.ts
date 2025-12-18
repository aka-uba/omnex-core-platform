export type ExportFormat = 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html' | 'zip';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  title?: string;
  description?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  tableStyle?: 'default' | 'minimal' | 'professional';
  columns?: string[];
  selectedRows?: any[];
  templateId?: string; // FAZ 0.3: Export template ID
  
  // Excel specific options
  excel?: {
    columnWidth?: number | 'auto'; // Sütun genişliği (sayı veya 'auto')
    rowHeight?: number; // Satır yüksekliği
    cellAlignment?: 'left' | 'center' | 'right' | 'justify';
    borders?: boolean; // Kenar çizgileri
    borderStyle?: 'thin' | 'medium' | 'thick' | 'dotted' | 'dashed';
    borderColor?: string; // Hex color
    colorScheme?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray' | 'custom';
    customColors?: {
      headerBg?: string;
      headerText?: string;
      evenRowBg?: string;
      oddRowBg?: string;
    };
    orientation?: 'portrait' | 'landscape'; // Yatay/Dikey
    paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
    fitToPage?: boolean; // Sayfaya sığdır
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  
  // CSV specific options
  csv?: {
    delimiter?: ',' | ';' | '\t'; // Ayırıcı
    encoding?: 'utf-8' | 'utf-8-bom' | 'windows-1254';
    lineEnding?: 'lf' | 'crlf'; // Satır sonu
    quoteAll?: boolean; // Tüm alanları tırnak içine al
    escapeChar?: string; // Kaçış karakteri
  };
  
  // Word specific options
  word?: {
    paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    headerFooter?: boolean; // Antetli kağıt
    headerContent?: string;
    footerContent?: string;
  };
  
  // PDF specific options
  pdf?: {
    paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    fitToWidth?: boolean; // Genişliğe göre sığdır
    fontSize?: number;
    fontFamily?: string;
    colorScheme?: 'default' | 'grayscale' | 'custom';
  };
  
  // HTML specific options
  html?: {
    paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    showPrintControls?: boolean; // Yazdır kontrollerini göster
    showSaveButtons?: boolean; // Kaydet butonlarını göster
  };
}

export interface CompanySettings {
  logo?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface ExportData {
  columns: string[];
  columnAlignments?: ('left' | 'center' | 'right')[]; // Sütun hizalamaları (opsiyonel)
  rows: any[][];
  metadata?: {
    title?: string;
    description?: string;
    generatedAt?: string;
    generatedBy?: string;
  };
}

// FAZ 0.3: Export Template Types
export interface ExportTemplate {
  id: string;
  tenantId: string;
  companyId?: string | null;
  locationId?: string | null;
  name: string;
  type: 'header' | 'footer' | 'full';
  logoUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  customFields?: Record<string, any> | null;
  layout?: Record<string, any> | null;
  styles?: Record<string, any> | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportTemplateData {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  customFields?: Record<string, any>;
  layout?: Record<string, any>;
  styles?: Record<string, any>;
  design?: Record<string, any>; // Template design structure (HTML-like structure for rendering)
}
