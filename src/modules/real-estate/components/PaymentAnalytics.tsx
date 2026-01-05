'use client';

import { useState } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  Title,
  Progress,
} from '@mantine/core';
import { DataTable } from '@/components/tables/DataTable';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconCheck,
} from '@tabler/icons-react';
import { usePaymentAnalytics } from '@/hooks/usePayments';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Loader } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartTooltip } from '@/components/charts';

interface PaymentAnalyticsProps {
  locale: string;
}

export function PaymentAnalytics({ locale }: PaymentAnalyticsProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(12, 'months').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());

  const { data, isLoading, error } = usePaymentAnalytics({
    ...(dateFrom ? { dateFrom: dateFrom.toISOString() } : {}),
    ...(dateTo ? { dateTo: dateTo.toISOString() } : {}),
  });

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  const { summary, byStatus, byType, monthlyTrend, upcomingPayments, overduePayments } = data;

  // Prepare chart data
  const chartData = monthlyTrend.map((item) => ({
    month: dayjs(item.month).format('MMM YYYY'),
    total: item.total,
    paid: item.paid,
    pending: item.pending,
    overdue: item.overdue,
  }));

  return (
    <Stack gap="md">
      {/* Date Range Filter */}
      <Paper shadow="xs" p="md">
        <Group>
          <DatePickerInput label={t('analytics.dateFrom')}
            value={dateFrom}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateFrom(date);
            }}
            locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
            clearable
          />
  <DatePickerInput label={t('analytics.dateTo')}
            value={dateTo}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateTo(date);
            }}
            locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
            clearable
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
                  {t('analytics.totalPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {summary.totalPayments}
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
                  {t('analytics.totalAmount')}
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {formatCurrency(summary.totalAmount)}
                </Text>
              </div>
              <IconTrendingUp size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('analytics.paidAmount')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="green">
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
                  {t('analytics.collectionRate')}
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {summary.collectionRate.toFixed(1)}%
                </Text>
                <Progress
                  value={summary.collectionRate}
                  color={summary.collectionRate >= 80 ? 'green' : summary.collectionRate >= 60 ? 'yellow' : 'red'}
                  mt="xs"
                />
              </div>
              <IconTrendingUp size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Status Breakdown */}
      <Paper shadow="xs" p="md">
        <Title order={4} mb="md">
          {t('analytics.statusBreakdown')}
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('payments.status.paid')}
                </Text>
                <Badge color="green" size="lg">
                  {byStatus.paid.count}
                </Badge>
              </Group>
              <Text size="xl" fw={700} c="green">
                {formatCurrency(byStatus.paid.amount)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('payments.status.pending')}
                </Text>
                <Badge color="yellow" size="lg">
                  {byStatus.pending.count}
                </Badge>
              </Group>
              <Text size="xl" fw={700} c="yellow">
                {formatCurrency(byStatus.pending.amount)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('payments.status.overdue')}
                </Text>
                <Badge color="red" size="lg">
                  {byStatus.overdue.count}
                </Badge>
              </Group>
              <Text size="xl" fw={700} c="red">
                {formatCurrency(byStatus.overdue.amount)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('payments.status.cancelled')}
                </Text>
                <Badge color="gray" size="lg">
                  {byStatus.cancelled.count}
                </Badge>
              </Group>
              <Text size="xl" fw={700} c="gray">
                {formatCurrency(byStatus.cancelled.amount)}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Monthly Trend Chart */}
      <Paper shadow="xs" p="md">
        <Title order={4} mb="md">
          {t('analytics.monthlyTrend')}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" name={t('analytics.total')} />
            <Line type="monotone" dataKey="paid" stroke="#82ca9d" name={t('analytics.paid')} />
            <Line type="monotone" dataKey="pending" stroke="#ffc658" name={t('analytics.pending')} />
            <Line type="monotone" dataKey="overdue" stroke="#ff7300" name={t('analytics.overdue')} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Type Breakdown */}
      <Paper shadow="xs" p="md">
        <Title order={4} mb="md">
          {t('analytics.typeBreakdown')}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { name: t('payments.types.rent'), amount: byType.rent.amount, count: byType.rent.count },
            { name: t('payments.types.deposit'), amount: byType.deposit.amount, count: byType.deposit.count },
            { name: t('payments.types.fee'), amount: byType.fee.amount, count: byType.fee.count },
            { name: t('payments.types.maintenance'), amount: byType.maintenance.amount, count: byType.maintenance.count },
            { name: t('payments.types.utility'), amount: byType.utility.amount, count: byType.utility.count },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" name={t('analytics.amount')} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Upcoming Payments */}
      <Stack gap="md">
        <Title order={4}>
          {t('analytics.upcomingPayments')}
        </Title>
        {upcomingPayments.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'apartmentUnitNumber',
                label: t('table.apartment'),
                sortable: true,
                searchable: true,
              },
              {
                key: 'amount',
                label: t('table.amount'),
                sortable: true,
                searchable: false,
                align: 'right',
                render: (value) => formatCurrency(value),
              },
              {
                key: 'dueDate',
                label: t('table.dueDate'),
                sortable: true,
                searchable: false,
                render: (value) => dayjs(value).format('DD.MM.YYYY'),
              },
              {
                key: 'daysUntilDue',
                label: t('analytics.daysUntilDue'),
                sortable: true,
                searchable: false,
                align: 'right',
                render: (value) => (
                  <Badge color={value <= 7 ? 'red' : value <= 14 ? 'yellow' : 'blue'}>
                    {value} {t('analytics.days')}
                  </Badge>
                ),
              },
            ]}
            data={upcomingPayments}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={25}
            emptyMessage={t('analytics.noUpcomingPayments')}
            showColumnSettings={true}
          />
        ) : (
          <Text c="dimmed">{t('analytics.noUpcomingPayments')}</Text>
        )}
      </Stack>

      {/* Overdue Payments */}
      <Stack gap="md">
        <Title order={4} c="red">
          {t('analytics.overduePayments')}
        </Title>
        {overduePayments.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'apartmentUnitNumber',
                label: t('table.apartment'),
                sortable: true,
                searchable: true,
              },
              {
                key: 'amount',
                label: t('table.amount'),
                sortable: true,
                searchable: false,
                align: 'right',
                render: (value) => formatCurrency(value),
              },
              {
                key: 'dueDate',
                label: t('table.dueDate'),
                sortable: true,
                searchable: false,
                render: (value) => dayjs(value).format('DD.MM.YYYY'),
              },
              {
                key: 'daysOverdue',
                label: t('analytics.daysOverdue'),
                sortable: true,
                searchable: false,
                align: 'right',
                render: (value) => (
                  <Badge color="red">
                    {value} {t('analytics.days')}
                  </Badge>
                ),
              },
            ]}
            data={overduePayments}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={25}
            emptyMessage={t('analytics.noOverduePayments')}
            showColumnSettings={true}
          />
        ) : (
          <Text c="dimmed">{t('analytics.noOverduePayments')}</Text>
        )}
      </Stack>
    </Stack>
  );
}

