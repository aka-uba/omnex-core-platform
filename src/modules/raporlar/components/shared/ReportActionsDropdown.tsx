'use client';

import { Menu, ActionIcon } from '@mantine/core';
import { IconDotsVertical, IconDownload, IconEye, IconTrash, IconShare } from '@tabler/icons-react';
import { useExport } from '@/lib/export/useExport';
import { reportService } from '../../services/report.service';
import type { Report } from '../../types/report';
import type { ExportOptions } from '@/lib/export/types';

interface ReportActionsDropdownProps {
  report: Report;
  onDelete?: () => void;
  onView?: () => void;
  onExport?: (report: Report, format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => Promise<void>;
}

export function ReportActionsDropdown({ report, onDelete, onView }: ReportActionsDropdownProps) {
  const { exportToPDF, exportToExcel, exportToCSV, exportToWord, exportToHTML, printData } = useExport();

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'word' | 'html' | 'print') => {
    try {
      const reportData = await reportService.getReportData(report.id);
      const exportData = {
        columns: reportData.columns,
        rows: reportData.rows,
        metadata: reportData.metadata,
      };

      const options: Partial<ExportOptions> = {
        title: report.name,
        description: report.typeName || report.type,
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
        ...(report.dateRange ? { dateRange: report.dateRange } : {}),
      };

      switch (format) {
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'excel':
          await exportToExcel(exportData, options);
          break;
        case 'csv':
          await exportToCSV(exportData, options);
          break;
        case 'word':
          await exportToWord(exportData, options);
          break;
        case 'html':
          await exportToHTML(exportData, options);
          break;
        case 'print':
          await printData(exportData, options);
          break;
      }
    } catch (error) {
      // Export error - silently fail
    }
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {onView && (
          <Menu.Item leftSection={<IconEye size={16} />} onClick={onView}>
            Görüntüle
          </Menu.Item>
        )}
        <Menu.Label>Export</Menu.Label>
        <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => handleExport('pdf')}>
          PDF olarak indir
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => handleExport('excel')}>
          Excel olarak indir
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => handleExport('csv')}>
          CSV olarak indir
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => handleExport('word')}>
          Word olarak indir
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => handleExport('html')}>
          HTML olarak indir
        </Menu.Item>
        <Menu.Item leftSection={<IconShare size={16} />} onClick={() => handleExport('print')}>
          Yazdır
        </Menu.Item>
        {onDelete && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={onDelete}
            >
              Sil
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}


