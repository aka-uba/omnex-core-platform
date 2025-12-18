'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Grid,
  Group,
  Title,
  NumberInput,
  Switch,
  MultiSelect,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  useCreateBulkOperation,
} from '@/hooks/useBulkOperations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { BulkOperationType, RentIncreaseParams, FeeUpdateParams } from '@/modules/real-estate/types/bulk-operation';
import { useApartments } from '@/hooks/useApartments';
import { useContracts } from '@/hooks/useContracts';

interface BulkOperationFormProps {
  locale: string;
  operationType?: BulkOperationType;
}

export function BulkOperationForm({ locale, operationType = 'rent_increase' }: BulkOperationFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const createOperation = useCreateBulkOperation();
  const [selectedType, setSelectedType] = useState<BulkOperationType>(operationType);

  // Fetch related data
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: contractsData } = useContracts({ page: 1, pageSize: 1000, status: 'active' });

  const form = useForm({
    initialValues: {
      type: operationType,
      title: '',
      description: '',
      parameters: {} as RentIncreaseParams | FeeUpdateParams,
    },
    validate: {
      title: (value) => (!value ? t('form.required') : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const result = await createOperation.mutateAsync({
        type: selectedType,
        title: values.title,
        ...(values.description ? { description: values.description } : {}),
        parameters: values.parameters,
      });

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: result.executed
          ? (t('bulkOperations.execute.success'))
          : (t('bulkOperations.create.success')),
      });

      router.push(`/${locale}/modules/real-estate/bulk-operations`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('bulkOperations.create.error'),
      });
    }
  };

  // Render form fields based on operation type
  const renderFormFields = () => {
    if (selectedType === 'rent_increase') {
      const params = form.values.parameters as RentIncreaseParams;
      return (
        <>
          <Grid.Col span={12}>
            <MultiSelect
              label={t('bulkOperations.rentIncrease.apartments')}
              placeholder={t('bulkOperations.rentIncrease.selectApartments')}
              data={
                apartmentsData?.apartments.map((apt) => ({
                  value: apt.id,
                  label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
                })) || []
              }
              value={params.apartmentIds || []}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  apartmentIds: value,
                });
              }}
              clearable
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <MultiSelect
              label={t('bulkOperations.rentIncrease.contracts')}
              placeholder={t('bulkOperations.rentIncrease.selectContracts')}
              data={
                contractsData?.contracts.map((contract) => ({
                  value: contract.id,
                  label: `${contract.contractNumber} - ${contract.apartment?.unitNumber || ''}`,
                })) || []
              }
              value={params.contractIds || []}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  contractIds: value,
                });
              }}
              clearable
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label={t('bulkOperations.rentIncrease.increaseType')}
              placeholder={t('bulkOperations.rentIncrease.selectType')}
              required
              data={[
                { value: 'percentage', label: t('bulkOperations.rentIncrease.percentage') },
                { value: 'fixed', label: t('bulkOperations.rentIncrease.fixed') },
              ]}
              value={params.increaseType || 'percentage'}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  increaseType: value as 'percentage' | 'fixed',
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label={
                params.increaseType === 'percentage'
                  ? (t('bulkOperations.rentIncrease.percentageValue'))
                  : (t('bulkOperations.rentIncrease.fixedValue'))
              }
              placeholder={t('bulkOperations.rentIncrease.enterValue')}
              required
              min={0}
              value={params.increaseValue || 0}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  increaseValue: Number(value) || 0,
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <DatePickerInput label={t('bulkOperations.rentIncrease.effectiveDate')}
              placeholder={t('bulkOperations.rentIncrease.selectDate')}
              required
              value={params.effectiveDate ? new Date(params.effectiveDate) : null}
              onChange={(value: string | Date | null) => {
                const date = value instanceof Date ? value : value ? new Date(value) : null;
                form.setFieldValue('parameters', {
                  ...params,
                  effectiveDate: date || new Date(),
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Switch
              label={t('bulkOperations.rentIncrease.notifyTenants')}
              checked={params.notifyTenants || false}
              onChange={(e) => {
                form.setFieldValue('parameters', {
                  ...params,
                  notifyTenants: e.currentTarget.checked,
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Switch
              label={t('bulkOperations.rentIncrease.createNewPayments')}
              checked={params.createNewPayments || false}
              onChange={(e) => {
                form.setFieldValue('parameters', {
                  ...params,
                  createNewPayments: e.currentTarget.checked,
                });
              }}
            />
          </Grid.Col>
        </>
      );
    } else if (selectedType === 'fee_update') {
      const params = form.values.parameters as FeeUpdateParams;
      return (
        <>
          <Grid.Col span={12}>
            <MultiSelect
              label={t('bulkOperations.feeUpdate.apartments')}
              placeholder={t('bulkOperations.feeUpdate.selectApartments')}
              data={
                apartmentsData?.apartments.map((apt) => ({
                  value: apt.id,
                  label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
                })) || []
              }
              value={params.apartmentIds || []}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  apartmentIds: value,
                });
              }}
              clearable
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label={t('bulkOperations.feeUpdate.feeType')}
              placeholder={t('bulkOperations.feeUpdate.selectType')}
              required
              data={[
                { value: 'maintenance', label: t('bulkOperations.feeUpdate.maintenance') },
                { value: 'utility', label: t('bulkOperations.feeUpdate.utility') },
                { value: 'other', label: t('bulkOperations.feeUpdate.other') },
              ]}
              value={params.feeType || 'maintenance'}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  feeType: value as 'maintenance' | 'utility' | 'other',
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label={t('bulkOperations.feeUpdate.newAmount')}
              placeholder={t('bulkOperations.feeUpdate.enterAmount')}
              required
              min={0}
              leftSection="₺"
              value={params.newAmount || 0}
              onChange={(value) => {
                form.setFieldValue('parameters', {
                  ...params,
                  newAmount: Number(value) || 0,
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
      <DatePickerInput label={t('bulkOperations.feeUpdate.effectiveDate')}
              placeholder={t('bulkOperations.feeUpdate.selectDate')}
              required
              value={params.effectiveDate ? new Date(params.effectiveDate) : null}
              onChange={(value: string | Date | null) => {
                const date = value instanceof Date ? value : value ? new Date(value) : null;
                form.setFieldValue('parameters', {
                  ...params,
                  effectiveDate: date || new Date(),
                });
              }}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Switch
              label={t('bulkOperations.feeUpdate.notifyTenants')}
              checked={params.notifyTenants || false}
              onChange={(e) => {
                form.setFieldValue('parameters', {
                  ...params,
                  notifyTenants: e.currentTarget.checked,
                });
              }}
            />
          </Grid.Col>
        </>
      );
    }

    return null;
  };

  return (
    <Paper shadow="xs" p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>{t('bulkOperations.create.title')}</Title>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              {t('actions.back')}
            </Button>
          </Group>

          <Grid>
            <Grid.Col span={12}>
              <Select
                label={t('bulkOperations.type')}
                placeholder={t('bulkOperations.selectType')}
                required
                data={[
                  { value: 'rent_increase', label: t('bulkOperations.types.rent_increase') },
                  { value: 'fee_update', label: t('bulkOperations.types.fee_update') },
                ]}
                value={selectedType}
                onChange={(value) => {
                  setSelectedType(value as BulkOperationType);
                  form.setFieldValue('type', value as BulkOperationType);
                  if (value === 'rent_increase') {
                    form.setFieldValue('parameters', {
                      increaseType: 'percentage',
                      increaseValue: 0,
                      effectiveDate: new Date(),
                      notifyTenants: false,
                      createNewPayments: false,
                    } as RentIncreaseParams);
                  } else if (value === 'fee_update') {
                    form.setFieldValue('parameters', {
                      feeType: 'maintenance',
                      newAmount: 0,
                      effectiveDate: new Date(),
                      notifyTenants: false,
                    } as FeeUpdateParams);
                  }
                }}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label={t('form.title')}
                placeholder={t('bulkOperations.titlePlaceholder')}
                required
                {...form.getInputProps('title')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.description')}
                placeholder={t('bulkOperations.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps(t('form.description'))}
              />
            </Grid.Col>

            {renderFormFields()}
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={createOperation.isPending}>
              {t('actions.execute')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

