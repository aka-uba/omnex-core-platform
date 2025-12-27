'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  ThemeIcon,
  Paper,
  Skeleton,
  Alert,
  Button,
  Timeline,
  Box,
  SimpleGrid,
  Divider,
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
  IconInfoCircle,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconRefresh,
  IconChevronRight,
  IconClock,
  IconTrendingUp,
  IconCash,
  IconPlus,
  IconUpload,
  IconList,
  IconReceipt,
  IconShoppingCart,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

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

const iconMap: Record<string, any> = {
  IconBuilding,
  IconFolder,
  IconCalendar,
  IconBell,
  IconUsers,
  IconReportMoney,
  IconBox,
  IconCash,
  IconPlus,
  IconUpload,
  IconList,
  IconReceipt,
  IconShoppingCart,
};

const moduleNameMap: Record<string, string> = {
  'real-estate': 'Gayrimenkul',
  'file-manager': 'Dosya Yönetimi',
  'calendar': 'Takvim',
  'notifications': 'Bildirimler',
  'hr': 'İnsan Kaynakları',
  'accounting': 'Muhasebe',
  'production': 'Üretim',
};

export function Dashboard() {
  const { t } = useTranslation('modules/dashboard');
  const { t: tGlobal } = useTranslation('global');
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || 'tr';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error, refetch } = useQuery<DashboardSummary>({
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <IconAlertTriangle size={20} />;
      case 'error':
        return <IconCircleX size={20} />;
      case 'success':
        return <IconCircleCheck size={20} />;
      default:
        return <IconInfoCircle size={20} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/dashboard"
        icon={mounted ? <IconDashboard size={32} /> : null}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
        ]}
        showBackButton={false}
        actions={[
          {
            label: tGlobal('common.actions.refresh') || 'Yenile',
            icon: mounted ? <IconRefresh size={18} /> : null,
            onClick: () => refetch(),
            variant: 'light',
          },
        ]}
      />

      {/* Notifications/Alerts */}
      {data?.notifications && data.notifications.length > 0 && (
        <Stack gap="sm" mb="xl">
          {data.notifications.map((notification) => (
            <Alert
              key={notification.id}
              icon={getNotificationIcon(notification.type)}
              title={notification.title}
              color={getNotificationColor(notification.type)}
              variant="light"
              withCloseButton
            >
              {notification.description}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Module Cards Grid */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={200} radius="md" />
          ))}
        </SimpleGrid>
      ) : error ? (
        <Alert color="red" title="Hata" mb="xl">
          Dashboard verileri yüklenirken bir hata oluştu.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
          {data?.modules.map((module) => (
            <Card
              key={module.module}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={() => router.push(`/${currentLocale}/modules/${module.module}/dashboard`)}
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" color={module.color} variant="light">
                    {mounted && getIcon(module.icon, 22)}
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    {moduleNameMap[module.module] || module.module}
                  </Text>
                </Group>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Group>

              <SimpleGrid cols={2} spacing="xs">
                {module.stats.map((stat, index) => (
                  <Box key={index} p="xs">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      {stat.label}
                    </Text>
                    <Group gap={4} align="baseline">
                      <Text size="xl" fw={700}>
                        {stat.value}
                      </Text>
                      {stat.change !== undefined && (
                        <Badge
                          size="sm"
                          color={stat.change >= 0 ? 'green' : 'red'}
                          variant="light"
                          leftSection={
                            stat.change >= 0 ? (
                              <IconArrowUpRight size={12} />
                            ) : (
                              <IconArrowDownRight size={12} />
                            )
                          }
                        >
                          {stat.change >= 0 ? '+' : ''}{stat.change}%
                        </Badge>
                      )}
                    </Group>
                  </Box>
                ))}
              </SimpleGrid>

              {module.quickActions && module.quickActions.length > 0 && (
                <>
                  <Divider my="sm" />
                  <Group gap="xs">
                    {module.quickActions.map((action, index) => (
                      <Button
                        key={index}
                        size="xs"
                        variant="light"
                        color={module.color}
                        leftSection={mounted && getIcon(action.icon, 14)}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${currentLocale}${action.href}`);
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Group>
                </>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Bottom Section: Events and Quick Overview */}
      <Grid gutter="lg">
        {/* Upcoming Events */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size="md" radius="md" color="grape" variant="light">
                  {mounted && <IconClock size={18} />}
                </ThemeIcon>
                <Text fw={600}>Yaklaşan Etkinlikler</Text>
              </Group>
              <Badge variant="light" color="grape">
                {data?.upcomingEvents?.length || 0}
              </Badge>
            </Group>

            {isLoading ? (
              <Stack gap="sm">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={40} radius="sm" />
                ))}
              </Stack>
            ) : data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {data.upcomingEvents.slice(0, 5).map((event) => (
                  <Timeline.Item
                    key={event.id}
                    bullet={mounted && getIcon(event.icon, 12)}
                    color={event.color}
                    title={event.title}
                  >
                    <Text size="xs" c="dimmed">
                      {dayjs(event.date).fromNow()} • {dayjs(event.date).format('DD MMM, HH:mm')}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Yaklaşan etkinlik bulunmuyor
              </Text>
            )}
          </Card>
        </Grid.Col>

        {/* Quick Stats Overview */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                  {mounted && <IconTrendingUp size={18} />}
                </ThemeIcon>
                <Text fw={600}>Hızlı Bakış</Text>
              </Group>
            </Group>

            {isLoading ? (
              <Stack gap="md">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={60} radius="sm" />
                ))}
              </Stack>
            ) : data?.modules && data.modules.length > 0 ? (
              <Stack gap="md">
                {data.modules.slice(0, 4).map((module) => {
                  const mainStat = module.stats[0];
                  const secondaryStat = module.stats[1];

                  return (
                    <Paper key={module.module} p="sm" withBorder radius="sm">
                      <Group justify="space-between">
                        <Group gap="sm">
                          <ThemeIcon size="sm" radius="sm" color={module.color} variant="light">
                            {mounted && getIcon(module.icon, 14)}
                          </ThemeIcon>
                          <div>
                            <Text size="sm" fw={500}>
                              {moduleNameMap[module.module]}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {mainStat?.label}: {mainStat?.value}
                              {secondaryStat && ` • ${secondaryStat.label}: ${secondaryStat.value}`}
                            </Text>
                          </div>
                        </Group>
                        <ActionIcon
                          variant="subtle"
                          color={module.color}
                          size="sm"
                          onClick={() => router.push(`/${currentLocale}/modules/${module.module}/dashboard`)}
                        >
                          <IconExternalLink size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Aktif modül bulunmuyor
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
