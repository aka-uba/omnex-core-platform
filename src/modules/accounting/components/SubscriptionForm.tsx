'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
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
import { useCreateSubscription, useUpdateSubscription, useSubscription } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';
import { subscriptionCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import type { SubscriptionType, SubscriptionStatus, BillingCycle, CommissionType } from '@/modules/accounting/types/subscription';

interface SubscriptionFormProps {
  locale: string;
  subscriptionId?: string;
}

export function SubscriptionForm({ locale, subscriptionId }: SubscriptionFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { currency: defaultCurrency } = useCurrency();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useSubscription(subscriptionId || '');

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!subscriptionId;

  const form = useForm({
    initialValues: {
      name: '',
      type: 'rental' as SubscriptionType,
      customerId: null as string | null,
      supplierId: null as string | null,
      startDate: new Date(),
      endDate: null as Date | null,
      renewalDate: null as Date | null,
      basePrice: 0,
      currency: 'TRY',
      billingCycle: 'monthly' as BillingCycle,
      commissionRate: null as number | null,
      commissionType: null as CommissionType | null,
      assignedUserId: null as string | null,
      description: '',
      terms: '',
      status: 'active' as SubscriptionStatus,
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('subscriptions.form.name') + ' ' + tGlobal('common.required') : null),
      basePrice: (value) => (value <= 0 ? t('subscriptions.form.basePrice') + ' ' + t('form.mustBePositive') : null),
    },
  });

  // Load subscription data for edit
  useEffect(() => {
    if (isEdit && subscriptionData && !isLoadingSubscription) {
      if (form.values.name === '') {
        form.setValues({
          name: subscriptionData.name,
          type: subscriptionData.type,
          customerId: subscriptionData.customerId || null,
          supplierId: subscriptionData.supplierId || null,
          startDate: new Date(subscriptionData.startDate),
          endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null,
          renewalDate: subscriptionData.renewalDate ? new Date(subscriptionData.renewalDate) : null,
          basePrice: subscriptionData.basePrice,
          currency: subscriptionData.currency,
          billingCycle: subscriptionData.billingCycle,
          commissionRate: subscriptionData.commissionRate || null,
          commissionType: subscriptionData.commissionType || null,
          assignedUserId: subscriptionData.assignedUserId || null,
          description: subscriptionData.description || '',
          terms: subscriptionData.terms || '',
          status: subscriptionData.status,
          isActive: subscriptionData.isActive,
        });
      }
    }
  }, [isEdit, subscriptionData, isLoadingSubscription, form.values.name]);

  // Set default currency from GeneralSettings for new subscriptions
  useEffect(() => {
    if (!isEdit && defaultCurrency && form.values.currency === 'TRY') {
      form.setFieldValue('currency', defaultCurrency);
    }
  }, [isEdit, defaultCurrency]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        name: values.name,
        type: values.type,
        customerId: values.customerId || undefined,
        supplierId: values.supplierId || undefined,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate?.toISOString(),
        renewalDate: values.renewalDate?.toISOString(),
        basePrice: values.basePrice,
        currency: values.currency,
        billingCycle: values.billingCycle,
        commissionRate: values.commissionRate ?? undefined,
        commissionType: values.commissionType || undefined,
        assignedUserId: values.assignedUserId || undefined,
        description: values.description || undefined,
        terms: values.terms || undefined,
      };

      const validatedData = subscriptionCreateSchema.parse(formData) as any;

      if (isEdit && subscriptionId) {
        await updateSubscription.mutateAsync({
          id: subscriptionId,
          ...validatedData,
          status: values.status,
          isActive: values.isActive,
        } as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('subscriptions.updateSuccess'),
        });
      } else {
        await createSubscription.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('subscriptions.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/accounting/subscriptions`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingSubscription) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const typeOptions: { value: SubscriptionType; label: string }[] = [
    { value: 'rental', label: t('subscriptions.types.rental') },
    { value: 'subscription', label: t('subscriptions.types.subscription') },
    { value: 'commission', label: t('subscriptions.types.commission') },
  ];

  const billingCycleOptions: { value: BillingCycle; label: string }[] = [
    { value: 'monthly', label: t('subscriptions.billingCycle.monthly') },
    { value: 'quarterly', label: t('subscriptions.billingCycle.quarterly') },
    { value: 'yearly', label: t('subscriptions.billingCycle.yearly') },
    { value: 'one_time', label: t('subscriptions.billingCycle.one_time') },
  ];

  const statusOptions: { value: SubscriptionStatus; label: string }[] = useMemo(() => [
    { value: 'active', label: t('subscriptions.status.active') },
    { value: 'suspended', label: t('subscriptions.status.suspended') },
    { value: 'cancelled', label: t('subscriptions.status.cancelled') },
  ], [t]);

  const commissionTypeOptions: { value: CommissionType; label: string }[] = [
    { value: 'percentage', label: t('subscriptions.commissionType.percentage') },
    { value: 'fixed', label: t('subscriptions.commissionType.fixed') },
  ];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/accounting/subscriptions`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('subscriptions.form.name')}
                placeholder={t('subscriptions.form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('subscriptions.form.type')}
                placeholder={t('subscriptions.form.typePlaceholder')}
                required
                data={typeOptions}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('subscriptions.form.startDate')}
                placeholder={t('subscriptions.form.startDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('startDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('subscriptions.form.endDate')}
                placeholder={t('subscriptions.form.endDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('endDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('subscriptions.form.basePrice')}
                placeholder={t('subscriptions.form.basePricePlaceholder')}
                required
                min={0}
                decimalScale={2}
                {...form.getInputProps('basePrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('subscriptions.form.currency')}
                placeholder={t('subscriptions.form.currencyPlaceholder')}
                data={CURRENCY_SELECT_OPTIONS}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('subscriptions.form.billingCycle')}
                placeholder={t('subscriptions.form.billingCyclePlaceholder')}
                required
                data={billingCycleOptions}
                {...form.getInputProps('billingCycle')}
              />
            </Grid.Col>
            {isEdit && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('subscriptions.form.status')}
                  placeholder={t('subscriptions.form.statusPlaceholder')}
                  data={statusOptions}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>
            )}
            {form.values.type === 'commission' && (
              <>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label={t('subscriptions.form.commissionRate')}
                    placeholder={t('subscriptions.form.commissionRatePlaceholder')}
                    min={0}
                    max={100}
                    {...form.getInputProps('commissionRate')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={t('subscriptions.form.commissionType')}
                    placeholder={t('subscriptions.form.commissionTypePlaceholder')}
                    data={commissionTypeOptions}
                    {...form.getInputProps('commissionType')}
                  />
                </Grid.Col>
              </>
            )}
            {isEdit && (
              <Grid.Col span={{ base: 12 }}>
                <Switch
                  label={t('subscriptions.form.isActive')}
                  description={t('subscriptions.form.isActiveDescription')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('subscriptions.form.description')}
                placeholder={t('subscriptions.form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('subscriptions.form.terms')}
                placeholder={t('subscriptions.form.termsPlaceholder')}
                rows={4}
                {...form.getInputProps('terms')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/accounting/subscriptions`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createSubscription.isPending || updateSubscription.isPending}
            >
              {isEdit ? t('form.update') : t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}







