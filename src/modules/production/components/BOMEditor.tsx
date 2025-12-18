'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  NumberInput,
} from '@mantine/core';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useCreateBOMItem, useUpdateBOMItem, useBOMItem } from '@/hooks/useBOM';
import { useProducts } from '@/hooks/useProducts';
import { useTranslation } from '@/lib/i18n/client';

interface BOMEditorProps {
  locale: string;
  bomId: string;
  productId?: string;
  itemId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BOMEditor({ locale, bomId, productId, itemId, onSuccess, onCancel }: BOMEditorProps) {
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const createBOMItem = useCreateBOMItem();
  const updateBOMItem = useUpdateBOMItem();
  const { data: itemData } = useBOMItem(itemId || '');
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });

  const isEdit = !!itemId;

  const form = useForm({
    initialValues: {
      bomId: bomId || productId || '',
      productId: productId || '',
      componentId: '',
      quantity: 1,
      unit: 'adet',
      wasteRate: 0,
      order: 0,
    },
    validate: {
      productId: (value) => (!value ? (t('bom.form.productId')) + ' ' + (tGlobal('common.required')) : null),
      quantity: (value) => (value <= 0 ? (t('bom.form.quantity')) + ' must be greater than 0' : null),
      unit: (value) => (!value ? (t('bom.form.unit')) + ' ' + (tGlobal('common.required')) : null),
    },
  });

  // Load item data for edit
  useEffect(() => {
    if (isEdit && itemData?.bomItem) {
      const item = itemData.bomItem;
      form.setValues({
        bomId: item.bomId,
        productId: item.productId,
        componentId: item.componentId || '',
        quantity: item.quantity,
        unit: item.unit,
        wasteRate: item.wasteRate,
        order: item.order,
      });
    }
  }, [isEdit, itemData]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // bomId should be the same as productId (the product that this BOM belongs to)
      const submitData = {
        ...values,
        bomId: productId || bomId || values.productId,
      };

      if (isEdit && itemId) {
        await updateBOMItem.mutateAsync({
          id: itemId,
          data: submitData,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('bom.update.success'),
        });
      } else {
        await createBOMItem.mutateAsync(submitData);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('bom.create.success'),
        });
      }
      onSuccess();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : (t('bom.save.error')),
      });
    }
  };

  const products = productsData?.products || [];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Select
          label={t('bom.form.productId')}
          data={products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
          {...form.getInputProps('productId')}
          disabled={!!productId}
          required
        />

        <Select
          label={t('bom.form.componentId')}
          data={products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
          {...form.getInputProps('componentId')}
          clearable
        />

        <Group grow>
          <NumberInput
            label={t('bom.form.quantity')}
            {...form.getInputProps('quantity')}
            min={0.01}
            step={0.01}
            decimalScale={2}
            required
          />

          <TextInput
            label={t('bom.form.unit')}
            {...form.getInputProps('unit')}
            required
          />
        </Group>

        <Group grow>
          <NumberInput
            label={t('bom.form.wasteRate')}
            {...form.getInputProps('wasteRate')}
            min={0}
            max={100}
            decimalScale={2}
          />

          <NumberInput
            label={t('bom.form.order')}
            {...form.getInputProps('order')}
            min={0}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            {tGlobal('common.cancel')}
          </Button>
          <Button type="submit" loading={createBOMItem.isPending || updateBOMItem.isPending}>
            {isEdit ? (tGlobal('common.save')) : (tGlobal('common.create'))}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

