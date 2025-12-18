'use client';

import { Modal, Button, Group, Stack, Text, Checkbox, Paper, Divider, Badge, ScrollArea } from '@mantine/core';
import { IconDownload, IconFileText, IconFileSpreadsheet, IconFile, IconPrinter, IconCode, IconFileZip } from '@tabler/icons-react';
import { useExport } from '@/lib/export/useExport';
import { reportService } from '../services/report.service';
import type { Report, ExportFormat } from '../types/report';
import { useState, useEffect } from 'react';

interface ReportExportModalProps {
  opened: boolean;
  onClose: () => void;
  reports: Report[];
  selectedReports?: Report[];
}

export function ReportExportModal({ opened, onClose, reports, selectedReports = [] }: ReportExportModalProps) {
  const { exportToPDF, exportToExcel, exportToCSV, exportToWord, exportToHTML, printData, exportToZIP, isExporting } = useExport();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedReportsForExport, setSelectedReportsForExport] = useState<Report[]>(selectedReports);

  // Update selected reports when prop changes
  useEffect(() => {
    if (selectedReports.length > 0) {
      setSelectedReportsForExport(selectedReports);
    }
  }, [selectedReports]);

  const handleSingleExport = async (report: Report, format: ExportFormat) => {
    try {
      const reportData = await reportService.getReportData(report.id);
      const exportData = {
        columns: reportData.columns,
        rows: reportData.rows,
        metadata: reportData.metadata,
      };

      const options = {
        title: report.name,
        description: report.typeName || report.type,
        ...(report.dateRange ? { dateRange: report.dateRange } : {}),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
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

      onClose();
    } catch (error) {
      // Export error - silently fail
    }
  };

  const handleBulkExport = async (format: ExportFormat) => {
    if (selectedReportsForExport.length === 0) return;

    try {
      const files = await Promise.all(
        selectedReportsForExport.map(async (report) => {
          const reportData = await reportService.getReportData(report.id);
          return {
            data: {
              columns: reportData.columns,
              rows: reportData.rows,
              metadata: reportData.metadata,
            },
            options: {
              format,
              title: report.name,
              description: report.typeName || report.type,
              ...(report.dateRange ? { dateRange: report.dateRange } : {}),
              includeHeader: true,
              includeFooter: true,
              includePageNumbers: true,
              filename: `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
            },
            format,
          };
        })
      );

      await exportToZIP(files, `reports_${new Date().toISOString().split('T')[0]}.zip`);
      onClose();
    } catch (error) {
      // Bulk export error - silently fail
    }
  };

  const exportOptions = [
    { value: 'pdf' as ExportFormat, label: 'PDF', icon: IconFile, color: 'red', description: 'Portable Document Format' },
    { value: 'excel' as ExportFormat, label: 'Excel', icon: IconFileSpreadsheet, color: 'green', description: 'Microsoft Excel' },
    { value: 'csv' as ExportFormat, label: 'CSV', icon: IconFileText, color: 'blue', description: 'Comma Separated Values' },
    { value: 'word' as ExportFormat, label: 'Word', icon: IconFileText, color: 'blue', description: 'Microsoft Word' },
    { value: 'html' as ExportFormat, label: 'HTML', icon: IconCode, color: 'orange', description: 'HyperText Markup Language' },
    { value: 'print' as ExportFormat, label: 'Yazdır', icon: IconPrinter, color: 'gray', description: 'Yazdırma' },
  ];

  const isBulkMode = selectedReportsForExport.length > 1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconDownload size={20} />
          <Text fw={600} size="lg">
            {isBulkMode ? 'Toplu Export' : 'Rapor Export'}
          </Text>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="lg">
        {/* Selected Reports Info */}
        {isBulkMode && (
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Text fw={500} size="sm">
                  Seçili Raporlar
                </Text>
                <Badge color="blue" variant="light">
                  {selectedReportsForExport.length}
                </Badge>
              </Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setSelectedReportsForExport([])}
              >
                Tümünü Temizle
              </Button>
            </Group>
            <Divider mb="sm" />
            <ScrollArea h={200}>
              <Stack gap="xs">
                {reports.map((report) => (
                  <Checkbox
                    key={report.id}
                    label={
                      <Group gap="xs" justify="space-between" style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {report.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {report.typeName || report.type}
                        </Text>
                      </Group>
                    }
                    checked={selectedReportsForExport.some(r => r.id === report.id)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedReportsForExport([...selectedReportsForExport, report]);
                      } else {
                        setSelectedReportsForExport(selectedReportsForExport.filter(r => r.id !== report.id));
                      }
                    }}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        )}

        {/* Format Selection */}
        <div>
          <Text fw={500} size="sm" mb="md">
            Export Formatı Seçin
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedFormat === option.value;
              return (
                <Paper
                  key={option.value}
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  {...(isSelected ? { bg: `${option.color}.0` } : {})}
                  onClick={() => {
                    setSelectedFormat(option.value);
                    if (!isBulkMode && reports.length === 1) {
                      const report = reports[0];
                      if (report) handleSingleExport(report, option.value);
                    }
                  }}
                >
                  <Stack gap="xs" align="center">
                    <Paper
                      p="sm"
                      radius="md"
                      bg={`${option.color}.1`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon
                        size={32}
                        color={`var(--mantine-color-${option.color}-6)`}
                      />
                    </Paper>
                    <Text fw={isSelected ? 600 : 500} size="sm" {...(isSelected ? { c: option.color } : {})}>
                      {option.label}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      {option.description}
                    </Text>
                  </Stack>
                </Paper>
              );
            })}
          </div>
        </div>

        {/* Bulk Export Action */}
        {isBulkMode && selectedFormat && selectedReportsForExport.length > 0 && (
          <Paper
            p="md"
            radius="md"
            withBorder
            bg="blue.0"
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Toplu Export Hazır
                </Text>
                <Badge color="blue" variant="light">
                  {selectedReportsForExport.length} dosya
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Seçili {selectedReportsForExport.length} rapor {selectedFormat.toUpperCase()} formatında ZIP dosyası olarak indirilecek.
              </Text>
              <Button
                onClick={() => handleBulkExport(selectedFormat)}
                loading={isExporting}
                leftSection={<IconFileZip size={18} />}
                fullWidth
                size="md"
              >
                ZIP Olarak İndir
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Single Export Info */}
        {!isBulkMode && reports.length === 1 && selectedFormat && (
          <Paper
            p="md"
            radius="md"
            withBorder
            bg="blue.0"
          >
            <Text size="sm" c="dimmed" ta="center">
              {reports?.[0]?.name || 'Rapor'} raporu {selectedFormat.toUpperCase()} formatında indirilecek.
            </Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
}
