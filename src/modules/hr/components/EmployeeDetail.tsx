'use client';

import { Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { useEmployee } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import type { WorkType } from '@/modules/hr/types/hr';

interface EmployeeDetailProps {
  locale: string;
  employeeId: string;
}

export function EmployeeDetail({ locale: _locale, employeeId }: EmployeeDetailProps) {
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const { data: employee, isLoading } = useEmployee(employeeId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!employee) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('employees.notFound')}</Text>
      </Paper>
    );
  }

  const getWorkTypeBadge = (workType: WorkType) => {
    const workTypeColors: Record<WorkType, string> = {
      full_time: 'blue',
      part_time: 'yellow',
      contract: 'orange',
    };
    return (
      <Badge color={workTypeColors[workType] || 'gray'}>
        {t(`employees.workTypes.${workType}`) || workType}
      </Badge>
    );
  };

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group>
          <Text fw={500} size="lg">{employee.user?.name || '-'}</Text>
          {getWorkTypeBadge(employee.workType)}
          <Badge color={employee.isActive ? 'green' : 'gray'}>
            {employee.isActive ? (tGlobal('status.active')) : (tGlobal('status.inactive'))}
          </Badge>
        </Group>

        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.employeeNumber')}</Text>
              <Text fw={500}>{employee.employeeNumber}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.name')}</Text>
              <Text fw={500}>{employee.user?.name || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.email')}</Text>
              <Text fw={500}>{employee.user?.email || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.phone')}</Text>
              <Text fw={500}>{employee.user?.phone || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.department')}</Text>
              <Text fw={500}>{employee.department}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.position')}</Text>
              <Text fw={500}>{employee.position}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.workType')}</Text>
              <Text fw={500}>{getWorkTypeBadge(employee.workType)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('employees.form.hireDate')}</Text>
              <Text fw={500}>{dayjs(employee.hireDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            {employee.manager && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('employees.form.manager')}</Text>
                <Text fw={500}>{employee.manager.name || '-'}</Text>
              </Grid.Col>
            )}
            {employee.salary && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('employees.form.salary')}</Text>
                <Text fw={500}>
                  {formatCurrency(Number(employee.salary))}
                </Text>
              </Grid.Col>
            )}
            {employee.salaryGroup && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('employees.form.salaryGroup')}</Text>
                <Text fw={500}>{employee.salaryGroup}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(employee.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(employee.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}

