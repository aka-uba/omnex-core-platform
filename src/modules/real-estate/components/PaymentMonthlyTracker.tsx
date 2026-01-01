'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  ActionIcon,
  Select,
  Tooltip,
  Popover,
  Box,
  Loader,
  Center,
  Stack,
  Progress,
  RingProgress,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
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
  IconTrendingUp,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
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

// Mobile-friendly Month Cell Component
function MonthCellWithPopover({
  info,
  monthIndex,
  colors,
  methodIcon,
  fullMonthNames,
  currentYear,
  formatCurrency,
  formatShortCurrency,
  t,
}: {
  info: MonthPaymentInfo;
  monthIndex: number;
  colors: ReturnType<typeof getStatusColors>;
  methodIcon: React.ReactNode;
  fullMonthNames: string[];
  currentYear: number;
  formatCurrency: (amount: number) => string;
  formatShortCurrency: (amount: number) => string;
  t: (key: string) => string;
}) {
  const [opened, { close, toggle }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const cellContent = (
    <Box
      onClick={isMobile ? toggle : undefined}
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
  );

  // Mobile: Use Popover with click
  if (isMobile) {
    return (
      <Popover opened={opened} onClose={close} position="bottom" withArrow shadow="md" width={220}>
        <Popover.Target>
          {cellContent}
        </Popover.Target>
        <Popover.Dropdown>
          {tooltipContent}
        </Popover.Dropdown>
      </Popover>
    );
  }

  // Desktop: Use Tooltip with hover
  return (
    <Tooltip label={tooltipContent} multiline w={220} withArrow>
      {cellContent}
    </Tooltip>
  );
}

// Layered Depth Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconColor: string;
  badgeText?: string;
  badgeColor?: string;
  badgeIcon?: React.ReactNode;
  progress?: number;
  progressColor?: string;
  ringProgress?: number;
  ringColor?: string;
  isDark: boolean;
}

function LayeredDepthCard({
  title,
  value,
  subValue,
  icon,
  iconColor,
  badgeText,
  badgeColor = 'blue',
  badgeIcon,
  progress,
  progressColor = 'blue',
  ringProgress,
  ringColor = 'blue',
  isDark,
}: StatsCardProps) {
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : '#ffffff';
  const cardBorder = isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0';
  const insetBg = isDark ? 'var(--mantine-color-dark-7)' : '#f8fafc';
  const insetShadow = isDark
    ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.3), inset -1px -1px 0px rgba(255, 255, 255, 0.05)'
    : 'inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -1px -1px 0px rgba(255, 255, 255, 1)';
  const iconBg = isDark
    ? 'linear-gradient(to bottom right, var(--mantine-color-dark-5), var(--mantine-color-dark-6))'
    : 'linear-gradient(to bottom right, #ffffff, #f8fafc)';

  return (
    <Paper
      p="lg"
      radius="lg"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        zIndex: 1,
      }}
      className="hover:shadow-md"
    >
      {/* Floating Badge - Right aligned, z-index between card and header */}
      {badgeText && (
        <Box
          style={{
            position: 'absolute',
            top: -22,
            right: 20,
            zIndex: 5,
          }}
        >
          <Badge
            size="lg"
            variant="filled"
            color={badgeColor}
            leftSection={badgeIcon}
            radius="sm"
            styles={{
              root: {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                fontWeight: 700,
                textTransform: 'none',
                padding: '10px 16px',
                fontSize: '0.85rem',
                minWidth: 60,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                height: 'auto',
              },
              section: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              },
              label: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              },
            }}
          >
            {badgeText}
          </Badge>
        </Box>
      )}

      {/* Header */}
      <Group justify="space-between" mb="md">
        <Text
          size="sm"
          fw={500}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: '0.05em' }}
        >
          {title}
        </Text>
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: iconBg,
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            color: iconColor,
          }}
        >
          {icon}
        </Box>
      </Group>

      {/* Inset Value Area */}
      <Box
        p="md"
        style={{
          backgroundColor: insetBg,
          borderRadius: 8,
          boxShadow: insetShadow,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" align="center">
          <div>
            <Text
              size="xl"
              fw={700}
              style={{
                fontSize: '1.75rem',
                letterSpacing: '-0.025em',
                textShadow: isDark ? 'none' : '1px 1px 0px rgba(255,255,255, 1)',
              }}
            >
              {value}
            </Text>
            {subValue && (
              <Text size="sm" c="dimmed" mt={4}>
                {subValue}
              </Text>
            )}
          </div>

          {/* Ring Progress (for collection rate) */}
          {ringProgress !== undefined && (
            <RingProgress
              size={52}
              thickness={5}
              roundCaps
              sections={[{ value: ringProgress, color: ringColor }]}
              label={
                <Text size="xs" ta="center" fw={700}>
                  {ringProgress}%
                </Text>
              }
            />
          )}

          {/* Progress Ring (moved to right side like ringProgress) */}
          {progress !== undefined && (
            <RingProgress
              size={52}
              thickness={5}
              roundCaps
              sections={[{ value: progress, color: progressColor }]}
              label={
                <Text size="xs" ta="center" fw={700}>
                  {Math.round(progress)}%
                </Text>
              }
            />
          )}
        </Group>
      </Box>
    </Paper>
  );
}

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);

  // Export hook
  let exportHook: ReturnType<typeof useExport> | null = null;
  try {
    exportHook = useExport();
  } catch {
    // ExportProvider not available
  }

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

    return (
      <MonthCellWithPopover
        info={info}
        monthIndex={monthIndex}
        colors={colors}
        methodIcon={methodIcon}
        fullMonthNames={fullMonthNames}
        currentYear={currentYear}
        formatCurrency={formatCurrency}
        formatShortCurrency={formatShortCurrency}
        t={t}
      />
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
        align: 'left',
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
        key: 'floor',
        label: t('table.floor'),
        sortable: true,
        searchable: false,
        align: 'center',
        render: (value: string) => (
          <Text size="sm">{value || '-'}</Text>
        ),
      },
      {
        key: 'tenantName',
        label: t('table.tenant'),
        sortable: true,
        searchable: true,
        align: 'left',
        render: (value: string, row: any) => (
          <Group gap={4} wrap="nowrap" justify="flex-start">
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
      floor: row.floor,
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
        key: 'propertyId',
        label: t('table.property'),
        type: 'select',
        options: propertyOptions,
      },
    ];
  }, [propertyOptions, t]);

  // Handle filter changes from DataTable
  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.propertyId) {
      setPropertyFilter(filters.propertyId);
    } else {
      setPropertyFilter(null);
    }
  }, []);

  // Custom export handler to format month cells properly (avoid [object Object])
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => {
    if (!exportHook || !data?.rows) return;

    // Format month payment info as readable text
    const formatMonthForExport = (info: MonthPaymentInfo, monthIndex: number): string => {
      if (info.status === 'none') return '-';

      const parts: string[] = [];
      parts.push(`${formatCurrency(info.amount)}`);
      parts.push(`(${t(`payments.status.${info.status}`)})`);

      if (info.dueDate) {
        parts.push(`${t('table.dueDate')}: ${dayjs(info.dueDate).format('DD.MM.YYYY')}`);
      }
      if (info.paidDate) {
        parts.push(`${t('table.paidDate')}: ${dayjs(info.paidDate).format('DD.MM.YYYY')}`);
      }
      if (info.paymentMethod) {
        parts.push(`${t(`payments.methods.${info.paymentMethod}`)}`);
      }

      return parts.join(' | ');
    };

    // Build export columns
    const baseColumnLabels = [
      t('table.property'),
      t('table.unit'),
      t('table.floor'),
      t('table.tenant'),
    ];
    const monthColumnLabels = monthNames.map(name => name);
    const allColumns = [...baseColumnLabels, ...monthColumnLabels];

    // Build export rows with formatted month data
    const exportRows = data.rows.map(row => {
      const tenantLabel = row.tenantType === 'company'
        ? `[${t('tenants.type.company')}] ${row.tenantName}`
        : row.tenantName;

      const baseData = [
        row.propertyName,
        row.unitNumber,
        row.floor || '-',
        tenantLabel,
      ];

      // Format each month's data
      const monthData = Array.from({ length: 12 }, (_, i) => {
        const monthInfo = row.months[i];
        if (!monthInfo) return '-';
        return formatMonthForExport(monthInfo, i);
      });

      return [...baseData, ...monthData].map(value => ({
        html: String(value),
        text: String(value),
        raw: value,
      }));
    });

    const exportData = {
      columns: allColumns,
      columnAlignments: allColumns.map((_, i) => i < 4 ? 'left' : 'center'),
      rows: exportRows,
      metadata: {
        title: `${t('payments.monthlyTracker.tab')} - ${currentYear}`,
        generatedAt: new Date().toISOString(),
        scope: 'all' as const,
        totalRecords: data.rows.length,
        exportedRecords: data.rows.length,
      },
    };

    const exportOptions = {
      format,
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      title: `${t('payments.monthlyTracker.tab')} - ${currentYear}`,
    };

    try {
      switch (format) {
        case 'csv':
          await exportHook.exportToCSV(exportData, exportOptions);
          break;
        case 'excel':
          await exportHook.exportToExcel(exportData, exportOptions);
          break;
        case 'word':
          await exportHook.exportToWord(exportData, exportOptions);
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
  }, [data, monthNames, formatCurrency, t, exportHook, currentYear]);

  const { summary } = data || {};

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

      {/* Summary Cards - Layered Depth Design */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <LayeredDepthCard
            title={t('payments.monthlyTracker.totalPayments')}
            value={summary?.totalPayments || 0}
            subValue={formatCurrency(summary?.totalAmount || 0)}
            icon={<IconCurrencyDollar size={20} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />}
            iconColor="var(--mantine-color-blue-6)"
            badgeText={`${currentYear}`}
            badgeColor="blue"
            progress={summary?.totalPayments ? Math.min((summary.paidPayments / summary.totalPayments) * 100, 100) : 0}
            progressColor="blue"
            isDark={isDark}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <LayeredDepthCard
            title={t('payments.monthlyTracker.paidPayments')}
            value={summary?.paidPayments || 0}
            subValue={formatCurrency(summary?.paidAmount || 0)}
            icon={<IconCheck size={20} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />}
            iconColor="var(--mantine-color-green-6)"
            badgeText={summary?.paidPayments ? `+${summary.paidPayments}` : undefined}
            badgeColor="green"
            badgeIcon={<IconTrendingUp size={12} />}
            isDark={isDark}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <LayeredDepthCard
            title={t('payments.monthlyTracker.pendingPayments')}
            value={summary?.pendingPayments || 0}
            subValue={formatCurrency(summary?.pendingAmount || 0)}
            icon={<IconClock size={20} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />}
            iconColor="var(--mantine-color-yellow-6)"
            badgeText={summary?.pendingPayments ? t('payments.status.pending') : undefined}
            badgeColor="yellow"
            isDark={isDark}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <LayeredDepthCard
            title={t('payments.monthlyTracker.overduePayments')}
            value={summary?.overduePayments || 0}
            subValue={t('payments.monthlyTracker.collectionRate')}
            icon={<IconShieldCheck size={20} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />}
            iconColor="var(--mantine-color-violet-6)"
            badgeText={summary?.collectionRate ? t('payments.status.paid') : undefined}
            badgeColor="violet"
            badgeIcon={<IconShieldCheck size={12} />}
            ringProgress={Math.round(summary?.collectionRate || 0)}
            ringColor="violet"
            isDark={isDark}
          />
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
        onFilter={handleFilter}
        emptyMessage={t('payments.monthlyTracker.noData')}
        tableId="payment-monthly-tracker"
        exportTitle={`${t('payments.monthlyTracker.tab')} - ${currentYear}`}
        exportNamespace="modules/real-estate"
        onExport={handleExport}
        showAuditHistory={true}
        auditEntityName="Payment"
        auditIdKey="tenantId"
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
