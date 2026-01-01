'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  ThemeIcon,
  Paper,
  Skeleton,
  Button,
  Box,
  SimpleGrid,
  CloseButton,
  Progress,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconDashboard,
  IconBuilding,
  IconFolder,
  IconCalendar,
  IconBell,
  IconUsers,
  IconReportMoney,
  IconBox,
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
  IconRefresh,
  IconChevronRight,
  IconTrendingUp,
  IconCash,
  IconPlus,
  IconList,
  IconReceipt,
  IconShoppingCart,
  IconKey,
  IconEye,
  IconTool,
  IconCheck,
  IconExternalLink,
  IconArrowRight,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';
import styles from './Dashboard.module.css';

dayjs.extend(relativeTime);
dayjs.locale('tr');

interface ModuleSummary {
  module: string;
  icon: string;
  color: string;
  stats: {
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
  }[];
  quickActions?: {
    label: string;
    href: string;
    icon: string;
  }[];
}

interface DashboardSummary {
  modules: ModuleSummary[];
  recentActivities: {
    id: string;
    module: string;
    type: string;
    title: string;
    description: string;
    date: string;
    icon: string;
    color: string;
  }[];
  upcomingEvents: {
    id: string;
    module: string;
    type: string;
    title: string;
    date: string;
    icon: string;
    color: string;
  }[];
  notifications: {
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    description: string;
    module: string;
  }[];
}

const iconMap: Record<string, React.ElementType> = {
  IconBuilding,
  IconFolder,
  IconCalendar,
  IconBell,
  IconUsers,
  IconReportMoney,
  IconBox,
  IconCash,
  IconPlus,
  IconList,
  IconReceipt,
  IconShoppingCart,
  IconKey,
  IconEye,
  IconTool,
  IconCheck,
};

const moduleNameMap: Record<string, string> = {
  'real-estate': 'Gayrimenkul',
  'file-manager': 'Dosya Yonetimi',
  calendar: 'Takvim',
  notifications: 'Bildirimler',
  hr: 'Insan Kaynaklari',
  accounting: 'Muhasebe',
  production: 'Uretim',
};

const moduleColorMap: Record<string, { bg: string; text: string; hoverBg: string }> = {
  'real-estate': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-500',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
  },
  calendar: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-500',
    hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/40',
  },
  notifications: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-500',
    hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/40',
  },
  hr: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-500',
    hoverBg: 'hover:bg-teal-100 dark:hover:bg-teal-900/40',
  },
  accounting: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-500',
    hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
  },
  production: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-500',
    hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
  },
};

const eventTypeColors: Record<string, { bg: string; icon: React.ElementType }> = {
  delivery: {
    bg: 'bg-indigo-500 dark:bg-indigo-600',
    icon: IconBuilding,
  },
  key: {
    bg: 'bg-pink-500 dark:bg-pink-600',
    icon: IconKey,
  },
  showing: {
    bg: 'bg-cyan-500 dark:bg-cyan-600',
    icon: IconEye,
  },
  maintenance: {
    bg: 'bg-amber-500 dark:bg-amber-600',
    icon: IconTool,
  },
  completed: {
    bg: 'bg-emerald-500 dark:bg-emerald-600',
    icon: IconCheck,
  },
};

export function Dashboard() {
  const { t } = useTranslation('modules/dashboard');
  const { t: tGlobal } = useTranslation('global');
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || 'tr';
  const [mounted, setMounted] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      return result.data as DashboardSummary;
    },
    refetchInterval: 60000,
  });

  const getIcon = (iconName: string, size = 20) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={size} /> : null;
  };

  const getModuleColors = (moduleSlug: string) => {
    return (
      moduleColorMap[moduleSlug] || {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        text: 'text-gray-500',
        hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-900/40',
      }
    );
  };

  // Find pending payments notification
  const pendingPaymentsNotification = data?.notifications?.find(
    (n) => n.type === 'warning' && n.module === 'real-estate'
  );

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/dashboard"
        icon={mounted ? <IconDashboard size={32} /> : null}
        breadcrumbs={[
          {
            label: 'navigation.dashboard',
            href: `/${currentLocale}/dashboard`,
            namespace: 'global',
          },
        ]}
        showBackButton={false}
        actions={[
          {
            label: tGlobal('common.actions.refresh') || 'Yenile',
            icon: mounted ? (
              <IconRefresh size={18} className={styles.refreshIcon} />
            ) : null,
            onClick: () => refetch(),
            variant: 'light',
          },
        ]}
      />

      {/* Alert Banner */}
      {pendingPaymentsNotification && !alertDismissed && (
        <Paper
          className={`${styles.animatePulseSlow} mb-6`}
          p="md"
          radius="lg"
          style={{
            backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgb(254, 242, 242)',
            border: `1px solid ${isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgb(254, 226, 226)'}`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-full shrink-0 ${isDark ? 'bg-red-800/30' : 'bg-red-100'}`}
            >
              <IconAlertTriangle
                size={20}
                className={isDark ? 'text-red-400' : 'text-red-500'}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <Text fw={700} size="sm" c={isDark ? 'red.2' : 'red.8'}>
                    {pendingPaymentsNotification.title}
                  </Text>
                  <Text size="sm" c={isDark ? 'red.3' : 'red.6'} mt={4}>
                    {pendingPaymentsNotification.description}
                  </Text>
                </div>
                <CloseButton
                  size="sm"
                  c={isDark ? 'red.4' : 'red.4'}
                  onClick={() => setAlertDismissed(true)}
                />
              </div>
            </div>
          </div>
        </Paper>
      )}

      {/* Module Cards Grid */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg" mb="xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={220} radius="lg" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg" mb="xl">
          {data?.modules.map((module) => {
            const colors = getModuleColors(module.module);
            const hasOccupancy = module.stats.some((s) => s.label === 'Doluluk');
            const occupancyStat = module.stats.find((s) => s.label === 'Doluluk');
            const pendingStat = module.stats.find(
              (s) => s.label === 'Bekleyen Odeme' || s.label === 'Bekleyen Ödeme'
            );

            return (
              <Paper
                key={module.module}
                className={styles.moduleCard}
                p="lg"
                radius="lg"
                withBorder
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() =>
                  router.push(`/${currentLocale}/modules/${module.module}/dashboard`)
                }
              >
                {/* Corner Decoration */}
                <div
                  className={`${styles.cornerDecoration} absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 ${colors.bg}`}
                />

                {/* Header */}
                <Group justify="space-between" mb="lg" style={{ position: 'relative', zIndex: 10 }}>
                  <Group gap="sm">
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                      {mounted && getIcon(module.icon, 20)}
                    </div>
                    <Text fw={600} size="lg">
                      {moduleNameMap[module.module] || module.module}
                    </Text>
                  </Group>
                  <IconChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </Group>

                {/* Stats Grid */}
                <SimpleGrid cols={2} spacing="md" mb="lg">
                  {module.stats.slice(0, 4).map((stat, index) => (
                    <Box key={index}>
                      <Text
                        size="xs"
                        fw={500}
                        c="dimmed"
                        tt="uppercase"
                        style={{ letterSpacing: '0.05em' }}
                        mb={4}
                      >
                        {stat.label}
                      </Text>
                      <Group gap="xs" align="center">
                        <Text
                          size="xl"
                          fw={700}
                          c={
                            stat.label === 'Bekleyen Odeme' ||
                            stat.label === 'Bekleyen Ödeme'
                              ? 'orange'
                              : undefined
                          }
                        >
                          {stat.value}
                        </Text>
                        {stat.label === 'Doluluk' && (
                          <Progress
                            value={parseInt(String(stat.value))}
                            size="sm"
                            color="blue"
                            w={48}
                            radius="xl"
                          />
                        )}
                        {stat.change !== undefined && (
                          <Badge
                            size="xs"
                            color={stat.change >= 0 ? 'green' : 'red'}
                            variant="light"
                            leftSection={
                              stat.change >= 0 ? (
                                <IconArrowUpRight size={10} />
                              ) : (
                                <IconArrowDownRight size={10} />
                              )
                            }
                          >
                            {stat.change >= 0 ? '+' : ''}
                            {stat.change}%
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  ))}
                </SimpleGrid>

                {/* Quick Actions */}
                {module.quickActions && module.quickActions.length > 0 && (
                  <Group gap="xs">
                    {module.quickActions.slice(0, 2).map((action, index) => (
                      <Button
                        key={index}
                        size="xs"
                        variant="light"
                        color={module.color}
                        className={`flex-1 ${colors.bg} ${colors.hoverBg}`}
                        leftSection={mounted && getIcon(action.icon, 14)}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${currentLocale}${action.href}`);
                        }}
                        styles={{
                          root: {
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Group>
                )}
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Upcoming Events - Glass Card */}
        <div className="lg:col-span-2">
          <Paper
            radius="xl"
            p={0}
            style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: 450,
              isolation: 'isolate',
            }}
            withBorder
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              }}
            />

            {/* Animated Blobs */}
            <div
              className={`absolute top-0 -left-4 w-96 h-96 rounded-full filter blur-3xl opacity-40 ${styles.animateBlob}`}
              style={{
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.3)'
                  : 'rgba(199, 210, 254, 1)',
                mixBlendMode: isDark ? 'screen' : 'multiply',
              }}
            />
            <div
              className={`absolute top-0 -right-4 w-96 h-96 rounded-full filter blur-3xl opacity-40 ${styles.animateBlob} ${styles.animationDelay2000}`}
              style={{
                backgroundColor: isDark
                  ? 'rgba(236, 72, 153, 0.3)'
                  : 'rgba(251, 207, 232, 1)',
                mixBlendMode: isDark ? 'screen' : 'multiply',
              }}
            />
            <div
              className={`absolute -bottom-32 left-20 w-96 h-96 rounded-full filter blur-3xl opacity-40 ${styles.animateBlob} ${styles.animationDelay4000}`}
              style={{
                backgroundColor: isDark
                  ? 'rgba(34, 211, 238, 0.3)'
                  : 'rgba(165, 243, 252, 1)',
                mixBlendMode: isDark ? 'screen' : 'multiply',
              }}
            />

            {/* Content */}
            <div
              className={`relative z-10 h-full p-8 flex flex-col ${styles.glassEffect}`}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${styles.animatePing}`}
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                    </span>
                    <Text
                      size="xs"
                      fw={700}
                      tt="uppercase"
                      style={{ letterSpacing: '0.1em' }}
                      c="indigo"
                    >
                      Canli Veri Akisi
                    </Text>
                  </div>
                  <Text size="xl" fw={700} className="text-gray-900 dark:text-white">
                    Yaklasan Etkinlikler
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    Onumuzdeki gunlerde planlanan isler ve randevular.
                  </Text>
                </div>

                {/* Total Badge */}
                <Paper
                  p="md"
                  radius="lg"
                  style={{
                    backgroundColor: isDark
                      ? 'rgba(30, 41, 59, 0.5)'
                      : 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.6)'}`,
                  }}
                >
                  <Group gap="lg">
                    <div className="text-right">
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Toplam
                      </Text>
                      <Text size="sm" fw={600} c="dimmed">
                        Bekleyen Is
                      </Text>
                    </div>
                    <div
                      className="w-px h-10"
                      style={{
                        backgroundColor: isDark ? '#4b5563' : '#d1d5db',
                      }}
                    />
                    <Text
                      size="xl"
                      fw={300}
                      c="indigo"
                      style={{ fontSize: '2.5rem' }}
                    >
                      {data?.upcomingEvents?.length || 0}
                    </Text>
                  </Group>
                </Paper>
              </div>

              {/* Events List */}
              <div
                className={`flex-1 space-y-3 overflow-y-auto pr-2 ${styles.noScrollbar}`}
                style={{ maxHeight: 400 }}
              >
                {isLoading ? (
                  <Stack gap="sm">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} height={80} radius="lg" />
                    ))}
                  </Stack>
                ) : data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
                  data.upcomingEvents.slice(0, 5).map((event, index) => {
                    const eventColor =
                      eventTypeColors[event.type] || eventTypeColors.delivery;
                    const EventIcon = eventColor.icon;
                    const hoverColors = [
                      'hover:shadow-indigo-100/20',
                      'hover:shadow-pink-100/20',
                      'hover:shadow-cyan-100/20',
                      'hover:shadow-amber-100/20',
                      'hover:shadow-emerald-100/20',
                    ];

                    return (
                      <Paper
                        key={event.id}
                        className={`${styles.eventCard} cursor-pointer ${hoverColors[index % 5]}`}
                        p="md"
                        radius="lg"
                        style={{
                          backgroundColor: isDark
                            ? 'rgba(30, 41, 59, 0.4)'
                            : 'rgba(255, 255, 255, 0.4)',
                          border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.5)'}`,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${eventColor.bg}`}
                            style={{ color: 'white' }}
                          >
                            <EventIcon size={20} />
                          </div>
                          <div className="flex-1">
                            <Group justify="space-between" align="flex-start">
                              <Text fw={700} size="md" className="text-gray-800 dark:text-gray-100">
                                {event.title}
                              </Text>
                              <Badge
                                size="xs"
                                variant="light"
                                color={event.color}
                                tt="uppercase"
                                fw={700}
                              >
                                {event.type === 'delivery'
                                  ? 'Teslimat'
                                  : event.type === 'key'
                                    ? 'Anahtar'
                                    : event.type === 'showing'
                                      ? 'Sunum'
                                      : event.type === 'maintenance'
                                        ? 'Tamirat'
                                        : 'Tamamlandi'}
                              </Badge>
                            </Group>
                            <Group gap="sm" mt={4}>
                              <Group gap={4}>
                                <IconCalendarEvent size={14} className="text-gray-400" />
                                <Text size="xs" c="dimmed">
                                  {dayjs(event.date).fromNow()}
                                </Text>
                              </Group>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <Text size="xs" c="dimmed">
                                {dayjs(event.date).format('DD MMM, HH:mm')}
                              </Text>
                            </Group>
                          </div>
                          <IconChevronRight
                            size={16}
                            className={`text-gray-300 dark:text-gray-600 ${styles.arrowSlide}`}
                          />
                        </div>
                      </Paper>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <IconCalendar size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                    <Text c="dimmed">Yaklasan etkinlik bulunmuyor</Text>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="mt-4 pt-4 flex justify-center"
                style={{
                  borderTop: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                }}
              >
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => router.push(`/${currentLocale}/modules/calendar`)}
                >
                  Tum Takvimi Goruntule
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        {/* Quick Overview Sidebar */}
        <div className="lg:col-span-1">
          <Paper p="lg" radius="lg" withBorder h="100%">
            <Group gap="sm" mb="lg">
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500">
                <IconTrendingUp size={20} />
              </div>
              <Text fw={700} size="lg">
                Hizli Bakis
              </Text>
            </Group>

            <Stack gap="sm">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => <Skeleton key={i} height={72} radius="lg" />)
              ) : (
                data?.modules.slice(0, 4).map((module) => {
                  const colors = getModuleColors(module.module);
                  const mainStat = module.stats[0];
                  const secondaryStat = module.stats[1];

                  return (
                    <Paper
                      key={module.module}
                      p="md"
                      radius="lg"
                      withBorder
                      className={`cursor-pointer transition-all ${colors.hoverBg}`}
                      onClick={() =>
                        router.push(`/${currentLocale}/modules/${module.module}/dashboard`)
                      }
                      style={{
                        borderColor: 'var(--mantine-color-default-border)',
                      }}
                    >
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={600} className="text-gray-700 dark:text-gray-200">
                            {moduleNameMap[module.module]}
                          </Text>
                          <Text size="xs" c="dimmed" mt={2}>
                            {mainStat?.label}: {mainStat?.value}
                            {secondaryStat && ` - ${secondaryStat.label}: ${secondaryStat.value}`}
                          </Text>
                        </div>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconExternalLink size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  );
                })
              )}
            </Stack>
          </Paper>
        </div>
      </div>
    </Container>
  );
}
