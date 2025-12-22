'use client';

import { Container, Stack, Alert, Text, Paper, Badge, Group, Progress, RingProgress, Button, useMantineColorScheme } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import {
  IconBuilding,
  IconHome,
  IconUsers,
  IconFileText,
  IconCurrencyDollar,
  IconCalendar,
  IconTools,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMap,
  IconCheck,
  IconHome2,
  IconTrendingUp,
  IconArrowRight,
  IconChartPie,
  IconActivity
} from '@tabler/icons-react';
import { useRealEstateDashboard } from '@/hooks/useRealEstateDashboard';
import { StatisticsCards } from '@/modules/real-estate/components/dashboard/StatisticsCards';
import { DashboardCharts } from '@/modules/real-estate/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/modules/real-estate/components/dashboard/RecentActivity';
import { UpcomingEvents } from '@/modules/real-estate/components/dashboard/UpcomingEvents';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { PropertyMap } from '@/modules/real-estate/components/PropertyMap';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

export function RealEstateDashboardClient() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeView, setActiveView] = useState<'v1' | 'v2'>('v2');

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
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

      {/* Version Toggle */}
      <div className="flex items-center justify-end gap-2 mt-4 mb-6">
        <Text size="sm" c="dimmed">Tasarım:</Text>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveView('v1')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'v1'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            V1 - Mevcut
          </button>
          <button
            onClick={() => setActiveView('v2')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'v2'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            V2 - Yeni (Tailwind + Map)
          </button>
        </div>
      </div>

      {activeView === 'v1' ? (
        /* ===== V1 - MEVCUT TASARIM ===== */
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
      ) : (
        /* ===== V2 - YENİ MODERN TASARIM (Tailwind + Mantine Hibrit) ===== */
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
              {/* Hero Stats Row - Tek satırda 4 kart, eşit yükseklik */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Properties Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        {t('properties.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.properties.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="blue" variant="light" size="sm">
                          {data.statistics.properties.active} {t('dashboard.active')}
                        </Badge>
                      </div>
                    </div>
                    <IconBuilding className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconBuilding className="w-32 h-32" />
                  </div>
                </div>

                {/* Apartments Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {t('apartments.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.apartments.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          <IconTrendingUp className="w-3 h-3" />
                          <span>{data.statistics.apartments.occupancyRate}% doluluk</span>
                        </div>
                      </div>
                    </div>
                    <IconHome className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div className="mt-3">
                    <Progress
                      value={data.statistics.apartments.occupancyRate}
                      color="teal"
                      size="sm"
                      radius="xl"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconHome className="w-32 h-32" />
                  </div>
                </div>

                {/* Tenants Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/30' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                        {t('tenants.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.tenants.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="orange" variant="light" size="sm">
                          {data.statistics.tenants.active} {t('dashboard.active')}
                        </Badge>
                      </div>
                    </div>
                    <IconUsers className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconUsers className="w-32 h-32" />
                  </div>
                </div>

                {/* Revenue Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-violet-900/40 to-violet-800/20 border border-violet-700/30' : 'bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                        {t('dashboard.monthlyRevenue') || 'Aylık Gelir'}
                      </p>
                      <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(data.revenue.currentMonth ?? 0)}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {(data.revenue.changePercentage ?? 0) >= 0 ? (
                          <div className="flex items-center gap-1 text-xs text-emerald-500">
                            <IconArrowUpRight className="w-3 h-3" />
                            <span>+{(data.revenue.changePercentage ?? 0).toFixed(1)}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-red-500">
                            <IconArrowDownRight className="w-3 h-3" />
                            <span>{(data.revenue.changePercentage ?? 0).toFixed(1)}%</span>
                          </div>
                        )}
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          vs geçen ay
                        </span>
                      </div>
                    </div>
                    <IconCurrencyDollar className={`w-8 h-8 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconCurrencyDollar className="w-32 h-32" />
                  </div>
                </div>
              </div>

              {/* Secondary Stats Row - Tek satırda 4 kart (gradient tasarım) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Contracts Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-700/30' : 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
                        {t('contracts.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.contracts.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="cyan" variant="light" size="sm">
                          {data.statistics.contracts.active} {t('dashboard.active')}
                        </Badge>
                      </div>
                    </div>
                    <IconFileText className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconFileText className="w-32 h-32" />
                  </div>
                </div>

                {/* Payments Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-teal-900/40 to-teal-800/20 border border-teal-700/30' : 'bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>
                        {t('payments.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.payments.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="teal" variant="light" size="sm">
                          {data.statistics.payments.paid} {t('payments.status.paid')}
                        </Badge>
                      </div>
                    </div>
                    <IconCurrencyDollar className={`w-8 h-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconCurrencyDollar className="w-32 h-32" />
                  </div>
                </div>

                {/* Appointments Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-grape-900/40 to-grape-800/20 border border-grape-700/30' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                        {t('appointments.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.appointments.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="grape" variant="light" size="sm">
                          {data.statistics.appointments.upcoming} {t('dashboard.upcoming')}
                        </Badge>
                      </div>
                    </div>
                    <IconCalendar className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconCalendar className="w-32 h-32" />
                  </div>
                </div>

                {/* Maintenance Card */}
                <div className={`relative overflow-hidden rounded-xl p-5 ${isDark ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/30' : 'bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        {t('maintenance.title')}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.statistics.maintenance.total}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="red" variant="light" size="sm">
                          {data.statistics.maintenance.open} {t('dashboard.open')}
                        </Badge>
                      </div>
                    </div>
                    <IconTools className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                    <IconTools className="w-32 h-32" />
                  </div>
                </div>
              </div>

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
                    <Text fw={600} mb="md">{tGlobal('common.quickActions') || 'Hızlı İşlemler'}</Text>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="light"
                        leftSection={<IconHome className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/apartments/create`)}
                      >
                        {t('apartments.create')}
                      </Button>
                      <Button
                        variant="light"
                        color="green"
                        leftSection={<IconFileText className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/contracts/create`)}
                      >
                        {t('contracts.create')}
                      </Button>
                      <Button
                        variant="light"
                        color="violet"
                        leftSection={<IconCurrencyDollar className="w-4 h-4" />}
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/${locale}/modules/real-estate/payments/create`)}
                      >
                        {t('payments.create')}
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
                    <Text fw={600} mb="md">{t('dashboard.occupancyRate') || 'Doluluk Oranı'}</Text>
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
                        <Text size="xs" c="dimmed">{t('dashboard.vacant') || 'Boş'}</Text>
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
      )}
    </Container>
  );
}






