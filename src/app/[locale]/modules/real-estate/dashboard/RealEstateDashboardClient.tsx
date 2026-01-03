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
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { PropertyMap } from '@/modules/real-estate/components/PropertyMap';
import { PaymentCards } from '@/modules/real-estate/components/dashboard/PaymentCards';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useCompany } from '@/context/CompanyContext';
import { useMemo } from 'react';
import styles from '@/modules/dashboard/Dashboard.module.css';

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
        showBackButton={false}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'menu.items.dashboard', namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('apartments.create.title'),
            icon: <IconHome size={18} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/apartments/create`),
            variant: 'light',
          },
          {
            label: t('contracts.create.title'),
            icon: <IconFileText size={18} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/contracts/create`),
            variant: 'light',
            color: 'green',
          },
          {
            label: t('payments.create.title'),
            icon: <IconCurrencyEuro size={18} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/payments/create`),
            variant: 'light',
            color: 'violet',
          },
          {
            label: t('appointments.create'),
            icon: <IconCalendar size={18} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/appointments/create`),
            variant: 'light',
            color: 'orange',
          },
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
              {/* All Stats - Micro-Chart Insight Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Properties Card */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-blue-900/30 hover:shadow-blue-500/10' : 'bg-white border border-blue-100 hover:shadow-blue-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-blue-400' : 'text-blue-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {t('properties.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.properties.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <IconBuilding className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        {data.statistics.properties.active} {t('dashboard.active')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apartments Card with Occupancy Ring */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-emerald-900/30 hover:shadow-emerald-500/10' : 'bg-white border border-emerald-100 hover:shadow-emerald-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {t('apartments.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.apartments.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <IconHome className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className={isDark ? 'text-emerald-900' : 'text-emerald-100'} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path className="text-emerald-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${data.statistics.apartments.occupancyRate}, 100`} strokeWidth="3" />
                        </svg>
                        <div className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {data.statistics.apartments.occupancyRate}%
                        </div>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('dashboard.occupancyRate')}</p>
                    </div>
                  </div>
                </div>

                {/* Tenants Card with Bar Chart */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-orange-900/30 hover:shadow-orange-500/10' : 'bg-white border border-orange-100 hover:shadow-orange-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-orange-400' : 'text-orange-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          {t('tenants.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.tenants.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                        <IconUsers className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-end space-x-0.5 h-6 w-full">
                      {[40, 60, 30, 80, 50, 90].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-t-sm ${isDark ? `bg-orange-${900 - i * 100}` : `bg-orange-${200 + i * 100}`}`} style={{ height: `${h}%`, backgroundColor: isDark ? `rgba(251, 146, 60, ${0.3 + i * 0.1})` : `rgba(251, 146, 60, ${0.2 + i * 0.15})` }} />
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[10px] font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{data.statistics.tenants.active} {t('dashboard.active')}</span>
                    </div>
                  </div>
                </div>

                {/* Contracts Card with Stacked Bar */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-teal-900/30 hover:shadow-teal-500/10' : 'bg-white border border-teal-100 hover:shadow-teal-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-teal-400' : 'text-teal-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                          {t('contracts.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.contracts.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                        <IconFileText className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex w-full h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full" style={{ width: `${(data.statistics.contracts.active / data.statistics.contracts.total) * 100}%` }} />
                      <div className="bg-amber-400 h-full" style={{ width: `${((data.statistics.contracts.total - data.statistics.contracts.active) / data.statistics.contracts.total) * 100}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[10px] ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{data.statistics.contracts.active} {t('dashboard.active')}</span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.statistics.contracts.total - data.statistics.contracts.active} {t('dashboard.expiring')}</span>
                    </div>
                  </div>
                </div>

                {/* Payments Card with Progress Bar */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-cyan-900/30 hover:shadow-cyan-500/10' : 'bg-white border border-cyan-100 hover:shadow-cyan-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          {t('payments.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.payments.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                        <IconCurrencyEuro className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.statistics.payments.paid} {t('payments.status.paid')}</span>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{Math.round((data.statistics.payments.paid / data.statistics.payments.total) * 100)}%</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(data.statistics.payments.paid / data.statistics.payments.total) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Appointments Card with Dots */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-purple-900/30 hover:shadow-purple-500/10' : 'bg-white border border-purple-100 hover:shadow-purple-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-purple-400' : 'text-purple-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {t('appointments.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.appointments.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                        <IconCalendar className="w-5 h-5" />
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                      {data.statistics.appointments.upcoming} {t('dashboard.upcoming')}
                    </span>
                    <div className="flex space-x-1 mt-1.5">
                      {[...Array(Math.min(7, data.statistics.appointments.upcoming))].map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 rounded-full bg-purple-500 ${i === data.statistics.appointments.upcoming - 1 ? 'animate-pulse' : ''}`} />
                      ))}
                      {[...Array(Math.max(0, 7 - data.statistics.appointments.upcoming))].map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-purple-900' : 'bg-purple-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Maintenance Card with Ring */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-red-900/30 hover:shadow-red-500/10' : 'bg-white border border-red-100 hover:shadow-red-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-red-400' : 'text-red-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          {t('maintenance.title')}
                        </p>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {data.statistics.maintenance.total}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        <IconTools className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle className={isDark ? 'text-red-900' : 'text-red-100'} cx="18" cy="18" fill="none" r="15.9155" stroke="currentColor" strokeWidth="4" />
                          <circle className="text-red-500" cx="18" cy="18" fill="none" r="15.9155" stroke="currentColor" strokeDasharray={`${data.statistics.maintenance.total > 0 ? ((data.statistics.maintenance.total - data.statistics.maintenance.open) / data.statistics.maintenance.total) * 100 : 100}, 100`} strokeWidth="4" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${data.statistics.maintenance.open === 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
                          {data.statistics.maintenance.open} {t('dashboard.open')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Card with Sparkline */}
                <div className={`group relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-violet-900/30 hover:shadow-violet-500/10' : 'bg-white border border-violet-100 hover:shadow-violet-500/10'}`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? 'text-violet-400' : 'text-violet-600'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                          {t('dashboard.monthlyRevenue')}
                        </p>
                        <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(data.revenue.thisMonth ?? 0)}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                        <IconCurrencyEuro className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="h-6 w-full">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24">
                        <defs>
                          <linearGradient id="gradientViolet" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 18 Q 20 22, 40 10 T 70 14 T 100 4 V 24 H 0 Z" fill="url(#gradientViolet)" stroke="none" />
                        <path d="M0 18 Q 20 22, 40 10 T 70 14 T 100 4" fill="none" stroke="#8B5CF6" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center">
                      {(() => {
                        const changePercentage = data.revenue.lastMonth > 0
                          ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100
                          : 0;
                        return changePercentage >= 0 ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>+{changePercentage.toFixed(1)}%</span>
                        ) : (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-500'}`}>{changePercentage.toFixed(1)}%</span>
                        );
                      })()}
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>vs {t('dashboard.lastMonth')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Cards - Upcoming & Overdue Payments */}
              <PaymentCards locale={locale} />

              {/* Map Section - New Design */}
              <div className={styles.mapSection}>
                <div className={styles.mapHeader}>
                  <div className={styles.mapHeaderLeft}>
                    <div className={styles.mapHeaderTitle}>
                      <IconMap className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
                      <h2>{t('map.title')}</h2>
                    </div>
                    <p>{t('map.description')}</p>
                  </div>
                  <div className={styles.mapStats}>
                    <div className={styles.mapStatItem}>
                      <span className={`${styles.mapStatDot} ${styles.blue}`}></span>
                      <span>{mapStats.totalProperties} {t('map.totalProperties')}</span>
                    </div>
                    <div className={styles.mapStatItem}>
                      <span className={`${styles.mapStatDot} ${styles.green}`}></span>
                      <span>{mapStats.rented} {t('map.rented')}</span>
                    </div>
                    <div className={styles.mapStatItem}>
                      <span className={`${styles.mapStatDot} ${styles.yellow}`}></span>
                      <span>{mapStats.empty} {t('map.empty')}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.mapContainer}>
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
                            <Text size="xs" c="dimmed">{t('dashboard.occupied')}</Text>
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

                  {/* Upcoming Payments - height matches Payment Types chart */}
                  <Paper shadow="xs" p="md" radius="md" withBorder style={{ height: 'calc(300px + 2rem + 1.5rem)' }}>
                    <Group justify="space-between" mb="md">
                      <Text fw={600}>{t('dashboard.upcomingPayments')}</Text>
                      <Button
                        variant="subtle"
                        size="xs"
                        rightSection={<IconArrowRight size={14} />}
                        onClick={() => router.push(`/${locale}/modules/real-estate/payments`)}
                      >
                        {t('dashboard.viewAll')}
                      </Button>
                    </Group>
                    <Stack gap="xs" style={{ height: 'calc(100% - 50px)', overflowY: 'auto' }} className={styles.noScrollbar}>
                      {data.upcomingPayments && data.upcomingPayments.length > 0 ? (
                        data.upcomingPayments.slice(0, 6).map((payment) => (
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
                                {payment.daysUntilDue} {t('dashboard.days')}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                          {t('dashboard.noUpcomingPayments')}
                        </Text>
                      )}
                    </Stack>
                  </Paper>

                  {/* Recent Activity - height matches Payment Types chart */}
                  <Paper shadow="xs" p="md" radius="md" withBorder style={{ height: 'calc(300px + 2rem + 1.5rem)' }}>
                    <Group justify="space-between" mb="md">
                      <Text fw={600}>{t('dashboard.recentActivity')}</Text>
                    </Group>
                    <Stack gap="xs" style={{ height: 'calc(100% - 50px)', overflowY: 'auto' }} className={styles.noScrollbar}>
                      {data.recentActivity && data.recentActivity.length > 0 ? (
                        data.recentActivity.slice(0, 6).map((activity, index) => (
                          <div
                            key={activity.id || index}
                            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} flex items-center gap-3`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.type === 'payment' ? (isDark ? 'bg-emerald-900/30' : 'bg-emerald-50') :
                              activity.type === 'contract' ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') :
                              activity.type === 'maintenance' ? (isDark ? 'bg-amber-900/30' : 'bg-amber-50') :
                              (isDark ? 'bg-purple-900/30' : 'bg-purple-50')
                            }`}>
                              {activity.type === 'payment' && <IconCurrencyEuro size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />}
                              {activity.type === 'contract' && <IconFileText size={14} className={isDark ? 'text-blue-400' : 'text-blue-500'} />}
                              {activity.type === 'maintenance' && <IconTools size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />}
                              {activity.type === 'tenant' && <IconUsers size={14} className={isDark ? 'text-purple-400' : 'text-purple-500'} />}
                              {!['payment', 'contract', 'maintenance', 'tenant'].includes(activity.type) && (
                                <IconHome size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Text size="sm" fw={500} truncate>{activity.title}</Text>
                              <Text size="xs" c="dimmed" truncate>{activity.description}</Text>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                          {t('dashboard.noActivity')}
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                </div>
              </div>
            </>
          )}
      </div>
    </Container>
  );
}






