'use client';

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
import { DateInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateProperty, useUpdateProperty, useProperty } from '@/hooks/useProperties';
import { useTranslation } from '@/lib/i18n/client';
import { propertyCreateSchema } from '@/modules/real-estate/schemas/property.schema';
import type { PropertyType } from '@/modules/real-estate/types/property';
import { MediaGallery } from './MediaGallery';
import { useAuth } from '@/hooks/useAuth';

interface PropertyFormProps {
  locale: string;
  propertyId?: string;
}

export function PropertyForm({ locale, propertyId }: PropertyFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { data: propertyData, isLoading: isLoadingProperty } = useProperty(propertyId || '');
  const { user } = useAuth();

  const isEdit = !!propertyId;

  const form = useForm({
    initialValues: {
      name: '',
      type: 'apartment' as PropertyType,
      code: '',
      address: '',
      city: '',
      district: '',
      neighborhood: '',
      street: '',
      buildingNo: '',
      postalCode: '',
      country: 'TR',
      propertyNumber: '',
      latitude: null as number | null,
      longitude: null as number | null,
      totalUnits: 0,
      managerId: null as string | null,
      managerUserId: null as string | null,
      monthlyFee: null as number | null,
      paymentDay: null as number | null,
      constructionYear: null as number | null,
      lastRenovationDate: null as Date | null,
      landArea: null as number | null,
      floorCount: null as number | null,
      livingArea: null as number | null,
      purchaseDate: null as Date | null,
      purchasePrice: null as number | null,
      isPaidOff: false,
      financingStartDate: null as Date | null,
      financingEndDate: null as Date | null,
      monthlyFinancingRate: null as number | null,
      numberOfInstallments: null as number | null,
      financingPaymentDay: null as number | null,
      description: '',
      images: [] as string[],
      coverImage: undefined as string | undefined,
      documents: [] as string[],
    },
    validate: {
      name: (value) => (!value ? t('form.name') + ' ' + tGlobal('common.required') : null),
      type: (value) => (!value ? t('form.type') + ' ' + tGlobal('common.required') : null),
      address: (value) => (!value ? t('form.address') + ' ' + tGlobal('common.required') : null),
      city: (value) => (!value ? t('form.city') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load property data for edit
  if (isEdit && propertyData && !isLoadingProperty) {
    if (form.values.name === '') {
      form.setValues({
        name: propertyData.name,
        type: propertyData.type,
        code: propertyData.code || '',
        address: propertyData.address,
        city: propertyData.city,
        district: propertyData.district || '',
        neighborhood: propertyData.neighborhood || '',
        street: propertyData.street || '',
        buildingNo: propertyData.buildingNo || '',
        postalCode: propertyData.postalCode || '',
        country: propertyData.country,
        propertyNumber: (propertyData as any).propertyNumber || '',
        latitude: propertyData.latitude ? Number(propertyData.latitude) : null,
        longitude: propertyData.longitude ? Number(propertyData.longitude) : null,
        totalUnits: (propertyData as any).totalUnits || 0,
        managerId: propertyData.managerId || null,
        managerUserId: propertyData.managerUserId || null,
        monthlyFee: propertyData.monthlyFee ? Number(propertyData.monthlyFee) : null,
        paymentDay: propertyData.paymentDay || null,
        constructionYear: (propertyData as any).constructionYear || null,
        lastRenovationDate: (propertyData as any).lastRenovationDate ? new Date((propertyData as any).lastRenovationDate) : null,
        landArea: (propertyData as any).landArea ? Number((propertyData as any).landArea) : null,
        floorCount: (propertyData as any).floorCount || null,
        livingArea: (propertyData as any).livingArea ? Number((propertyData as any).livingArea) : null,
        purchaseDate: (propertyData as any).purchaseDate ? new Date((propertyData as any).purchaseDate) : null,
        purchasePrice: (propertyData as any).purchasePrice ? Number((propertyData as any).purchasePrice) : null,
        isPaidOff: (propertyData as any).isPaidOff || false,
        financingStartDate: (propertyData as any).financingStartDate ? new Date((propertyData as any).financingStartDate) : null,
        financingEndDate: (propertyData as any).financingEndDate ? new Date((propertyData as any).financingEndDate) : null,
        monthlyFinancingRate: (propertyData as any).monthlyFinancingRate ? Number((propertyData as any).monthlyFinancingRate) : null,
        numberOfInstallments: (propertyData as any).numberOfInstallments || null,
        financingPaymentDay: (propertyData as any).financingPaymentDay || null,
        description: propertyData.description || '',
        images: propertyData.images || [],
        coverImage: propertyData.coverImage ?? undefined,
        documents: propertyData.documents || [],
      });
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        name: values.name,
        type: values.type,
        code: values.code || undefined,
        address: values.address,
        city: values.city,
        district: values.district || undefined,
        neighborhood: values.neighborhood || undefined,
        street: values.street || undefined,
        buildingNo: values.buildingNo || undefined,
        postalCode: values.postalCode || undefined,
        country: values.country,
        propertyNumber: values.propertyNumber || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        totalUnits: values.totalUnits ?? undefined,
        managerId: values.managerId || undefined,
        managerUserId: values.managerUserId || undefined,
        monthlyFee: values.monthlyFee ?? undefined,
        paymentDay: values.paymentDay ?? undefined,
        constructionYear: values.constructionYear ?? undefined,
        lastRenovationDate: values.lastRenovationDate || undefined,
        landArea: values.landArea ?? undefined,
        floorCount: values.floorCount ?? undefined,
        livingArea: values.livingArea ?? undefined,
        purchaseDate: values.purchaseDate || undefined,
        purchasePrice: values.purchasePrice ?? undefined,
        isPaidOff: values.isPaidOff ?? undefined,
        financingStartDate: values.financingStartDate || undefined,
        financingEndDate: values.financingEndDate || undefined,
        monthlyFinancingRate: values.monthlyFinancingRate ?? undefined,
        numberOfInstallments: values.numberOfInstallments ?? undefined,
        financingPaymentDay: values.financingPaymentDay ?? undefined,
        description: values.description || undefined,
        images: values.images || [],
        coverImage: values.coverImage || undefined,
        documents: values.documents || [],
      };

      // Parse without isActive for create/update
      const validatedData = propertyCreateSchema.parse(formData) as any;

      if (isEdit && propertyId) {
        await updateProperty.mutateAsync({
          id: propertyId,
          input: validatedData as any,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createProperty.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/real-estate/properties`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingProperty) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
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
              <Select
                label={t('form.type')}
                placeholder={t('form.typePlaceholder')}
                required
                data={[
                  { value: 'apartment', label: t('types.apartment') },
                  { value: 'complex', label: t('types.complex') },
                  { value: 'building', label: t('types.building') },
                ]}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.code')}
                placeholder={t('form.codePlaceholder')}
                {...form.getInputProps('code')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.country')}
                placeholder={t('form.countryPlaceholder')}
                {...form.getInputProps('country')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label={t('form.address')}
                placeholder={t('form.addressPlaceholder')}
                required
                {...form.getInputProps('address')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.city')}
                placeholder={t('form.cityPlaceholder')}
                required
                {...form.getInputProps('city')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.district')}
                placeholder={t('form.districtPlaceholder')}
                {...form.getInputProps('district')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.neighborhood')}
                placeholder={t('form.neighborhoodPlaceholder')}
                {...form.getInputProps('neighborhood')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.street')}
                placeholder={t('form.streetPlaceholder')}
                {...form.getInputProps('street')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.buildingNo')}
                placeholder={t('form.buildingNoPlaceholder')}
                {...form.getInputProps('buildingNo')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.postalCode')}
                placeholder={t('form.postalCodePlaceholder')}
                {...form.getInputProps('postalCode')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.propertyNumber')}
                placeholder={t('form.propertyNumberPlaceholder')}
                {...form.getInputProps('propertyNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.latitude')}
                placeholder={t('form.latitudePlaceholder')}
                decimalScale={8}
                {...form.getInputProps('latitude')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.longitude')}
                placeholder={t('form.longitudePlaceholder')}
                decimalScale={8}
                {...form.getInputProps('longitude')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.totalUnits')}
                placeholder={t('form.totalUnitsPlaceholder')}
                min={0}
                {...form.getInputProps('totalUnits')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.monthlyFee')}
                placeholder={t('form.monthlyFeePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('monthlyFee')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.paymentDay')}
                placeholder={t('form.paymentDayPlaceholder')}
                min={1}
                max={31}
                {...form.getInputProps('paymentDay')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.constructionYear')}
                placeholder={t('form.constructionYearPlaceholder')}
                min={1800}
                max={2100}
                {...form.getInputProps('constructionYear')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.lastRenovationDate')}
                placeholder={t('form.lastRenovationDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('lastRenovationDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.floorCount')}
                placeholder={t('form.floorCountPlaceholder')}
                min={1}
                {...form.getInputProps('floorCount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.landArea')}
                placeholder={t('form.landAreaPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('landArea')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.livingArea')}
                placeholder={t('form.livingAreaPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('livingArea')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.purchaseDate')}
                placeholder={t('form.purchaseDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('purchaseDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.purchasePrice')}
                placeholder={t('form.purchasePricePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('purchasePrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label={t('form.isPaidOff')}
                {...form.getInputProps('isPaidOff', { type: 'checkbox' })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.financingStartDate')}
                placeholder={t('form.financingStartDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('financingStartDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.financingEndDate')}
                placeholder={t('form.financingEndDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('financingEndDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.monthlyFinancingRate')}
                placeholder={t('form.monthlyFinancingRatePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('monthlyFinancingRate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.numberOfInstallments')}
                placeholder={t('form.numberOfInstallmentsPlaceholder')}
                min={1}
                {...form.getInputProps('numberOfInstallments')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.financingPaymentDay')}
                placeholder={t('form.financingPaymentDayPlaceholder')}
                min={1}
                max={31}
                {...form.getInputProps('financingPaymentDay')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <MediaGallery
                tenantId="temp-tenant-id"
                {...(propertyId ? { entityId: propertyId } : {})}
                entityType="property"
                images={form.values.images}
                documents={form.values.documents}
                {...(form.values.coverImage ? { coverImage: form.values.coverImage } : {})}
                onImagesChange={(images) => form.setFieldValue('images', images)}
                onDocumentsChange={(documents) => form.setFieldValue('documents', documents)}
                onCoverImageChange={(coverImage) => form.setFieldValue('coverImage', coverImage ?? undefined)}
                userId={user?.id || 'system'}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/properties`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createProperty.isPending || updateProperty.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

