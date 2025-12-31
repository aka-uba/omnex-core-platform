'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Tabs } from '@mantine/core';
import { IconClipboardList, IconEdit, IconList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useProductionOrder } from '@/hooks/useProductionOrders';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import { ProductionStepList } from '@/modules/production/components/ProductionStepList';

export function OrderDetailPageClient({ locale, orderId }: { locale: string; orderId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');
  const { data: order, isLoading } = useProductionOrder(orderId);

  if (isLoading) {
    return <DetailPageSkeleton showTabs />;
  }

  if (!order) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.notFound')}</Text>
      </Container>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`orders.status.${status}`)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return (
      <Badge color={priorityColors[priority] || 'gray'}>
        {t(`orders.priority.${priority}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={order.orderNumber}
        description={order.product?.name || t('orders.title')}
        namespace="modules/production"
        icon={<IconClipboardList size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'orders.title', href: `/${currentLocale}/modules/production/orders`, namespace: 'modules/production' },
          { label: order.orderNumber, namespace: 'modules/production' },
        ]}
        actions={[
          {
            label: t('form.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/production/orders/${orderId}/edit`);
            },
            variant: 'filled',
            color: 'blue',
          },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<IconClipboardList size={16} />}>
              {t('tabs.details')}
            </Tabs.Tab>
            <Tabs.Tab value="steps" leftSection={<IconList size={16} />}>
              {t('tabs.steps')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <Group>
                <Text fw={500} size="lg">{order.orderNumber}</Text>
                {getStatusBadge(order.status)}
                {getPriorityBadge(order.priority)}
                <Badge color={order.isActive ? 'green' : 'gray'}>
                  {order.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('orders.form.product')}</Text>
                  <Text fw={500}>{order.product?.name || '-'}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('orders.form.quantity')}</Text>
                  <Text fw={500}>{Number(order.quantity).toLocaleString('tr-TR')} {order.unit}</Text>
                </Grid.Col>
                {order.plannedStartDate && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('orders.form.plannedStartDate')}</Text>
                    <Text fw={500}>{dayjs(order.plannedStartDate).format('DD.MM.YYYY HH:mm')}</Text>
                  </Grid.Col>
                )}
                {order.plannedEndDate && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('orders.form.plannedEndDate')}</Text>
                    <Text fw={500}>{dayjs(order.plannedEndDate).format('DD.MM.YYYY HH:mm')}</Text>
                  </Grid.Col>
                )}
                {order.estimatedCost && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('orders.form.estimatedCost')}</Text>
                    <Text fw={500}>
                      {Number(order.estimatedCost).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </Text>
                  </Grid.Col>
                )}
                {order.notes && (
                  <Grid.Col span={{ base: 12 }}>
                    <Text size="sm" c="dimmed">{t('orders.form.notes')}</Text>
                    <Text>{order.notes}</Text>
                  </Grid.Col>
                )}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.createdAt')}</Text>
                  <Text fw={500}>{dayjs(order.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.updatedAt')}</Text>
                  <Text fw={500}>{dayjs(order.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="steps" pt="md">
            <ProductionStepList
              locale={currentLocale}
              orderId={orderId}
              onStepChange={() => {
                // Refresh if needed
              }}
            />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}


