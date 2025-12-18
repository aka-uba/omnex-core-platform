'use client';

import { Card, Text, Stack } from '@mantine/core';
import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Report } from '../types/report';
import dayjs from 'dayjs';
import { useTranslation } from '@/lib/i18n/client';
import { ChartTooltip } from '@/components/charts';

interface ReportChartsProps {
  reports: Report[];
  loading?: boolean;
}

const COLORS = ['#228be6', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7', '#fd7e14'];

export function ReportCharts({ reports, loading }: ReportChartsProps) {
  const { t } = useTranslation('modules/raporlar');
  
  const chartData = useMemo(() => {
    // Status distribution for pie chart
    const statusData = [
      { name: t('charts.statusCompleted'), value: reports.filter(r => r.status === 'completed').length },
      { name: t('charts.statusPending'), value: reports.filter(r => r.status === 'pending').length },
      { name: t('charts.statusGenerating'), value: reports.filter(r => r.status === 'generating').length },
      { name: t('charts.statusFailed'), value: reports.filter(r => r.status === 'failed').length },
    ].filter(item => item.value > 0);

    // Reports by type (bar chart)
    const typeCounts: Record<string, number> = {};
    reports.forEach(report => {
      const type = report.typeName || report.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Reports over time (line chart) - last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = dayjs().subtract(29 - i, 'days');
      return {
        date: date.format('DD.MM'),
        count: reports.filter(r => {
          const reportDate = dayjs(r.createdAt);
          return reportDate.isSame(date, 'day');
        }).length,
      };
    });

    return {
      statusData,
      typeData: typeData.slice(0, 10), // Top 10 types
      timeSeriesData: last30Days,
    };
  }, [reports, t]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <Card key={i} padding="lg" radius="xl" withBorder>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Status Distribution Pie Chart */}
      <Card
        padding="lg"
        radius="xl"
        withBorder
        className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
      >
        <Stack gap="md">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            {t('charts.statusDistribution')}
          </Text>
          {chartData.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Text c="dimmed">{t('charts.noData')}</Text>
            </div>
          )}
        </Stack>
      </Card>

      {/* Reports by Type Bar Chart */}
      <Card
        padding="lg"
        radius="xl"
        withBorder
        className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
      >
        <Stack gap="md">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            {t('charts.typeDistribution')}
          </Text>
          {chartData.typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="value" fill="#228be6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Text c="dimmed">{t('charts.noData')}</Text>
            </div>
          )}
        </Stack>
      </Card>

      {/* Reports Over Time Line Chart */}
      <Card
        padding="lg"
        radius="xl"
        withBorder
        className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10 lg:col-span-2"
      >
        <Stack gap="md">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            {t('charts.trend30Days')}
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#228be6" 
                strokeWidth={2}
                name={t('charts.reportCount')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Stack>
      </Card>
    </div>
  );
}

