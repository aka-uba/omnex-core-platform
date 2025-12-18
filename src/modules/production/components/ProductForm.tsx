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
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { productCreateSchema } from '@/modules/production/schemas/product.schema';
import type { ProductType, ProductUnit } from '@/modules/production/types/product';

interface ProductFormProps {
  locale: string;
  productId?: string;
}

export function ProductForm({ locale, productId }: ProductFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productData, isLoading: isLoadingProduct } = useProduct(productId || '');
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const isEdit = !!productId;

  const form = useForm({
    initialValues: {
      name: '',
      code: '',
      sku: '',
      barcode: '',
      category: '',
      type: 'hammadde' as ProductType,
      locationId: null as string | null,
      stockQuantity: 0,
      minStockLevel: null as number | null,
      maxStockLevel: null as number | null,
      unit: 'adet' as ProductUnit,
      costPrice: null as number | null,
      sellingPrice: null as number | null,
      currency: 'TRY',
      isProducible: false,
      productionTime: null as number | null,
      description: '',
      images: [] as string[],
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('form.name') + ' ' + tGlobal('common.required') : null),
      code: (value) => (!value ? t('form.code') + ' ' + tGlobal('common.required') : null),
      category: (value) => (!value ? t('form.category') + ' ' + tGlobal('common.required') : null),
      unit: (value) => (!value ? t('form.unit') + ' ' + tGlobal('common.required') : null),
      stockQuantity: (value) => (value < 0 ? t('form.stockQuantity') + ' ' + t('form.mustBeNonNegative') : null),
    },
  });

  // Load product data for edit
  useEffect(() => {
    if (isEdit && productData && !isLoadingProduct) {
      if (form.values.name === '') {
        form.setValues({
          name: productData.name,
          code: productData.code,
          sku: productData.sku || '',
          barcode: productData.barcode || '',
          category: productData.category,
          type: productData.type,
          locationId: productData.locationId ?? null,
          stockQuantity: Number(productData.stockQuantity),
          minStockLevel: productData.minStockLevel != null ? Number(productData.minStockLevel) : null,
          maxStockLevel: productData.maxStockLevel != null ? Number(productData.maxStockLevel) : null,
          unit: productData.unit,
          costPrice: productData.costPrice != null ? Number(productData.costPrice) : null,
          sellingPrice: productData.sellingPrice != null ? Number(productData.sellingPrice) : null,
          currency: productData.currency,
          isProducible: productData.isProducible,
          productionTime: productData.productionTime || null,
          description: productData.description || '',
          images: productData.images || [],
          isActive: productData.isActive,
        });
      }
    }
  }, [isEdit, productData, isLoadingProduct, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        name: values.name,
        code: values.code,
        sku: values.sku || undefined,
        barcode: values.barcode || undefined,
        category: values.category,
        type: values.type,
        locationId: values.locationId || undefined,
        stockQuantity: values.stockQuantity,
        minStockLevel: values.minStockLevel ?? undefined,
        maxStockLevel: values.maxStockLevel ?? undefined,
        unit: values.unit,
        costPrice: values.costPrice ?? undefined,
        sellingPrice: values.sellingPrice ?? undefined,
        currency: values.currency,
        isProducible: values.isProducible,
        productionTime: values.productionTime ?? undefined,
        description: values.description || undefined,
        images: values.images || [],
      };

      const validatedData = productCreateSchema.parse(formData) as any;

      if (isEdit && productId) {
        await updateProduct.mutateAsync({
          id: productId,
          ...validatedData,
          isActive: values.isActive,
        } as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createProduct.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/production/products`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingProduct) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const locationOptions = locationsData?.locations.map(l => ({
    value: l.id,
    label: l.name,
  })) || [];

  const unitOptions: { value: ProductUnit; label: string }[] = [
    { value: 'adet', label: t('units.adet') },
    { value: 'kg', label: t('units.kg') },
    { value: 'lt', label: t('units.lt') },
    { value: 'm', label: t('units.m') },
    { value: 'm²', label: t('units.m2') },
    { value: 'm³', label: t('units.m3') },
    { value: 'paket', label: t('units.paket') },
    { value: 'kutu', label: t('units.kutu') },
    { value: 'palet', label: t('units.palet') },
  ];

  const typeOptions: { value: ProductType; label: string }[] = [
    { value: 'hammadde', label: t('types.hammadde') },
    { value: 'yarı_mamul', label: t('types.yarı_mamul') },
    { value: 'mamul', label: t('types.mamul') },
  ];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/production/products`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.name')}
                placeholder={t('form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.code')}
                placeholder={t('form.codePlaceholder')}
                required
                {...form.getInputProps('code')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.sku')}
                placeholder={t('form.skuPlaceholder')}
                {...form.getInputProps('sku')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.barcode')}
                placeholder={t('form.barcodePlaceholder')}
                {...form.getInputProps('barcode')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.category')}
                placeholder={t('form.categoryPlaceholder')}
                required
                {...form.getInputProps('category')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.type')}
                placeholder={t('form.typePlaceholder')}
                required
                data={typeOptions}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.location')}
                placeholder={t('form.locationPlaceholder')}
                data={locationOptions}
                searchable
                clearable
                {...form.getInputProps('locationId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.unit')}
                placeholder={t('form.unitPlaceholder')}
                required
                data={unitOptions}
                {...form.getInputProps('unit')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.stockQuantity')}
                placeholder={t('form.stockQuantityPlaceholder')}
                min={0}
                {...form.getInputProps('stockQuantity')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.minStockLevel')}
                placeholder={t('form.minStockLevelPlaceholder')}
                min={0}
                {...form.getInputProps('minStockLevel')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.maxStockLevel')}
                placeholder={t('form.maxStockLevelPlaceholder')}
                min={0}
                {...form.getInputProps('maxStockLevel')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.costPrice')}
                placeholder={t('form.costPricePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('costPrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.sellingPrice')}
                placeholder={t('form.sellingPricePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('sellingPrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('form.currency')}
                placeholder={t('form.currencyPlaceholder')}
                data={[
                  { value: 'TRY', label: 'TRY' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                ]}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch
                label={t('form.isProducible')}
                description={t('form.isProducibleDescription')}
                {...form.getInputProps('isProducible', { type: 'checkbox' })}
              />
            </Grid.Col>
            {form.values.isProducible && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label={t('form.productionTime')}
                  placeholder={t('form.productionTimePlaceholder')}
                  min={0}
                  {...form.getInputProps('productionTime')}
                />
              </Grid.Col>
            )}
            {isEdit && (
              <Grid.Col span={{ base: 12 }}>
                <Switch
                  label={t('form.isActive')}
                  description={t('form.isActiveDescription')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/production/products`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createProduct.isPending || updateProduct.isPending}
            >
              {isEdit ? t('form.update') : t('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}







