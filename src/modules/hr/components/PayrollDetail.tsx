'use client';

import { Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { usePayroll } from '@/hooks/usePayrolls';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import type { PayrollStatus } from '@/modules/hr/types/hr';

interface PayrollDetailProps {
  locale: string;
  payrollId: string;
}

export function PayrollDetail({ locale: _locale, payrollId }: PayrollDetailProps) {
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { data: payroll, isLoading } = usePayroll(payrollId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!payroll) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('payrolls.notFound')}</Text>
      </Paper>
    );
  }

  const getStatusBadge = (status: PayrollStatus) => {
    const statusColors: Record<PayrollStatus, string> = {
      draft: 'gray',
      approved: 'blue',
      paid: 'green',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payrolls.status.${status}`) || status}
      </Badge>
    );
  };

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group>
          <Text fw={500} size="lg">
            {payroll.employee?.user?.name || payroll.employee?.employeeNumber || '-'} - {payroll.period}
          </Text>
          {getStatusBadge(payroll.status)}
        </Group>

        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.employee')}</Text>
              <Text fw={500}>{payroll.employee?.user?.name || payroll.employee?.employeeNumber || '-'}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.period')}</Text>
              <Text fw={500}>{payroll.period}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.payDate')}</Text>
              <Text fw={500}>{dayjs(payroll.payDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.status')}</Text>
              <Text fw={500}>{getStatusBadge(payroll.status)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.grossSalary')}</Text>
              <Text fw={500}>
                {Number(payroll.grossSalary).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.deductions')}</Text>
              <Text fw={500}>
                {Number(payroll.deductions).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </Grid.Col>
            {payroll.taxDeduction && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('payrolls.form.taxDeduction')}</Text>
                <Text fw={500}>
                  {Number(payroll.taxDeduction).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            {payroll.sgkDeduction && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('payrolls.form.sgkDeduction')}</Text>
                <Text fw={500}>
                  {Number(payroll.sgkDeduction).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            {payroll.otherDeductions && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="sm" c="dimmed">{t('payrolls.form.otherDeductions')}</Text>
                <Text fw={500}>
                  {Number(payroll.otherDeductions).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            {payroll.bonuses > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('payrolls.form.bonuses')}</Text>
                <Text fw={500}>
                  {Number(payroll.bonuses).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            {payroll.overtime > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('payrolls.form.overtime')}</Text>
                <Text fw={500}>
                  {Number(payroll.overtime).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('payrolls.form.netSalary')}</Text>
              <Text fw={500} size="lg" c="green">
                {Number(payroll.netSalary).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Text>
            </Grid.Col>
            {payroll.notes && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">{t('payrolls.form.notes')}</Text>
                <Text>{payroll.notes}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(payroll.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{tGlobal('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(payroll.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}







