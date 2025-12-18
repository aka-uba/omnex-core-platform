'use client';

import { useState } from 'react';
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
  IconPackage,
  IconClipboardList,
  IconAlertCircle,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useProductionAnalytics } from '@/hooks/useProductionAnalytics';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartTooltip } from '@/components/charts';

interface ProductionDashboardProps {
  locale: string;
}

export function ProductionDashboard({ locale }: ProductionDashboardProps) {
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(12, 'months').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());

  const { data, isLoading, error } = useProductionAnalytics({
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

  const { summary, ordersByStatus, ordersByMonth, lowStockProducts } = data;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare chart data
  const chartData = ordersByMonth.map((item) => ({
    month: dayjs(item.month).format('MMM YYYY'),
    total: item.count,
    completed: item.completed,
  }));

  const statusData = ordersByStatus.map((item) => ({
    status: item.status,
    count: item.count,
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
            clearable
          />
  <DatePickerInput label={t('dashboard.dateTo')}
            value={dateTo}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : (value ? new Date(value as string) : null);
              setDateTo(date);
            }}
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
                  {t('dashboard.totalProducts')}
                </Text>
                <Text fw={700} size="xl">
                  {summary.totalProducts}
                </Text>
              </div>
              <IconPackage size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.totalOrders')}
                </Text>
                <Text fw={700} size="xl">
                  {summary.totalOrders}
                </Text>
              </div>
              <IconClipboardList size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.activeOrders')}
                </Text>
                <Text fw={700} size="xl">
                  {summary.activeOrders}
                </Text>
              </div>
              <IconTrendingUp size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.stockValue')}
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(summary.totalStockValue)}
                </Text>
              </div>
              <IconPackage size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.ordersByMonth')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" name={t('dashboard.total')} />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" name={t('dashboard.completed')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.ordersByStatus')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <Paper shadow="xs" p="md" c="orange">
          <Group>
            <IconAlertCircle size={24} />
            <div>
              <Text fw={600}>
                {t('dashboard.lowStockAlert')}
              </Text>
              <Text size="sm">
                {t('dashboard.lowStockCount') || `${lowStockProducts} products are below minimum stock level`}
              </Text>
            </div>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}


