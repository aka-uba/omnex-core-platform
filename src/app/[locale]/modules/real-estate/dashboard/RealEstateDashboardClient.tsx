'use client';

import { Container, Stack, Alert, Text } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { IconBuilding } from '@tabler/icons-react';
import { useRealEstateDashboard } from '@/hooks/useRealEstateDashboard';
import { StatisticsCards } from '@/modules/real-estate/components/dashboard/StatisticsCards';
import { DashboardCharts } from '@/modules/real-estate/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/modules/real-estate/components/dashboard/RecentActivity';
import { UpcomingEvents } from '@/modules/real-estate/components/dashboard/UpcomingEvents';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';

export function RealEstateDashboardClient() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const { data, isLoading, error } = useRealEstateDashboard();

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        namespace="modules/real-estate"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'menu.items.dashboard', namespace: 'modules/real-estate' },
        ]}
      />

      <Stack gap="xl" mt="xl">
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <Alert color="red" title={tGlobal('common.error')}>
            {error instanceof Error ? error.message : tGlobal('common.errorLoading')}
          </Alert>
        ) : !data ? (
          <Text c="dimmed">{tGlobal('common.noData')}</Text>
        ) : (
          <>
            {/* Statistics Cards */}
            <StatisticsCards statistics={data.statistics} loading={isLoading} />

            {/* Charts */}
            <DashboardCharts
              statistics={data.statistics}
              revenue={data.revenue}
              loading={isLoading}
            />

            {/* Upcoming Events */}
            <UpcomingEvents
              upcomingPayments={data.upcomingPayments}
              expiringContracts={data.expiringContracts}
              loading={isLoading}
            />

            {/* Recent Activity */}
            <RecentActivity activities={data.recentActivity} loading={isLoading} />
          </>
        )}
      </Stack>
    </Container>
  );
}






