'use client';

import { useMemo, useEffect } from 'react';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
import {
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useCreateAccountingPayment } from '@/hooks/useAccountingPayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { accountingPaymentCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import type { PaymentMethod, PaymentStatus } from '@/modules/accounting/types/subscription';

interface PaymentFormProps {
  locale: string;
  onSuccess?: () => void;
  initialInvoiceId?: string;
  initialSubscriptionId?: string;
}

export function PaymentForm({ locale, onSuccess, initialInvoiceId, initialSubscriptionId }: PaymentFormProps) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const createPayment = useCreateAccountingPayment();
  const { data: invoicesData } = useInvoices({ page: 1, pageSize: 1000 });
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const form = useForm({
    initialValues: {
      subscriptionId: initialSubscriptionId || null as string | null,
      invoiceId: initialInvoiceId || null as string | null,
      amount: 0,
      currency: 'TRY',
      paymentDate: new Date(),
      paymentMethod: 'cash' as PaymentMethod,
      paymentReference: '',
      status: 'completed' as PaymentStatus,
      notes: '',
    },
    validate: {
      amount: (value) => (value <= 0 ? t('payments.form.amount') + ' ' + t('form.mustBePositive') : null),
      paymentMethod: (value) => (!value ? t('payments.form.paymentMethod') + ' ' + tGlobal('common.required') : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        subscriptionId: values.subscriptionId || undefined,
        invoiceId: values.invoiceId || undefined,
        amount: values.amount,
        currency: values.currency,
        paymentDate: values.paymentDate.toISOString(),
        paymentMethod: values.paymentMethod,
        paymentReference: values.paymentReference || undefined,
        status: values.status,
        notes: values.notes || undefined,
      };

      const validatedData = accountingPaymentCreateSchema.parse(formData) as any;

      await createPayment.mutateAsync(validatedData);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('payments.createSuccess'),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  const invoiceOptions = useMemo(() => {
    return invoicesData?.invoices.map(i => ({
      value: i.id,
      label: `${i.invoiceNumber} - ${Number(i.totalAmount).toLocaleString('tr-TR', { style: 'currency', currency: i.currency || 'TRY' })}`,
    })) || [];
  }, [invoicesData?.invoices]);

  const subscriptionOptions = useMemo(() => {
    return subscriptionsData?.subscriptions.map(s => ({
      value: s.id,
      label: s.name,
    })) || [];
  }, [subscriptionsData?.subscriptions]);

  const paymentMethodOptions: { value: PaymentMethod; label: string }[] = useMemo(() => [
    { value: 'cash', label: t('payments.methods.cash') },
    { value: 'bank_transfer', label: t('payments.methods.bank_transfer') },
    { value: 'card', label: t('payments.methods.card') },
    { value: 'check', label: t('payments.methods.check') },
    { value: 'other', label: t('payments.methods.other') },
  ], [t]);

  const statusOptions: { value: PaymentStatus; label: string }[] = useMemo(() => [
    { value: 'pending', label: t('payments.status.pending') },
    { value: 'completed', label: t('payments.status.completed') },
    { value: 'failed', label: t('payments.status.failed') },
    { value: 'cancelled', label: t('payments.status.cancelled') },
  ], [t]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('payments.form.invoice')}
              placeholder={t('payments.form.invoicePlaceholder')}
              data={invoiceOptions}
              searchable
              clearable
              {...form.getInputProps('invoiceId')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('payments.form.subscription')}
              placeholder={t('payments.form.subscriptionPlaceholder')}
              data={subscriptionOptions}
              searchable
              clearable
              {...form.getInputProps('subscriptionId')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label={t('payments.form.amount')}
              placeholder={t('payments.form.amountPlaceholder')}
              required
              min={0.01}
              decimalScale={2}
              {...form.getInputProps('amount')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('payments.form.currency')}
              placeholder={t('payments.form.currencyPlaceholder')}
              data={[
                { value: 'TRY', label: 'TRY' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
              ]}
              {...form.getInputProps('currency')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <DatePickerInput
              label={t('payments.form.paymentDate')}
              placeholder={t('payments.form.paymentDatePlaceholder')}
              required
              locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
              {...form.getInputProps('paymentDate')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('payments.form.paymentMethod')}
              placeholder={t('payments.form.paymentMethodPlaceholder')}
              required
              data={paymentMethodOptions}
              {...form.getInputProps('paymentMethod')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t('payments.form.paymentReference')}
              placeholder={t('payments.form.paymentReferencePlaceholder')}
              {...form.getInputProps('paymentReference')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('payments.form.status')}
              placeholder={t('payments.form.statusPlaceholder')}
              data={statusOptions}
              {...form.getInputProps('status')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12 }}>
            <Textarea
              label={t('payments.form.notes')}
              placeholder={t('payments.form.notesPlaceholder')}
              rows={4}
              {...form.getInputProps('notes')}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button
            type="submit"
            loading={createPayment.isPending}
          >
            {t('form.create')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}







