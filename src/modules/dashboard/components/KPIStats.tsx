'use client';

import { Card, Text, Group, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface KPIStat {
  title: string;
  value: string | number;
  change: string;
  trendUp: boolean;
}

interface KPIStatsProps {
  stats: KPIStat[];
}

export function KPIStats({ stats }: KPIStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          padding="lg"
          radius="xl"
          withBorder
          className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
        >
          <Stack gap="xs">
            <Text size="md" fw={500} className="text-gray-700 dark:text-gray-300">
              {stat.title}
            </Text>
            <Text
              size="3xl"
              fw={700}
              className="text-gray-900 dark:text-white tracking-tight"
            >
              {stat.value}
            </Text>
            <Group gap={4}>
              {stat.trendUp ? (
                <IconTrendingUp size={16} className="text-green-600 dark:text-green-500" />
              ) : (
                <IconTrendingDown size={16} className="text-red-600 dark:text-red-500" />
              )}
              <Text
                size="md"
                fw={500}
                className={stat.trendUp ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}
              >
                {stat.change}
              </Text>
            </Group>
          </Stack>
        </Card>
      ))}
    </div>
  );
}






