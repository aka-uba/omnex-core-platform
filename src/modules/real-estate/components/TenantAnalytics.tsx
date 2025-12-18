'use client';

import {
  Paper,
  Text,
  Group,
  Stack,
  Grid,
  Progress,
  Badge,
  Button,
  Card,
  RingProgress,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconRefresh,
  IconCurrencyDollar,
  IconPhone,
  IconTools,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useTenantAnalytics, useRecalculateTenantAnalytics } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { notifications } from '@mantine/notifications';

interface TenantAnalyticsProps {
  tenantId: string;
  locale: string;
}

export function TenantAnalytics({ tenantId, locale }: TenantAnalyticsProps) {
  const { t } = useTranslation('modules/real-estate');
  // const { t: tGlobal } = useTranslation('global'); // removed - unused
  const { data: analytics, isLoading, error } = useTenantAnalytics(tenantId);
  const recalculateAnalytics = useRecalculateTenantAnalytics();

  const handleRecalculate = async () => {
    try {
      await recalculateAnalytics.mutateAsync(tenantId);
      notifications.show({
        title: t('messages.success'),
        message: t('analytics.recalculated'),
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: t('messages.error'),
        message: error instanceof Error ? error.message : (t('analytics.recalculateError')),
        color: 'red',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('analytics.excellent');
    if (score >= 60) return t('analytics.good');
    if (score >= 40) return t('analytics.fair');
    return t('analytics.poor');
  };

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Center>
          <Loader />
        </Center>
      </Paper>
    );
  }

  if (error || !analytics) {
    return (
      <Paper shadow="xs" p="md">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('messages.error')}>
          {error instanceof Error ? error.message : (t('analytics.loadError'))}
        </Alert>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>
          {t('analytics.title')}
        </Text>
        <Button
          leftSection={<IconRefresh size={18} />}
          onClick={handleRecalculate}
          loading={recalculateAnalytics.isPending}
          variant="subtle"
        >
          {t('analytics.recalculate')}
        </Button>
      </Group>

      <Grid>
        {/* Overall Score */}
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <Text c="dimmed">
                {t('analytics.overallScore')}
              </Text>
              <RingProgress
                size={120}
                thickness={12}
                sections={[{ value: analytics.overallScore, color: getScoreColor(analytics.overallScore) }]}
                label={
                  <Center>
                    <Text fw={700} c={getScoreColor(analytics.overallScore)}>
                      {Math.round(analytics.overallScore)}
                    </Text>
                  </Center>
                }
              />
              <Badge color={getScoreColor(analytics.overallScore)} variant="light">
                {getScoreLabel(analytics.overallScore)}
              </Badge>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Payment Score */}
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconCurrencyDollar size={20} />
                  <Text fw={500}>
                    {t('analytics.paymentScore')}
                  </Text>
                </Group>
                <Badge color={getScoreColor(analytics.paymentScore)} variant="light">
                  {Math.round(analytics.paymentScore)}
                </Badge>
              </Group>
              <Progress
                value={analytics.paymentScore}
                color={getScoreColor(analytics.paymentScore)}
                radius="xl"
              />
              <Text c="dimmed">
                {t('analytics.onTimeRate')?.replace('{{rate}}', analytics.paymentHistory.onTimeRate.toFixed(1)) ||
                  `${analytics.paymentHistory.onTimeRate.toFixed(1)}% on-time`}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Contact Score */}
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconPhone size={20} />
                  <Text fw={500}>
                    {t('analytics.contactScore')}
                  </Text>
                </Group>
                <Badge color={getScoreColor(analytics.contactScore)} variant="light">
                  {Math.round(analytics.contactScore)}
                </Badge>
              </Group>
              <Progress
                value={analytics.contactScore}
                color={getScoreColor(analytics.contactScore)}
                radius="xl"
              />
              <Text c="dimmed">
                {t('analytics.appointments')?.replace('{{total}}', analytics.appointmentHistory.total.toString()) ||
                  `${analytics.appointmentHistory.total} appointments`}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Maintenance Score */}
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconTools size={20} />
                  <Text fw={500}>
                    {t('analytics.maintenanceScore')}
                  </Text>
                </Group>
                <Badge color={getScoreColor(analytics.maintenanceScore)} variant="light">
                  {Math.round(analytics.maintenanceScore)}
                </Badge>
              </Group>
              <Progress
                value={analytics.maintenanceScore}
                color={getScoreColor(analytics.maintenanceScore)}
                radius="xl"
              />
              <Text c="dimmed">
                {t('analytics.maintenanceRecords')?.replace('{{total}}', analytics.maintenanceHistory.total.toString()) ||
                  `${analytics.maintenanceHistory.total} records`}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Detailed Statistics */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Text fw={500} mb="md">
              {t('analytics.paymentHistory')}
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text>{t('analytics.totalPayments')}</Text>
                <Text fw={500}>
                  {analytics.paymentHistory.total}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.paid')}</Text>
                <Badge color="green">{analytics.paymentHistory.paid}</Badge>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.pending')}</Text>
                <Badge color="yellow">{analytics.paymentHistory.pending}</Badge>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.overdue')}</Text>
                <Badge color="red">{analytics.paymentHistory.overdue}</Badge>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Text fw={500} mb="md">
              {t('analytics.contractHistory')}
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text>{t('analytics.totalContracts')}</Text>
                <Text fw={500}>
                  {analytics.contractHistory.total}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.active')}</Text>
                <Badge color="green">{analytics.contractHistory.active}</Badge>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.expired')}</Text>
                <Badge color="gray">{analytics.contractHistory.expired}</Badge>
              </Group>
              <Group justify="space-between">
                <Text>{t('analytics.terminated')}</Text>
                <Badge color="red">{analytics.contractHistory.terminated}</Badge>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

