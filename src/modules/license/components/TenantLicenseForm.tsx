'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Loader,
  Textarea,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateTenantLicense, useUpdateTenantLicense, useTenantLicense } from '@/hooks/useTenantLicenses';
import { useTranslation } from '@/lib/i18n/client';
import { tenantLicenseCreateSchema } from '@/modules/license/schemas/license.schema';
import type { LicenseStatus, PaymentStatus, TenantLicenseUpdateInput } from '@/modules/license/types/license';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface TenantLicenseFormProps {
  locale: string;
  licenseId?: string;
}

export function TenantLicenseForm({ locale, licenseId }: TenantLicenseFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const createLicense = useCreateTenantLicense();
  const updateLicense = useUpdateTenantLicense();
  const { data: licenseData, isLoading: isLoadingLicense } = useTenantLicense(licenseId || null);

  const [tenants, setTenants] = useState<Array<{ value: string; label: string }>>([]);
  const [packages, setPackages] = useState<Array<{ value: string; label: string }>>([]);

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!licenseId;

  // Load tenants and packages
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tenants
        const tenantsResponse = await fetch('/api/admin/tenants');
        if (tenantsResponse.ok) {
          const tenantsData = await tenantsResponse.json();
          setTenants(
            tenantsData.data?.tenants?.map((t: { id: string; name: string }) => ({
              value: t.id,
              label: t.name,
            })) || []
          );
        }

        // Load packages
        const packagesResponse = await fetch('/api/admin/licenses?pageSize=1000');
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          setPackages(
            packagesData.data?.packages?.map((p: { id: string; name: string }) => ({
              value: p.id,
              label: p.name,
            })) || []
          );
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const form = useForm({
    initialValues: {
      tenantId: '',
      packageId: '',
      startDate: new Date(),
      endDate: new Date(),
      renewalDate: null as Date | null,
      status: 'active' as LicenseStatus,
      paymentStatus: 'pending' as PaymentStatus,
      notes: '',
    },
    validate: {
      tenantId: (value) => (!value ? t('tenantLicenses.form.tenant') + ' ' + tGlobal('common.required') : null),
      packageId: (value) => (!value ? t('tenantLicenses.form.package') + ' ' + tGlobal('common.required') : null),
      startDate: (value) => (!value ? t('tenantLicenses.form.startDate') + ' ' + tGlobal('common.required') : null),
      endDate: (value) => (!value ? t('tenantLicenses.form.endDate') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load license data for edit
  useEffect(() => {
    if (isEdit && licenseData && !isLoadingLicense) {
      form.setValues({
        tenantId: licenseData.tenantId,
        packageId: licenseData.packageId,
        startDate: new Date(licenseData.startDate),
        endDate: new Date(licenseData.endDate),
        renewalDate: licenseData.renewalDate ? new Date(licenseData.renewalDate) : null,
        status: licenseData.status,
        paymentStatus: licenseData.paymentStatus,
        notes: licenseData.notes || '',
      });
    }
  }, [isEdit, licenseData, isLoadingLicense]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const validatedData = tenantLicenseCreateSchema.parse({
        tenantId: values.tenantId,
        packageId: values.packageId,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        renewalDate: values.renewalDate?.toISOString() || null,
        status: values.status,
        paymentStatus: values.paymentStatus,
        notes: values.notes || null,
      });
      
      if (isEdit && licenseId) {
        // Convert to UpdateInput format with conditional spreading for optional fields
        const updateInput: TenantLicenseUpdateInput = {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          status: validatedData.status,
          paymentStatus: validatedData.paymentStatus,
          ...(validatedData.renewalDate !== null && validatedData.renewalDate !== undefined ? { renewalDate: validatedData.renewalDate } : {}),
          ...(validatedData.lastPaymentDate !== null && validatedData.lastPaymentDate !== undefined ? { lastPaymentDate: validatedData.lastPaymentDate } : {}),
          ...(validatedData.nextPaymentDate !== null && validatedData.nextPaymentDate !== undefined ? { nextPaymentDate: validatedData.nextPaymentDate } : {}),
          ...(validatedData.notes !== null && validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
        };
        await updateLicense.mutateAsync({
          id: licenseId,
          input: updateInput,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('tenantLicenses.updateSuccess'),
        });
      } else {
        await createLicense.mutateAsync({
          tenantId: validatedData.tenantId,
          packageId: validatedData.packageId,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          status: validatedData.status,
          paymentStatus: validatedData.paymentStatus,
          ...(validatedData.renewalDate !== null && validatedData.renewalDate !== undefined ? { renewalDate: validatedData.renewalDate } : {}),
          ...(validatedData.lastPaymentDate !== null && validatedData.lastPaymentDate !== undefined ? { lastPaymentDate: validatedData.lastPaymentDate } : {}),
          ...(validatedData.nextPaymentDate !== null && validatedData.nextPaymentDate !== undefined ? { nextPaymentDate: validatedData.nextPaymentDate } : {}),
          ...(validatedData.notes !== null && validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('tenantLicenses.createSuccess'),
        });
      }
      router.push(`/${locale}/admin/tenant-licenses`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : (isEdit ? t('tenantLicenses.updateError') : t('tenantLicenses.createError')),
      });
    }
  };

  if (isEdit && isLoadingLicense) {
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
              onClick={() => router.push(`/${locale}/admin/tenant-licenses`)}
            >
              {tGlobal('common.back')}
            </Button>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('tenantLicenses.form.tenant')}
                placeholder={t('tenantLicenses.form.tenantPlaceholder')}
                data={tenants}
                required
                searchable
                disabled={isEdit}
                {...form.getInputProps('tenantId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('tenantLicenses.form.package')}
                placeholder={t('tenantLicenses.form.packagePlaceholder')}
                data={packages}
                required
                searchable
                disabled={isEdit}
                {...form.getInputProps('packageId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('tenantLicenses.form.startDate')}
                placeholder={t('tenantLicenses.form.startDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('startDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('tenantLicenses.form.endDate')}
                placeholder={t('tenantLicenses.form.endDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('endDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('tenantLicenses.form.renewalDate')}
                placeholder={t('tenantLicenses.form.renewalDatePlaceholder')}
                clearable
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('renewalDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('tenantLicenses.form.status')}
                placeholder={t('tenantLicenses.form.statusPlaceholder')}
                data={[
                  { value: 'active', label: t('tenantLicenses.status.active') },
                  { value: 'expired', label: t('tenantLicenses.status.expired') },
                  { value: 'suspended', label: t('tenantLicenses.status.suspended') },
                  { value: 'cancelled', label: t('tenantLicenses.status.cancelled') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('tenantLicenses.form.paymentStatus')}
                placeholder={t('tenantLicenses.form.paymentStatusPlaceholder')}
                data={[
                  { value: 'pending', label: t('tenantLicenses.paymentStatus.pending') },
                  { value: 'paid', label: t('tenantLicenses.paymentStatus.paid') },
                  { value: 'failed', label: t('tenantLicenses.paymentStatus.failed') },
                ]}
                {...form.getInputProps('paymentStatus')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('tenantLicenses.form.notes')}
                placeholder={t('tenantLicenses.form.notesPlaceholder')}
                rows={3}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/admin/tenant-licenses`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createLicense.isPending || updateLicense.isPending}
            >
              {isEdit ? tGlobal('common.update') : tGlobal('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

