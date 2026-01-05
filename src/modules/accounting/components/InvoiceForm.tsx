'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Switch,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';
import { invoiceCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import type { InvoiceStatus } from '@/modules/accounting/types/subscription';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface InvoiceFormProps {
  locale: string;
  invoiceId?: string;
}

function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

export function InvoiceForm({ locale, invoiceId }: InvoiceFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { currency: defaultCurrency } = useCurrency();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: invoiceData, isLoading: isLoadingInvoice } = useInvoice(invoiceId || '');
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!invoiceId;

  const form = useForm({
    initialValues: {
      subscriptionId: null as string | null,
      invoiceNumber: '',
      invoiceDate: new Date(),
      dueDate: new Date(),
      customerId: null as string | null,
      supplierId: null as string | null,
      subtotal: 0,
      taxRate: null as number | null,
      taxAmount: null as number | null,
      totalAmount: 0,
      currency: 'TRY',
      description: '',
      isActive: true,
    },
    validate: {
      invoiceDate: (value) => (!value ? t('invoices.form.invoiceDate') + ' ' + tGlobal('common.required') : null),
      dueDate: (value) => (!value ? t('invoices.form.dueDate') + ' ' + tGlobal('common.required') : null),
      subtotal: (value) => (value < 0 ? t('invoices.form.subtotal') + ' ' + t('form.mustBeNonNegative') : null),
      totalAmount: (value) => (value <= 0 ? t('invoices.form.totalAmount') + ' ' + t('form.mustBePositive') : null),
    },
  });

  // Auto-generate invoice number if creating
  useEffect(() => {
    if (!isEdit && !form.values.invoiceNumber) {
      form.setFieldValue('invoiceNumber', generateInvoiceNumber());
    }
  }, [isEdit, form.values.invoiceNumber]);

  // Calculate tax and total when subtotal or taxRate changes
  useEffect(() => {
    const subtotal = form.values.subtotal || 0;
    const taxRate = form.values.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    form.setFieldValue('taxAmount', taxAmount);
    form.setFieldValue('totalAmount', totalAmount);
  }, [form.values.subtotal, form.values.taxRate]);

  // Load invoice data for edit
  useEffect(() => {
    if (isEdit && invoiceData && !isLoadingInvoice) {
      if (form.values.invoiceNumber === '') {
        form.setValues({
          subscriptionId: invoiceData.subscriptionId || null,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: new Date(invoiceData.invoiceDate),
          dueDate: new Date(invoiceData.dueDate),
          customerId: invoiceData.customerId || null,
          supplierId: invoiceData.supplierId || null,
          subtotal: invoiceData.subtotal,
          taxRate: invoiceData.taxRate ?? null,
          taxAmount: invoiceData.taxAmount,
          totalAmount: invoiceData.totalAmount,
          currency: invoiceData.currency,
          description: invoiceData.description || '',
          isActive: invoiceData.isActive,
        } as any);
      }
    }
  }, [isEdit, invoiceData, isLoadingInvoice, form.values.invoiceNumber]);

  // Set default currency from GeneralSettings for new invoices
  useEffect(() => {
    if (!isEdit && defaultCurrency && form.values.currency === 'TRY') {
      form.setFieldValue('currency', defaultCurrency);
    }
  }, [isEdit, defaultCurrency]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        subscriptionId: values.subscriptionId || undefined,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        customerId: values.customerId || undefined,
        supplierId: values.supplierId || undefined,
        subtotal: values.subtotal,
        taxRate: values.taxRate ?? undefined,
        taxAmount: values.taxAmount ?? undefined,
        totalAmount: values.totalAmount,
        currency: values.currency,
        description: values.description || undefined,
      };

      const validatedData = invoiceCreateSchema.parse(formData) as any;

      if (isEdit && invoiceId) {
        await updateInvoice.mutateAsync({
          id: invoiceId,
          ...validatedData,
          isActive: values.isActive,
        } as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('invoices.updateSuccess'),
        });
      } else {
        await createInvoice.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('invoices.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/accounting/invoices`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingInvoice) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const subscriptionOptions = useMemo(() => {
    return subscriptionsData?.subscriptions.map(s => ({
      value: s.id,
      label: s.name,
    })) || [];
  }, [subscriptionsData?.subscriptions]);

  const statusOptions: { value: InvoiceStatus; label: string }[] = useMemo(() => [
    { value: 'draft', label: t('invoices.status.draft') },
    { value: 'sent', label: t('invoices.status.sent') },
    { value: 'paid', label: t('invoices.status.paid') },
    { value: 'overdue', label: t('invoices.status.overdue') },
    { value: 'cancelled', label: t('invoices.status.cancelled') },
  ], [t]);

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/accounting/invoices`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('invoices.form.invoiceNumber')}
                placeholder={t('invoices.form.invoiceNumberPlaceholder')}
                required
                {...form.getInputProps('invoiceNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('invoices.form.subscription')}
                placeholder={t('invoices.form.subscriptionPlaceholder')}
                data={subscriptionOptions}
                searchable
                clearable
                {...form.getInputProps('subscriptionId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('invoices.form.invoiceDate')}
                placeholder={t('invoices.form.invoiceDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('invoiceDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('invoices.form.dueDate')}
                placeholder={t('invoices.form.dueDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('dueDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('invoices.form.subtotal')}
                placeholder={t('invoices.form.subtotalPlaceholder')}
                required
                min={0}
                decimalScale={2}
                {...form.getInputProps('subtotal')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('invoices.form.taxRate')}
                placeholder={t('invoices.form.taxRatePlaceholder')}
                min={0}
                max={100}
                {...form.getInputProps('taxRate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('invoices.form.totalAmount')}
                placeholder={t('invoices.form.totalAmountPlaceholder')}
                required
                min={0}
                decimalScale={2}
                readOnly
                {...form.getInputProps('totalAmount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('invoices.form.currency')}
                placeholder={t('invoices.form.currencyPlaceholder')}
                data={CURRENCY_SELECT_OPTIONS}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            {isEdit && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('invoices.form.status')}
                  placeholder={t('invoices.form.statusPlaceholder')}
                  data={statusOptions}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>
            )}
            {isEdit && (
              <Grid.Col span={{ base: 12 }}>
                <Switch
                  label={t('invoices.form.isActive')}
                  description={t('invoices.form.isActiveDescription')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('invoices.form.description')}
                placeholder={t('invoices.form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/accounting/invoices`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createInvoice.isPending || updateInvoice.isPending}
            >
              {isEdit ? t('form.update') : t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}







