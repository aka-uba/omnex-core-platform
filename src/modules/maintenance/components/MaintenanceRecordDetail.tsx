'use client';

import { Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { useMaintenanceRecord } from '@/hooks/useMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/maintenance/types/maintenance';

interface MaintenanceRecordDetailProps {
  locale: string;
  recordId: string;
}

export function MaintenanceRecordDetail({ locale: _locale, recordId }: MaintenanceRecordDetailProps) {
  const { t } = useTranslation('modules/maintenance');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const { data: record, isLoading } = useMaintenanceRecord(recordId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!record) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('notFound')}</Text>
      </Paper>
    );
  }

  const getTypeBadge = (type: MaintenanceType) => {
    const typeColors: Record<MaintenanceType, string> = {
      preventive: 'blue',
      corrective: 'orange',
      emergency: 'red',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    const statusColors: Record<MaintenanceStatus, string> = {
      scheduled: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`status.${status}`) || status}
      </Badge>
    );
  };

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group>
          <Text fw={500} size="lg">{record.title}</Text>
          {getTypeBadge(record.type)}
          {getStatusBadge(record.status)}
          <Badge color={record.isActive ? 'green' : 'gray'}>
            {record.isActive ? (tGlobal('status.active')) : (tGlobal('status.inactive'))}
          </Badge>
        </Group>

        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.location')}</Text>
              <Text fw={500}>{record.location?.name || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.equipment')}</Text>
              <Text fw={500}>
                {record.equipment?.name || '-'}
                {record.equipment?.code && ` (${record.equipment.code})`}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.type')}</Text>
              <Text fw={500}>{getTypeBadge(record.type)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.status')}</Text>
              <Text fw={500}>{getStatusBadge(record.status)}</Text>
            </Grid.Col>
            {record.description && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">{t('form.description')}</Text>
                <Text>{record.description}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" c="dimmed">{t('form.scheduledDate')}</Text>
              <Text fw={500}>{dayjs(record.scheduledDate).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            {record.startDate && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('form.startDate')}</Text>
                <Text fw={500}>{dayjs(record.startDate).format('DD.MM.YYYY HH:mm')}</Text>
              </Grid.Col>
            )}
            {record.endDate && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('form.endDate')}</Text>
                <Text fw={500}>{dayjs(record.endDate).format('DD.MM.YYYY HH:mm')}</Text>
              </Grid.Col>
            )}
            {record.estimatedCost && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('form.estimatedCost')}</Text>
                <Text fw={500}>
                  {formatCurrency(Number(record.estimatedCost))}
                </Text>
              </Grid.Col>
            )}
            {record.actualCost && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('form.actualCost')}</Text>
                <Text fw={500}>
                  {formatCurrency(Number(record.actualCost))}
                </Text>
              </Grid.Col>
            )}
            {record.notes && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">{t('form.notes')}</Text>
                <Text>{record.notes}</Text>
              </Grid.Col>
            )}
            {record.documents && record.documents.length > 0 && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">{t('form.documents')}</Text>
                <Group gap="xs" mt="xs">
                  {record.documents.map((doc, index) => (
                    <Badge key={index} variant="light">
                      {doc}
                    </Badge>
                  ))}
                </Group>
              </Grid.Col>
            )}
            {/* File Management Section - Using Core File Manager */}
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed" mb="xs">{t('form.documents')}</Text>
              <Paper withBorder p="md" radius="md">
                <Text size="xs" c="dimmed">
                  {t('form.documentsDescription')}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(record.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(record.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}

