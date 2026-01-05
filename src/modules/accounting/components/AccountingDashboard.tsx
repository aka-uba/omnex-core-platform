'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Stack,
  Card,
  Title,
  Loader,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCreditCard,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useAccountingAnalytics } from '@/hooks/useAccountingAnalytics';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartTooltip } from '@/components/charts';

interface AccountingDashboardProps {
  locale: string;
}

export function AccountingDashboard({ locale }: AccountingDashboardProps) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(12, 'months').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const { data, isLoading, error } = useAccountingAnalytics({
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

  const { summary, revenueByMonth, expensesByCategory } = data;


  // Prepare chart data
  const chartData = revenueByMonth.map((item) => ({
    month: dayjs(item.month).format('MMM YYYY'),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.revenue - item.expenses,
  }));

  return (
    <Stack gap="md">
      {/* Date Range Filter */}
      <Paper shadow="xs" p="md">
        <Group>
          <DatePickerInput label={t('dashboard.dateFrom')}
            value={dateFrom}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateFrom(date);
            }}
            locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
            clearable
          />
  <DatePickerInput label={t('dashboard.dateTo')}
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
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.totalRevenue')}
                </Text>
                <Text fw={700} size="xl" c="green">
                  {formatCurrency(summary.totalRevenue)}
                </Text>
              </div>
              <IconTrendingUp size={40} stroke={1.5} color="green" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.totalExpenses')}
                </Text>
                <Text fw={700} size="xl" c="red">
                  {formatCurrency(summary.totalExpenses)}
                </Text>
              </div>
              <IconTrendingDown size={40} stroke={1.5} color="red" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.netProfit')}
                </Text>
                <Text fw={700} size="xl" c={summary.netProfit >= 0 ? 'green' : 'red'}>
                  {formatCurrency(summary.netProfit)}
                </Text>
              </div>
              <IconCurrencyDollar size={40} stroke={1.5} color={summary.netProfit >= 0 ? 'green' : 'red'} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.activeSubscriptions')}
                </Text>
                <Text fw={700} size="xl">
                  {summary.activeSubscriptions}
                </Text>
              </div>
              <IconCreditCard size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.revenueByMonth')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name={t('dashboard.revenue')} />
                <Line type="monotone" dataKey="expenses" stroke="#ff7300" name={t('dashboard.expenses')} />
                <Line type="monotone" dataKey="profit" stroke="#8884d8" name={t('dashboard.profit')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.expensesByCategory')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                <Bar dataKey="amount" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}








