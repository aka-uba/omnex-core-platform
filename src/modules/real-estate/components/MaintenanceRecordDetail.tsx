'use client';

import {
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Title,
  Grid,
  Divider,
} from '@mantine/core';
import { IconCalendar, IconCurrencyDollar } from '@tabler/icons-react';
import { useRealEstateMaintenanceRecord } from '@/hooks/useRealEstateMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/real-estate/types/maintenance-record';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface MaintenanceRecordDetailProps {
  locale: string;
  recordId: string;
}

export function MaintenanceRecordDetail({ locale, recordId }: MaintenanceRecordDetailProps) {
  const { t } = useTranslation('modules/real-estate');
  const { formatCurrency } = useCurrency();
  const { data: record, isLoading, error } = useRealEstateMaintenanceRecord(recordId);

  const getTypeBadge = (type: MaintenanceType) => {
    const typeColors: Record<MaintenanceType, string> = {
      preventive: 'blue',
      corrective: 'orange',
      emergency: 'red',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`maintenance.types.${type}`) || type}
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
        {t(`maintenance.status.${status}`) || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !record) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Paper>
    );
  }

  const apartment = (record as any).apartment;

  return (
    <Paper shadow="xs" p="md" mt="md">
      <Stack gap="md">
        <Title order={2}>{record.title}</Title>
        <Divider />

        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.type')}
            </Text>
            {getTypeBadge(record.type)}
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.status')}
            </Text>
            {getStatusBadge(record.status)}
          </Grid.Col>

          <Grid.Col span={12}>
            <Text size="sm" c="dimmed">
              {t('form.apartment')}
            </Text>
            <Text fw={500}>
              {apartment
                ? `${apartment.unitNumber} - ${apartment.property?.name || ''}`
                : '-'}
            </Text>
          </Grid.Col>

          {apartment && (
            <>
              {apartment.property && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('apartments.propertyManager')}
                  </Text>
                  <Text fw={500}>{apartment.property.name || '-'}</Text>
                </Grid.Col>
              )}
              {apartment.property?.address && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('apartments.details')}
                  </Text>
                  <Text fw={500}>
                    {apartment.property.address.street || ''} {apartment.property.address.houseNumber || ''}
                    {apartment.property.address.postalCode ? `, ${apartment.property.address.postalCode}` : ''}
                    {apartment.property.address.city ? ` ${apartment.property.address.city}` : ''}
                  </Text>
                </Grid.Col>
              )}
              {apartment.currentTenant && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('apartments.currentTenant')}
                  </Text>
                  <Text fw={500}>
                    {apartment.currentTenant.firstName || ''} {apartment.currentTenant.lastName || ''}
                  </Text>
                </Grid.Col>
              )}
              {apartment.managedByStaff && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('apartments.managedBy')}
                  </Text>
                  <Text fw={500}>
                    {apartment.managedByStaff.name || '-'}
                  </Text>
                </Grid.Col>
              )}
            </>
          )}

          {record.description && (
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed">
                {t('form.description')}
              </Text>
              <Text>{record.description}</Text>
            </Grid.Col>
          )}

          <Grid.Col span={6}>
            <Group gap="xs">
              <IconCalendar size={16} />
              <div>
                <Text size="sm" c="dimmed">
                  {t('form.scheduledDate')}
                </Text>
                <Text fw={500}>{dayjs(record.scheduledDate).format('DD.MM.YYYY HH:mm')}</Text>
              </div>
            </Group>
          </Grid.Col>

          {record.startDate && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCalendar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.startDate')}
                  </Text>
                  <Text fw={500}>{dayjs(record.startDate).format('DD.MM.YYYY HH:mm')}</Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {record.endDate && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCalendar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.endDate')}
                  </Text>
                  <Text fw={500}>{dayjs(record.endDate).format('DD.MM.YYYY HH:mm')}</Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {record.estimatedCost && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCurrencyDollar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.estimatedCost') || t('table.estimatedCost')}
                  </Text>
                  <Text fw={500}>
                    {formatCurrency(Number(record.estimatedCost))}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {record.actualCost && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCurrencyDollar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.actualCost')}
                  </Text>
                  <Text fw={500}>
                    {formatCurrency(Number(record.actualCost))}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {record.notes && (
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed">
                {t('form.notes')}
              </Text>
              <Text>{record.notes}</Text>
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </Paper>
  );
}


