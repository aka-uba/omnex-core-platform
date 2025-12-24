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
  Title,
  ActionIcon,
  Tooltip,
  Loader,
  Select,
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
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';

interface PaymentMonthlyTrackerProps {
  locale: string;
}

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: currentDate.startOf('month'),
        end: currentDate.endOf('month'),
      };
    } else {
      return {
        start: currentDate.startOf('year'),
        end: currentDate.endOf('year'),
      };
    }
  }, [currentDate, viewMode]);

  const { data, isLoading, error } = usePayments({
    page: 1,
    pageSize: 1000, // Get all payments for the period
  });

  // Filter payments for current period
  const periodPayments = useMemo(() => {
    if (!data?.payments) return [];
    return data.payments.filter((payment) => {
      const dueDate = dayjs(payment.dueDate);
      return dueDate.isAfter(dateRange.start.subtract(1, 'day')) &&
             dueDate.isBefore(dateRange.end.add(1, 'day'));
    });
  }, [data, dateRange]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = periodPayments.length;
    const paid = periodPayments.filter(p => p.status === 'paid').length;
    const pending = periodPayments.filter(p => p.status === 'pending').length;
    const overdue = periodPayments.filter(p => p.status === 'overdue' ||
      (p.status === 'pending' && dayjs(p.dueDate).isBefore(dayjs()))).length;

    const totalAmount = periodPayments.reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
    const paidAmount = periodPayments.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0);
    const pendingAmount = periodPayments.filter(p => p.status === 'pending')
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
  }, [periodPayments]);

  // Group payments by day (for month view) or month (for year view)
  const groupedPayments = useMemo(() => {
    const groups: Record<string, typeof periodPayments> = {};

    periodPayments.forEach((payment) => {
      const key = viewMode === 'month'
        ? dayjs(payment.dueDate).format('YYYY-MM-DD')
        : dayjs(payment.dueDate).format('YYYY-MM');

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(payment);
    });

    return groups;
  }, [periodPayments, viewMode]);

  // Navigate to previous/next period
  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => viewMode === 'month' ? prev.subtract(1, 'month') : prev.subtract(1, 'year'));
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate(prev => viewMode === 'month' ? prev.add(1, 'month') : prev.add(1, 'year'));
  }, [viewMode]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  // Get status color
  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return 'green';
    if (status === 'overdue' || (status === 'pending' && dayjs(dueDate).isBefore(dayjs()))) return 'red';
    if (status === 'pending') return 'yellow';
    return 'gray';
  };

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    if (viewMode !== 'month') return [];

    const days = [];
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.day(); // 0 = Sunday

    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, date: null });
    }

    // Add days of the month
    let day = startOfMonth;
    while (day.isBefore(endOfMonth) || day.isSame(endOfMonth, 'day')) {
      const dateKey = day.format('YYYY-MM-DD');
      const paymentsForDay = groupedPayments[dateKey] || [];
      days.push({
        day: day.date(),
        date: dateKey,
        payments: paymentsForDay,
        isToday: day.isSame(dayjs(), 'day'),
      });
      day = day.add(1, 'day');
    }

    return days;
  }, [currentDate, viewMode, groupedPayments]);

  // Generate months for year view
  const calendarMonths = useMemo(() => {
    if (viewMode !== 'year') return [];

    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = currentDate.startOf('year').add(i, 'month');
      const monthKey = monthDate.format('YYYY-MM');
      const paymentsForMonth = groupedPayments[monthKey] || [];

      months.push({
        month: i,
        monthName: monthDate.locale(locale).format('MMMM'),
        date: monthKey,
        payments: paymentsForMonth,
        isCurrentMonth: monthDate.isSame(dayjs(), 'month'),
      });
    }

    return months;
  }, [currentDate, viewMode, groupedPayments, locale]);

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
      {/* Navigation and View Mode */}
      <Paper shadow="xs" p="md">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={navigatePrevious}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Title order={4}>
              {viewMode === 'month'
                ? currentDate.locale(locale).format('MMMM YYYY')
                : currentDate.format('YYYY')}
            </Title>
            <ActionIcon variant="subtle" onClick={navigateNext}>
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
          <Select
            value={viewMode}
            onChange={(value) => setViewMode(value as 'month' | 'year')}
            data={[
              { value: 'month', label: t('payments.monthlyTracker.monthView') },
              { value: 'year', label: t('payments.monthlyTracker.yearView') },
            ]}
            w={150}
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

      {/* Calendar View */}
      <Paper shadow="xs" p="md">
        {viewMode === 'month' ? (
          <>
            {/* Weekday Headers */}
            <Grid gutter="xs" mb="xs">
              {[
                t('payments.monthlyTracker.weekdays.sun'),
                t('payments.monthlyTracker.weekdays.mon'),
                t('payments.monthlyTracker.weekdays.tue'),
                t('payments.monthlyTracker.weekdays.wed'),
                t('payments.monthlyTracker.weekdays.thu'),
                t('payments.monthlyTracker.weekdays.fri'),
                t('payments.monthlyTracker.weekdays.sat'),
              ].map((day) => (
                <Grid.Col span={12 / 7} key={day}>
                  <Text ta="center" fw={600} size="sm" c="dimmed">
                    {day}
                  </Text>
                </Grid.Col>
              ))}
            </Grid>

            {/* Calendar Days */}
            <Grid gutter="xs">
              {calendarDays.map((dayInfo, index) => (
                <Grid.Col span={12 / 7} key={index}>
                  {dayInfo.day !== null ? (
                    <Card
                      padding="xs"
                      radius="sm"
                      withBorder
                      style={{
                        minHeight: 80,
                        backgroundColor: dayInfo.isToday ? 'var(--mantine-color-blue-light)' : undefined,
                      }}
                    >
                      <Text size="sm" fw={dayInfo.isToday ? 700 : 400}>
                        {dayInfo.day}
                      </Text>
                      <Stack gap={2} mt={4}>
                        {dayInfo.payments?.slice(0, 3).map((payment) => (
                          <Tooltip
                            key={payment.id}
                            label={`${payment.apartment?.unitNumber || '-'}: ${formatCurrency(Number(payment.totalAmount || payment.amount))}`}
                          >
                            <Badge
                              size="xs"
                              color={getStatusColor(payment.status, payment.dueDate)}
                              variant="filled"
                              style={{ cursor: 'pointer' }}
                            >
                              {payment.apartment?.unitNumber || '-'}
                            </Badge>
                          </Tooltip>
                        ))}
                        {dayInfo.payments && dayInfo.payments.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{dayInfo.payments.length - 3} {t('payments.monthlyTracker.more')}
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  ) : (
                    <div style={{ minHeight: 80 }} />
                  )}
                </Grid.Col>
              ))}
            </Grid>
          </>
        ) : (
          /* Year View - Monthly Cards */
          <Grid>
            {calendarMonths.map((monthInfo) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={monthInfo.month}>
                <Card
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    backgroundColor: monthInfo.isCurrentMonth ? 'var(--mantine-color-blue-light)' : undefined,
                  }}
                >
                  <Text fw={600} mb="xs">
                    {monthInfo.monthName}
                  </Text>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">
                      {monthInfo.payments.length} {t('payments.monthlyTracker.total')}
                    </Badge>
                    <Badge color="green" size="sm">
                      {monthInfo.payments.filter(p => p.status === 'paid').length} {t('payments.monthlyTracker.paid')}
                    </Badge>
                  </Group>
                  {monthInfo.payments.length > 0 && (
                    <Text size="sm" mt="xs" c="dimmed">
                      {formatCurrency(monthInfo.payments.reduce((sum, p) => sum + Number(p.totalAmount || p.amount), 0))}
                    </Text>
                  )}
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Paper>

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
