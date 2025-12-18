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
import { useCreateLeave, useUpdateLeave, useLeave } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { leaveCreateSchema } from '@/modules/hr/schemas/hr.schema';
import type { LeaveType, LeaveStatus } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface LeaveFormProps {
  locale: string;
  leaveId?: string;
}

export function LeaveForm({ locale, leaveId }: LeaveFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const createLeave = useCreateLeave();
  const updateLeave = useUpdateLeave();
  const { data: leaveData, isLoading: isLoadingLeave } = useLeave(leaveId || '');

  // Fetch employees for selection
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!leaveId;

  const form = useForm({
    initialValues: {
      employeeId: '',
      type: 'annual' as LeaveType,
      startDate: new Date(),
      endDate: new Date(),
      days: 1,
      reason: '',
      status: 'pending' as LeaveStatus,
    },
    validate: {
      employeeId: (value) => (!value ? t('leaves.form.employee') + ' ' + tGlobal('common.required') : null),
      type: (value) => (!value ? t('leaves.form.type') + ' ' + tGlobal('common.required') : null),
      startDate: (value) => (!value ? t('leaves.form.startDate') + ' ' + tGlobal('common.required') : null),
      endDate: (value, values) => {
        if (!value) return t('leaves.form.endDate') + ' ' + tGlobal('common.required');
        if (values.startDate && value < values.startDate) {
          return t('leaves.form.endDateAfterStart');
        }
        return null;
      },
      days: (value) => (!value || value < 1 ? t('leaves.form.days') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Calculate days when dates change
  useEffect(() => {
    if (form.values.startDate && form.values.endDate) {
      const days = Math.ceil((form.values.endDate.getTime() - form.values.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 0) {
        form.setFieldValue('days', days);
      }
    }
  }, [form.values.startDate, form.values.endDate]);

  // Load leave data for edit
  useEffect(() => {
    if (isEdit && leaveData && !isLoadingLeave) {
      if (form.values.employeeId === '') {
        form.setValues({
          employeeId: leaveData.employeeId,
          type: leaveData.type,
          startDate: new Date(leaveData.startDate),
          endDate: new Date(leaveData.endDate),
          days: leaveData.days,
          reason: leaveData.reason || '',
          status: leaveData.status,
        });
      }
    }
  }, [isEdit, leaveData, isLoadingLeave, form.values.employeeId]);

  // Get employees for selection
  const employeeOptions: Array<{ value: string; label: string }> = 
    (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        employeeId: values.employeeId,
        type: values.type,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        days: values.days,
        reason: values.reason || undefined,
      };

      const validatedData = leaveCreateSchema.parse(formData);

      if (isEdit && leaveId) {
        await updateLeave.mutateAsync({
          id: leaveId,
          ...(validatedData as any),
          status: values.status,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('leaves.updateSuccess'),
        });
      } else {
        await createLeave.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('leaves.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/hr/leaves`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingLeave) {
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
            onClick={() => router.push(`/${locale}/modules/hr/leaves`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('leaves.form.employee')}
                placeholder={t('leaves.form.employeePlaceholder')}
                data={employeeOptions}
                searchable
                required
                disabled={isEdit}
                {...form.getInputProps('employeeId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('leaves.form.type')}
                placeholder={t('leaves.form.typePlaceholder')}
                data={[
                  { value: 'annual', label: t('leaves.types.annual') },
                  { value: 'sick', label: t('leaves.types.sick') },
                  { value: 'unpaid', label: t('leaves.types.unpaid') },
                  { value: 'maternity', label: t('leaves.types.maternity') },
                ]}
                required
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DatePickerInput
                label={t('leaves.form.startDate')}
                placeholder={t('leaves.form.startDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('startDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DatePickerInput
                label={t('leaves.form.endDate')}
                placeholder={t('leaves.form.endDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('endDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('leaves.form.days')}
                placeholder={t('leaves.form.daysPlaceholder')}
                min={1}
                required
                {...form.getInputProps('days')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('leaves.form.reason')}
                placeholder={t('leaves.form.reasonPlaceholder')}
                rows={3}
                {...form.getInputProps('reason')}
              />
            </Grid.Col>

            {isEdit && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('leaves.form.status')}
                  placeholder={t('leaves.form.statusPlaceholder')}
                  data={[
                    { value: 'pending', label: t('leaves.status.pending') },
                    { value: 'approved', label: t('leaves.status.approved') },
                    { value: 'rejected', label: t('leaves.status.rejected') },
                  ]}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>
            )}
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/hr/leaves`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createLeave.isPending || updateLeave.isPending}
            >
              {isEdit ? tGlobal('form.save') : tGlobal('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

