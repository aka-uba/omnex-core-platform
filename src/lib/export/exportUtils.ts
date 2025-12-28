import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ExportData, ExportOptions, CompanySettings, ExportFormat, ExportTemplateData } from './types';
import { ExportTemplateService } from './ExportTemplateService';
import type { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

// Helper function to format date
 
// const formatDate = (date: Date): string => { // removed - unused
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
// };

// Helper function to format filename
export const formatFilename = (baseName: string, format: string, dateRange?: { from: string; to: string }): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const range = dateRange ? `_${dateRange.from}_${dateRange.to}` : '';
  return `${baseName}${range}_${timestamp}.${format}`;
};

/**
 * Get export template data
 * FAZ 0.3: Template desteği
 */
async function getExportTemplateData(
  options: ExportOptions,
  companySettings: CompanySettings,
  tenantPrisma?: TenantPrismaClient,
  tenantId?: string,
  companyId?: string,
  locationId?: string
): Promise<ExportTemplateData> {
  // If templateId provided, use template service
  if (options.templateId && tenantPrisma && tenantId) {
    const templateService = new ExportTemplateService(tenantPrisma);
    const template = await templateService.getTemplate(options.templateId);
    return templateService.mergeWithCompanySettings(template, companySettings);
  }

  // If no template, try to get default template
  if (tenantPrisma && tenantId) {
    const templateService = new ExportTemplateService(tenantPrisma);
    const defaultTemplate = await templateService.getDefaultTemplate(tenantId, companyId, locationId);
    return templateService.mergeWithCompanySettings(defaultTemplate, companySettings);
  }

  // Fallback to company settings only
  return {
    ...(companySettings.logo ? { logoUrl: companySettings.logo } : {}),
    title: companySettings.name,
    ...(companySettings.address ? { address: companySettings.address } : {}),
    ...(companySettings.phone ? { phone: companySettings.phone } : {}),
    ...(companySettings.email ? { email: companySettings.email } : {}),
    ...(companySettings.website ? { website: companySettings.website } : {}),
    ...(companySettings.taxId ? { taxNumber: companySettings.taxId } : {}),
  };
}

// Export to CSV
export const exportToCSV = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  tenantPrisma?: TenantPrismaClient,
  tenantId?: string,
  companyId?: string,
  locationId?: string,
  preloadedTemplateData?: ExportTemplateData
) => {
  const { columns, rows } = data;

  // Use preloaded template data or fetch from service
  const templateData = preloadedTemplateData || await getExportTemplateData(
    options,
    companySettings,
    tenantPrisma,
    tenantId,
    companyId,
    locationId
  );
  
  // Add BOM for UTF-8
  const BOM = '\uFEFF';
  let csv = BOM;
  
  // Add header from template if needed
  if (options.includeHeader) {
    if (templateData.title) csv += `${templateData.title}\n`;
    if (templateData.subtitle) csv += `${templateData.subtitle}\n`;
    if (templateData.address) csv += `${templateData.address}\n`;
    if (templateData.phone) csv += `Phone: ${templateData.phone}\n`;
    if (templateData.email) csv += `Email: ${templateData.email}\n`;
    if (templateData.website) csv += `Website: ${templateData.website}\n`;
    if (templateData.taxNumber) csv += `Tax Number: ${templateData.taxNumber}\n`;
    if (options.title) csv += `${options.title}\n`;
    if (options.description) csv += `${options.description}\n`;
    csv += '\n';
  }
  
  // Add column headers
  csv += columns.join(',') + '\n';
  
  // Add rows
  rows.forEach(row => {
    csv += row.map(cell => {
      const value = cell ?? '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',') + '\n';
  });
  
  // Add footer if needed
  if (options.includeFooter) {
    csv += '\n';
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    if (companySettings.name) csv += `Company: ${companySettings.name}\n`;
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = options.filename || formatFilename('report', 'csv', options.dateRange);
  saveAs(blob, filename);
};

// Export to Excel
export const exportToExcel = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  tenantPrisma?: TenantPrismaClient,
  tenantId?: string,
  companyId?: string,
  locationId?: string,
  preloadedTemplateData?: ExportTemplateData
) => {
  // Use preloaded template data or fetch from service
  const templateData = preloadedTemplateData || await getExportTemplateData(
    options,
    companySettings,
    tenantPrisma,
    tenantId,
    companyId,
    locationId
  );

  // Create Excel workbook with UTF-8 support
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companySettings.name || 'OMNEX Platform';
  workbook.created = new Date();
  // ExcelJS automatically handles UTF-8 encoding for all languages including Turkish
  const worksheet = workbook.addWorksheet('Report');
  
  let currentRow = 1;
  
  // Add header section from template
  if (options.includeHeader) {
    // Logo row (if available)
    if (templateData.logoUrl) {
      // TODO: Add logo image to Excel
      // For now, just add a placeholder
      const logoRow = worksheet.addRow(['[LOGO]']);
      logoRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    if (templateData.title) {
      const headerRow = worksheet.addRow([templateData.title]);
      headerRow.font = { size: 16, bold: true };
      headerRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    if (templateData.subtitle) {
      const subtitleRow = worksheet.addRow([templateData.subtitle]);
      subtitleRow.font = { size: 12 };
      subtitleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    // Contact information
    const contactInfo: string[] = [];
    if (templateData.address) contactInfo.push(templateData.address);
    if (templateData.phone) contactInfo.push(`Phone: ${templateData.phone}`);
    if (templateData.email) contactInfo.push(`Email: ${templateData.email}`);
    if (templateData.website) contactInfo.push(`Website: ${templateData.website}`);
    if (templateData.taxNumber) contactInfo.push(`Tax: ${templateData.taxNumber}`);
    
    if (contactInfo.length > 0) {
      const contactRow = worksheet.addRow([contactInfo.join(' | ')]);
      contactRow.alignment = { horizontal: 'center' };
      contactRow.font = { size: 10 };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    if (options.title) {
      const titleRow = worksheet.addRow([options.title]);
      titleRow.font = { size: 14, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    if (options.description) {
      const descRow = worksheet.addRow([options.description]);
      descRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    if (options.dateRange) {
      const dateRow = worksheet.addRow([`Period: ${options.dateRange.from} to ${options.dateRange.to}`]);
      dateRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    
    currentRow++; // Empty row
  }
  
  // Add column headers with alignments
  const headerRow = worksheet.addRow(data.columns);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.height = 25;
  
  // Set header cell alignments: first column left, last column (actions) right, middle columns center
  headerRow.eachCell((cell, colNumber) => {
    const index = colNumber - 1;
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    cell.alignment = { 
      horizontal: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center', 
      vertical: 'middle' 
    };
  });
  
  // Add data rows with alignments
  data.rows.forEach((row, index) => {
    // Convert cell objects to text values for Excel - handle all object types
    const excelRow = row.map(cell => {
      // If cell is object with text/html/raw properties
      if (typeof cell === 'object' && cell !== null) {
        if ('text' in cell && cell.text) {
          return String(cell.text);
        }
        if ('html' in cell && cell.html) {
          // Strip HTML tags for Excel
          const text = String(cell.html).replace(/<[^>]*>/g, '').trim();
          return text || '';
        }
        // If it's a plain object, try to extract meaningful text
        if (cell.raw) {
          return String(cell.raw);
        }
        // Last resort: return empty string for complex objects
        return '';
      }
      // If cell is primitive, convert to string
      if (cell === null || cell === undefined) {
        return '';
      }
      return String(cell);
    });
    const dataRow = worksheet.addRow(excelRow);
    if (index % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
    // Set data cell alignments: first column left, last column (actions) right, middle columns center
    dataRow.eachCell((cell, colNumber) => {
      const colIndex = colNumber - 1;
      const isFirstColumn = colIndex === 0;
      const isLastColumn = colIndex === data.columns.length - 1;
      const isActionsColumn = data.columns[colIndex]?.toLowerCase().includes('action') || data.columns[colIndex]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[colIndex] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      cell.alignment = { 
        horizontal: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center', 
        vertical: 'middle' 
      };
    });
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  // Add footer
  if (options.includeFooter) {
    currentRow = worksheet.rowCount + 2;
    const footerRow = worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    footerRow.font = { italic: true };
    worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
    
    if (companySettings.name) {
      currentRow++;
      const companyRow = worksheet.addRow([`Company: ${companySettings.name}`]);
      companyRow.font = { italic: true };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
    }
  }
  
  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = options.filename || formatFilename('report', 'xlsx', options.dateRange);
  saveAs(blob, filename);
};

// Export to Word
export const exportToWord = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  preloadedTemplateData?: ExportTemplateData
) => {
  // Use preloaded template data or fallback to company settings
  const templateData = preloadedTemplateData || {
    title: companySettings.name,
    address: companySettings.address,
    phone: companySettings.phone,
    email: companySettings.email,
    website: companySettings.website,
    taxNumber: companySettings.taxId,
  };

  const children: (Paragraph | Table)[] = [];

  // Add header
  if (options.includeHeader) {
    if (templateData.title) {
      children.push(
        new Paragraph({
          text: templateData.title,
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
        })
      );
    }

    if (templateData.subtitle) {
      children.push(
        new Paragraph({
          text: templateData.subtitle,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    // Contact info
    const contactParts = [];
    if (templateData.address) contactParts.push(templateData.address);
    if (templateData.phone) contactParts.push(`Tel: ${templateData.phone}`);
    if (templateData.email) contactParts.push(templateData.email);
    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          text: contactParts.join(' | '),
          alignment: AlignmentType.CENTER,
        })
      );
    }
    
    if (options.title) {
      children.push(
        new Paragraph({
          text: options.title,
          heading: 'Heading2',
          alignment: AlignmentType.CENTER,
        })
      );
    }
    
    if (options.description) {
      children.push(
        new Paragraph({
          text: options.description,
          alignment: AlignmentType.CENTER,
        })
      );
    }
    
    if (options.dateRange) {
      children.push(
        new Paragraph({
          text: `Period: ${options.dateRange.from} to ${options.dateRange.to}`,
          alignment: AlignmentType.CENTER,
        })
      );
    }
    
    children.push(new Paragraph({ text: '' })); // Empty line
  }
  
  // Create table
  const tableRows: TableRow[] = [];
  
  // Header row with alignments
  const headerCells = data.columns.map((col, index) => {
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = col.toLowerCase().includes('action') || col.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    return new TableCell({
      children: [new Paragraph({ 
        text: col, 
        heading: 'Heading3',
        alignment: align === 'left' ? AlignmentType.LEFT : align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER
      })],
      shading: { fill: '4472C4' },
    });
  });
  tableRows.push(new TableRow({ children: headerCells }));
  
  // Data rows with alignments
  data.rows.forEach(row => {
    const cells = row.map((cell, index) => {
      const isFirstColumn = index === 0;
      const isLastColumn = index === data.columns.length - 1;
      const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      // Convert cell object to text for Word
      const cellText = typeof cell === 'object' && cell !== null && 'text' in cell ? cell.text : String(cell ?? '');
      return new TableCell({
        children: [new Paragraph({ 
          text: cellText,
          alignment: align === 'left' ? AlignmentType.LEFT : align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER
        })],
      });
    });
    tableRows.push(new TableRow({ children: cells }));
  });
  
  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  
  // Add footer
  if (options.includeFooter) {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        text: `Generated: ${new Date().toLocaleString()}`,
        alignment: AlignmentType.CENTER,
      })
    );
    
    if (companySettings.name) {
      children.push(
        new Paragraph({
          text: `Company: ${companySettings.name}`,
          alignment: AlignmentType.CENTER,
        })
      );
    }
  }
  
  const doc = new Document({
    sections: [{
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  const filename = options.filename || formatFilename('report', 'docx', options.dateRange);
  saveAs(blob, filename);
};

// Export to PDF
export const exportToPDF = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  preloadedTemplateData?: ExportTemplateData
) => {
  // Use preloaded template data or fallback to company settings
  const templateData = preloadedTemplateData || {
    title: companySettings.name,
    address: companySettings.address,
    phone: companySettings.phone,
    email: companySettings.email,
    website: companySettings.website,
    taxNumber: companySettings.taxId,
  };

  // Create PDF with UTF-8 support for Turkish and other languages
  const doc = new jsPDF({
    orientation: options.pdf?.orientation || 'portrait',
    unit: 'mm',
    format: options.pdf?.paperSize || 'a4',
    compress: true,
  });

  // Enable UTF-8 support (jsPDF supports UTF-8 by default, but we ensure proper encoding)
  // Note: For full Unicode support including Turkish characters, we may need to use a custom font
  // For now, standard fonts should work for most Turkish characters
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Add header from template
  if (options.includeHeader) {
    if (templateData.title) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const nameWidth = doc.getTextWidth(templateData.title);
      doc.text(templateData.title, (pageWidth - nameWidth) / 2, yPosition);
      yPosition += 10;
    }

    if (templateData.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const subtitleWidth = doc.getTextWidth(templateData.subtitle);
      doc.text(templateData.subtitle, (pageWidth - subtitleWidth) / 2, yPosition);
      yPosition += 6;
    }

    // Contact info
    const contactParts = [];
    if (templateData.address) contactParts.push(templateData.address);
    if (templateData.phone) contactParts.push(`Tel: ${templateData.phone}`);
    if (templateData.email) contactParts.push(templateData.email);
    if (contactParts.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const contactText = contactParts.join(' | ');
      const contactWidth = doc.getTextWidth(contactText);
      doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition);
      yPosition += 8;
    }
    
    if (options.title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleWidth = doc.getTextWidth(options.title);
      doc.text(options.title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 8;
    }
    
    if (options.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(options.description, pageWidth - 40);
      doc.text(descLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += descLines.length * 5 + 5;
    }
    
    if (options.dateRange) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const dateText = `Period: ${options.dateRange.from} to ${options.dateRange.to}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 10;
    }
    
    yPosition += 5;
  }
  
  // Calculate column styles with alignments
  const columnStyles: Record<number, any> = {};
  data.columns.forEach((col, index) => {
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = col.toLowerCase().includes('action') || col.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    columnStyles[index] = {
      halign: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center',
      valign: 'middle',
    };
  });

  // Convert rows to text for PDF - handle all object types
  const pdfRows = data.rows.map(row => 
    row.map(cell => {
      // If cell is object with text/html/raw properties
      if (typeof cell === 'object' && cell !== null) {
        if ('text' in cell && cell.text) {
          return String(cell.text);
        }
        if ('html' in cell && cell.html) {
          // Strip HTML tags for PDF
          const text = String(cell.html).replace(/<[^>]*>/g, '').trim();
          return text || '';
        }
        // If it's a plain object, try to extract meaningful text
        if (cell.raw) {
          return String(cell.raw);
        }
        // Last resort: return empty string for complex objects
        return '';
      }
      // If cell is primitive, convert to string
      if (cell === null || cell === undefined) {
        return '';
      }
      return String(cell);
    })
  );

  // Add table
  autoTable(doc, {
    head: [data.columns],
    body: pdfRows,
    startY: yPosition,
    styles: { 
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [68, 114, 196],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [242, 242, 242],
    },
    columnStyles: columnStyles, // Sütun hizalamaları
    margin: { left: 20, right: 20 },
    didDrawPage: (data: { pageNumber: number; totalPages?: number }) => {
      // Add page numbers
      if (options.includePageNumbers) {
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Add footer on last page
      if (data.totalPages && data.pageNumber === data.totalPages && options.includeFooter) {
        let footerY = pageHeight - 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });
        footerY += 5;
        if (companySettings.name) {
          doc.text(`Company: ${companySettings.name}`, pageWidth / 2, footerY, { align: 'center' });
        }
      }
    },
  });
  
  const filename = options.filename || formatFilename('report', 'pdf', options.dateRange);
  doc.save(filename);
};

// Export to HTML
export const exportToHTML = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  tenantPrisma?: TenantPrismaClient,
  tenantId?: string,
  companyId?: string,
  locationId?: string,
  preloadedTemplateData?: ExportTemplateData
) => {
  // Use preloaded template data or fetch from service
  const templateData = preloadedTemplateData || await getExportTemplateData(
    options,
    companySettings,
    tenantPrisma,
    tenantId,
    companyId,
    locationId
  );

  // HTML options
  const htmlOptions = options.html || {};
  const paperSize = htmlOptions.paperSize || 'A4';
  const orientation = htmlOptions.orientation || 'portrait';
  const showPrintControls = htmlOptions.showPrintControls !== false; // Default true
  const showSaveButtons = htmlOptions.showSaveButtons !== false; // Default true

  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (options.title || templateData.title || 'Report') + '</title>';
  html += '<style>';
  html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
  html += '.print-controls { position: fixed; top: 10px; right: 10px; z-index: 1000; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }';
  html += '.print-controls select, .print-controls button { margin: 5px; padding: 8px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }';
  html += '.print-controls button { background: #4472C4; color: white; border: none; }';
  html += '.print-controls button:hover { background: #365899; }';
  html += '.print-controls .btn-save-pdf { background: #dc3545; }';
  html += '.print-controls .btn-save-pdf:hover { background: #c82333; }';
  html += '.print-controls .btn-save-html { background: #28a745; }';
  html += '.print-controls .btn-save-html:hover { background: #218838; }';
  html += 'h1 { text-align: center; color: #4472C4; }';
  html += 'h2 { text-align: center; color: #666; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }';
  html += 'td { padding: 8px; border: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
  html += '.footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }';
  html += '@media print { ';
  html += `  @page { size: ${paperSize} ${orientation}; margin: 1cm; }`;
  html += '  body { margin: 0; }';
  html += '  .print-controls { display: none; }';
  html += '}';
  html += '</style></head><body>';
  
  // Print controls (top right)
  if (showPrintControls || showSaveButtons) {
    html += '<div class="print-controls">';
    html += '<select id="paperSizeSelect">';
    html += `<option value="A4" ${paperSize === 'A4' ? 'selected' : ''}>A4</option>`;
    html += `<option value="A3" ${paperSize === 'A3' ? 'selected' : ''}>A3</option>`;
    html += `<option value="Letter" ${paperSize === 'Letter' ? 'selected' : ''}>Letter</option>`;
    html += `<option value="Legal" ${paperSize === 'Legal' ? 'selected' : ''}>Legal</option>`;
    html += '</select>';
    html += '<select id="paperOrientationSelect">';
    html += `<option value="portrait" ${orientation === 'portrait' ? 'selected' : ''}>Dikey</option>`;
    html += `<option value="landscape" ${orientation === 'landscape' ? 'selected' : ''}>Yatay</option>`;
    html += '</select>';
    if (showSaveButtons) {
      html += '<button id="btnSavePDF" class="btn-save-pdf">💾 PDF Kaydet</button>';
      html += '<button id="btnSaveHTML" class="btn-save-html">🌐 HTML Kaydet</button>';
    }
    if (showPrintControls) {
      html += '<button id="btnPrint" class="btn-print">🖨️ Yazdır</button>';
    }
    html += '</div>';
    
    // JavaScript for controls
    html += '<script>';
    html += 'document.getElementById("paperSizeSelect").addEventListener("change", function() {';
    html += '  const size = this.value;';
    html += '  document.querySelector("style").textContent += `@media print { @page { size: ${size} ${document.getElementById("paperOrientationSelect").value}; } }`;';
    html += '});';
    html += 'document.getElementById("paperOrientationSelect").addEventListener("change", function() {';
    html += '  const orientation = this.value;';
    html += '  document.querySelector("style").textContent += `@media print { @page { size: ${document.getElementById("paperSizeSelect").value} ${orientation}; } }`;';
    html += '});';
    if (showSaveButtons) {
      html += 'document.getElementById("btnSavePDF").addEventListener("click", function() {';
      html += '  window.print();';
      html += '});';
      html += 'document.getElementById("btnSaveHTML").addEventListener("click", function() {';
      html += '  const html = document.documentElement.outerHTML;';
      html += '  const blob = new Blob([html], { type: "text/html" });';
      html += '  const url = URL.createObjectURL(blob);';
      html += '  const a = document.createElement("a");';
      html += '  a.href = url;';
      html += '  a.download = "report.html";';
      html += '  a.click();';
      html += '});';
    }
    if (showPrintControls) {
      html += 'document.getElementById("btnPrint").addEventListener("click", function() {';
      html += '  window.print();';
      html += '});';
    }
    html += '</script>';
  }
  
  // Add header
  if (options.includeHeader) {
    if (templateData.logoUrl) {
      html += `<div style="text-align: center; margin-bottom: 20px;"><img src="${templateData.logoUrl}" alt="Logo" style="max-height: 60px;" /></div>`;
    }
    if (templateData.title || companySettings.name) {
      html += `<h1>${templateData.title || companySettings.name}</h1>`;
    }
    if (templateData.subtitle) {
      html += `<h2>${templateData.subtitle}</h2>`;
    }
    // Contact information
    const contactInfo: string[] = [];
    if (templateData.address) contactInfo.push(templateData.address);
    if (templateData.phone) contactInfo.push(`Phone: ${templateData.phone}`);
    if (templateData.email) contactInfo.push(`Email: ${templateData.email}`);
    if (templateData.website) contactInfo.push(`Website: ${templateData.website}`);
    if (templateData.taxNumber) contactInfo.push(`Tax: ${templateData.taxNumber}`);
    if (contactInfo.length > 0) {
      html += `<p style="text-align: center; font-size: 12px; color: #666;">${contactInfo.join(' | ')}</p>`;
    }
    if (options.title) {
      html += `<h2>${options.title}</h2>`;
    }
    if (options.description) {
      html += `<p style="text-align: center;">${options.description}</p>`;
    }
    if (options.dateRange) {
      html += `<p style="text-align: center;">Period: ${options.dateRange.from} to ${options.dateRange.to}</p>`;
    }
  }
  
  // Add table with column alignments
  html += '<table>';
  html += '<thead><tr>';
  data.columns.forEach((col, index) => {
    // Hizalama: İlk sütun left, son sütun (actions) right, ortadaki sütunlar center
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = col.toLowerCase().includes('action') || col.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    html += `<th style="text-align: ${align};">${col}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  data.rows.forEach(row => {
    html += '<tr>';
    row.forEach((cell, index) => {
      // Hizalama: İlk sütun left, son sütun (actions) right, ortadaki sütunlar center
      const isFirstColumn = index === 0;
      const isLastColumn = index === data.columns.length - 1;
      const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      // Cell can be object with html/text/raw or plain string
      const cellContent = typeof cell === 'object' && cell !== null && 'html' in cell ? cell.html : (cell ?? '');
      html += `<td style="text-align: ${align};">${cellContent}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  // Add footer
  if (options.includeFooter) {
    html += '<div class="footer">';
    html += `<p>Generated: ${new Date().toLocaleString()}</p>`;
    if (templateData.title || companySettings.name) {
      html += `<p>Company: ${templateData.title || companySettings.name}</p>`;
    }
    html += '</div>';
  }
  
  html += '</body></html>';
  
  // HTML yeni sekmede açılır, indirilmez
  const htmlWindow = window.open('', '_blank');
  if (!htmlWindow) {
    // Popup blocker varsa fallback olarak indir
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const filename = options.filename || formatFilename('report', 'html', options.dateRange);
    saveAs(blob, filename);
    return;
  }
  
  // HTML içeriğini yeni sekmede göster
  htmlWindow.document.open('text/html', 'replace');
  htmlWindow.document.write(html);
  htmlWindow.document.close();
  htmlWindow.focus();
};

// Print data
export const printData = async (
  data: ExportData,
  options: ExportOptions,
  companySettings: CompanySettings,
  tenantPrisma?: TenantPrismaClient,
  tenantId?: string,
  companyId?: string,
  locationId?: string,
  preloadedTemplateData?: ExportTemplateData
) => {
  // Use preloaded template data or fetch from service
  const templateData = preloadedTemplateData || await getExportTemplateData(
    options,
    companySettings,
    tenantPrisma,
    tenantId,
    companyId,
    locationId
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Report</title>';
  html += '<style>';
  html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
  html += 'h1 { text-align: center; color: #4472C4; }';
  html += 'h2 { text-align: center; color: #666; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }';
  html += 'td { padding: 8px; border: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
  html += '.footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }';
  html += '@media print { @page { margin: 1cm; } body { margin: 0; } }';
  html += '</style></head><body>';
  
  // Add header
  if (options.includeHeader) {
    if (templateData.logoUrl) {
      html += `<div style="text-align: center; margin-bottom: 20px;"><img src="${templateData.logoUrl}" alt="Logo" style="max-height: 60px;" /></div>`;
    }
    if (templateData.title || companySettings.name) {
      html += `<h1>${templateData.title || companySettings.name}</h1>`;
    }
    if (templateData.subtitle) {
      html += `<h2>${templateData.subtitle}</h2>`;
    }
    // Contact information
    const contactInfo: string[] = [];
    if (templateData.address) contactInfo.push(templateData.address);
    if (templateData.phone) contactInfo.push(`Phone: ${templateData.phone}`);
    if (templateData.email) contactInfo.push(`Email: ${templateData.email}`);
    if (templateData.website) contactInfo.push(`Website: ${templateData.website}`);
    if (templateData.taxNumber) contactInfo.push(`Tax: ${templateData.taxNumber}`);
    if (contactInfo.length > 0) {
      html += `<p style="text-align: center; font-size: 12px; color: #666;">${contactInfo.join(' | ')}</p>`;
    }
    if (options.title) {
      html += `<h2>${options.title}</h2>`;
    }
    if (options.description) {
      html += `<p style="text-align: center;">${options.description}</p>`;
    }
    if (options.dateRange) {
      html += `<p style="text-align: center;">Period: ${options.dateRange.from} to ${options.dateRange.to}</p>`;
    }
  }
  
  // Add table with column alignments
  html += '<table>';
  html += '<thead><tr>';
  data.columns.forEach((col, index) => {
    // Hizalama: İlk sütun left, son sütun (actions) right, ortadaki sütunlar center
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = col.toLowerCase().includes('action') || col.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    html += `<th style="text-align: ${align};">${col}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  data.rows.forEach(row => {
    html += '<tr>';
    row.forEach((cell, index) => {
      // Hizalama: İlk sütun left, son sütun (actions) right, ortadaki sütunlar center
      const isFirstColumn = index === 0;
      const isLastColumn = index === data.columns.length - 1;
      const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      // Cell can be object with html/text/raw or plain string
      const cellContent = typeof cell === 'object' && cell !== null && 'html' in cell ? cell.html : (cell ?? '');
      html += `<td style="text-align: ${align};">${cellContent}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  // Add footer
  if (options.includeFooter) {
    html += '<div class="footer">';
    html += `<p>Generated: ${new Date().toLocaleString()}</p>`;
    if (companySettings.name) {
      html += `<p>Company: ${companySettings.name}</p>`;
    }
    html += '</div>';
  }
  
  html += '</body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Print dialog açılır, popup iptal edilse bile sayfa açık kalır
  setTimeout(() => {
    printWindow.print();
    // printWindow.close() kaldırıldı - print popup iptal edilse bile sayfa açık kalacak
  }, 250);
};

// Export to ZIP (multiple files)
export const exportToZIP = async (
  files: Array<{ data: ExportData; options: ExportOptions; format: ExportFormat }>,
  companySettings: CompanySettings,
  zipFilename?: string
) => {
  const zip = new JSZip();
  
  for (const file of files) {
    const { data, options, format } = file;
    let content: Blob | string | ArrayBuffer;
    let extension: string;
    
    switch (format) {
      case 'csv':
        const csvContent = await generateCSVContent(data, options, companySettings);
        content = csvContent;
        extension = 'csv';
        break;
      case 'excel':
        const excelBlob = await generateExcelBuffer(data, options, companySettings);
        content = await excelBlob.arrayBuffer();
        extension = 'xlsx';
        break;
      case 'word':
        const wordBlob = await generateWordBlob(data, options, companySettings);
        content = await wordBlob.arrayBuffer();
        extension = 'docx';
        break;
      case 'pdf':
        const pdfBlob = await generatePDFBlob(data, options, companySettings);
        content = await pdfBlob.arrayBuffer();
        extension = 'pdf';
        break;
      case 'html':
        const htmlContent = await generateHTMLContent(data, options, companySettings);
        content = htmlContent;
        extension = 'html';
        break;
      default:
        continue;
    }
    
    const filename = options.filename || formatFilename('report', extension, options.dateRange);
    zip.file(filename, content);
  }
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const finalFilename = zipFilename || formatFilename('reports', 'zip');
  saveAs(blob, finalFilename);
};

// Helper functions for ZIP export
const generateCSVContent = async (data: ExportData, options: ExportOptions, companySettings: CompanySettings): Promise<string> => {
  const BOM = '\uFEFF';
  let csv = BOM;
  
  if (options.includeHeader && companySettings.name) {
    csv += `${companySettings.name}\n`;
    if (options.title) csv += `${options.title}\n`;
    csv += '\n';
  }
  
  csv += data.columns.join(',') + '\n';
  data.rows.forEach(row => {
    csv += row.map(cell => {
      // Convert cell object to text for CSV
      const value = typeof cell === 'object' && cell !== null && 'text' in cell ? cell.text : (cell ?? '');
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',') + '\n';
  });
  
  return csv;
};

const generateExcelBuffer = async (data: ExportData, options: ExportOptions, companySettings: CompanySettings): Promise<Blob> => {
  // Create Excel workbook with UTF-8 support
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companySettings.name || 'OMNEX Platform';
  workbook.created = new Date();
  // ExcelJS automatically handles UTF-8 encoding for all languages including Turkish
  const worksheet = workbook.addWorksheet('Report');
  
  let currentRow = 1;
  
  if (options.includeHeader) {
    if (companySettings.name) {
      const headerRow = worksheet.addRow([companySettings.name]);
      headerRow.font = { size: 16, bold: true };
      headerRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    if (options.title) {
      const titleRow = worksheet.addRow([options.title]);
      titleRow.font = { size: 14, bold: true };
      titleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
      currentRow++;
    }
    currentRow++;
  }
  
  const headerRow = worksheet.addRow(data.columns);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Set header cell alignments: first column left, last column (actions) right, middle columns center
  headerRow.eachCell((cell, colNumber) => {
    const index = colNumber - 1;
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    cell.alignment = { 
      horizontal: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center', 
      vertical: 'middle' 
    };
  });
  
  data.rows.forEach((row, index) => {
    // Convert cell objects to text values for Excel - handle all object types
    const excelRow = row.map(cell => {
      // If cell is object with text/html/raw properties
      if (typeof cell === 'object' && cell !== null) {
        if ('text' in cell && cell.text) {
          return String(cell.text);
        }
        if ('html' in cell && cell.html) {
          // Strip HTML tags for Excel
          const text = String(cell.html).replace(/<[^>]*>/g, '').trim();
          return text || '';
        }
        // If it's a plain object, try to extract meaningful text
        if (cell.raw) {
          return String(cell.raw);
        }
        // Last resort: return empty string for complex objects
        return '';
      }
      // If cell is primitive, convert to string
      if (cell === null || cell === undefined) {
        return '';
      }
      return String(cell);
    });
    const dataRow = worksheet.addRow(excelRow);
    if (index % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
    // Set data cell alignments: first column left, last column (actions) right, middle columns center
    dataRow.eachCell((cell, colNumber) => {
      const colIndex = colNumber - 1;
      const isFirstColumn = colIndex === 0;
      const isLastColumn = colIndex === data.columns.length - 1;
      const isActionsColumn = data.columns[colIndex]?.toLowerCase().includes('action') || data.columns[colIndex]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[colIndex] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      cell.alignment = { 
        horizontal: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center', 
        vertical: 'middle' 
      };
    });
  });
  
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const generateWordBlob = async (data: ExportData, options: ExportOptions, companySettings: CompanySettings): Promise<Blob> => {
  const children: (Paragraph | Table)[] = [];
  
  if (options.includeHeader) {
    if (companySettings.name) {
      children.push(
        new Paragraph({
          text: companySettings.name,
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
        })
      );
    }
    if (options.title) {
      children.push(
        new Paragraph({
          text: options.title,
          heading: 'Heading2',
          alignment: AlignmentType.CENTER,
        })
      );
    }
    children.push(new Paragraph({ text: '' }));
  }
  
  const tableRows: TableRow[] = [];
  const headerCells = data.columns.map((col, index) => {
    const isFirstColumn = index === 0;
    const isLastColumn = index === data.columns.length - 1;
    const isActionsColumn = col.toLowerCase().includes('action') || col.toLowerCase().includes('işlem');
    const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
    return new TableCell({
      children: [new Paragraph({ 
        text: col, 
        heading: 'Heading3',
        alignment: align === 'left' ? AlignmentType.LEFT : align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER
      })],
      shading: { fill: '4472C4' },
    });
  });
  tableRows.push(new TableRow({ children: headerCells }));
  
  data.rows.forEach(row => {
    const cells = row.map((cell, index) => {
      const isFirstColumn = index === 0;
      const isLastColumn = index === data.columns.length - 1;
      const isActionsColumn = data.columns[index]?.toLowerCase().includes('action') || data.columns[index]?.toLowerCase().includes('işlem');
      const align = data.columnAlignments?.[index] || (isActionsColumn ? 'right' : isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
      // Convert cell object to text for Word - handle all object types
      let cellText = '';
      if (typeof cell === 'object' && cell !== null) {
        if ('text' in cell && cell.text) {
          cellText = String(cell.text);
        } else if ('html' in cell && cell.html) {
          // Strip HTML tags for Word
          cellText = String(cell.html).replace(/<[^>]*>/g, '').trim();
        } else if (cell.raw) {
          cellText = String(cell.raw);
        } else {
          // Last resort: return empty string for complex objects
          cellText = '';
        }
      } else {
        cellText = String(cell ?? '');
      }
      return new TableCell({
        children: [new Paragraph({ 
          text: cellText,
          alignment: align === 'left' ? AlignmentType.LEFT : align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER
        })],
      });
    });
    tableRows.push(new TableRow({ children: cells }));
  });
  
  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  
  const doc = new Document({
    sections: [{
      children,
    }],
  });
  
  return await Packer.toBlob(doc);
};

const generatePDFBlob = async (data: ExportData, options: ExportOptions, companySettings: CompanySettings): Promise<Blob> => {
  // Create PDF with UTF-8 support for Turkish and other languages
  const doc = new jsPDF({
    orientation: options.pdf?.orientation || 'portrait',
    unit: 'mm',
    format: options.pdf?.paperSize || 'a4',
    compress: true,
  });
  
  // Enable UTF-8 support (jsPDF supports UTF-8 by default, but we ensure proper encoding)
  // Note: For full Unicode support including Turkish characters, we may need to use a custom font
  // For now, standard fonts should work for most Turkish characters
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  
  if (options.includeHeader) {
    if (companySettings.name) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const nameWidth = doc.getTextWidth(companySettings.name);
      doc.text(companySettings.name, (pageWidth - nameWidth) / 2, yPosition);
      yPosition += 10;
    }
    if (options.title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleWidth = doc.getTextWidth(options.title);
      doc.text(options.title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 8;
    }
    yPosition += 5;
  }
  
  // Convert rows to text for PDF - handle all object types
  const pdfRows = data.rows.map(row => 
    row.map(cell => {
      // If cell is object with text/html/raw properties
      if (typeof cell === 'object' && cell !== null) {
        if ('text' in cell && cell.text) {
          return String(cell.text);
        }
        if ('html' in cell && cell.html) {
          // Strip HTML tags for PDF
          const text = String(cell.html).replace(/<[^>]*>/g, '').trim();
          return text || '';
        }
        // If it's a plain object, try to extract meaningful text
        if (cell.raw) {
          return String(cell.raw);
        }
        // Last resort: return empty string for complex objects
        return '';
      }
      // If cell is primitive, convert to string
      if (cell === null || cell === undefined) {
        return '';
      }
      return String(cell);
    })
  );

  autoTable(doc, {
    head: [data.columns],
    body: pdfRows,
    startY: yPosition,
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      font: 'helvetica', // Use helvetica which supports basic Turkish characters
      fontStyle: 'normal',
    },
    headStyles: {
      fillColor: [68, 114, 196],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: [242, 242, 242],
    },
    margin: { left: 20, right: 20 },
  });
  
  return doc.output('blob');
};

const generateHTMLContent = async (data: ExportData, options: ExportOptions, companySettings: CompanySettings): Promise<string> => {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (options.title || 'Report') + '</title>';
  html += '<style>body { font-family: Arial, sans-serif; margin: 20px; }';
  html += 'h1 { text-align: center; color: #4472C4; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; }';
  html += 'td { padding: 8px; border-bottom: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }</style></head><body>';
  
  if (options.includeHeader && companySettings.name) {
    html += `<h1>${companySettings.name}</h1>`;
    if (options.title) html += `<h2>${options.title}</h2>`;
  }
  
  html += '<table><thead><tr>';
  data.columns.forEach(col => html += `<th>${col}</th>`);
  html += '</tr></thead><tbody>';
  data.rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => html += `<td>${cell ?? ''}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';
  
  return html;
};

