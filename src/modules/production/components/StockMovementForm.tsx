'use client';

import { useForm } from '@mantine/form';
import {
  Paper,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { stockMovementCreateSchema } from '@/modules/production/schemas/product.schema';
import type { StockMovementType } from '@/modules/production/types/product';

interface StockMovementFormProps {
  locale: string;
}

export function StockMovementForm({ locale }: StockMovementFormProps) {
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const createMovement = useCreateStockMovement();
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const form = useForm({
    initialValues: {
      productId: '',
      locationId: null as string | null,
      type: 'in' as StockMovementType,
      quantity: 0,
      unit: 'adet',
      referenceType: null as string | null,
      referenceId: null as string | null,
      movementDate: new Date(),
      notes: '',
    },
    validate: {
      productId: (value) => (!value ? t('stock.form.product') + ' ' + tGlobal('common.required') : null),
      quantity: (value) => (value <= 0 ? t('stock.form.quantity') + ' ' + t('stock.form.mustBePositive') : null),
      unit: (value) => (!value ? t('stock.form.unit') + ' ' + tGlobal('common.required') : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        productId: values.productId,
        locationId: values.locationId || undefined,
        type: values.type,
        quantity: values.quantity,
        unit: values.unit,
        referenceType: values.referenceType || undefined,
        referenceId: values.referenceId || undefined,
        movementDate: values.movementDate,
        notes: values.notes || undefined,
      };

      const validatedData = stockMovementCreateSchema.parse(formData) as any;

      await createMovement.mutateAsync(validatedData);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('stock.createSuccess'),
      });

      router.push(`/${locale}/modules/production/stock`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

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

  const typeOptions: { value: StockMovementType; label: string }[] = [
    { value: 'in', label: t('stock.types.in') },
    { value: 'out', label: t('stock.types.out') },
    { value: 'transfer', label: t('stock.types.transfer') },
    { value: 'adjustment', label: t('stock.types.adjustment') },
  ];

  const referenceTypeOptions = [
    { value: '', label: t('stock.form.none') },
    { value: 'production', label: t('stock.referenceTypes.production') },
    { value: 'sale', label: t('stock.referenceTypes.sale') },
    { value: 'purchase', label: t('stock.referenceTypes.purchase') },
    { value: 'maintenance', label: t('stock.referenceTypes.maintenance') },
  ];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/production/stock`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('stock.form.product')}
                placeholder={t('stock.form.productPlaceholder')}
                required
                data={productOptions}
                searchable
                {...form.getInputProps('productId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('stock.form.location')}
                placeholder={t('stock.form.locationPlaceholder')}
                data={locationOptions}
                searchable
                clearable
                {...form.getInputProps('locationId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('stock.form.type')}
                placeholder={t('stock.form.typePlaceholder')}
                required
                data={typeOptions}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label={t('stock.form.quantity')}
                placeholder={t('stock.form.quantityPlaceholder')}
                required
                min={0.01}
                {...form.getInputProps('quantity')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label={t('stock.form.unit')}
                placeholder={t('stock.form.unitPlaceholder')}
                required
                data={unitOptions}
                {...form.getInputProps('unit')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('stock.form.referenceType')}
                placeholder={t('stock.form.referenceTypePlaceholder')}
                data={referenceTypeOptions}
                clearable
                {...form.getInputProps('referenceType')}
              />
            </Grid.Col>
            {form.values.referenceType && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('stock.form.referenceId')}
                  placeholder={t('stock.form.referenceIdPlaceholder')}
                  {...form.getInputProps('referenceId')}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('stock.form.movementDate')}
                placeholder={t('stock.form.movementDatePlaceholder')}
                {...form.getInputProps('movementDate')}
               locale={dayjsLocale} />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('stock.form.notes')}
                placeholder={t('stock.form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/production/stock`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createMovement.isPending}
            >
              {t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

