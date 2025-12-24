'use client';

import { Container, Alert, Text, Paper, Badge, Group, RingProgress, Stack, Button, useMantineColorScheme } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import {
  IconBuilding,
  IconHome,
  IconUsers,
  IconFileText,
  IconCurrencyEuro,
  IconCalendar,
  IconTools,
  IconMap,
  IconArrowRight,
} from '@tabler/icons-react';
import { useRealEstateDashboard } from '@/hooks/useRealEstateDashboard';
import { DashboardCharts } from '@/modules/real-estate/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/modules/real-estate/components/dashboard/RecentActivity';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { PropertyMap } from '@/modules/real-estate/components/PropertyMap';
import { PaymentQuickBoard } from '@/modules/real-estate/components/PaymentQuickBoard';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useCompany } from '@/context/CompanyContext';
import { useMemo } from 'react';

export function RealEstateDashboardClient() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { formatCurrency: formatCurrencyFromContext } = useCompany();

  const { data, isLoading, error } = useRealEstateDashboard();
  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });

  const mapStats = useMemo(() => {
    if (!propertiesData || !apartmentsData) {
      return { totalProperties: 0, totalApartments: 0, rented: 0, empty: 0 };
    }
    const totalProperties = propertiesData.properties.length;
    const totalApartments = apartmentsData.apartments.length;
    const rented = apartmentsData.apartments.filter(a => a.status === 'rented').length;
    const empty = apartmentsData.apartments.filter(a => a.status === 'empty').length;
    return { totalProperties, totalApartments, rented, empty };
  }, [propertiesData, apartmentsData]);

  const formatCurrency = (value: number) => {
    return formatCurrencyFromContext(value);
  };

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

      <div className="mt-6 space-y-6">
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
              {/* All Stats - 4'lü grid, 2 satır */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Properties Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        {t('properties.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.properties.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {data.statistics.properties.active} {t('dashboard.active')}
                      </p>
                    </div>
                    <IconBuilding className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconBuilding className="w-16 h-16" />
                  </div>
                </div>

                {/* Apartments Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {t('apartments.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.apartments.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {data.statistics.apartments.occupancyRate}% {t('dashboard.occupied')}
                      </p>
                    </div>
                    <IconHome className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconHome className="w-16 h-16" />
                  </div>
                </div>

                {/* Tenants Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/30' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                        {t('tenants.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.tenants.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        {data.statistics.tenants.active} {t('dashboard.active')}
                      </p>
                    </div>
                    <IconUsers className={`w-6 h-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconUsers className="w-16 h-16" />
                  </div>
                </div>

                {/* Contracts Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-700/30' : 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
                        {t('contracts.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.contracts.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {data.statistics.contracts.active} {t('dashboard.active')}
                      </p>
                    </div>
                    <IconFileText className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconFileText className="w-16 h-16" />
                  </div>
                </div>

                {/* Payments Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-teal-900/40 to-teal-800/20 border border-teal-700/30' : 'bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>
                        {t('payments.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.payments.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                        {data.statistics.payments.paid} {t('payments.status.paid')}
                      </p>
                    </div>
                    <IconCurrencyEuro className={`w-6 h-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconCurrencyEuro className="w-16 h-16" />
                  </div>
                </div>

                {/* Appointments Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                        {t('appointments.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.appointments.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                        {data.statistics.appointments.upcoming} {t('dashboard.upcoming')}
                      </p>
                    </div>
                    <IconCalendar className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconCalendar className="w-16 h-16" />
                  </div>
                </div>

                {/* Maintenance Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/30' : 'bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        {t('maintenance.title')}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.maintenance.total}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        {data.statistics.maintenance.open} {t('dashboard.open')}
                      </p>
                    </div>
                    <IconTools className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconTools className="w-16 h-16" />
                  </div>
                </div>

                {/* Revenue Card */}
                <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-violet-900/40 to-violet-800/20 border border-violet-700/30' : 'bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                        {t('dashboard.monthlyRevenue')}
                      </p>
                      <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(data.revenue.thisMonth ?? 0)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {(() => {
                          const changePercentage = data.revenue.lastMonth > 0
                            ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100
                            : 0;
                          return changePercentage >= 0 ? (
                            <span className="text-xs text-emerald-500">+{changePercentage.toFixed(1)}%</span>
                          ) : (
                            <span className="text-xs text-red-500">{changePercentage.toFixed(1)}%</span>
                          );
                        })()}
                      </div>
                    </div>
                    <IconCurrencyEuro className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-10">
                    <IconCurrencyEuro className="w-16 h-16" />
                  </div>
                </div>
              </div>

              {/* Payment Quick Board - Upcoming & Overdue Payments */}
              <PaymentQuickBoard locale={locale} />

              {/* Map Section - Full Width with Stats Overlay */}
              <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconMap className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <Text fw={600}>{t('map.title')}</Text>
                      <Text size="xs" c="dimmed">{t('map.description')}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Mini Stats in Map Header */}
                    <div className="hidden md:flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <Text size="xs">{mapStats.totalProperties} {t('map.totalProperties')}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <Text size="xs">{mapStats.rented} {t('map.rented')}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <Text size="xs">{mapStats.empty} {t('map.empty')}</Text>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[400px]">
                  <PropertyMap locale={locale} />
                </div>
              </div>

              {/* Main Content Grid - Charts + Events */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                  <DashboardCharts
                    statistics={data.statistics}
                    revenue={data.revenue}
                    loading={isLoading}
                  />
                </div>

                {/* Right Sidebar - Events + Activity */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Text fw={600} mb="md">{t('dashboard.quickActions')}</Text>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="light"
                        leftSection={<IconHome className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/apartments/create`)}
                      >
                        {t('apartments.create.title')}
                      </Button>
                      <Button
                        variant="light"
                        color="green"
                        leftSection={<IconFileText className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/contracts/create`)}
                      >
                        {t('contracts.create.title')}
                      </Button>
                      <Button
                        variant="light"
                        color="violet"
                        leftSection={<IconCurrencyEuro className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/payments/create`)}
                      >
                        {t('payments.create.title')}
                      </Button>
                      <Button
                        variant="light"
                        color="orange"
                        leftSection={<IconCalendar className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/appointments/create`)}
                      >
                        {t('appointments.create')}
                      </Button>
                    </div>
                  </Paper>

                  {/* Occupancy Ring Chart */}
                  <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Text fw={600} mb="md">{t('dashboard.occupancyRate')}</Text>
                    <div className="flex items-center justify-center">
                      <RingProgress
                        size={160}
                        thickness={16}
                        roundCaps
                        sections={[
                          { value: data.statistics.apartments.occupancyRate, color: 'teal' },
                        ]}
                        label={
                          <div className="text-center">
                            <Text size="xl" fw={700}>{data.statistics.apartments.occupancyRate}%</Text>
                            <Text size="xs" c="dimmed">Dolu</Text>
                          </div>
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <Text size="lg" fw={600} c="teal">{data.statistics.apartments.occupied}</Text>
                        <Text size="xs" c="dimmed">{t('dashboard.occupied')}</Text>
                      </div>
                      <div className="text-center">
                        <Text size="lg" fw={600} c="gray">{data.statistics.apartments.vacant}</Text>
                        <Text size="xs" c="dimmed">{t('dashboard.vacant')}</Text>
                      </div>
                    </div>
                  </Paper>

                  {/* Upcoming Payments Mini */}
                  <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600}>{t('dashboard.upcomingPayments')}</Text>
                      <Button
                        variant="subtle"
                        size="xs"
                        rightSection={<IconArrowRight className="w-3 h-3" />}
                        onClick={() => router.push(`/${locale}/modules/real-estate/payments`)}
                      >
                        {t('dashboard.viewAll')}
                      </Button>
                    </Group>
                    <Stack gap="xs">
                      {data.upcomingPayments.slice(0, 3).map((payment) => (
                        <div
                          key={payment.id}
                          className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} flex items-center justify-between`}
                        >
                          <div>
                            <Text size="sm" fw={500}>{payment.tenantName}</Text>
                            <Text size="xs" c="dimmed">{payment.apartment}</Text>
                          </div>
                          <div className="text-right">
                            <Text size="sm" fw={600}>{formatCurrency(payment.amount)}</Text>
                            <Badge
                              size="xs"
                              color={payment.daysUntilDue <= 7 ? 'red' : payment.daysUntilDue <= 14 ? 'yellow' : 'blue'}
                              variant="light"
                            >
                              {payment.daysUntilDue} gün
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {data.upcomingPayments.length === 0 && (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                          {t('dashboard.noUpcomingPayments')}
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                </div>
              </div>

              {/* Bottom Row - Recent Activity */}
              <RecentActivity activities={data.recentActivity} loading={isLoading} />
            </>
          )}
      </div>
    </Container>
  );
}






