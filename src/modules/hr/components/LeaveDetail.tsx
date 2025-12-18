'use client';

import { Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { useLeave } from '@/hooks/useLeaves';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import type { LeaveType, LeaveStatus } from '@/modules/hr/types/hr';

interface LeaveDetailProps {
  locale: string;
  leaveId: string;
}

export function LeaveDetail({ locale: _locale, leaveId }: LeaveDetailProps) {
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { data: leave, isLoading } = useLeave(leaveId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!leave) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('leaves.notFound')}</Text>
      </Paper>
    );
  }

  const getTypeBadge = (type: LeaveType) => {
    const typeColors: Record<LeaveType, string> = {
      annual: 'blue',
      sick: 'red',
      unpaid: 'orange',
      maternity: 'purple',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`leaves.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const statusColors: Record<LeaveStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`leaves.status.${status}`) || status}
      </Badge>
    );
  };

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group>
          <Text fw={500} size="lg">
            {leave.employee?.user?.name || leave.employee?.employeeNumber || '-'} - {t(`leaves.types.${leave.type}`) || leave.type}
          </Text>
          {getTypeBadge(leave.type)}
          {getStatusBadge(leave.status)}
        </Group>

        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.employee')}</Text>
              <Text fw={500}>{leave.employee?.user?.name || leave.employee?.employeeNumber || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.type')}</Text>
              <Text fw={500}>{getTypeBadge(leave.type)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.status')}</Text>
              <Text fw={500}>{getStatusBadge(leave.status)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.days')}</Text>
              <Text fw={500}>{leave.days}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.startDate')}</Text>
              <Text fw={500}>{dayjs(leave.startDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" c="dimmed">{t('leaves.form.endDate')}</Text>
              <Text fw={500}>{dayjs(leave.endDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            {leave.approvedAt && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('leaves.form.approvedAt')}</Text>
                <Text fw={500}>{dayjs(leave.approvedAt).format('DD.MM.YYYY HH:mm')}</Text>
              </Grid.Col>
            )}
            {leave.reason && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">{t('leaves.form.reason')}</Text>
                <Text>{leave.reason}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(leave.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(leave.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}







