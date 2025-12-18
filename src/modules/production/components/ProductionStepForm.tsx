'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  NumberInput,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useCreateProductionStep, useUpdateProductionStep, useProductionStep } from '@/hooks/useProductionSteps';
import { useTranslation } from '@/lib/i18n/client';
import type { ProductionStepStatus } from '@/modules/production/types/product';

interface ProductionStepFormProps {
  locale: string;
  orderId: string;
  stepId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductionStepForm({ locale, orderId, stepId, onSuccess, onCancel }: ProductionStepFormProps) {
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const createStep = useCreateProductionStep();
  const updateStep = useUpdateProductionStep();
  const { data: stepData } = useProductionStep(stepId || '');

  const isEdit = !!stepId;

  const form = useForm({
    initialValues: {
      orderId: orderId,
      stepNumber: 1,
      name: '',
      description: '',
      status: 'pending' as ProductionStepStatus,
      plannedStart: null as Date | null,
      plannedEnd: null as Date | null,
      assignedTo: '',
      laborHours: null as number | null,
      notes: '',
      actualStart: null as Date | null,
      actualEnd: null as Date | null,
    },
    validate: {
      stepNumber: (value) => (value < 1 ? t('steps.form.stepNumber') + ' ' + t('steps.form.stepNumberMinError') : null),
      name: (value) => (!value ? t('steps.form.name') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load step data for edit
  useEffect(() => {
    if (isEdit && stepData?.step) {
      const step = stepData.step;
      form.setValues({
        orderId: step.orderId,
        stepNumber: step.stepNumber,
        name: step.name,
        description: step.description || '',
        status: step.status,
        plannedStart: step.plannedStart ? new Date(step.plannedStart) : null,
        plannedEnd: step.plannedEnd ? new Date(step.plannedEnd) : null,
        assignedTo: step.assignedTo || '',
        laborHours: step.laborHours ?? null,
        notes: step.notes || '',
        actualStart: step.actualStart ? new Date(step.actualStart) : null,
        actualEnd: step.actualEnd ? new Date(step.actualEnd) : null,
      });
    }
  }, [isEdit, stepData]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const submitData = {
        orderId: values.orderId,
        stepNumber: values.stepNumber,
        name: values.name,
        description: values.description || null,
        status: values.status,
        plannedStart: values.plannedStart?.toISOString() || null,
        plannedEnd: values.plannedEnd?.toISOString() || null,
        assignedTo: values.assignedTo || null,
        laborHours: values.laborHours || null,
        notes: values.notes || null,
        actualStart: values.actualStart?.toISOString() || null,
        actualEnd: values.actualEnd?.toISOString() || null,
      };

      if (isEdit && stepId) {
        await updateStep.mutateAsync({
          id: stepId,
          data: submitData,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('steps.update.success'),
        });
      } else {
        await createStep.mutateAsync(submitData);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('steps.create.success'),
        });
      }
      onSuccess();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('steps.save.error'),
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Group grow>
          <NumberInput
            label={t('steps.form.stepNumber')}
            {...form.getInputProps('stepNumber')}
            min={1}
            required
          />

          <Select
            label={t('steps.form.status')}
            data={[
              { value: 'pending', label: t('steps.status.pending') },
              { value: 'in_progress', label: t('steps.status.in_progress') },
              { value: 'completed', label: t('steps.status.completed') },
              { value: 'cancelled', label: t('steps.status.cancelled') },
            ]}
            {...form.getInputProps('status')}
            required
          />
        </Group>

        <TextInput
          label={t('steps.form.name')}
          {...form.getInputProps('name')}
          required
        />

        <Textarea
          label={t('steps.form.description')}
          {...form.getInputProps('description')}
          rows={3}
        />

        <Group grow>
          <DatePickerInput
            label={t('steps.form.plannedStart')}
            {...form.getInputProps('plannedStart')}
            clearable
           locale={dayjsLocale} />

          <DatePickerInput
            label={t('steps.form.plannedEnd')}
            {...form.getInputProps('plannedEnd')}
            clearable
           locale={dayjsLocale} />
        </Group>

        <Group grow>
          <TextInput
            label={t('steps.form.assignedTo')}
            {...form.getInputProps('assignedTo')}
            placeholder={t('steps.form.assignedToPlaceholder')}
          />

          <NumberInput
            label={t('steps.form.laborHours')}
            {...form.getInputProps('laborHours')}
            min={0}
            decimalScale={2}
          />
        </Group>

        <Group grow>
          <DatePickerInput
            label={t('steps.form.actualStart')}
            {...form.getInputProps('actualStart')}
            clearable
           locale={dayjsLocale} />

          <DatePickerInput
            label={t('steps.form.actualEnd')}
            {...form.getInputProps('actualEnd')}
            clearable
           locale={dayjsLocale} />
        </Group>

        <Textarea
          label={t('steps.form.notes')}
          {...form.getInputProps('notes')}
          rows={3}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            {tGlobal('form.cancel')}
          </Button>
          <Button type="submit" loading={createStep.isPending || updateStep.isPending}>
            {isEdit ? tGlobal('form.save') : tGlobal('form.create')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}


