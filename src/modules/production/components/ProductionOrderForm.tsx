'use client';

import { useEffect } from 'react';
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
import { useCreateProductionOrder, useUpdateProductionOrder, useProductionOrder } from '@/hooks/useProductionOrders';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { productionOrderCreateSchema } from '@/modules/production/schemas/product.schema';
import type { ProductionOrderStatus, ProductionOrderPriority } from '@/modules/production/types/product';

interface ProductionOrderFormProps {
  locale: string;
  orderId?: string;
}

export function ProductionOrderForm({ locale, orderId }: ProductionOrderFormProps) {
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const createOrder = useCreateProductionOrder();
  const updateOrder = useUpdateProductionOrder();
  const { data: orderData, isLoading: isLoadingOrder } = useProductionOrder(orderId || '');
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000, isProducible: true });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const isEdit = !!orderId;

  const form = useForm({
    initialValues: {
      locationId: '',
      productId: '',
      orderNumber: '',
      quantity: 0,
      unit: 'adet',
      status: 'pending' as ProductionOrderStatus,
      priority: 'normal' as ProductionOrderPriority,
      plannedStartDate: null as Date | null,
      plannedEndDate: null as Date | null,
      estimatedCost: null as number | null,
      notes: '',
      isActive: true,
    },
    validate: {
      locationId: (value) => (!value ? t('orders.form.location') + ' ' + tGlobal('common.required') : null),
      productId: (value) => (!value ? t('orders.form.product') + ' ' + tGlobal('common.required') : null),
      orderNumber: (value) => (!value ? t('orders.form.orderNumber') + ' ' + tGlobal('common.required') : null),
      quantity: (value) => (value <= 0 ? t('orders.form.quantity') + ' ' + t('orders.form.mustBePositive') : null),
      unit: (value) => (!value ? t('orders.form.unit') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load order data for edit
  useEffect(() => {
    if (isEdit && orderData && !isLoadingOrder) {
      if (form.values.orderNumber === '') {
        form.setValues({
          locationId: orderData.locationId,
          productId: orderData.productId,
          orderNumber: orderData.orderNumber,
          quantity: Number(orderData.quantity),
          unit: orderData.unit,
          status: orderData.status,
          priority: orderData.priority,
          plannedStartDate: orderData.plannedStartDate ? new Date(orderData.plannedStartDate) : null,
          plannedEndDate: orderData.plannedEndDate ? new Date(orderData.plannedEndDate) : null,
          estimatedCost: orderData.estimatedCost ? Number(orderData.estimatedCost) : null,
          notes: orderData.notes || '',
          isActive: orderData.isActive,
        });
      }
    }
  }, [isEdit, orderData, isLoadingOrder, form]);

  // Auto-generate order number if creating
  useEffect(() => {
    if (!isEdit && !form.values.orderNumber) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      form.setFieldValue('orderNumber', `PO-${timestamp}-${random}`);
    }
  }, [isEdit, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        locationId: values.locationId,
        productId: values.productId,
        orderNumber: values.orderNumber,
        quantity: values.quantity,
        unit: values.unit,
        status: values.status,
        priority: values.priority,
        plannedStartDate: values.plannedStartDate || undefined,
        plannedEndDate: values.plannedEndDate || undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        notes: values.notes || undefined,
      };

      const validatedData = productionOrderCreateSchema.parse(formData) as any;

      if (isEdit && orderId) {
        await updateOrder.mutateAsync({
          id: orderId,
          ...validatedData,
          isActive: values.isActive,
        } as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('orders.updateSuccess'),
        });
      } else {
        await createOrder.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('orders.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/production/orders`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingOrder) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const productOptions = productsData?.products.map(p => ({
    value: p.id,
    label: `${p.name} (${p.code})`,
  })) || [];

  const locationOptions = locationsData?.locations.map(l => ({
    value: l.id,
    label: l.name,
  })) || [];

  const unitOptions = [
    { value: 'adet', label: t('units.adet') },
    { value: 'kg', label: t('units.kg') },
    { value: 'lt', label: t('units.lt') },
    { value: 'm', label: t('units.m') },
    { value: 'm²', label: t('units.m2') },
    { value: 'm³', label: t('units.m3') },
  ];

  const statusOptions: { value: ProductionOrderStatus; label: string }[] = [
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'in_progress', label: t('orders.status.in_progress') },
    { value: 'completed', label: t('orders.status.completed') },
    { value: 'cancelled', label: t('orders.status.cancelled') },
  ];

  const priorityOptions: { value: ProductionOrderPriority; label: string }[] = [
    { value: 'low', label: t('orders.priority.low') },
    { value: 'normal', label: t('orders.priority.normal') },
    { value: 'high', label: t('orders.priority.high') },
    { value: 'urgent', label: t('orders.priority.urgent') },
  ];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/production/orders`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('orders.form.orderNumber')}
                placeholder={t('orders.form.orderNumberPlaceholder')}
                required
                {...form.getInputProps('orderNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('orders.form.location')}
                placeholder={t('orders.form.locationPlaceholder')}
                required
                data={locationOptions}
                searchable
                {...form.getInputProps('locationId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('orders.form.product')}
                placeholder={t('orders.form.productPlaceholder')}
                required
                data={productOptions}
                searchable
                {...form.getInputProps('productId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label={t('orders.form.quantity')}
                placeholder={t('orders.form.quantityPlaceholder')}
                required
                min={0.01}
                {...form.getInputProps('quantity')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label={t('orders.form.unit')}
                placeholder={t('orders.form.unitPlaceholder')}
                required
                data={unitOptions}
                {...form.getInputProps('unit')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('orders.form.status')}
                placeholder={t('orders.form.statusPlaceholder')}
                data={statusOptions}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('orders.form.priority')}
                placeholder={t('orders.form.priorityPlaceholder')}
                data={priorityOptions}
                {...form.getInputProps('priority')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('orders.form.plannedStartDate')}
                placeholder={t('orders.form.plannedStartDatePlaceholder')}
                {...form.getInputProps('plannedStartDate')}
               locale={dayjsLocale} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('orders.form.plannedEndDate')}
                placeholder={t('orders.form.plannedEndDatePlaceholder')}
                {...form.getInputProps('plannedEndDate')}
               locale={dayjsLocale} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('orders.form.estimatedCost')}
                placeholder={t('orders.form.estimatedCostPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('estimatedCost')}
              />
            </Grid.Col>
            {isEdit && (
              <Grid.Col span={{ base: 12 }}>
                <Switch
                  label={t('orders.form.isActive')}
                  description={t('orders.form.isActiveDescription')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('orders.form.notes')}
                placeholder={t('orders.form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/production/orders`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createOrder.isPending || updateOrder.isPending}
            >
              {isEdit ? t('form.update') : t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

