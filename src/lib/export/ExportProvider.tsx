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

  const exportData = useCallback(
    async (data: ExportData, options: ExportOptions) => {
      setIsExporting(true);
      try {
        const defaultOptions: ExportOptions = {
          includeHeader: true,
          includeFooter: true,
          includePageNumbers: true,
          tableStyle: 'professional',
          ...options,
        };

        // Get tenant context for template support
        let tenantId: string | undefined;
        let companyId: string | undefined;
        let locationId: string | undefined;

        try {
          // Get tenant context from API
          const contextResponse = await fetch('/api/tenant-context');
          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            if (contextData.success) {
              tenantId = contextData.data?.tenantId;
              companyId = contextData.data?.companyId;
              locationId = contextData.data?.locationId;
            }
          }
        } catch (error) {
          console.warn('Failed to get tenant context for template:', error);
        }

        // All export functions now support client-side template fetching via API
        switch (options.format) {
          case 'csv':
            await exportToCSV(data, defaultOptions, companySettings, undefined, tenantId, companyId, locationId);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'CSV dosyası başarıyla oluşturuldu',
            });
            break;
          case 'excel':
            await exportToExcel(data, defaultOptions, companySettings, undefined, tenantId, companyId, locationId);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'Excel dosyası başarıyla oluşturuldu',
            });
            break;
          case 'word':
            await exportToWord(data, defaultOptions, companySettings);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'Word dosyası başarıyla oluşturuldu',
            });
            break;
          case 'pdf':
            await exportToPDF(data, defaultOptions, companySettings);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'PDF dosyası başarıyla oluşturuldu',
            });
            break;
          case 'html':
            await exportToHTML(data, defaultOptions, companySettings, undefined, tenantId, companyId, locationId);
            showToast({
              type: 'success',
              title: 'Export Başarılı',
              message: 'HTML dosyası başarıyla oluşturuldu',
            });
            break;
          case 'print':
            await printData(data, defaultOptions, companySettings, undefined, tenantId, companyId, locationId);
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
    [companySettings]
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


