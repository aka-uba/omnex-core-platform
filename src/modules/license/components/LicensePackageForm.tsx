'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Switch,
  Loader,
  MultiSelect,
  Textarea,
  Text,
} from '@mantine/core';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateLicensePackage, useUpdateLicensePackage, useLicensePackage } from '@/hooks/useLicensePackages';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';
import { licensePackageCreateSchema } from '@/modules/license/schemas/license.schema';
import type { BillingCycle, LicensePackageUpdateInput } from '@/modules/license/types/license';

interface LicensePackageFormProps {
  locale: string;
  packageId?: string | null;
}

export function LicensePackageForm({ locale, packageId }: LicensePackageFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const { currency: defaultCurrency } = useCurrency();
  const createPackage = useCreateLicensePackage();
  const updatePackage = useUpdateLicensePackage();
  const { data: packageData, isLoading: isLoadingPackage } = useLicensePackage(packageId || null);

  const isEdit = !!packageId;

  // Available modules list (this should come from module registry in real implementation)
  const [availableModules] = useState<string[]>([
    'real-estate',
    'production',
    'accounting',
    'maintenance',
    'hr',
    'chat',
    'web-builder',
  ]);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      modules: [] as string[],
      basePrice: 0,
      currency: 'TRY',
      billingCycle: 'monthly' as BillingCycle,
      maxUsers: null as number | null,
      maxStorage: null as number | null,
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('packages.form.name') + ' ' + tGlobal('common.required') : null),
      modules: (value) => (value.length === 0 ? t('packages.form.modules') + ' ' + tGlobal('common.required') : null),
      basePrice: (value) => (value <= 0 ? t('packages.form.basePrice') + ' ' + tGlobal('common.required') : null),
      billingCycle: (value) => (!value ? t('packages.form.billingCycle') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Set default currency from GeneralSettings for new packages
  useEffect(() => {
    if (!isEdit && defaultCurrency && form.values.currency === 'TRY') {
      form.setFieldValue('currency', defaultCurrency);
    }
  }, [isEdit, defaultCurrency]);

  // Load package data for edit
  useEffect(() => {
    if (isEdit && packageData && !isLoadingPackage) {
      form.setValues({
        name: packageData.name,
        description: packageData.description || '',
        modules: packageData.modules,
        basePrice: packageData.basePrice,
        currency: packageData.currency,
        billingCycle: packageData.billingCycle,
        maxUsers: packageData.maxUsers || null,
        maxStorage: packageData.maxStorage || null,
        isActive: packageData.isActive,
      });
    }
  }, [isEdit, packageData, isLoadingPackage]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const validatedData = licensePackageCreateSchema.parse(values);
      
      if (isEdit && packageId) {
        // Convert to UpdateInput format with conditional spreading for optional fields
        const updateInput: LicensePackageUpdateInput = {
          name: validatedData.name,
          modules: validatedData.modules,
          basePrice: validatedData.basePrice,
          currency: validatedData.currency,
          billingCycle: validatedData.billingCycle,
          isActive: validatedData.isActive,
          ...(validatedData.description !== null && validatedData.description !== undefined ? { description: validatedData.description } : {}),
          ...(validatedData.maxUsers !== null && validatedData.maxUsers !== undefined ? { maxUsers: validatedData.maxUsers } : {}),
          ...(validatedData.maxStorage !== null && validatedData.maxStorage !== undefined ? { maxStorage: validatedData.maxStorage } : {}),
          ...(validatedData.features !== null && validatedData.features !== undefined ? { features: validatedData.features } : {}),
        };
        await updatePackage.mutateAsync({
          id: packageId,
          input: updateInput,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('packages.updateSuccess'),
        });
      } else {
        await createPackage.mutateAsync({
          name: validatedData.name,
          modules: validatedData.modules,
          basePrice: validatedData.basePrice,
          currency: validatedData.currency,
          billingCycle: validatedData.billingCycle,
          isActive: validatedData.isActive,
          ...(validatedData.description !== null && validatedData.description !== undefined ? { description: validatedData.description } : {}),
          ...(validatedData.maxUsers !== null && validatedData.maxUsers !== undefined ? { maxUsers: validatedData.maxUsers } : {}),
          ...(validatedData.maxStorage !== null && validatedData.maxStorage !== undefined ? { maxStorage: validatedData.maxStorage } : {}),
          ...(validatedData.features !== null && validatedData.features !== undefined ? { features: validatedData.features } : {}),
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('packages.createSuccess'),
        });
      }
      router.push(`/${locale}/admin/licenses`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : (isEdit ? t('packages.updateError') : t('packages.createError')),
      });
    }
  };

  if (isEdit && isLoadingPackage) {
    return (
      <Paper p="xl">
        <Loader size="lg" />
        <Text mt="md">{tGlobal('common.loading')}</Text>
      </Paper>
    );
  }

  return (
    <Paper p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/admin/licenses`)}
            >
              {tGlobal('common.back')}
            </Button>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('packages.form.name')}
                placeholder={t('packages.form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('packages.form.currency')}
                placeholder={t('packages.form.currencyPlaceholder')}
                data={CURRENCY_SELECT_OPTIONS}
                required
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('packages.form.description')}
                placeholder={t('packages.form.descriptionPlaceholder')}
                rows={3}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <MultiSelect
                label={t('packages.form.modules')}
                placeholder={t('packages.form.modulesPlaceholder')}
                data={availableModules}
                required
                searchable
                {...form.getInputProps('modules')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('packages.form.billingCycle')}
                placeholder={t('packages.form.billingCyclePlaceholder')}
                data={[
                  { value: 'monthly', label: t('packages.billingCycles.monthly') },
                  { value: 'quarterly', label: t('packages.billingCycles.quarterly') },
                  { value: 'yearly', label: t('packages.billingCycles.yearly') },
                ]}
                required
                {...form.getInputProps('billingCycle')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('packages.form.basePrice')}
                placeholder={t('packages.form.basePricePlaceholder')}
                required
                min={0}
                decimalScale={2}
                {...form.getInputProps('basePrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('packages.form.maxUsers')}
                placeholder={t('packages.form.maxUsersPlaceholder')}
                min={1}
                {...form.getInputProps('maxUsers')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('packages.form.maxStorage')}
                placeholder={t('packages.form.maxStoragePlaceholder')}
                min={1}
                {...form.getInputProps('maxStorage')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Switch
                label={t('packages.form.isActive')}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/admin/licenses`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createPackage.isPending || updatePackage.isPending}
            >
              {isEdit ? tGlobal('common.update') : tGlobal('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

