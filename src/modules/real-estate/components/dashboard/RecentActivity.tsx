'use client';

import { Paper, Title, Text, Timeline } from '@mantine/core';
import {
  IconCurrencyDollar,
  IconFileText,
  IconCalendar,
  IconTools,
  IconUser,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import type { DashboardActivity } from '@/hooks/useRealEstateDashboard';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

interface RecentActivityProps {
  activities: DashboardActivity[];
  loading?: boolean;
}

const iconMap: Record<string, any> = {
  IconCurrencyDollar: IconCurrencyDollar,
  IconFileText: IconFileText,
  IconCalendar: IconCalendar,
  IconTools: IconTools,
  IconUser: IconUser,
};

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  const { t } = useTranslation('modules/real-estate');

  if (loading) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Title order={4} mb="md">
          {t('dashboard.recentActivity')}
        </Title>
        <div style={{ height: 400 }} />
      </Paper>
    );
  }

  if (activities.length === 0) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Title order={4} mb="md">
          {t('dashboard.recentActivity')}
        </Title>
        <Text c="dimmed" ta="center" py="xl">
          {t('dashboard.noActivity')}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        {t('dashboard.recentActivity')}
      </Title>
      <Timeline active={-1} bulletSize={24} lineWidth={2}>
        {activities.slice(0, 10).map((activity) => {
          const Icon = iconMap[activity.icon] || IconUser;
          const date = dayjs(activity.date);
          const isToday = date.isSame(dayjs(), 'day');
          const isYesterday = date.isSame(dayjs().subtract(1, 'day'), 'day');

          let timeLabel = '';
          if (isToday) {
            timeLabel = t('dashboard.today') + ' ' + date.format('HH:mm');
          } else if (isYesterday) {
            timeLabel = t('dashboard.yesterday') + ' ' + date.format('HH:mm');
          } else {
            timeLabel = date.format('DD.MM.YYYY HH:mm');
          }

          return (
            <Timeline.Item
              key={activity.id}
              bullet={<Icon size={12} />}
              title={
                <Text size="sm" fw={500}>
                  {activity.title}
                </Text>
              }
              color={activity.color}
            >
              <Text size="xs" c="dimmed" mt={4}>
                {activity.description}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {timeLabel}
              </Text>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Paper>
  );
}






