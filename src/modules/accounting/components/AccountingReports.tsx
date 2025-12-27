'use client';

// Accounting Reports Component (FAZ 2)

import { useState, useEffect } from 'react';
import {
  Paper,
  Tabs,
  Button,
  Group,
  Text,
  Select,
  Stack,
  Card,
  Grid,
  Loader,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFileText, IconChartBar, IconDownload, IconCalendar } from '@tabler/icons-react';
import { useAccountingAnalytics } from '@/hooks/useAccountingAnalytics';
// import { useSubscriptions } from '@/hooks/useSubscriptions'; // removed - unused
// import { useInvoices } from '@/hooks/useInvoices'; // removed - unused
// import { useExpenses } from '@/hooks/useExpenses'; // removed - unused
import { useExport } from '@/lib/export/ExportProvider';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface AccountingReportsProps {
  locale: string;
}

export function AccountingReports({ locale }: AccountingReportsProps) {
  const { t } = useTranslation('modules/accounting');
  // const { t: tGlobal } = useTranslation('global'); // removed - unused
  const { exportToExcel, exportToPDF, isExporting } = useExport();
  
  const [reportType, setReportType] = useState<string>('financial');
  const [startDate, setStartDate] = useState<Date | null>(dayjs().startOf('month').toDate());
  const [endDate, setEndDate] = useState<Date | null>(dayjs().endOf('month').toDate());
  // const [subscriptionId, setSubscriptionId] = useState<string | undefined>(); // removed - unused

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  // Fetch data
  const { data: analyticsData, isLoading: analyticsLoading } = useAccountingAnalytics({
    ...(startDate ? { dateFrom: startDate.toISOString() } : {}),
    ...(endDate ? { dateTo: endDate.toISOString() } : {}),
  });

  // const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 }); // removed - unused
  // const { data: invoicesData } = useInvoices({ page: 1, pageSize: 1000 }); // removed - unused
  // const { data: expensesData } = useExpenses({ page: 1, pageSize: 1000 }); // removed - unused

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    if (!analyticsData) return;

    try {
      const reportData = {
        columns: [
          t('reports.metric'),
          t('reports.value'),
        ],
        rows: [
          [t('reports.totalRevenue'), Number(analyticsData.summary.totalRevenue).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })],
          [t('reports.totalExpenses'), Number(analyticsData.summary.totalExpenses).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })],
          [t('reports.netProfit'), Number(analyticsData.summary.netProfit).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })],
          [t('dashboard.activeSubscriptions'), analyticsData.summary.activeSubscriptions.toString()],
          [t('dashboard.pendingInvoices'), (analyticsData.summary.totalInvoices - analyticsData.summary.paidInvoices).toString()],
          [t('reports.completedPayments'), analyticsData.summary.paidInvoices.toString()],
        ],
        metadata: {
          title: `${t('reports.financial')} - ${dayjs(startDate).format('DD.MM.YYYY')} - ${dayjs(endDate).format('DD.MM.YYYY')}`,
          description: t('reports.financialDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: reportData.metadata.title,
        description: reportData.metadata.description,
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `accounting_report_${dayjs().format('YYYY-MM-DD')}`,
      };

      if (format === 'excel') {
        await exportToExcel(reportData, options);
      } else {
        await exportToPDF(reportData, options);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (analyticsLoading) {
    return <Loader />;
  }

  return (
    <Stack gap="sm">
      {/* Filters */}
      <Paper p="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={t('reports.reportType')}
              value={reportType}
              onChange={(value) => setReportType(value || 'financial')}
              data={[
                { value: 'financial', label: t('reports.financial') },
                { value: 'subscriptions', label: t('reports.subscriptions') },
                { value: 'invoices', label: t('reports.invoices') },
                { value: 'expenses', label: t('reports.expenses') },
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <DatePickerInput label={t('reports.startDate')}
              value={startDate}
              onChange={(value: Date | string | null) => {
                if (value === null) {
                  setStartDate(null);
                } else if (typeof value === 'string') {
                  setStartDate(new Date(value));
                } else {
                  setStartDate(value);
                }
              }}
              locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
              leftSection={<IconCalendar size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
      <DatePickerInput label={t('reports.endDate')}
              value={endDate}
              onChange={(value: Date | string | null) => {
                if (value === null) {
                  setEndDate(null);
                } else if (typeof value === 'string') {
                  setEndDate(new Date(value));
                } else {
                  setEndDate(value);
                }
              }}
              locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
              leftSection={<IconCalendar size={16} />}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Report Content */}
      <Paper p="md" withBorder>
        <Stack gap="sm" mb="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="lg" fw={600}>
              {t('reports.title')}
            </Text>
            <Group gap="xs" wrap="wrap">
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => handleExportReport('excel')}
                loading={isExporting}
                size="sm"
              >
                {t('reports.exportExcel')}
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => handleExportReport('pdf')}
                loading={isExporting}
                variant="outline"
                size="sm"
              >
                {t('reports.exportPDF')}
              </Button>
            </Group>
          </Group>
        </Stack>

        <Tabs value={reportType} onChange={(value) => setReportType(value || 'financial')}>
          <Tabs.List>
            <Tabs.Tab value="financial" leftSection={<IconChartBar size={16} />}>
              {t('reports.financial')}
            </Tabs.Tab>
            <Tabs.Tab value="subscriptions" leftSection={<IconFileText size={16} />}>
              {t('reports.subscriptions')}
            </Tabs.Tab>
            <Tabs.Tab value="invoices" leftSection={<IconFileText size={16} />}>
              {t('reports.invoices')}
            </Tabs.Tab>
            <Tabs.Tab value="expenses" leftSection={<IconFileText size={16} />}>
              {t('reports.expenses')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="financial" pt="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">
                    {t('reports.totalRevenue')}
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {Number(analyticsData?.summary.totalRevenue || 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">
                    {t('reports.totalExpenses')}
                  </Text>
                  <Text size="xl" fw={700} c="red">
                    {Number(analyticsData?.summary.totalExpenses || 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">
                    {t('reports.netProfit')}
                  </Text>
                  <Text size="xl" fw={700} c={Number(analyticsData?.summary.netProfit || 0) >= 0 ? 'green' : 'red'}>
                    {Number(analyticsData?.summary.netProfit || 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="subscriptions" pt="md">
            <Text c="dimmed">
              {t('reports.subscriptionsDescription')}
            </Text>
          </Tabs.Panel>

          <Tabs.Panel value="invoices" pt="md">
            <Text c="dimmed">
              {t('reports.invoicesDescription')}
            </Text>
          </Tabs.Panel>

          <Tabs.Panel value="expenses" pt="md">
            <Text c="dimmed">
              {t('reports.expensesDescription')}
            </Text>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
}

