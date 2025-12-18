'use client';

import { useState, useEffect } from 'react';
import { Container, Paper, Stack, Group, Text, Button, LoadingOverlay } from '@mantine/core';
import { ReportViewSkeleton } from './ReportViewSkeleton';
import { DataTable } from '@/components/tables';
import { IconDownload, IconArrowLeft, IconCalendar, IconUser, IconFile } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconChartBar } from '@tabler/icons-react';
import { useReport } from '../hooks/useReports';
import { reportService } from '../services/report.service';
import { ReportStatusBadge } from './shared/ReportStatusBadge';
import { useExport } from '@/lib/export/useExport';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

interface ReportViewProps {
  reportId: string;
}

export function ReportView({ reportId }: ReportViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('modules/raporlar');
  const { data: report, isLoading } = useReport(reportId);
  const { exportToPDF, exportToExcel, exportToCSV, exportToWord, exportToHTML, printData, isExporting } = useExport();
  const [reportData, setReportData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (report && report.status === 'completed') {
        setDataLoading(true);
        try {
          const data = await reportService.getReportData(reportId);
          setReportData(data);
        } catch (error) {
          // Failed to fetch report data - silently fail
        } finally {
          setDataLoading(false);
        }
      }
    };

    if (report) {
      fetchReportData();
    }
  }, [report, reportId]);

  const loading = isLoading || dataLoading;

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'word' | 'html' | 'print') => {
    if (!report || !reportData) return;

    try {
      const exportData = {
        columns: reportData.columns,
        rows: reportData.rows,
        metadata: reportData.metadata,
      };

      const options = {
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
      showToast({
        type: 'error',
        title: 'Hata',
        message: t('titles.export.islemi.basarisiz.oldu'),
      });
    }
  };

  if (loading) {
    return <ReportViewSkeleton />;
  }

  if (!report) {
    return (
      <Container size="xl" py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Text c="dimmed" size="lg" ta="center">
            {t('errors.reportNotFound')}
          </Text>
          <Button mt="md" onClick={() => router.push(`/${pathname?.split('/')[1] || 'tr'}/modules/raporlar`)} leftSection={<IconArrowLeft size={18} />}>
            {t('actions.back')}
          </Button>
        </Paper>
      </Container>
    );
  }

  // Format report type for display
  const formatReportType = (type: string): string => {
    if (!type) return '';
    // If it's already a readable name, return as is
    if (type.includes(' ') || type === type.charAt(0).toUpperCase() + type.slice(1)) {
      return type;
    }
    // Convert snake_case or camelCase to readable format
    return type
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <CentralPageHeader
          title={report.name}
          description={report.typeName || formatReportType(report.type)}
          namespace="modules/raporlar"
          icon={<IconChartBar size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${pathname?.split('/')[1] || 'tr'}/dashboard`, namespace: 'global' },
            { label: 'menu.label', href: `/${pathname?.split('/')[1] || 'tr'}/modules/raporlar`, namespace: 'modules/raporlar' },
            { label: report.name, namespace: 'modules/raporlar' },
          ]}
          actions={[
            {
              label: t('actions.back'),
              icon: <IconArrowLeft size={18} />,
              onClick: () => router.push(`/${pathname?.split('/')[1] || 'tr'}/modules/raporlar`),
              variant: 'subtle',
            },
            ...(report.status === 'completed' && reportData
              ? [
                  {
                    label: 'Export',
                    icon: <IconDownload size={18} />,
                    onClick: () => handleExport('pdf'),
                    variant: 'filled',
                  },
                ]
              : []),
          ]}
        />

        {/* Report Info */}
        <Paper shadow="sm" p="md" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600} className="text-text-primary-light dark:text-text-primary-dark">
                Rapor Bilgileri
              </Text>
              <ReportStatusBadge status={report.status} />
            </Group>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Group gap="xs">
                <IconFile size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                  Tip:
                </Text>
                <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                  {report.typeName || report.type}
                </Text>
              </Group>

              {report.fileSize && (
                <Group gap="xs">
                  <IconFile size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                  <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                    Dosya Boyutu:
                  </Text>
                  <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                    {report.fileSize}
                  </Text>
                </Group>
              )}

              <Group gap="xs">
                <IconCalendar size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                  Oluşturulma:
                </Text>
                <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                  {dayjs(report.createdAt).format('DD.MM.YYYY HH:mm')}
                </Text>
              </Group>

              {report.generatedAt && (
                <Group gap="xs">
                  <IconCalendar size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                  <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                    Oluşturulma:
                  </Text>
                  <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                    {dayjs(report.generatedAt).format('DD.MM.YYYY HH:mm')}
                  </Text>
                </Group>
              )}

              <Group gap="xs">
                <IconUser size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                  Oluşturan:
                </Text>
                <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                  {report.createdByName || report.createdBy}
                </Text>
              </Group>

              {report.dateRange && (
                <Group gap="xs">
                  <IconCalendar size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
                  <Text size="sm" className="text-text-secondary-light dark:text-text-secondary-dark">
                    Tarih Aralığı:
                  </Text>
                  <Text size="sm" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                    {dayjs(report.dateRange.from).format('DD.MM.YYYY')} - {dayjs(report.dateRange.to).format('DD.MM.YYYY')}
                  </Text>
                </Group>
              )}
            </div>
          </Stack>
        </Paper>

        {/* Report Data */}
        {report.status === 'completed' && reportData ? (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600} className="text-text-primary-light dark:text-text-primary-dark">
                Rapor Verisi
              </Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExport('pdf')}
                  loading={isExporting}
                >
                  PDF
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExport('excel')}
                  loading={isExporting}
                >
                  Excel
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExport('csv')}
                  loading={isExporting}
                >
                  CSV
                </Button>
              </Group>
            </Group>

            {reportData.metadata && (
              <div className="mb-4">
                {reportData.metadata.description && (
                  <Text size="sm" c="dimmed" mb="xs">
                    {reportData.metadata.description}
                  </Text>
                )}
                {reportData.metadata.generatedAt && (
                  <Text size="xs" c="dimmed">
                    Oluşturulma: {dayjs(reportData.metadata.generatedAt).format('DD.MM.YYYY HH:mm')}
                  </Text>
                )}
              </div>
            )}

            {reportData.rows.length > 0 ? (
              <DataTable
                columns={reportData.columns.map((column: string) => ({
                  key: column,
                  label: column,
                  sortable: true,
                }))}
                data={reportData.rows.map((row: any[]) => {
                  const rowObject: Record<string, any> = {};
                  reportData.columns.forEach((column: string, index: number) => {
                    rowObject[column] = row[index];
                  });
                  return rowObject;
                })}
                searchable={true}
                sortable={true}
                pageable={true}
                defaultPageSize={25}
                pageSizeOptions={[10, 25, 50, 100]}
                emptyMessage={t('messages.rapor.verisi.bulunamadi')}
                showExportIcons={true}
                onExport={(format) => handleExport(format)}
              />
            ) : (
              <Paper shadow="sm" p="xl" radius="md">
                <Text c="dimmed" ta="center" py="xl">
                  Rapor verisi bulunamadı
                </Text>
              </Paper>
            )}
          </Stack>
        ) : report.status === 'generating' ? (
          <Paper shadow="sm" p="xl" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <Stack gap="md" align="center">
              <LoadingOverlay visible={true} />
              <Text size="lg" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                Rapor oluşturuluyor...
              </Text>
              <Text size="sm" c="dimmed">
                Lütfen bekleyin, rapor hazır olduğunda otomatik olarak görüntülenecektir.
              </Text>
            </Stack>
          </Paper>
        ) : report.status === 'failed' ? (
          <Paper shadow="sm" p="xl" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <Stack gap="md" align="center">
              <Text size="lg" fw={500} c="red">
                {t('errors.reportGenerationFailed')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('errors.createFailed')}. Lütfen tekrar deneyin.
              </Text>
              <Button onClick={() => router.push(`/${pathname?.split('/')[1] || 'tr'}/modules/raporlar`)}>{t('actions.backToList')}</Button>
            </Stack>
          </Paper>
        ) : (
          <Paper shadow="sm" p="xl" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <Stack gap="md" align="center">
              <Text size="lg" fw={500} className="text-text-primary-light dark:text-text-primary-dark">
                Rapor bekleniyor
              </Text>
              <Text size="sm" c="dimmed">
                Rapor henüz oluşturulmadı.
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

