'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Select,
  NumberInput,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreatePropertyExpense, useUpdatePropertyExpense, usePropertyExpense } from '@/hooks/usePropertyExpenses';
import { useTranslation } from '@/lib/i18n/client';
import type { ExpenseCategory } from '@/modules/real-estate/types/property-expense';

interface PropertyExpenseFormProps {
  locale: string;
  propertyId: string;
  propertyName?: string;
  expenseId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyExpenseForm({
  locale,
  propertyId,
  propertyName,
  expenseId,
  onSuccess,
  onCancel
}: PropertyExpenseFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createExpense = useCreatePropertyExpense();
  const updateExpense = useUpdatePropertyExpense();
  const { data: expenseData, isLoading: isLoadingExpense } = usePropertyExpense(expenseId);

  const isEdit = !!expenseId;

  const form = useForm({
    initialValues: {
      name: '',
      category: 'utilities' as ExpenseCategory,
      amount: 0,
      expenseDate: new Date(),
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1 as number | null,
      description: '',
      invoiceNumber: '',
      vendorName: '',
      receiptUrl: '',
    },
    validate: {
      name: (value) => (!value ? t('validation.required') : null),
      amount: (value) => (value <= 0 ? t('validation.positiveNumber') : null),
      expenseDate: (value) => (!value ? t('validation.required') : null),
    },
  });

  // Load existing expense data
  useEffect(() => {
    if (expenseData && isEdit) {
      form.setValues({
        name: expenseData.name || '',
        category: expenseData.category as ExpenseCategory,
        amount: expenseData.amount || 0,
        expenseDate: expenseData.expenseDate ? new Date(expenseData.expenseDate) : new Date(),
        year: expenseData.year || new Date().getFullYear(),
        month: expenseData.month || null,
        description: expenseData.description || '',
        invoiceNumber: expenseData.invoiceNumber || '',
        vendorName: expenseData.vendorName || '',
        receiptUrl: expenseData.receiptUrl || '',
      });
    }
  }, [expenseData, isEdit]);

  // Update year when expenseDate changes
  useEffect(() => {
    if (form.values.expenseDate) {
      const date = form.values.expenseDate;
      form.setFieldValue('year', date.getFullYear());
      form.setFieldValue('month', date.getMonth() + 1);
    }
  }, [form.values.expenseDate]);

  const categoryOptions = [
    { value: 'utilities', label: t('propertyExpenses.categories.utilities') },
    { value: 'maintenance', label: t('propertyExpenses.categories.maintenance') },
    { value: 'insurance', label: t('propertyExpenses.categories.insurance') },
    { value: 'taxes', label: t('propertyExpenses.categories.taxes') },
    { value: 'management', label: t('propertyExpenses.categories.management') },
    { value: 'cleaning', label: t('propertyExpenses.categories.cleaning') },
    { value: 'heating', label: t('propertyExpenses.categories.heating') },
    { value: 'other', label: t('propertyExpenses.categories.other') },
  ];

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        propertyId,
        name: values.name,
        category: values.category,
        amount: values.amount,
        expenseDate: values.expenseDate.toISOString(),
        year: values.year,
        month: values.month || undefined,
        description: values.description || undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        vendorName: values.vendorName || undefined,
        receiptUrl: values.receiptUrl || undefined,
      };

      if (isEdit && expenseId) {
        await updateExpense.mutateAsync({ id: expenseId, data: payload });
        showToast({ type: 'success', title: tGlobal('common.success'), message: t('propertyExpenses.updateSuccess') });
      } else {
        await createExpense.mutateAsync(payload);
        showToast({ type: 'success', title: tGlobal('common.success'), message: t('propertyExpenses.createSuccess') });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast({ type: 'error', title: tGlobal('common.error'), message: isEdit ? t('propertyExpenses.updateError') : t('propertyExpenses.createError') });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (isLoadingExpense && isEdit) {
    return <Text>{tGlobal('common.loading')}</Text>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {propertyName && (
            <Text size="sm" c="dimmed">
              {t('properties.title')}: <Text span fw={500}>{propertyName}</Text>
            </Text>
          )}

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('propertyExpenses.form.name')}
                placeholder={t('propertyExpenses.form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('propertyExpenses.form.category')}
                placeholder={t('propertyExpenses.form.categoryPlaceholder')}
                data={categoryOptions}
                required
                {...form.getInputProps('category')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('propertyExpenses.form.amount')}
                placeholder="0.00"
                required
                min={0}
                decimalScale={2}
                thousandSeparator=","
                suffix=" ₺"
                {...form.getInputProps('amount')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('propertyExpenses.form.expenseDate')}
                placeholder={t('propertyExpenses.form.expenseDatePlaceholder')}
                required
                valueFormat="DD.MM.YYYY"
                {...form.getInputProps('expenseDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('propertyExpenses.form.vendorName')}
                placeholder={t('propertyExpenses.form.vendorNamePlaceholder')}
                {...form.getInputProps('vendorName')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('propertyExpenses.form.invoiceNumber')}
                placeholder={t('propertyExpenses.form.invoiceNumberPlaceholder')}
                {...form.getInputProps('invoiceNumber')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('propertyExpenses.form.description')}
                placeholder={t('propertyExpenses.form.descriptionPlaceholder')}
                rows={3}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={handleCancel}
            >
              {tGlobal('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createExpense.isPending || updateExpense.isPending}
            >
              {isEdit ? tGlobal('buttons.update') : tGlobal('buttons.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
