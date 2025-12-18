'use client';

import { useState, useMemo } from 'react';
import { Container, Button, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconChartBar } from '@tabler/icons-react';
import { useReports, useDeleteReport } from './hooks/useReports';
import { useReportTypes } from './hooks/useReportTypes';
import { ReportFilters } from './components/ReportFilters';
import { ReportList } from './components/ReportList';
import { ReportExportModal } from './components/ReportExportModal';
import { ReportMetrics } from './components/ReportMetrics';
import { ReportCharts } from './components/ReportCharts';
import { useNotification } from '@/hooks/useNotification';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

export function ReportsIndex() {
  const { t } = useTranslation('modules/raporlar');
  const router = useRouter();
  const pathname = usePathname();
  const { data: reportsData, isLoading, error } = useReports();
  const deleteReportMutation = useDeleteReport();
  const { reportTypes, loading: typesLoading } = useReportTypes();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [searchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: dayjs().subtract(30, 'days').toDate(),
    to: dayjs().toDate(),
  });
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [selectedReports, setSelectedReports] = useState<any[]>([]);

  const reports = reportsData?.reports || [];
  const loading = isLoading || typesLoading;

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.typeName || report.type).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !selectedType || report.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [reports, searchQuery, selectedType]);

  const handleDelete = async (id: string) => {
    showConfirm(
      t('messages.delete.title'),
      t('messages.delete.confirm'),
      async () => {
        try {
          await deleteReportMutation.mutateAsync(id);
          showSuccess(t('actions.success'), t('messages.delete.success'));
        } catch (error) {
          showError(t('actions.error'), t('messages.delete.error'));
        }
      }
    );
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;

    showConfirm(
      t('messages.bulkDelete.title'),
      t('messages.bulkDelete.confirm', { count: ids.length }),
      async () => {
        try {
          await Promise.all(ids.map(id => deleteReportMutation.mutateAsync(id)));
          showSuccess(t('actions.success'), t('messages.bulkDelete.success', { count: ids.length }));
        } catch (error) {
          showError(t('actions.error'), t('messages.bulkDelete.error'));
        }
      }
    );
  };

  const handleView = (report: any) => {
    const locale = pathname?.split('/')[1] || 'tr';
    router.push(`/${locale}/modules/reports/${report.id}`);
  };

  const handleExport = async (_report: unknown, _format: string): Promise<void> => {
    // Export is handled in ReportList component
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="Tüm Raporlar"
        description="Sistem ve kullanıcı raporlarını oluşturun, görüntüleyin ve export edin"
        namespace="modules/raporlar"
        icon={<IconChartBar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '/dashboard', namespace: 'global' },
          { label: 'menu.label', href: '/modules/raporlar', namespace: 'modules/raporlar' },
          { label: 'page.allReports.title', namespace: 'modules/raporlar' },
        ]}
        actions={[
          {
            label: 'actions.create',
            icon: <IconPlus size={18} />,
            onClick: () => {
              const locale = pathname?.split('/')[1] || 'tr';
              router.push(`/${locale}/modules/reports/create`);
            },
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="xl">
        {/* Metrics Cards */}
        {!loading && reports.length > 0 && (
          <>
            <ReportMetrics reports={reports} loading={loading} />
            <ReportCharts reports={reports} loading={loading} />
          </>
        )}

        {/* Filters */}
        <ReportFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          reportTypes={reportTypes}
        />

        {/* Report List */}
        {loading ? (
          <DataTableSkeleton columns={6} rows={8} />
        ) : error ? (
          <div className="text-center py-12">
            <Text c="red" size="lg">
              Raporlar yüklenirken bir hata oluştu
            </Text>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Text c="dimmed" size="lg">
              Rapor bulunamadı
            </Text>
            <Button
              mt="md"
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                const locale = pathname?.split('/')[1] || 'tr';
                router.push(`/${locale}/modules/reports/create`);
              }}
            >
              Yeni Rapor Oluştur
            </Button>
          </div>
        ) : (
          <ReportList
            reports={filteredReports}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onView={handleView}
            onExport={handleExport}
            onSelectionChange={(ids) => {
              setSelectedReports(filteredReports.filter(r => ids.includes(r.id)));
            }}
            onBulkExport={() => setExportModalOpened(true)}
            selectedCount={selectedReports.length}
            loading={loading}
          />
        )}
      </Stack>

      <ReportExportModal
        opened={exportModalOpened}
        onClose={() => setExportModalOpened(false)}
        reports={filteredReports}
        selectedReports={selectedReports}
      />
    </Container>
  );
}

