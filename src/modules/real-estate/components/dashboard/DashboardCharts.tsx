'use client';

import { Grid, Paper, Title } from '@mantine/core';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useTranslation } from '@/lib/i18n/client';
import type { DashboardStatistics, DashboardRevenue } from '@/hooks/useRealEstateDashboard';
import dayjs from 'dayjs';

interface DashboardChartsProps {
  statistics: DashboardStatistics;
  revenue: DashboardRevenue;
  loading?: boolean;
}

const COLORS = ['#228be6', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7', '#fd7e14', '#20c997'];

export function DashboardCharts({ statistics, revenue, loading }: DashboardChartsProps) {
  const { t } = useTranslation('modules/real-estate');

  if (loading) {
    return (
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <div style={{ height: 300 }} />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <div style={{ height: 300 }} />
          </Paper>
        </Grid.Col>
      </Grid>
    );
  }

  // Revenue Trend Chart Data
  const revenueChartData = revenue.monthlyTrend.map((item) => ({
    month: dayjs(item.month).format('MMM YYYY'),
    revenue: item.revenue,
    net: item.net,
  }));

  // Payment Status Pie Chart Data
  const paymentStatusData = [
    {
      name: t('payments.status.paid'),
      value: statistics.payments.paid,
      amount: statistics.payments.paidAmount,
    },
    {
      name: t('payments.status.pending'),
      value: statistics.payments.pending,
      amount: statistics.payments.pendingAmount,
    },
    {
      name: t('payments.status.overdue'),
      value: statistics.payments.overdue,
      amount: statistics.payments.overdueAmount,
    },
  ].filter((item) => item.value > 0);

  // Contract Status Bar Chart Data
  const contractStatusData = Object.entries(statistics.contracts.byStatus).map(([status, count]) => ({
    name: t(`contracts.status.${status}`) || status,
    value: count,
  }));

  // Payment Type Distribution
  const paymentTypeData = Object.entries(statistics.payments.byType)
    .map(([type, data]) => ({
      name: t(`payments.types.${type}`) || type,
      value: data.count,
      amount: data.amount,
    }))
    .filter((item) => item.value > 0)
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Grid>
      {/* Revenue Trend Chart */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            {t('dashboard.revenueTrend')}
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#51cf66"
                name={t('dashboard.revenue')}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#228be6"
                name={t('dashboard.net')}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid.Col>

      {/* Payment Status Pie Chart */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            {t('dashboard.paymentStatus')}
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(value) => Number(value).toLocaleString('tr-TR')} />} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid.Col>

      {/* Contract Status Bar Chart */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            {t('dashboard.contractStatus')}
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contractStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="value" fill="#228be6" name={t('dashboard.count')} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid.Col>

      {/* Payment Type Distribution */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            {t('dashboard.paymentTypes')}
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip content={<ChartTooltip formatter={(value) => Number(value).toLocaleString('tr-TR')} />} />
              <Legend />
              <Bar dataKey="value" fill="#51cf66" name={t('dashboard.count')} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}






