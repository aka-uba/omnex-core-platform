'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { IconRepeat, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useSubscription } from '@/hooks/useSubscriptions';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

export function SubscriptionDetailPageClient({ locale, subscriptionId }: { locale: string; subscriptionId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');
  const { data: subscription, isLoading } = useSubscription(subscriptionId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!subscription) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      rental: 'blue',
      subscription: 'green',
      commission: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`subscriptions.types.${type}`)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'green',
      suspended: 'yellow',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`subscriptions.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={subscription.name}
        description={t(`subscriptions.types.${subscription.type}`)}
        namespace="modules/accounting"
        icon={<IconRepeat size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'subscriptions.title', href: `/${currentLocale}/modules/accounting/subscriptions`, namespace: 'modules/accounting' },
          { label: subscription.name, namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('form.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/accounting/subscriptions/${subscriptionId}/edit`);
            },
            variant: 'filled',
            color: 'blue',
          },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Stack gap="md">
          <Group>
            <Text fw={500} size="lg">{subscription.name}</Text>
            {getTypeBadge(subscription.type)}
            {getStatusBadge(subscription.status)}
            <Badge color={subscription.isActive ? 'green' : 'gray'}>
              {subscription.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('subscriptions.form.basePrice')}</Text>
              <Text fw={500}>
                {Number(subscription.basePrice).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: subscription.currency || 'TRY',
                })}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('subscriptions.form.billingCycle')}</Text>
              <Text fw={500}>
                {t(`subscriptions.billingCycle.${subscription.billingCycle}`)}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('subscriptions.form.startDate')}</Text>
              <Text fw={500}>{dayjs(subscription.startDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('subscriptions.form.endDate')}</Text>
              <Text fw={500}>
                {subscription.endDate ? dayjs(subscription.endDate).format('DD.MM.YYYY') : '-'}
              </Text>
            </Grid.Col>
            {subscription.description && (
              <Grid.Col span={{ base: 12 }}>
                <Text size="sm" c="dimmed">{t('subscriptions.form.description')}</Text>
                <Text>{subscription.description}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(subscription.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(subscription.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
}








