'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useCompanySettings } from './useCompanySettings';
import {
  exportToCSV,
  exportToExcel,
  exportToWord,
  exportToPDF,
  exportToHTML,
  printData,
  exportToZIP,
} from './exportUtils';
import type { ExportData, ExportOptions, ExportFormat } from './types';

interface ExportContextType {
  exportData: (data: ExportData, options: ExportOptions) => Promise<void>;
  exportToCSV: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  exportToExcel: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  exportToWord: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  exportToPDF: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  exportToHTML: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  printData: (data: ExportData, options?: Partial<ExportOptions>) => Promise<void>;
  exportToZIP: (
    files: Array<{ data: ExportData; options: ExportOptions; format: ExportFormat }>,
    zipFilename?: string
  ) => Promise<void>;
  isExporting: boolean;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within ExportProvider');
  }
  return context;
};

interface ExportProviderProps {
  children: React.ReactNode;
}

export function ExportProvider({ children }: ExportProviderProps) {
  const { settings: companySettings } = useCompanySettings();
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch template data from API
  const fetchTemplateData = useCallback(async (templateId?: string) => {
    try {
      // If specific templateId provided, fetch that template
      if (templateId) {
        const response = await fetch(`/api/export-templates/${templateId}`);
        if (response.ok) {
          const result = await response.json();
          // API returns { data: template } directly
          if (result.data) {
            return result.data;
          }
        }
      }

      // Otherwise try to get default template
      const defaultResponse = await fetch('/api/export-templates/default?type=full');
      if (defaultResponse.ok) {
        const defaultResult = await defaultResponse.json();
        // Default API returns { data: template } directly
        if (defaultResult.data) {
          return defaultResult.data;
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to fetch export template:', error);
      return null;
    }
  }, []);

  // Merge template with company settings
  const mergeTemplateWithSettings = useCallback((template: any, settings: typeof companySettings) => {
    if (!template) {
      return {
        logoUrl: settings?.logo,
        title: settings?.name,
        address: settings?.address,
        phone: settings?.phone,
        email: settings?.email,
        website: settings?.website,
        taxNumber: settings?.taxId,
      };
    }

    // Parse customFields if needed
    const customFields = typeof template.customFields === 'string'
      ? JSON.parse(template.customFields)
      : template.customFields || {};

    return {
      logoUrl: template.logoUrl || settings?.logo,
      title: template.title || settings?.name,
      subtitle: template.subtitle,
      address: template.address || settings?.address,
      phone: template.phone || settings?.phone,
      email: template.email || settings?.email,
      website: template.website || settings?.website,
      taxNumber: template.taxNumber || settings?.taxId,
      customFields,
    };
  }, []);

  const exportData = useCallback(
    async (data: ExportData, options: ExportOptions) => {
      setIsExporting(true);
      try {
        // Fetch template data if templateId provided or try default
        const template = await fetchTemplateData(options.templateId);
        const templateData = mergeTemplateWithSettings(template, companySettings);

        const defaultOptions: ExportOptions = {
          includeHeader: true,
          includeFooter: true,
          includePageNumbers: true,
          tableStyle: 'professional',
          ...options,
        };

        // All export functions now use pre-fetched templateData
        switch (options.format) {
          case 'csv':
            await exportToCSV(data, defaultOptions, companySettings, undefined, undefined, undefined, undefined, templateData);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'CSV dosyası başarıyla oluşturuldu',
            });
            break;
          case 'excel':
            await exportToExcel(data, defaultOptions, companySettings, undefined, undefined, undefined, undefined, templateData);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'Excel dosyası başarıyla oluşturuldu',
            });
            break;
          case 'word':
            await exportToWord(data, defaultOptions, companySettings, templateData);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'Word dosyası başarıyla oluşturuldu',
            });
            break;
          case 'pdf':
            await exportToPDF(data, defaultOptions, companySettings, templateData);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'PDF dosyası başarıyla oluşturuldu',
            });
            break;
          case 'html':
            await exportToHTML(data, defaultOptions, companySettings, undefined, undefined, undefined, undefined, templateData);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'HTML dosyası başarıyla oluşturuldu',
            });
            break;
          case 'print':
            await printData(data, defaultOptions, companySettings, undefined, undefined, undefined, undefined, templateData);
            // Print doesn't need notification as it opens print dialog
            break;
          default:
            throw new Error(`Unsupported export format: ${options.format}`);
        }
      } catch (error: any) {
        console.error('Export error:', error);
        showToast({
          type: 'error',
          title: 'Export Hatası',
          message: error.message || 'Export işlemi sırasında bir hata oluştu',
        });
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [companySettings, fetchTemplateData, mergeTemplateWithSettings]
  );

  const exportToCSVHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'csv', ...options } as ExportOptions);
    },
    [exportData]
  );

  const exportToExcelHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'excel', ...options } as ExportOptions);
    },
    [exportData]
  );

  const exportToWordHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'word', ...options } as ExportOptions);
    },
    [exportData]
  );

  const exportToPDFHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'pdf', ...options } as ExportOptions);
    },
    [exportData]
  );

  const exportToHTMLHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'html', ...options } as ExportOptions);
    },
    [exportData]
  );

  const printDataHelper = useCallback(
    async (data: ExportData, options?: Partial<ExportOptions>) => {
      await exportData(data, { format: 'print', ...options } as ExportOptions);
    },
    [exportData]
  );

  const exportToZIPHelper = useCallback(
    async (
      files: Array<{ data: ExportData; options: ExportOptions; format: ExportFormat }>,
      zipFilename?: string
    ) => {
      setIsExporting(true);
      try {
        await exportToZIP(files, companySettings, zipFilename);
      } catch (error) {
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [companySettings]
  );

  const value: ExportContextType = {
    exportData,
    exportToCSV: exportToCSVHelper,
    exportToExcel: exportToExcelHelper,
    exportToWord: exportToWordHelper,
    exportToPDF: exportToPDFHelper,
    exportToHTML: exportToHTMLHelper,
    printData: printDataHelper,
    exportToZIP: exportToZIPHelper,
    isExporting,
  };

  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}


