'use client';

import { Card, Text, Group, Stack } from '@mantine/core';
import { IconChartBar, IconClock, IconCheck, IconX, IconTrendingUp } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import type { Report } from '../types/report';

interface ReportMetricsProps {
  reports: Report[];
  loading?: boolean;
}

export function ReportMetrics({ reports, loading }: ReportMetricsProps) {
  const { t } = useTranslation('modules/raporlar');
  const metrics = useMemo(() => {
    const total = reports.length;
    const completed = reports.filter(r => r.status === 'completed').length;
    const pending = reports.filter(r => r.status === 'pending' || r.status === 'generating').length;
    const failed = reports.filter(r => r.status === 'failed').length;
    
    // Calculate completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate average generation time (mock for now)
    const avgGenerationTime = '2.5 dk';
    
    return {
      total,
      completed,
      pending,
      failed,
      completionRate,
      avgGenerationTime,
    };
  }, [reports]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="lg" radius="xl" withBorder>
            <Stack gap="xs">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </Stack>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: t('metrics.total'),
      value: metrics.total,
      icon: IconChartBar,
      color: 'blue',
      change: null,
    },
    {
      title: t('metrics.completed'),
      value: metrics.completed,
      icon: IconCheck,
      color: 'green',
      change: `${metrics.completionRate}%`,
    },
    {
      title: t('metrics.pending'),
      value: metrics.pending,
      icon: IconClock,
      color: 'yellow',
      change: null,
    },
    {
      title: t('metrics.failed'),
      value: metrics.failed,
      icon: IconX,
      color: 'red',
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card
            key={index}
            padding="lg"
            radius="xl"
            withBorder
            className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
          >
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <Text size="md" fw={500} className="text-gray-700 dark:text-gray-300">
                  {metric.title}
                </Text>
                <Icon 
                  size={24} 
                  className={`text-${metric.color}-600 dark:text-${metric.color}-500`}
                  style={{ 
                    color: metric.color === 'blue' ? '#228be6' : 
                           metric.color === 'green' ? '#51cf66' : 
                           metric.color === 'yellow' ? '#ffd43b' : '#ff6b6b'
                  }}
                />
              </Group>
              <Text
                size="3xl"
                fw={700}
                className="text-gray-900 dark:text-white tracking-tight"
              >
                {metric.value}
              </Text>
              {metric.change && (
                <Group gap={4}>
                  <IconTrendingUp size={16} className="text-green-600 dark:text-green-500" />
                  <Text
                    size="sm"
                    fw={500}
                    className="text-green-600 dark:text-green-500"
                  >
                    {metric.change}
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>
        );
      })}
    </div>
  );
}









