'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Divider, Progress, Code } from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { IconPackage } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useBulkOperation } from '@/hooks/useBulkOperations';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { BulkOperationType } from '@/modules/real-estate/types/bulk-operation';

export function BulkOperationDetailPageClient({ locale, operationId }: { locale: string; operationId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: operation, isLoading, error } = useBulkOperation(operationId);

  if (error || (!isLoading && !operation)) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('bulkOperations.detail.title')}
          description={t('bulkOperations.detail.description')}
          namespace="modules/real-estate"
          icon={<IconPackage size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
            { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
            { label: t('bulkOperations.title'), href: `/${currentLocale}/modules/real-estate/bulk-operations`, namespace: 'modules/real-estate' },
            { label: t('bulkOperations.detail.title'), namespace: 'modules/real-estate' },
          ]}
        />
        <Text c="red" mt="md">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: BulkOperationType) => {
    const typeColors: Record<BulkOperationType, string> = {
      rent_increase: 'blue',
      fee_update: 'green',
      status_update: 'orange',
      contract_renewal: 'purple',
      payment_generate: 'cyan',
      custom: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`bulkOperations.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`bulkOperations.status.${status}`) || status}
      </Badge>
    );
  };

  const getProgressPercent = () => {
    if (!operation) return 0;
    const total = operation.affectedCount || 1;
    const done = (operation.successCount || 0) + (operation.failedCount || 0);
    return Math.round((done / total) * 100);
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('bulkOperations.detail.title')}
        description={t('bulkOperations.detail.description')}
        namespace="modules/real-estate"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('bulkOperations.title'), href: `/${currentLocale}/modules/real-estate/bulk-operations`, namespace: 'modules/real-estate' },
          { label: t('bulkOperations.detail.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[]}
      />

      {isLoading ? (
        <DetailPageSkeleton />
      ) : operation ? (
        <Paper shadow="xs" p="md" mt="md">
          <Stack gap="xl">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text fw={700} size="xl">{operation.title}</Text>
                <Group>
                  {getTypeBadge(operation.type)}
                  {getStatusBadge(operation.status)}
                </Group>
              </Stack>
            </Group>

            {operation.description && (
              <Text c="dimmed">{operation.description}</Text>
            )}

            <Divider />

            {/* Progress Section */}
            <Stack gap="md">
              <Text fw={600} size="lg">{t('bulkOperations.detail.progress')}</Text>
              <Progress value={getProgressPercent()} size="xl" striped animated={operation.status === 'processing'} />
              <Grid>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.totalAffected')}</Text>
                  <Text fw={500} size="lg">{operation.affectedCount}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.successCount')}</Text>
                  <Text fw={500} size="lg" c="green">{operation.successCount}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.failedCount')}</Text>
                  <Text fw={500} size="lg" c="red">{operation.failedCount}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.progressPercent')}</Text>
                  <Text fw={500} size="lg">{getProgressPercent()}%</Text>
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Parameters Section */}
            <Stack gap="md">
              <Text fw={600} size="lg">{t('bulkOperations.detail.parameters')}</Text>
              <Code block>
                {JSON.stringify(operation.parameters, null, 2)}
              </Code>
            </Stack>

            {/* Results Section */}
            {operation.results && (
              <>
                <Divider />
                <Stack gap="md">
                  <Text fw={600} size="lg">{t('bulkOperations.detail.results')}</Text>
                  <Code block>
                    {JSON.stringify(operation.results, null, 2)}
                  </Code>
                </Stack>
              </>
            )}

            {/* Timing Information */}
            <Divider />
            <Stack gap="md">
              <Text fw={600} size="lg">{t('bulkOperations.detail.timing')}</Text>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.createdAt')}</Text>
                  <Text fw={500}>{dayjs(operation.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
                {operation.startedAt && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('bulkOperations.detail.startedAt')}</Text>
                    <Text fw={500}>{dayjs(operation.startedAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Grid.Col>
                )}
                {operation.completedAt && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('bulkOperations.detail.completedAt')}</Text>
                    <Text fw={500}>{dayjs(operation.completedAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Grid.Col>
                )}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('bulkOperations.detail.updatedAt')}</Text>
                  <Text fw={500}>{dayjs(operation.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Container>
  );
}
