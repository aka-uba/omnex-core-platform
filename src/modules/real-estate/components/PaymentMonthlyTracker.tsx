'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  ActionIcon,
  Select,
  Table,
  ScrollArea,
  Tooltip,
  Box,
  Loader,
  Center,
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
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconCode,
  IconPrinter,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/client';
import { useExport } from '@/lib/export/ExportProvider';
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

// Status colors for cell backgrounds
const statusColors = {
  paid: { bg: 'var(--mantine-color-green-1)', border: 'var(--mantine-color-green-5)', text: 'var(--mantine-color-green-8)' },
  pending: { bg: 'var(--mantine-color-yellow-1)', border: 'var(--mantine-color-yellow-5)', text: 'var(--mantine-color-yellow-8)' },
  overdue: { bg: 'var(--mantine-color-red-1)', border: 'var(--mantine-color-red-5)', text: 'var(--mantine-color-red-8)' },
  partial: { bg: 'var(--mantine-color-orange-1)', border: 'var(--mantine-color-orange-5)', text: 'var(--mantine-color-orange-8)' },
  none: { bg: 'transparent', border: 'transparent', text: 'var(--mantine-color-dimmed)' },
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

  // Export hook
  let exportHook: ReturnType<typeof useExport> | null = null;
  try {
    exportHook = useExport();
  } catch {
    // ExportProvider not available
  }

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

  // Render cell content
  const renderCell = useCallback((info: MonthPaymentInfo, monthIndex: number) => {
    if (info.status === 'none') {
      return (
        <Box
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size="xs" c="dimmed">-</Text>
        </Box>
      );
    }

    const colors = statusColors[info.status];
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
        <Badge size="xs" color={info.status === 'paid' ? 'green' : info.status === 'overdue' ? 'red' : info.status === 'partial' ? 'orange' : 'yellow'}>
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
            width: '100%',
            height: '100%',
            minHeight: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            borderLeft: `3px solid ${colors.border}`,
            cursor: 'pointer',
            padding: '4px 2px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
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

  // Export handler
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'print' | 'html') => {
    if (!exportHook || !data?.rows) return;

    const monthHeaders = monthNames.map((m, i) => `${m} ${currentYear}`);
    const columns = [
      t('table.property'),
      t('table.unit'),
      t('table.tenant'),
      ...monthHeaders,
    ];

    const rows = data.rows.map(row => {
      const monthCells = Array.from({ length: 12 }, (_, i) => {
        const info = row.months[i];
        if (info.status === 'none') return { html: '-', text: '-', raw: null };
        const statusText = t(`payments.status.${info.status}`);
        const amount = formatCurrency(info.amount);
        return {
          html: `<span style="background-color: ${statusColors[info.status].bg}; padding: 2px 6px; border-radius: 4px;">${amount}</span>`,
          text: `${amount} (${statusText})`,
          raw: info.amount,
        };
      });

      return [
        { html: row.propertyName, text: row.propertyName, raw: row.propertyName },
        { html: row.unitNumber, text: row.unitNumber, raw: row.unitNumber },
        { html: row.tenantName, text: row.tenantName, raw: row.tenantName },
        ...monthCells,
      ];
    });

    const exportData = {
      columns,
      columnAlignments: ['left', 'center', 'left', ...Array(12).fill('center')],
      rows,
      metadata: {
        title: `${t('payments.monthlyTracker.tab')} - ${currentYear}`,
        generatedAt: new Date().toISOString(),
        totalRecords: data.rows.length,
        exportedRecords: data.rows.length,
      },
    };

    const exportOptions = {
      format,
      title: `${t('payments.monthlyTracker.tab')} - ${currentYear}`,
      includeHeader: true,
      includeFooter: true,
    };

    try {
      switch (format) {
        case 'csv':
          await exportHook.exportToCSV(exportData, exportOptions);
          break;
        case 'excel':
          await exportHook.exportToExcel(exportData, exportOptions);
          break;
        case 'pdf':
          await exportHook.exportToPDF(exportData, exportOptions);
          break;
        case 'html':
          await exportHook.exportToHTML(exportData, exportOptions);
          break;
        case 'print':
          await exportHook.printData(exportData, exportOptions);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [exportHook, data, monthNames, currentYear, formatCurrency, t]);

  // Export options
  const exportOptions = [
    { value: 'pdf' as const, label: tGlobal('export.pdf'), icon: IconFile, color: 'red' },
    { value: 'excel' as const, label: tGlobal('export.excel'), icon: IconFileSpreadsheet, color: 'green' },
    { value: 'csv' as const, label: tGlobal('export.csv'), icon: IconFileText, color: 'blue' },
    { value: 'html' as const, label: tGlobal('export.html'), icon: IconCode, color: 'orange' },
    { value: 'print' as const, label: tGlobal('export.print'), icon: IconPrinter, color: 'gray' },
  ];

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

  const { rows = [], summary, properties = [] } = data || {};

  return (
    <Stack gap="md">
      {/* Year Navigation, Filters, and Export Icons */}
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

          <Group gap="sm">
            <Select
              placeholder={t('payments.monthlyTracker.allProperties')}
              value={propertyFilter}
              onChange={setPropertyFilter}
              data={propertyOptions}
              clearable
              w={250}
              size="sm"
            />

            {/* Export Icons */}
            <Group gap={4}>
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isDisabled = !exportHook;
                return (
                  <Tooltip key={option.value} label={option.label}>
                    <ActionIcon
                      variant="subtle"
                      color={isDisabled ? 'gray' : option.color}
                      size="lg"
                      onClick={() => !isDisabled && handleExport(option.value)}
                      disabled={isDisabled}
                      style={{ opacity: isDisabled ? 0.5 : 1 }}
                    >
                      <Icon size={18} />
                    </ActionIcon>
                  </Tooltip>
                );
              })}
            </Group>
          </Group>
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

      {/* Pivot Table */}
      <Paper shadow="sm" p="md" radius="md">
        <ScrollArea>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            style={{ minWidth: 1200 }}
          >
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                <Table.Th
                  style={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'var(--mantine-color-gray-1)',
                    zIndex: 2,
                    minWidth: 150,
                  }}
                >
                  <Text size="sm" fw={600}>{t('table.property')}</Text>
                </Table.Th>
                <Table.Th
                  style={{
                    position: 'sticky',
                    left: 150,
                    backgroundColor: 'var(--mantine-color-gray-1)',
                    zIndex: 2,
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                >
                  <Text size="sm" fw={600}>{t('table.unit')}</Text>
                </Table.Th>
                <Table.Th
                  style={{
                    position: 'sticky',
                    left: 230,
                    backgroundColor: 'var(--mantine-color-gray-1)',
                    zIndex: 2,
                    minWidth: 150,
                  }}
                >
                  <Text size="sm" fw={600}>{t('table.tenant')}</Text>
                </Table.Th>
                {monthNames.map((month, index) => (
                  <Table.Th
                    key={index}
                    style={{
                      textAlign: 'center',
                      minWidth: 75,
                      padding: '8px 4px',
                    }}
                  >
                    <Text size="xs" fw={600}>{month}</Text>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={15} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text c="dimmed">{t('payments.monthlyTracker.noData')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td
                      style={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'var(--mantine-color-body)',
                        zIndex: 1,
                      }}
                    >
                      <Text size="sm" fw={500} lineClamp={1}>{row.propertyName}</Text>
                    </Table.Td>
                    <Table.Td
                      style={{
                        position: 'sticky',
                        left: 150,
                        backgroundColor: 'var(--mantine-color-body)',
                        zIndex: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Text size="sm">{row.unitNumber}</Text>
                    </Table.Td>
                    <Table.Td
                      style={{
                        position: 'sticky',
                        left: 230,
                        backgroundColor: 'var(--mantine-color-body)',
                        zIndex: 1,
                      }}
                    >
                      <Group gap={4} wrap="nowrap">
                        {row.tenantType === 'company' && (
                          <Badge size="xs" variant="light" color="blue">
                            {t('tenants.type.company')}
                          </Badge>
                        )}
                        <Text size="sm" lineClamp={1}>{row.tenantName}</Text>
                      </Group>
                    </Table.Td>
                    {Array.from({ length: 12 }, (_, i) => (
                      <Table.Td key={i} style={{ padding: 0 }}>
                        {renderCell(row.months[i], i)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      {/* Legend */}
      <Paper shadow="xs" p="sm">
        <Group gap="lg" wrap="wrap">
          <Group gap="xs">
            <Box
              style={{
                width: 16,
                height: 16,
                backgroundColor: statusColors.paid.bg,
                borderLeft: `3px solid ${statusColors.paid.border}`,
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
                backgroundColor: statusColors.pending.bg,
                borderLeft: `3px solid ${statusColors.pending.border}`,
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
                backgroundColor: statusColors.overdue.bg,
                borderLeft: `3px solid ${statusColors.overdue.border}`,
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
                backgroundColor: statusColors.partial.bg,
                borderLeft: `3px solid ${statusColors.partial.border}`,
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
