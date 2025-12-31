import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, ImageRun } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ExportData, ExportOptions, CompanySettings, ExportFormat, ExportTemplateData, TemplateSection, SectionItem } from './types';
import { ExportTemplateService } from './ExportTemplateService';
import type { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

// Helper to replace placeholders in text
const replacePlaceholders = (text: string, companySettings: CompanySettings, pageTitle?: string): string => {
  if (!text) return '';
  return text
    .replace(/\{\{pageTitle\}\}/g, pageTitle || '')
    .replace(/\{\{companyName\}\}/g, companySettings.name || '')
    .replace(/\{\{companyAddress\}\}/g, companySettings.address || '')
    .replace(/\{\{companyPhone\}\}/g, companySettings.phone || '')
    .replace(/\{\{companyEmail\}\}/g, companySettings.email || '')
    .replace(/\{\{companyWebsite\}\}/g, companySettings.website || '')
    .replace(/\{\{companyTaxId\}\}/g, companySettings.taxId || '')
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
};

// Helper to get text content from a section item
const getSectionItemText = (item: SectionItem, companySettings: CompanySettings, pageTitle?: string): string => {
  if (item.type === 'logo' || item.type === 'image') return '[LOGO]';
  if (item.type === 'divider') return '---';
  if (item.type === 'spacer') return '';
  return replacePlaceholders(item.value || '', companySettings, pageTitle);
};

// Helper to render sections as text (for CSV)
const renderSectionsAsText = (sections: TemplateSection[], companySettings: CompanySettings, pageTitle?: string): string[] => {
  const lines: string[] = [];
  for (const section of sections) {
    const columnTexts = section.columns.map(col =>
      col.items.map(item => getSectionItemText(item, companySettings, pageTitle)).filter(Boolean).join(' ')
    ).filter(Boolean);
    if (columnTexts.length > 0) {
      lines.push(columnTexts.join(' | '));
    }
  }
  return lines;
};

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
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      const headerLines = renderSectionsAsText(templateData.headerSections, companySettings, options.pageTitle);
      headerLines.forEach(line => { csv += `${line}\n`; });
    } else {
      // Fallback to old format
      if (templateData.title) csv += `${templateData.title}\n`;
      if (templateData.subtitle) csv += `${templateData.subtitle}\n`;
      if (templateData.address) csv += `${templateData.address}\n`;
      if (templateData.phone) csv += `Phone: ${templateData.phone}\n`;
      if (templateData.email) csv += `Email: ${templateData.email}\n`;
      if (templateData.website) csv += `Website: ${templateData.website}\n`;
      if (templateData.taxNumber) csv += `Tax Number: ${templateData.taxNumber}\n`;
    }
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
    // New grid-based sections
    if (templateData.footerSections && templateData.footerSections.length > 0) {
      const footerLines = renderSectionsAsText(templateData.footerSections, companySettings, options.pageTitle);
      footerLines.forEach(line => { csv += `${line}\n`; });
    }
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
  workbook.creator = templateData.title || companySettings.name || 'Export';
  workbook.created = new Date();
  // ExcelJS automatically handles UTF-8 encoding for all languages including Turkish
  const worksheet = workbook.addWorksheet('Report');

  let currentRow = 1;

  // Add header section from template
  if (options.includeHeader) {
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      const totalColumns = data.columns.length;

      for (const section of templateData.headerSections) {
        const sectionColCount = section.columns.length;
        // Calculate how many data columns each section column should span
        const colsPerSection = Math.floor(totalColumns / sectionColCount);
        const remainder = totalColumns % sectionColCount;

        // Build row values - fill all data columns
        const rowValues: string[] = new Array(totalColumns).fill('');

        let currentCol = 0;
        section.columns.forEach((column, sectionIdx) => {
          const cellText = column.items
            .map(item => getSectionItemText(item, companySettings, options.pageTitle))
            .filter(Boolean)
            .join(' ');

          // Calculate span for this section column
          const span = colsPerSection + (sectionIdx < remainder ? 1 : 0);

          // Put text in the first cell of this span
          rowValues[currentCol] = cellText;

          currentCol += span;
        });

        // Add row
        const row = worksheet.addRow(rowValues);
        row.font = { size: 12 };

        // Merge cells and apply alignment per section column
        currentCol = 0;
        section.columns.forEach((column, sectionIdx) => {
          const span = colsPerSection + (sectionIdx < remainder ? 1 : 0);
          const startCol = currentCol + 1; // 1-indexed
          const endCol = currentCol + span;

          // Merge cells if span > 1
          if (span > 1) {
            worksheet.mergeCells(currentRow, startCol, currentRow, endCol);
          }

          // Apply alignment and font to the merged cell (first cell of span)
          const cell = row.getCell(startCol);
          const firstItem = column.items[0];
          // Column-position-based alignment: first=left, last=right, middle=center
          const align = sectionIdx === 0 ? 'left' : (sectionIdx === sectionColCount - 1 ? 'right' : 'center');
          cell.alignment = { horizontal: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center', vertical: 'middle' };
          if (firstItem?.fontWeight === 'bold') {
            cell.font = { bold: true, size: 12 };
          }

          // Check if this is a logo item and add image
          const logoItem = column.items.find(item => item.type === 'logo' || item.type === 'image');
          if (logoItem?.logoUrl && logoItem.logoUrl.startsWith('data:image')) {
            try {
              // Add image to worksheet
              const imageId = workbook.addImage({
                base64: logoItem.logoUrl.split(',')[1],
                extension: 'png',
              });
              // Calculate proportional dimensions - max height 50px, width scales proportionally
              const maxHeight = 50;
              const maxWidth = 200; // Allow wider logos
              // Default to reasonable dimensions, will be adjusted by Excel
              let imgWidth = maxWidth;
              let imgHeight = maxHeight;
              // Try to get image dimensions from base64 (approximate based on common aspect ratios)
              // For wide logos (e.g. 3:1 ratio), allow full width
              // For tall logos, constrain to max height
              worksheet.addImage(imageId, {
                tl: { col: currentCol, row: currentRow - 1 },
                ext: { width: imgWidth, height: imgHeight },
              });
              // Clear text since we're showing image
              cell.value = '';
              row.height = 55; // Increase row height for image
            } catch (e) {
              // If image fails, keep the text
              console.warn('Failed to add image to Excel:', e);
            }
          }

          currentCol += span;
        });

        currentRow++;
      }
    } else {
      // Fallback to old format
      const customHeaders = templateData.customFields?.headers || [];
      const customLogos = templateData.customFields?.logos || [];

      // Logo row (if available)
      if (customLogos.length > 0 || templateData.logoUrl) {
        const logoRow = worksheet.addRow(['[LOGO]']);
        const logoPosition = customLogos[0]?.position || 'center';
        logoRow.alignment = { horizontal: logoPosition === 'left' ? 'left' : logoPosition === 'right' ? 'right' : 'center' };
        worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
        currentRow++;
      }

      // Use custom headers if available, otherwise fallback to title/subtitle
      if (customHeaders.length > 0) {
        customHeaders.forEach((header: any, idx: number) => {
          if (header.text) {
            const row = worksheet.addRow([header.text]);
            const position = header.position || 'center';
            row.font = { size: idx === 0 ? 16 : 12, bold: idx === 0 };
            row.alignment = { horizontal: position === 'left' ? 'left' : position === 'right' ? 'right' : 'center' };
            worksheet.mergeCells(currentRow, 1, currentRow, data.columns.length);
            currentRow++;
          }
        });
      } else {
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

  // Helper function to convert position to AlignmentType
  const getAlignment = (position: string) => {
    if (position === 'left') return AlignmentType.LEFT;
    if (position === 'right') return AlignmentType.RIGHT;
    return AlignmentType.CENTER;
  };

  // No border style for header tables
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  // Add header
  if (options.includeHeader) {
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      for (const section of templateData.headerSections) {
        const colCount = section.columns.length;
        // Create a table row for each section to achieve grid layout
        const sectionCells = await Promise.all(section.columns.map(async (column, colIdx) => {
          const firstItem = column.items[0];
          // Column-position-based alignment: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          const isBold = firstItem?.fontWeight === 'bold';

          // Check if there's a logo item
          const logoItem = column.items.find(item => item.type === 'logo' || item.type === 'image');
          const cellChildren: Paragraph[] = [];

          if (logoItem?.logoUrl && logoItem.logoUrl.startsWith('data:image')) {
            try {
              // Convert base64 to buffer for docx
              const base64Data = logoItem.logoUrl.split(',')[1] || '';
              const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

              // Use proportional dimensions - max height 50, width scales for wide logos
              cellChildren.push(new Paragraph({
                alignment: getAlignment(align),
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 180,
                      height: 50,
                    },
                    type: 'png',
                  }),
                ],
              }));
            } catch (e) {
              console.warn('Failed to add image to Word:', e);
              // Fallback to text
              cellChildren.push(new Paragraph({
                text: '[LOGO]',
                alignment: getAlignment(align),
              }));
            }
          }

          // Add text items (excluding logo)
          const textItems = column.items.filter(item => item.type !== 'logo' && item.type !== 'image');
          if (textItems.length > 0) {
            const cellText = textItems
              .map(item => getSectionItemText(item, companySettings, options.pageTitle))
              .filter(Boolean)
              .join(' ');

            if (cellText) {
              cellChildren.push(new Paragraph({
                text: cellText,
                alignment: getAlignment(align),
                ...(isBold ? { bold: true } : {}),
              }));
            }
          }

          // If no content, add empty paragraph
          if (cellChildren.length === 0) {
            cellChildren.push(new Paragraph({ text: '' }));
          }

          return new TableCell({
            children: cellChildren,
            width: { size: Math.floor(100 / section.columns.length), type: WidthType.PERCENTAGE },
            borders: noBorders,
          });
        }));

        if (sectionCells.length > 0) {
          children.push(
            new Table({
              rows: [new TableRow({ children: sectionCells })],
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
      }
    } else {
      // Fallback to old format
      const customHeaders = templateData.customFields?.headers || [];

      if (customHeaders.length > 0) {
        customHeaders.forEach((header: any, idx: number) => {
          if (header.text) {
            const position = header.position || 'center';
            children.push(
              new Paragraph({
                text: header.text,
                heading: idx === 0 ? 'Heading1' : undefined,
                alignment: getAlignment(position),
              })
            );
          }
        });
      } else {
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

// Export to PDF - Uses HTML-based approach with browser print dialog
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

  // PDF options
  const pdfOptions = options.pdf || {};
  const paperSize = pdfOptions.paperSize || 'A4';
  const orientation = pdfOptions.orientation || 'portrait';

  // Generate HTML content (similar to print but optimized for PDF)
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (options.title || templateData.title || 'Report') + '</title>';
  html += '<style>';
  html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
  html += 'h1 { text-align: center; color: #4472C4; }';
  html += 'h2 { text-align: center; color: #666; }';
  html += '.header-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.header-section-row { display: table-row; }';
  html += '.header-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.header-section-cell.align-left { text-align: left; }';
  html += '.header-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.header-section-cell.align-center { text-align: center; }';
  html += '.header-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.header-section-cell.align-right { text-align: right; }';
  html += '.header-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.header-section-cell img { max-height: 60px; max-width: 100%; height: auto; object-fit: contain; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }';
  html += 'td { padding: 8px; border: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
  html += '.footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }';
  html += '.footer-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.footer-section-row { display: table-row; }';
  html += '.footer-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.footer-section-cell.align-left { text-align: left; }';
  html += '.footer-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.footer-section-cell.align-center { text-align: center; }';
  html += '.footer-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.footer-section-cell.align-right { text-align: right; }';
  html += '.footer-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.footer-section-cell img { max-height: 40px; max-width: 100%; height: auto; object-fit: contain; }';
  html += '.pdf-instructions { position: fixed; top: 10px; right: 10px; background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; max-width: 300px; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; }';
  html += '.pdf-instructions h4 { margin: 0 0 10px 0; color: #856404; }';
  html += '.pdf-instructions ol { margin: 0; padding-left: 20px; }';
  html += '.pdf-instructions li { margin: 5px 0; }';
  html += '.pdf-instructions button { margin-top: 10px; padding: 8px 16px; background: #4472C4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }';
  html += '.pdf-instructions button:hover { background: #365899; }';
  html += `@media print { @page { size: ${paperSize} ${orientation}; margin: 1cm; } body { margin: 0; } .pdf-instructions { display: none; } }`;
  html += '</style></head><body>';

  // PDF save instructions panel
  html += '<div class="pdf-instructions">';
  html += '<h4>📄 PDF Olarak Kaydet</h4>';
  html += '<ol>';
  html += '<li>Aşağıdaki "PDF Kaydet" butonuna tıklayın</li>';
  html += '<li>Yazdırma penceresinde "Hedef" olarak "PDF olarak kaydet" seçin</li>';
  html += '<li>"Kaydet" butonuna tıklayın</li>';
  html += '</ol>';
  html += '<button onclick="window.print()">🖨️ PDF Kaydet</button>';
  html += '</div>';

  // Add timestamp at top right
  const generatedTimestamp = new Date().toLocaleString();
  html += `<div style="text-align: right; font-size: 11px; color: #888; margin-bottom: 10px;">${generatedTimestamp}</div>`;

  // Add header
  if (options.includeHeader) {
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      for (const section of templateData.headerSections) {
        html += `<div class="header-section"><div class="header-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column: any, colIdx: number) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="header-section-cell align-${align}">`;

          column.items.forEach((item: any) => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '14px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';

        if (section.borderBottom) {
          html += '<hr style="margin: 10px 0;" />';
        }
      }
    } else {
      // Fallback to old format
      const customHeaders = templateData.customFields?.headers || [];
      const customLogos = templateData.customFields?.logos || [];

      // Logo
      if (customLogos.length > 0 || templateData.logoUrl) {
        const logoUrl = customLogos[0]?.url || templateData.logoUrl;
        const logoPosition = customLogos[0]?.position || 'center';
        if (logoUrl) {
          html += `<div style="text-align: ${logoPosition}; margin-bottom: 20px;"><img src="${logoUrl}" alt="Logo" style="max-height: 60px;" /></div>`;
        }
      }

      // Use custom headers if available, otherwise fallback to title/subtitle
      if (customHeaders.length > 0) {
        customHeaders.forEach((header: any, idx: number) => {
          if (header.text) {
            const position = header.position || 'center';
            const tag = idx === 0 ? 'h1' : 'h2';
            html += `<${tag} style="text-align: ${position};">${header.text}</${tag}>`;
          }
        });
      } else {
        if (templateData.title || companySettings.name) {
          html += `<h1>${templateData.title || companySettings.name}</h1>`;
        }
        if (templateData.subtitle) {
          html += `<h2>${templateData.subtitle}</h2>`;
        }
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

    // New grid-based sections
    if (templateData.footerSections && templateData.footerSections.length > 0) {
      for (const section of templateData.footerSections) {
        html += `<div class="footer-section"><div class="footer-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column: any, colIdx: number) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="footer-section-cell align-${align}">`;

          column.items.forEach((item: any) => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '12px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';
      }
    } else {
      // Fallback to old format
      const customFooters = templateData.customFields?.footers || [];

      if (customFooters.length > 0) {
        customFooters.forEach((footer: any) => {
          if (footer.text) {
            const position = footer.position || 'center';
            html += `<p style="text-align: ${position};">${footer.text}</p>`;
          }
        });
      } else {
        // Default footer - show company info
        if (companySettings.name) {
          html += `<p>Company: ${companySettings.name}</p>`;
        }
      }
    }

    // Always add timestamp at footer
    html += `<p style="font-size: 10px; color: #999; margin-top: 10px;">Generated: ${generatedTimestamp}</p>`;
    html += '</div>';
  }

  html += '</body></html>';

  // Open in new window for PDF save
  const pdfWindow = window.open('', '_blank');
  if (pdfWindow) {
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    pdfWindow.focus();
  }
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
  html += '.header-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.header-section-row { display: table-row; }';
  html += '.header-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.header-section-cell.align-left { text-align: left; }';
  html += '.header-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.header-section-cell.align-center { text-align: center; }';
  html += '.header-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.header-section-cell.align-right { text-align: right; }';
  html += '.header-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.header-section-cell img { max-height: 60px; max-width: 100%; height: auto; object-fit: contain; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }';
  html += 'td { padding: 8px; border: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
  html += '.footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }';
  html += '.footer-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.footer-section-row { display: table-row; }';
  html += '.footer-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.footer-section-cell.align-left { text-align: left; }';
  html += '.footer-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.footer-section-cell.align-center { text-align: center; }';
  html += '.footer-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.footer-section-cell.align-right { text-align: right; }';
  html += '.footer-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.footer-section-cell img { max-height: 40px; max-width: 100%; height: auto; object-fit: contain; }';
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

  // Add timestamp at top right
  const generatedTimestamp = new Date().toLocaleString();
  html += `<div style="text-align: right; font-size: 11px; color: #888; margin-bottom: 10px;">${generatedTimestamp}</div>`;

  // Add header
  if (options.includeHeader) {
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      for (const section of templateData.headerSections) {
        html += `<div class="header-section"><div class="header-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column, colIdx) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="header-section-cell align-${align}">`;

          column.items.forEach(item => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '14px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';

        if (section.borderBottom) {
          html += '<hr style="margin: 10px 0;" />';
        }
      }
    } else {
      // Fallback to old format
      const customHeaders = templateData.customFields?.headers || [];
      const customLogos = templateData.customFields?.logos || [];

      // Logo
      if (customLogos.length > 0 || templateData.logoUrl) {
        const logoUrl = customLogos[0]?.url || templateData.logoUrl;
        const logoPosition = customLogos[0]?.position || 'center';
        if (logoUrl) {
          html += `<div style="text-align: ${logoPosition}; margin-bottom: 20px;"><img src="${logoUrl}" alt="Logo" style="max-height: 60px;" /></div>`;
        }
      }

      // Use custom headers if available, otherwise fallback to title/subtitle
      if (customHeaders.length > 0) {
        customHeaders.forEach((header: any, idx: number) => {
          if (header.text) {
            const position = header.position || 'center';
            const tag = idx === 0 ? 'h1' : 'h2';
            html += `<${tag} style="text-align: ${position};">${header.text}</${tag}>`;
          }
        });
      } else {
        if (templateData.title || companySettings.name) {
          html += `<h1>${templateData.title || companySettings.name}</h1>`;
        }
        if (templateData.subtitle) {
          html += `<h2>${templateData.subtitle}</h2>`;
        }
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

    // New grid-based sections
    if (templateData.footerSections && templateData.footerSections.length > 0) {
      for (const section of templateData.footerSections) {
        html += `<div class="footer-section"><div class="footer-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column, colIdx) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="footer-section-cell align-${align}">`;

          column.items.forEach(item => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '12px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';
      }
    } else {
      // Fallback to old format
      const customFooters = templateData.customFields?.footers || [];

      if (customFooters.length > 0) {
        customFooters.forEach((footer: any) => {
          if (footer.text) {
            const position = footer.position || 'center';
            html += `<p style="text-align: ${position};">${footer.text}</p>`;
          }
        });
      } else {
        // Default footer - show company info
        if (templateData.title || companySettings.name) {
          html += `<p>Company: ${templateData.title || companySettings.name}</p>`;
        }
      }
    }

    // Always add timestamp at footer
    html += `<p style="font-size: 10px; color: #999; margin-top: 10px;">Generated: ${generatedTimestamp}</p>`;
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
  html += 'h1 { color: #4472C4; }';
  html += 'h2 { color: #666; }';
  html += '.header-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.header-section-row { display: table-row; }';
  html += '.header-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.header-section-cell.align-left { text-align: left; }';
  html += '.header-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.header-section-cell.align-center { text-align: center; }';
  html += '.header-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.header-section-cell.align-right { text-align: right; }';
  html += '.header-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.header-section-cell img { max-height: 60px; max-width: 100%; height: auto; object-fit: contain; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
  html += 'th { background-color: #4472C4; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }';
  html += 'td { padding: 8px; border: 1px solid #ddd; }';
  html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
  html += '.footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }';
  html += '.footer-section { display: table; width: 100%; table-layout: fixed; margin-bottom: 10px; }';
  html += '.footer-section-row { display: table-row; }';
  html += '.footer-section-cell { display: table-cell; vertical-align: middle; padding: 5px; }';
  html += '.footer-section-cell.align-left { text-align: left; }';
  html += '.footer-section-cell.align-left img { display: block; margin-left: 0; margin-right: auto; }';
  html += '.footer-section-cell.align-center { text-align: center; }';
  html += '.footer-section-cell.align-center img { display: block; margin-left: auto; margin-right: auto; }';
  html += '.footer-section-cell.align-right { text-align: right; }';
  html += '.footer-section-cell.align-right img { display: block; margin-left: auto; margin-right: 0; }';
  html += '.footer-section-cell img { max-height: 40px; max-width: 100%; height: auto; object-fit: contain; }';
  html += '@media print { @page { margin: 1cm; } body { margin: 0; } }';
  html += '</style></head><body>';

  // Add timestamp at top right
  const generatedTimestamp = new Date().toLocaleString();
  html += `<div style="text-align: right; font-size: 11px; color: #888; margin-bottom: 10px;">${generatedTimestamp}</div>`;

  // Add header
  if (options.includeHeader) {
    // New grid-based sections
    if (templateData.headerSections && templateData.headerSections.length > 0) {
      for (const section of templateData.headerSections) {
        html += `<div class="header-section"><div class="header-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column, colIdx) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="header-section-cell align-${align}">`;

          column.items.forEach(item => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '14px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';

        if (section.borderBottom) {
          html += '<hr style="margin: 10px 0;" />';
        }
      }
    } else {
      // Fallback to old format
      // Get custom headers and logos from template
      const customHeaders = templateData.customFields?.headers || [];
      const customLogos = templateData.customFields?.logos || [];

      // Logo
      if (customLogos.length > 0 || templateData.logoUrl) {
        const logoUrl = customLogos[0]?.url || templateData.logoUrl;
        const logoPosition = customLogos[0]?.position || 'center';
        if (logoUrl) {
          html += `<div style="text-align: ${logoPosition}; margin-bottom: 20px;"><img src="${logoUrl}" alt="Logo" style="max-height: 60px;" /></div>`;
        }
      }

      // Use custom headers if available, otherwise fallback to title/subtitle
      if (customHeaders.length > 0) {
        customHeaders.forEach((header: any, idx: number) => {
          if (header.text) {
            const position = header.position || 'center';
            const tag = idx === 0 ? 'h1' : 'h2';
            html += `<${tag} style="text-align: ${position};">${header.text}</${tag}>`;
          }
        });
      } else {
        if (templateData.title || companySettings.name) {
          html += `<h1 style="text-align: center;">${templateData.title || companySettings.name}</h1>`;
        }
        if (templateData.subtitle) {
          html += `<h2 style="text-align: center;">${templateData.subtitle}</h2>`;
        }
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
    }

    if (options.title) {
      html += `<h2 style="text-align: center;">${options.title}</h2>`;
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

    // New grid-based sections
    if (templateData.footerSections && templateData.footerSections.length > 0) {
      for (const section of templateData.footerSections) {
        html += `<div class="footer-section"><div class="footer-section-row">`;

        const colCount = section.columns.length;
        section.columns.forEach((column: any, colIdx: number) => {
          // Alignment based on column position: first=left, last=right, middle=center
          const align = colIdx === 0 ? 'left' : (colIdx === colCount - 1 ? 'right' : 'center');
          html += `<div class="footer-section-cell align-${align}">`;

          column.items.forEach((item: any) => {
            if ((item.type === 'logo' || item.type === 'image') && item.logoUrl) {
              html += `<img src="${item.logoUrl}" alt="Logo" />`;
            } else if (item.type === 'text' || item.type === 'variable') {
              const text = replacePlaceholders(item.value || '', companySettings, options.pageTitle);
              const fontWeight = item.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontSize = item.fontSize ? `${item.fontSize}px` : '12px';
              const color = item.color || 'inherit';
              html += `<div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${text}</div>`;
            } else if (item.type === 'divider') {
              html += '<hr style="margin: 5px 0;" />';
            }
          });

          html += '</div>';
        });

        html += '</div></div>';
      }
    } else {
      // Fallback to old format
      // Get custom footers from template
      const customFooters = templateData.customFields?.footers || [];

      if (customFooters.length > 0) {
        customFooters.forEach((footer: any) => {
          if (footer.text) {
            const position = footer.position || 'center';
            html += `<p style="text-align: ${position};">${footer.text}</p>`;
          }
        });
      } else {
        // Default footer - show company info
        if (companySettings.name) {
          html += `<p>Company: ${companySettings.name}</p>`;
        }
      }
    }

    // Always add timestamp at footer
    html += `<p style="font-size: 10px; color: #999; margin-top: 10px;">Generated: ${generatedTimestamp}</p>`;
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
  workbook.creator = companySettings.name || 'Export';
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

