'use client';

import { useState } from 'react';
import { Container, Tabs, Grid, Paper, Text, Group, Stack, Card, Button } from '@mantine/core';
import {
  IconReport,
  IconChartBar,
  IconFileText,
  IconCurrencyDollar,
  IconBuilding,
  IconUsers,
  IconFileCheck,
  IconDownload,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AgreementReportList } from '@/modules/real-estate/components/AgreementReportList';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useTenants } from '@/hooks/useTenants';
import { useContracts } from '@/hooks/useContracts';
import { usePayments } from '@/hooks/usePayments';
import { useAppointments } from '@/hooks/useAppointments';
import { useExport } from '@/lib/export/ExportProvider';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';

export function ReportsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Fetch data for statistics
  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1 });
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1 });
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 1 });
  const { data: contractsData } = useContracts({ page: 1, pageSize: 1 });
  const { data: paymentsData } = usePayments({ page: 1, pageSize: 1 });
  const { data: appointmentsData } = useAppointments({ page: 1, pageSize: 1 });

  const handleExportReport = async (reportType: string, format: 'excel' | 'pdf' | 'csv') => {
    try {
      // This would generate a comprehensive report
      const reportData = {
        columns: [t('reports.column.date'), t('reports.column.type'), t('reports.column.details')],
        rows: [],
        metadata: {
          title: t(`reports.types.${reportType}`),
          description: t('reports.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t(`reports.types.${reportType}`),
        description: t('reports.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `${reportType}_${dayjs().format('YYYY-MM-DD')}`,
      };

      switch (format) {
        case 'excel':
          await exportToExcel(reportData, options);
          break;
        case 'pdf':
          await exportToPDF(reportData, options);
          break;
        case 'csv':
          await exportToCSV(reportData, options);
          break;
      }

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('reports.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('reports.exportError'),
      });
    }
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        namespace="modules/real-estate"
        icon={<IconReport size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('reports.title'), namespace: 'modules/real-estate' },
        ]}
      />

      <Tabs value={activeTab} onChange={setActiveTab} mt="md">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
            {t('reports.tabs.overview')}
          </Tabs.Tab>
          <Tabs.Tab value="agreement" leftSection={<IconFileCheck size={16} />}>
            {t('reports.tabs.agreement')}
          </Tabs.Tab>
          <Tabs.Tab value="financial" leftSection={<IconCurrencyDollar size={16} />}>
            {t('reports.tabs.financial')}
          </Tabs.Tab>
          <Tabs.Tab value="property" leftSection={<IconBuilding size={16} />}>
            {t('reports.tabs.property')}
          </Tabs.Tab>
          <Tabs.Tab value="tenant" leftSection={<IconUsers size={16} />}>
            {t('reports.tabs.tenant')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            {/* Statistics Cards */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.totalProperties')}
                      </Text>
                      <Text fw={700} size="xl">
                        {propertiesData?.total || 0}
                      </Text>
                    </div>
                    <IconBuilding size={40} color="var(--mantine-color-blue-6)" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.totalApartments')}
                      </Text>
                      <Text fw={700} size="xl">
                        {apartmentsData?.total || 0}
                      </Text>
                    </div>
                    <IconBuilding size={40} color="var(--mantine-color-green-6)" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.totalTenants')}
                      </Text>
                      <Text fw={700} size="xl">
                        {tenantsData?.total || 0}
                      </Text>
                    </div>
                    <IconUsers size={40} color="var(--mantine-color-orange-6)" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.activeContracts')}
                      </Text>
                      <Text fw={700} size="xl">
                        {contractsData?.total || 0}
                      </Text>
                    </div>
                    <IconFileText size={40} color="var(--mantine-color-violet-6)" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.totalPayments')}
                      </Text>
                      <Text fw={700} size="xl">
                        {paymentsData?.total || 0}
                      </Text>
                    </div>
                    <IconCurrencyDollar size={40} color="var(--mantine-color-teal-6)" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {t('reports.stats.totalAppointments')}
                      </Text>
                      <Text fw={700} size="xl">
                        {appointmentsData?.total || 0}
                      </Text>
                    </div>
                    <IconChartBar size={40} color="var(--mantine-color-cyan-6)" />
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Quick Actions */}
            <Paper shadow="sm" p="md" withBorder>
              <Text size="lg" fw={500} mb="md">
                {t('reports.quickActions')}
              </Text>
              <Group gap="md">
                <Button
                  leftSection={<IconDownload size={18} />}
                  variant="light"
                  onClick={() => handleExportReport('summary', 'excel')}
                  loading={isExporting}
                >
                  {t('reports.exportSummary')}
                </Button>
                <Button
                  leftSection={<IconFileText size={18} />}
                  variant="light"
                  onClick={() => router.push(`/${currentLocale}/modules/real-estate/agreement-reports`)}
                >
                  {t('reports.viewAgreementReports')}
                </Button>
                <Button
                  leftSection={<IconCurrencyDollar size={18} />}
                  variant="light"
                  onClick={() => router.push(`/${currentLocale}/modules/real-estate/payments`)}
                >
                  {t('reports.viewPayments')}
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="agreement" pt="md">
          <AgreementReportList locale={currentLocale} />
        </Tabs.Panel>

        <Tabs.Panel value="financial" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>
                {t('reports.financial.title')}
              </Text>
              <Group gap="xs">
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('financial', 'excel')}
                  loading={isExporting}
                >
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('financial', 'pdf')}
                  loading={isExporting}
                >
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('financial', 'csv')}
                  loading={isExporting}
                >
                  CSV
                </Button>
              </Group>
            </Group>
            <Text c="dimmed">
              {t('reports.financial.description')}
            </Text>
            <Button
              mt="md"
              variant="light"
              onClick={() => router.push(`/${currentLocale}/modules/real-estate/payments`)}
            >
              {t('reports.viewPaymentDetails')}
            </Button>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="property" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>
                {t('reports.property.title')}
              </Text>
              <Group gap="xs">
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('property', 'excel')}
                  loading={isExporting}
                >
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('property', 'pdf')}
                  loading={isExporting}
                >
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('property', 'csv')}
                  loading={isExporting}
                >
                  CSV
                </Button>
              </Group>
            </Group>
            <Text c="dimmed">
              {t('reports.property.description')}
            </Text>
            <Button
              mt="md"
              variant="light"
              onClick={() => router.push(`/${currentLocale}/modules/real-estate/properties`)}
            >
              {t('reports.viewProperties')}
            </Button>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="tenant" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>
                {t('reports.tenant.title')}
              </Text>
              <Group gap="xs">
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('tenant', 'excel')}
                  loading={isExporting}
                >
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('tenant', 'pdf')}
                  loading={isExporting}
                >
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleExportReport('tenant', 'csv')}
                  loading={isExporting}
                >
                  CSV
                </Button>
              </Group>
            </Group>
            <Text c="dimmed">
              {t('reports.tenant.description')}
            </Text>
            <Button
              mt="md"
              variant="light"
              onClick={() => router.push(`/${currentLocale}/modules/real-estate/tenants`)}
            >
              {t('reports.viewTenants')}
            </Button>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

