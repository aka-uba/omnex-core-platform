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
import { useCreateExpense, useUpdateExpense, useExpense } from '@/hooks/useExpenses';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';
import { expenseCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import type { ExpenseType, ExpenseStatus } from '@/modules/accounting/types/subscription';

interface ExpenseFormProps {
  locale: string;
  expenseId?: string;
}

export function ExpenseForm({ locale, expenseId }: ExpenseFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { currency: defaultCurrency } = useCurrency();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: expenseData, isLoading: isLoadingExpense } = useExpense(expenseId || '');
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!expenseId;

  const form = useForm({
    initialValues: {
      locationId: null as string | null,
      subscriptionId: null as string | null,
      name: '',
      category: '',
      type: 'operational' as ExpenseType,
      amount: 0,
      currency: 'TRY',
      expenseDate: new Date(),
      assignedUserId: null as string | null,
      description: '',
      receiptUrl: '',
      status: 'pending' as ExpenseStatus,
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('expenses.form.name') + ' ' + tGlobal('common.required') : null),
      category: (value) => (!value ? t('expenses.form.category') + ' ' + tGlobal('common.required') : null),
      amount: (value) => (value <= 0 ? t('expenses.form.amount') + ' ' + t('form.mustBePositive') : null),
    },
  });

  // Load expense data for edit
  useEffect(() => {
    if (isEdit && expenseData && !isLoadingExpense) {
      if (form.values.name === '') {
        form.setValues({
          locationId: expenseData.locationId || null,
          subscriptionId: expenseData.subscriptionId || null,
          name: expenseData.name,
          category: expenseData.category,
          type: expenseData.type,
          amount: expenseData.amount,
          currency: expenseData.currency,
          expenseDate: new Date(expenseData.expenseDate),
          assignedUserId: expenseData.assignedUserId || null,
          description: expenseData.description || '',
          receiptUrl: expenseData.receiptUrl || '',
          status: expenseData.status,
          isActive: expenseData.isActive,
        });
      }
    }
  }, [isEdit, expenseData, isLoadingExpense, form.values.name]);

  // Set default currency from GeneralSettings for new expenses
  useEffect(() => {
    if (!isEdit && defaultCurrency && form.values.currency === 'TRY') {
      form.setFieldValue('currency', defaultCurrency);
    }
  }, [isEdit, defaultCurrency]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        locationId: values.locationId || undefined,
        subscriptionId: values.subscriptionId || undefined,
        name: values.name,
        category: values.category,
        type: values.type,
        amount: values.amount,
        currency: values.currency,
        expenseDate: values.expenseDate.toISOString(),
        assignedUserId: values.assignedUserId || undefined,
        description: values.description || undefined,
        receiptUrl: values.receiptUrl || undefined,
      };

      const validatedData = expenseCreateSchema.parse(formData) as any;

      if (isEdit && expenseId) {
        await updateExpense.mutateAsync({
          id: expenseId,
          ...validatedData,
          status: values.status,
          isActive: values.isActive,
        } as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('expenses.updateSuccess'),
        });
      } else {
        await createExpense.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('expenses.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/accounting/expenses`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingExpense) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const subscriptionOptions = useMemo(() => {
    return subscriptionsData?.subscriptions.map(s => ({
      value: s.id,
      label: s.name,
    })) || [];
  }, [subscriptionsData?.subscriptions]);

  const locationOptions = useMemo(() => {
    return locationsData?.locations.map(l => ({
      value: l.id,
      label: l.name,
    })) || [];
  }, [locationsData?.locations]);

  const typeOptions: { value: ExpenseType; label: string }[] = useMemo(() => [
    { value: 'operational', label: t('expenses.types.operational') },
    { value: 'subscription', label: t('expenses.types.subscription') },
    { value: 'maintenance', label: t('expenses.types.maintenance') },
    { value: 'rent', label: t('expenses.types.rent') },
    { value: 'utility', label: t('expenses.types.utility') },
    { value: 'other', label: t('expenses.types.other') },
  ], [t]);

  const statusOptions: { value: ExpenseStatus; label: string }[] = useMemo(() => [
    { value: 'pending', label: t('expenses.status.pending') },
    { value: 'approved', label: t('expenses.status.approved') },
    { value: 'rejected', label: t('expenses.status.rejected') },
  ], [t]);

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/accounting/expenses`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('expenses.form.name')}
                placeholder={t('expenses.form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('expenses.form.category')}
                placeholder={t('expenses.form.categoryPlaceholder')}
                required
                {...form.getInputProps('category')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('expenses.form.type')}
                placeholder={t('expenses.form.typePlaceholder')}
                required
                data={typeOptions}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('expenses.form.amount')}
                placeholder={t('expenses.form.amountPlaceholder')}
                required
                min={0.01}
                decimalScale={2}
                {...form.getInputProps('amount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('expenses.form.currency')}
                placeholder={t('expenses.form.currencyPlaceholder')}
                data={CURRENCY_SELECT_OPTIONS}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('expenses.form.expenseDate')}
                placeholder={t('expenses.form.expenseDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('expenseDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('expenses.form.location')}
                placeholder={t('expenses.form.locationPlaceholder')}
                data={locationOptions}
                searchable
                clearable
                {...form.getInputProps('locationId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('expenses.form.subscription')}
                placeholder={t('expenses.form.subscriptionPlaceholder')}
                data={subscriptionOptions}
                searchable
                clearable
                {...form.getInputProps('subscriptionId')}
              />
            </Grid.Col>
            {isEdit && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('expenses.form.status')}
                  placeholder={t('expenses.form.statusPlaceholder')}
                  data={statusOptions}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>
            )}
            {isEdit && (
              <Grid.Col span={{ base: 12 }}>
                <Switch
                  label={t('expenses.form.isActive')}
                  description={t('expenses.form.isActiveDescription')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12 }}>
              <TextInput
                label={t('expenses.form.receiptUrl')}
                placeholder={t('expenses.form.receiptUrlPlaceholder')}
                {...form.getInputProps('receiptUrl')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('expenses.form.description')}
                placeholder={t('expenses.form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/accounting/expenses`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createExpense.isPending || updateExpense.isPending}
            >
              {isEdit ? t('form.update') : t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}







