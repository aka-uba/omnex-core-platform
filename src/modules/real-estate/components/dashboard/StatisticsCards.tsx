'use client';

import { Grid, Card, Group, Stack, Text, Progress } from '@mantine/core';
import {
  IconBuilding,
  IconHome,
  IconUsers,
  IconFileText,
  IconCurrencyDollar,
  IconCalendar,
  IconTools,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import type { DashboardStatistics } from '@/hooks/useRealEstateDashboard';

interface StatisticsCardsProps {
  statistics: DashboardStatistics;
  loading?: boolean;
}

export function StatisticsCards({ statistics, loading }: StatisticsCardsProps) {
  const { t } = useTranslation('modules/real-estate');

  if (loading) {
    return (
      <Grid>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <div style={{ height: 100 }} />
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  }

  const cards = [
    {
      title: t('properties.title'),
      value: statistics.properties.total,
      subtitle: `${statistics.properties.active} ${t('dashboard.active')}`,
      icon: IconBuilding,
      color: 'blue',
      trend: null,
    },
    {
      title: t('apartments.title'),
      value: statistics.apartments.total,
      subtitle: `${statistics.apartments.occupied} ${t('dashboard.occupied')} (${statistics.apartments.occupancyRate}%)`,
      icon: IconHome,
      color: 'green',
      trend: statistics.apartments.occupancyRate,
    },
    {
      title: t('tenants.title'),
      value: statistics.tenants.total,
      subtitle: `${statistics.tenants.active} ${t('dashboard.active')}`,
      icon: IconUsers,
      color: 'orange',
      trend: null,
    },
    {
      title: t('contracts.title'),
      value: statistics.contracts.total,
      subtitle: `${statistics.contracts.active} ${t('dashboard.active')}`,
      icon: IconFileText,
      color: 'violet',
      trend: null,
    },
    {
      title: t('payments.title'),
      value: statistics.payments.total,
      subtitle: `${statistics.payments.paid} ${t('payments.status.paid')}`,
      icon: IconCurrencyDollar,
      color: 'teal',
      trend: statistics.payments.total > 0 
        ? Math.round((statistics.payments.paid / statistics.payments.total) * 100)
        : 0,
    },
    {
      title: t('appointments.title'),
      value: statistics.appointments.total,
      subtitle: `${statistics.appointments.upcoming} ${t('dashboard.upcoming')}`,
      icon: IconCalendar,
      color: 'cyan',
      trend: null,
    },
    {
      title: t('maintenance.title'),
      value: statistics.maintenance.total,
      subtitle: `${statistics.maintenance.open} ${t('dashboard.open')}`,
      icon: IconTools,
      color: 'red',
      trend: null,
    },
  ];

  return (
    <Grid>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" c="dimmed" fw={500}>
                      {card.title}
                    </Text>
                    <Text size="xl" fw={700} mt={4}>
                      {card.value.toLocaleString('tr-TR')}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {card.subtitle}
                    </Text>
                  </div>
                  <Icon size={32} color={`var(--mantine-color-${card.color}-6)`} />
                </Group>
                {card.trend !== null && (
                  <div>
                    <Progress
                      value={card.trend}
                      color={card.color}
                      size="sm"
                      radius="xl"
                      mt="xs"
                    />
                    <Text size="xs" c="dimmed" mt={4} ta="right">
                      {card.trend}%
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        );
      })}
    </Grid>
  );
}






