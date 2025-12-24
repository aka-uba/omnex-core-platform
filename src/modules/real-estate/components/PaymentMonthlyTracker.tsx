'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Card,
  ActionIcon,
  Select,
  Tooltip,
  Box,
  Loader,
  Center,
  Stack,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCurrencyDollar,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconReceipt,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import type { MonthlyTrackerResponse, MonthPaymentInfo } from '@/app/api/real-estate/payments/monthly-tracker/route';

interface PaymentMonthlyTrackerProps {
  locale: string;
}

// Payment method icons
const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <IconCash size={12} />,
  bank_transfer: <IconBuildingBank size={12} />,
  credit_card: <IconCreditCard size={12} />,
  check: <IconReceipt size={12} />,
};

// Status colors for cell backgrounds (dark mode compatible)
const getStatusColors = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        bg: 'var(--mantine-color-green-light)',
        border: 'var(--mantine-color-green-6)',
        text: 'var(--mantine-color-green-text)',
        badgeColor: 'green',
      };
    case 'pending':
      return {
        bg: 'var(--mantine-color-yellow-light)',
        border: 'var(--mantine-color-yellow-6)',
        text: 'var(--mantine-color-yellow-text)',
        badgeColor: 'yellow',
      };
    case 'overdue':
      return {
        bg: 'var(--mantine-color-red-light)',
        border: 'var(--mantine-color-red-6)',
        text: 'var(--mantine-color-red-text)',
        badgeColor: 'red',
      };
    case 'partial':
      return {
        bg: 'var(--mantine-color-orange-light)',
        border: 'var(--mantine-color-orange-6)',
        text: 'var(--mantine-color-orange-text)',
        badgeColor: 'orange',
      };
    default:
      return {
        bg: 'transparent',
        border: 'transparent',
        text: 'var(--mantine-color-dimmed)',
        badgeColor: 'gray',
      };
  }
};

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);

  // Fetch data from API
  const { data, isLoading, error } = useQuery<MonthlyTrackerResponse>({
    queryKey: ['payment-monthly-tracker', currentYear, propertyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('year', String(currentYear));
      if (propertyFilter) params.set('propertyId', propertyFilter);

      const response = await fetch(`/api/real-estate/payments/monthly-tracker?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const json = await response.json();
      return json.data;
    },
  });

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  // Format short currency (for cells)
  const formatShortCurrency = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toFixed(0);
  }, []);

  // Navigate years
  const navigatePrevious = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const navigateNext = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);

  // Get month names
  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).locale(locale).format('MMM')
    );
  }, [locale]);

  // Full month names for tooltip
  const fullMonthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).locale(locale).format('MMMM')
    );
  }, [locale]);

  // Property options for filter
  const propertyOptions = useMemo(() => {
    if (!data?.properties) return [];
    return data.properties.map(p => ({ value: p.id, label: p.name }));
  }, [data?.properties]);

  // Render month cell
  const renderMonthCell = useCallback((info: MonthPaymentInfo, monthIndex: number) => {
    if (info.status === 'none') {
      return <Text size="xs" c="dimmed" ta="center">-</Text>;
    }

    const colors = getStatusColors(info.status);
    const methodIcon = info.paymentMethod ? paymentMethodIcons[info.paymentMethod] : null;

    const tooltipContent = (
      <Stack gap={4} p={4}>
        <Group gap={4}>
          <Text size="xs" fw={600}>{fullMonthNames[monthIndex]} {currentYear}</Text>
        </Group>
        <Text size="xs" fw={500}>{formatCurrency(info.amount)}</Text>
        {info.status === 'partial' && info.paidAmount > 0 && (
          <Text size="xs" c="green">
            {t('payments.monthlyTracker.paidAmount')}: {formatCurrency(info.paidAmount)}
          </Text>
        )}
        <Badge size="xs" color={colors.badgeColor}>
          {t(`payments.status.${info.status}`)}
        </Badge>
        {info.dueDate && (
          <Text size="xs">
            {t('table.dueDate')}: {dayjs(info.dueDate).format('DD.MM.YYYY')}
          </Text>
        )}
        {info.paidDate && (
          <Text size="xs">
            {t('table.paidDate')}: {dayjs(info.paidDate).format('DD.MM.YYYY')}
          </Text>
        )}
        {info.paymentMethod && (
          <Group gap={4}>
            {methodIcon}
            <Text size="xs">
              {t(`payments.methods.${info.paymentMethod}`)}
            </Text>
          </Group>
        )}
      </Stack>
    );

    return (
      <Tooltip label={tooltipContent} multiline w={220} withArrow>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            borderLeft: `3px solid ${colors.border}`,
            padding: '4px 6px',
            borderRadius: 4,
            cursor: 'pointer',
            minHeight: 32,
            transition: 'all 0.15s ease',
          }}
        >
          <Text size="xs" fw={600} style={{ color: colors.text, lineHeight: 1.2 }}>
            {formatShortCurrency(info.amount)}
          </Text>
          {info.paymentMethod && (
            <Box style={{ color: colors.text, opacity: 0.7, marginTop: 2 }}>
              {methodIcon}
            </Box>
          )}
        </Box>
      </Tooltip>
    );
  }, [formatCurrency, formatShortCurrency, fullMonthNames, currentYear, t]);

  // Build columns for DataTable
  const columns: DataTableColumn[] = useMemo(() => {
    const baseColumns: DataTableColumn[] = [
      {
        key: 'propertyName',
        label: t('table.property'),
        sortable: true,
        searchable: true,
        render: (value: string) => (
          <Text size="sm" fw={500} lineClamp={1}>{value}</Text>
        ),
      },
      {
        key: 'unitNumber',
        label: t('table.unit'),
        sortable: true,
        searchable: true,
        align: 'center',
        render: (value: string) => (
          <Text size="sm">{value}</Text>
        ),
      },
      {
        key: 'tenantName',
        label: t('table.tenant'),
        sortable: true,
        searchable: true,
        render: (value: string, row: any) => (
          <Group gap={4} wrap="nowrap">
            {row.tenantType === 'company' && (
              <Badge size="xs" variant="light" color="blue">
                {t('tenants.type.company')}
              </Badge>
            )}
            <Text size="sm" lineClamp={1}>{value}</Text>
          </Group>
        ),
      },
    ];

    // Add month columns
    const monthColumns: DataTableColumn[] = monthNames.map((month, index) => ({
      key: `month_${index}`,
      label: month,
      sortable: false,
      searchable: false,
      align: 'center' as const,
      render: (_: any, row: any) => {
        const monthInfo = row.months?.[index];
        if (!monthInfo) return <Text size="xs" c="dimmed">-</Text>;
        return renderMonthCell(monthInfo, index);
      },
    }));

    return [...baseColumns, ...monthColumns];
  }, [monthNames, renderMonthCell, t]);

  // Transform data for DataTable
  const tableData = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map(row => ({
      id: row.id,
      propertyName: row.propertyName,
      unitNumber: row.unitNumber,
      tenantName: row.tenantName,
      tenantType: row.tenantType,
      months: row.months,
    }));
  }, [data?.rows]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    if (!propertyOptions.length) return [];
    return [
      {
        key: 'propertyName',
        label: t('table.property'),
        type: 'select',
        options: propertyOptions,
      },
    ];
  }, [propertyOptions, t]);

  const { rows = [], summary, properties = [] } = data || {};

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('payments.monthlyTracker.error')}</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Year Navigation and Property Filter */}
      <Paper shadow="xs" p="md">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={navigatePrevious} size="lg">
              <IconChevronLeft size={24} />
            </ActionIcon>
            <Text size="xl" fw={700} style={{ minWidth: 60, textAlign: 'center' }}>
              {currentYear}
            </Text>
            <ActionIcon variant="subtle" onClick={navigateNext} size="lg">
              <IconChevronRight size={24} />
            </ActionIcon>
          </Group>

          <Select
            placeholder={t('payments.monthlyTracker.allProperties')}
            value={propertyFilter}
            onChange={setPropertyFilter}
            data={propertyOptions}
            clearable
            w={250}
            size="sm"
          />
        </Group>
      </Paper>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.totalPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {summary?.totalPayments || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary?.totalAmount || 0)}
                </Text>
              </div>
              <IconCurrencyDollar size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.paidPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="green">
                  {summary?.paidPayments || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary?.paidAmount || 0)}
                </Text>
              </div>
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.pendingPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="yellow">
                  {summary?.pendingPayments || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary?.pendingAmount || 0)}
                </Text>
              </div>
              <IconClock size={32} color="var(--mantine-color-yellow-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.overduePayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="red">
                  {summary?.overduePayments || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('payments.monthlyTracker.collectionRate')}: {(summary?.collectionRate || 0).toFixed(0)}%
                </Text>
              </div>
              <IconAlertCircle size={32} color="var(--mantine-color-red-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        showColumnSettings={true}
        showRowNumbers={true}
        filters={filterOptions}
        emptyMessage={t('payments.monthlyTracker.noData')}
        tableId="payment-monthly-tracker"
        exportTitle={`${t('payments.monthlyTracker.tab')} - ${currentYear}`}
        exportNamespace="modules/real-estate"
      />

      {/* Legend */}
      <Paper shadow="xs" p="sm">
        <Group gap="lg" wrap="wrap">
          <Group gap="xs">
            <Box
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'var(--mantine-color-green-light)',
                borderLeft: '3px solid var(--mantine-color-green-6)',
                borderRadius: 2,
              }}
            />
            <Text size="sm">{t('payments.status.paid')}</Text>
          </Group>
          <Group gap="xs">
            <Box
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'var(--mantine-color-yellow-light)',
                borderLeft: '3px solid var(--mantine-color-yellow-6)',
                borderRadius: 2,
              }}
            />
            <Text size="sm">{t('payments.status.pending')}</Text>
          </Group>
          <Group gap="xs">
            <Box
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'var(--mantine-color-red-light)',
                borderLeft: '3px solid var(--mantine-color-red-6)',
                borderRadius: 2,
              }}
            />
            <Text size="sm">{t('payments.status.overdue')}</Text>
          </Group>
          <Group gap="xs">
            <Box
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'var(--mantine-color-orange-light)',
                borderLeft: '3px solid var(--mantine-color-orange-6)',
                borderRadius: 2,
              }}
            />
            <Text size="sm">{t('payments.status.partial')}</Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">- : {t('payments.monthlyTracker.noPayment')}</Text>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
