'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Textarea,
  Loader,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreatePayroll, useUpdatePayroll, usePayroll } from '@/hooks/usePayrolls';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { payrollCreateSchema } from '@/modules/hr/schemas/hr.schema';
import type { PayrollStatus } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface PayrollFormProps {
  locale: string;
  payrollId?: string;
}

export function PayrollForm({ locale, payrollId }: PayrollFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const { data: payrollData, isLoading: isLoadingPayroll } = usePayroll(payrollId || '');

  // Fetch employees for selection
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!payrollId;

  const form = useForm({
    initialValues: {
      employeeId: '',
      period: dayjs().format('YYYY-MM'),
      payDate: new Date(),
      grossSalary: 0,
      deductions: 0,
      netSalary: 0,
      taxDeduction: null as number | null,
      sgkDeduction: null as number | null,
      otherDeductions: null as number | null,
      bonuses: 0,
      overtime: 0,
      status: 'draft' as PayrollStatus,
      notes: '',
    },
    validate: {
      employeeId: (value) => (!value ? t('payrolls.form.employee') + ' ' + tGlobal('common.required') : null),
      period: (value) => (!value ? t('payrolls.form.period') + ' ' + tGlobal('common.required') : null),
      payDate: (value) => (!value ? t('payrolls.form.payDate') + ' ' + tGlobal('common.required') : null),
      grossSalary: (value) => (!value || value < 0 ? t('payrolls.form.grossSalary') + ' ' + tGlobal('common.required') : null),
      netSalary: (value) => (!value || value < 0 ? t('payrolls.form.netSalary') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Calculate net salary when gross salary or deductions change
  useEffect(() => {
    const gross = form.values.grossSalary || 0;
    const deductions = form.values.deductions || 0;
    const bonuses = form.values.bonuses || 0;
    const overtime = form.values.overtime || 0;
    const net = gross - deductions + bonuses + overtime;
    if (net >= 0) {
      form.setFieldValue('netSalary', net);
    }
  }, [form.values.grossSalary, form.values.deductions, form.values.bonuses, form.values.overtime]);

  // Load payroll data for edit
  useEffect(() => {
    if (isEdit && payrollData && !isLoadingPayroll) {
      if (form.values.employeeId === '') {
        form.setValues({
          employeeId: payrollData.employeeId,
          period: payrollData.period,
          payDate: new Date(payrollData.payDate),
          grossSalary: payrollData.grossSalary,
          deductions: payrollData.deductions,
          netSalary: payrollData.netSalary,
          taxDeduction: payrollData.taxDeduction || null,
          sgkDeduction: payrollData.sgkDeduction || null,
          otherDeductions: payrollData.otherDeductions || null,
          bonuses: payrollData.bonuses,
          overtime: payrollData.overtime,
          status: payrollData.status,
          notes: payrollData.notes || '',
        });
      }
    }
  }, [isEdit, payrollData, isLoadingPayroll, form.values.employeeId]);

  // Get employees for selection
  const employeeOptions: Array<{ value: string; label: string }> = 
    (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = dayjs().subtract(i, 'month');
    const value = date.format('YYYY-MM');
    const label = date.format('MMMM YYYY');
    return { value, label };
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        employeeId: values.employeeId,
        period: values.period,
        payDate: values.payDate.toISOString(),
        grossSalary: values.grossSalary,
        deductions: values.deductions || 0,
        netSalary: values.netSalary,
        taxDeduction: values.taxDeduction ?? undefined,
        sgkDeduction: values.sgkDeduction ?? undefined,
        otherDeductions: values.otherDeductions ?? undefined,
        bonuses: values.bonuses || 0,
        overtime: values.overtime || 0,
        status: values.status,
        notes: values.notes || undefined,
      };

      const validatedData = payrollCreateSchema.parse(formData);

      if (isEdit && payrollId) {
        await updatePayroll.mutateAsync({
          id: payrollId,
          ...(validatedData as any),
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('payrolls.updateSuccess'),
        });
      } else {
        await createPayroll.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('payrolls.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/hr/payrolls`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingPayroll) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/hr/payrolls`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('payrolls.form.employee')}
                placeholder={t('payrolls.form.employeePlaceholder')}
                data={employeeOptions}
                searchable
                required
                disabled={isEdit}
                {...form.getInputProps('employeeId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('payrolls.form.period')}
                placeholder={t('payrolls.form.periodPlaceholder')}
                data={periodOptions}
                required
                {...form.getInputProps('period')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('payrolls.form.payDate')}
                placeholder={t('payrolls.form.payDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('payDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('payrolls.form.grossSalary')}
                placeholder={t('payrolls.form.grossSalaryPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                required
                {...form.getInputProps('grossSalary')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('payrolls.form.deductions')}
                placeholder={t('payrolls.form.deductionsPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('deductions')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('payrolls.form.bonuses')}
                placeholder={t('payrolls.form.bonusesPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('bonuses')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('payrolls.form.overtime')}
                placeholder={t('payrolls.form.overtimePlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('overtime')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('payrolls.form.taxDeduction')}
                placeholder={t('payrolls.form.taxDeductionPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('taxDeduction')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('payrolls.form.sgkDeduction')}
                placeholder={t('payrolls.form.sgkDeductionPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('sgkDeduction')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('payrolls.form.otherDeductions')}
                placeholder={t('payrolls.form.otherDeductionsPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('otherDeductions')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('payrolls.form.netSalary')}
                placeholder={t('payrolls.form.netSalaryPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                required
                readOnly
                {...form.getInputProps('netSalary')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('payrolls.form.status')}
                placeholder={t('payrolls.form.statusPlaceholder')}
                data={[
                  { value: 'draft', label: t('payrolls.status.draft') },
                  { value: 'approved', label: t('payrolls.status.approved') },
                  { value: 'paid', label: t('payrolls.status.paid') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('payrolls.form.notes')}
                placeholder={t('payrolls.form.notesPlaceholder')}
                rows={3}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/hr/payrolls`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createPayroll.isPending || updatePayroll.isPending}
            >
              {isEdit ? tGlobal('form.save') : tGlobal('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

