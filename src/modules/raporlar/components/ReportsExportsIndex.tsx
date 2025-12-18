'use client';

import { useState, useMemo } from 'react';
import { Container, Stack, Text, Button } from '@mantine/core';
import { IconPlus, IconFileExport } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useReports } from '../hooks/useReports';
import { ReportFilters } from './ReportFilters';
import { ReportList } from './ReportList';
import { ReportMetrics } from './ReportMetrics';
import { ReportCharts } from './ReportCharts';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

export function ReportsExportsIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('modules/raporlar');
  const { data: reportsData, isLoading, error } = useReports({ status: 'completed' });
  const [searchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: dayjs().subtract(30, 'days').toDate(),
    to: dayjs().toDate(),
  });

  const reports = reportsData?.reports || [];
  const loading = isLoading;

  // Filter only completed reports with outputUrl (exported reports)
  const exportedReports = useMemo(() => {
    return reports.filter((report: any) => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.typeName || report.type).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !selectedType || report.type === selectedType;
      
      // Only show completed reports with outputUrl
      const hasExport = report.status === 'completed' && report.outputUrl;
      
      return matchesSearch && matchesType && hasExport;
    });
  }, [reports, searchQuery, selectedType]);

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
        title={t('page.exports.title')}
        description={t('page.exports.description')}
        namespace="modules/raporlar"
        icon={<IconFileExport size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '/dashboard', namespace: 'global' },
          { label: 'menu.label', href: '/modules/raporlar', namespace: 'modules/raporlar' },
          { label: 'page.exports.title', namespace: 'modules/raporlar' },
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
        {!loading && exportedReports.length > 0 && (
          <>
            <ReportMetrics reports={exportedReports} loading={loading} />
            <ReportCharts reports={exportedReports} loading={loading} />
          </>
        )}

        {/* Filters */}
        <ReportFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          reportTypes={[]}
        />

        {/* Report List */}
        {loading ? (
          <DataTableSkeleton columns={6} rows={8} />
        ) : error ? (
          <div className="text-center py-12">
            <Text c="red" size="lg">
              {t('errors.exportsLoadFailed')}
            </Text>
          </div>
        ) : exportedReports.length === 0 ? (
          <div className="text-center py-12">
            <Text c="dimmed" size="lg">
              {t('exports.empty')}
            </Text>
            <Button
              mt="md"
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                const locale = pathname?.split('/')[1] || 'tr';
                router.push(`/${locale}/modules/reports/create`);
              }}
            >
              {t('exports.createNew')}
            </Button>
          </div>
        ) : (
          <ReportList
            reports={exportedReports}
            onView={handleView}
            onExport={handleExport}
          />
        )}
      </Stack>
    </Container>
  );
}

