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
  Loader,
  Select,
  Progress,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { usePayments } from '@/hooks/usePayments';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';

interface PaymentMonthlyTrackerProps {
  locale: string;
}

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const [currentYear, setCurrentYear] = useState(dayjs().year());

  const { data, isLoading, error } = usePayments({
    page: 1,
    pageSize: 1000,
  });

  // Filter payments for current year
  const yearPayments = useMemo(() => {
    if (!data?.payments) return [];
    return data.payments.filter((payment) => {
      const dueDate = dayjs(payment.dueDate);
      return dueDate.year() === currentYear;
    });
  }, [data, currentYear]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = yearPayments.length;
    const paid = yearPayments.filter(p => p.status === 'paid').length;
    const pending = yearPayments.filter(p => p.status === 'pending').length;
    const overdue = yearPayments.filter(p => p.status === 'overdue' ||
      (p.status === 'pending' && dayjs(p.dueDate).isBefore(dayjs()))).length;

    const totalAmount = yearPayments.reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
    const paidAmount = yearPayments.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
    const pendingAmount = yearPayments.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);

    return {
      total,
      paid,
      pending,
      overdue,
      totalAmount,
      paidAmount,
      pendingAmount,
      collectionRate: total > 0 ? (paid / total) * 100 : 0,
    };
  }, [yearPayments]);

  // Generate monthly data for table
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = dayjs().year(currentYear).month(i);
      const monthPayments = yearPayments.filter(p => dayjs(p.dueDate).month() === i);

      const total = monthPayments.length;
      const paid = monthPayments.filter(p => p.status === 'paid').length;
      const pending = monthPayments.filter(p => p.status === 'pending').length;
      const overdue = monthPayments.filter(p =>
        p.status === 'overdue' || (p.status === 'pending' && dayjs(p.dueDate).isBefore(dayjs()))
      ).length;

      const totalAmount = monthPayments.reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
      const paidAmount = monthPayments.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
      const pendingAmount = monthPayments.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);

      const collectionRate = total > 0 ? (paid / total) * 100 : 0;

      months.push({
        id: `month-${i}`,
        month: i,
        monthName: monthDate.locale(locale).format('MMMM'),
        isCurrentMonth: monthDate.isSame(dayjs(), 'month'),
        total,
        paid,
        pending,
        overdue,
        totalAmount,
        paidAmount,
        pendingAmount,
        collectionRate,
      });
    }
    return months;
  }, [yearPayments, currentYear, locale]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  // Navigate years
  const navigatePrevious = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const navigateNext = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);

  // Table columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'monthName',
      label: t('payments.monthlyTracker.month') || 'Ay',
      sortable: true,
      render: (value: string, row: any) => (
        <Text fw={row.isCurrentMonth ? 700 : 400} c={row.isCurrentMonth ? 'blue' : undefined}>
          {value}
        </Text>
      ),
    },
    {
      key: 'total',
      label: t('payments.monthlyTracker.totalPayments'),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <Badge color="blue" variant="light" size="lg">
          {value}
        </Badge>
      ),
    },
    {
      key: 'paid',
      label: t('payments.monthlyTracker.paidPayments'),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <Badge color="green" variant="filled" size="lg">
          {value}
        </Badge>
      ),
    },
    {
      key: 'pending',
      label: t('payments.monthlyTracker.pendingPayments'),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <Badge color="yellow" variant="filled" size="lg">
          {value}
        </Badge>
      ),
    },
    {
      key: 'overdue',
      label: t('payments.monthlyTracker.overduePayments'),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <Badge color={value > 0 ? 'red' : 'gray'} variant="filled" size="lg">
          {value}
        </Badge>
      ),
    },
    {
      key: 'totalAmount',
      label: t('payments.monthlyTracker.expectedAmount') || 'Beklenen Tutar',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <Text fw={500}>{formatCurrency(value)}</Text>
      ),
    },
    {
      key: 'paidAmount',
      label: t('payments.monthlyTracker.collectedAmount') || 'Tahsil Edilen',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <Text fw={500} c="green">{formatCurrency(value)}</Text>
      ),
    },
    {
      key: 'collectionRate',
      label: t('payments.monthlyTracker.collectionRate'),
      sortable: true,
      align: 'center' as const,
      render: (value: number, row: any) => (
        <Group gap="xs">
          <Progress
            value={value}
            color={value >= 80 ? 'green' : value >= 50 ? 'yellow' : 'red'}
            size="lg"
            radius="xl"
            style={{ width: 60 }}
          />
          <Text size="sm" fw={500}>
            {value.toFixed(0)}%
          </Text>
        </Group>
      ),
    },
  ], [t, formatCurrency]);

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Year Navigation */}
      <Paper shadow="xs" p="md">
        <Group justify="center">
          <ActionIcon variant="subtle" onClick={navigatePrevious} size="lg">
            <IconChevronLeft size={24} />
          </ActionIcon>
          <Text size="xl" fw={700}>
            {currentYear}
          </Text>
          <ActionIcon variant="subtle" onClick={navigateNext} size="lg">
            <IconChevronRight size={24} />
          </ActionIcon>
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
                  {summary.total}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary.totalAmount)}
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
                  {summary.paid}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary.paidAmount)}
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
                  {summary.pending}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary.pendingAmount)}
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
                  {summary.overdue}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('payments.monthlyTracker.collectionRate')}: {summary.collectionRate.toFixed(0)}%
                </Text>
              </div>
              <IconAlertCircle size={32} color="var(--mantine-color-red-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Monthly Table */}
      <DataTable
        tableId="payment-monthly-tracker"
        columns={columns}
        data={monthlyData}
        searchable={false}
        sortable={true}
        pageable={false}
        emptyMessage={t('payments.monthlyTracker.noData') || 'Veri bulunamadı'}
        showColumnSettings={false}
      />

      {/* Legend */}
      <Paper shadow="xs" p="sm">
        <Group gap="md">
          <Group gap="xs">
            <Badge color="green" size="sm">{t('payments.status.paid')}</Badge>
          </Group>
          <Group gap="xs">
            <Badge color="yellow" size="sm">{t('payments.status.pending')}</Badge>
          </Group>
          <Group gap="xs">
            <Badge color="red" size="sm">{t('payments.status.overdue')}</Badge>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
