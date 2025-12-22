'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Divider,
  Text,
  Card,
  Title,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconCash, IconReceipt, IconHome, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateApartment, useUpdateApartment, useApartment } from '@/hooks/useApartments';
import { useProperties } from '@/hooks/useProperties';
import { useTranslation } from '@/lib/i18n/client';
import { apartmentCreateSchema } from '@/modules/real-estate/schemas/apartment.schema';
import type { ApartmentStatus, OwnerType, OwnershipType } from '@/modules/real-estate/types/apartment';
import { MediaGallery } from './MediaGallery';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { UsageRightsPanel, ApartmentUsageRight } from './UsageRightsPanel';

interface ApartmentFormProps {
  locale: string;
  apartmentId?: string;
}

export function ApartmentForm({ locale, apartmentId }: ApartmentFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { user } = useAuth();
  const createApartment = useCreateApartment();
  const updateApartment = useUpdateApartment();
  const { data: apartmentData, isLoading: isLoadingApartment } = useApartment(apartmentId || '');
  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });

  const isEdit = !!apartmentId;

  // Usage Rights Panel state
  const [usageRightsPanelOpened, setUsageRightsPanelOpened] = useState(false);
  const [usageRights, setUsageRights] = useState<ApartmentUsageRight[]>([]);

  const form = useForm({
    initialValues: {
      propertyId: '',
      unitNumber: '',
      floor: undefined as number | undefined,
      block: '' as string,
      area: 0,
      roomCount: 0,
      livingRoom: true,
      bathroomCount: 1,
      balcony: false,
      ownerId: undefined as string | undefined,
      ownerType: undefined as OwnerType | undefined,
      ownershipType: undefined as OwnershipType | undefined,
      status: 'empty' as ApartmentStatus,
      deliveryDate: undefined as Date | undefined,
      rentPrice: undefined as number | undefined,
      salePrice: undefined as number | undefined,
      coldRent: undefined as number | undefined,
      additionalCosts: undefined as number | undefined,
      heatingCosts: undefined as number | undefined,
      deposit: undefined as number | undefined,
      description: '',
      images: [] as string[],
      coverImage: undefined as string | undefined,
      documents: [] as string[],
      qrCode: undefined as string | undefined,
    },
    validate: {
      propertyId: (value) => (!value ? t('form.property') + ' ' + tGlobal('common.required') : null),
      unitNumber: (value) => (!value ? t('form.unitNumber') + ' ' + tGlobal('common.required') : null),
      area: (value) => (value <= 0 ? t('form.area') + ' ' + tGlobal('common.required') : null),
      roomCount: (value) => (value < 0 ? t('form.roomCount') + ' ' + t('form.mustBeNonNegative') : null),
    },
  });

  // Toplam Kira (Warm Rent) hesaplamasi
  const warmRent = useMemo(() => {
    const cold = form.values.coldRent || 0;
    const additional = form.values.additionalCosts || 0;
    const heating = form.values.heatingCosts || 0;
    return cold + additional + heating;
  }, [form.values.coldRent, form.values.additionalCosts, form.values.heatingCosts]);

  // Load apartment data for edit
  useEffect(() => {
    if (isEdit && apartmentData && !isLoadingApartment) {
      if (form.values.unitNumber === '') {
        form.setValues({
          propertyId: apartmentData.propertyId,
          unitNumber: apartmentData.unitNumber,
          floor: apartmentData.floor ?? undefined,
          block: apartmentData.block ?? '',
          area: Number(apartmentData.area),
          roomCount: apartmentData.roomCount,
          livingRoom: apartmentData.livingRoom,
          bathroomCount: apartmentData.bathroomCount,
          balcony: apartmentData.balcony,
          ownerId: apartmentData.ownerId ?? undefined,
          ownerType: apartmentData.ownerType,
          ownershipType: apartmentData.ownershipType,
          status: apartmentData.status,
          deliveryDate: apartmentData.deliveryDate ? new Date(apartmentData.deliveryDate) : undefined,
          rentPrice: apartmentData.rentPrice ? Number(apartmentData.rentPrice) : undefined,
          salePrice: apartmentData.salePrice ? Number(apartmentData.salePrice) : undefined,
          coldRent: apartmentData.coldRent ? Number(apartmentData.coldRent) : undefined,
          additionalCosts: apartmentData.additionalCosts ? Number(apartmentData.additionalCosts) : undefined,
          heatingCosts: apartmentData.heatingCosts ? Number(apartmentData.heatingCosts) : undefined,
          deposit: apartmentData.deposit ? Number(apartmentData.deposit) : undefined,
          description: apartmentData.description || '',
          images: apartmentData.images || [],
          coverImage: apartmentData.coverImage ?? undefined,
          documents: apartmentData.documents || [],
          qrCode: apartmentData.qrCode ?? undefined,
        } as any);

        // Load usage rights from apartment data
        if (apartmentData.usageRights) {
          setUsageRights(apartmentData.usageRights as ApartmentUsageRight[]);
        }
      }
    }
  }, [isEdit, apartmentData, isLoadingApartment, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        propertyId: values.propertyId,
        unitNumber: values.unitNumber,
        floor: values.floor ?? undefined,
        block: values.block || undefined,
        area: values.area,
        roomCount: values.roomCount,
        livingRoom: values.livingRoom,
        bathroomCount: values.bathroomCount,
        balcony: values.balcony,
        ownerId: values.ownerId || undefined,
        ownerType: values.ownerType || undefined,
        ownershipType: values.ownershipType || undefined,
        status: values.status,
        deliveryDate: values.deliveryDate || undefined,
        rentPrice: values.rentPrice ?? undefined,
        salePrice: values.salePrice ?? undefined,
        coldRent: values.coldRent ?? undefined,
        additionalCosts: values.additionalCosts ?? undefined,
        heatingCosts: values.heatingCosts ?? undefined,
        deposit: values.deposit ?? undefined,
        description: values.description || undefined,
        images: values.images || [],
        coverImage: values.coverImage || null,
        documents: values.documents || [],
        qrCode: values.qrCode || undefined,
        usageRights: usageRights,
      };

      const validatedData = apartmentCreateSchema.parse(formData) as any;
      // Add usageRights to validated data (not in schema but accepted by API)
      validatedData.usageRights = usageRights;

      if (isEdit && apartmentId) {
        await updateApartment.mutateAsync({
          id: apartmentId,
          input: validatedData as any,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createApartment.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/real-estate/apartments`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingApartment) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const propertyOptions = propertiesData?.properties.map(p => ({
    value: p.id,
    label: p.name,
  })) || [];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.property')}
                placeholder={t('form.propertyPlaceholder')}
                required
                data={propertyOptions}
                searchable
                {...form.getInputProps('propertyId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.unitNumber')}
                placeholder={t('form.unitNumberPlaceholder')}
                required
                {...form.getInputProps('unitNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.floor')}
                placeholder={t('form.floorPlaceholder')}
                {...form.getInputProps('floor')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.block')}
                placeholder={t('form.blockPlaceholder')}
                {...form.getInputProps('block')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.area')}
                placeholder={t('form.areaPlaceholder')}
                required
                min={0}
                decimalScale={2}
                {...form.getInputProps('area')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.roomCount')}
                placeholder={t('form.roomCountPlaceholder')}
                required
                min={0}
                {...form.getInputProps('roomCount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.bathroomCount')}
                placeholder={t('form.bathroomCountPlaceholder')}
                required
                min={1}
                {...form.getInputProps('bathroomCount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('form.status')}
                placeholder={t('form.statusPlaceholder')}
                required
                data={[
                  { value: 'empty', label: t('apartments.status.empty') },
                  { value: 'rented', label: t('apartments.status.rented') },
                  { value: 'sold', label: t('apartments.status.sold') },
                  { value: 'maintenance', label: t('apartments.status.maintenance') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.rentPrice')}
                placeholder={t('form.rentPricePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('rentPrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.salePrice')}
                placeholder={t('form.salePricePlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('salePrice')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label={t('form.livingRoom')}
                {...form.getInputProps('livingRoom', { type: 'checkbox' })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label={t('form.balcony')}
                {...form.getInputProps('balcony', { type: 'checkbox' })}
              />
            </Grid.Col>
          </Grid>

          {/* Kira ve Yan Giderler Bolumu */}
          <Divider my="md" />
          <Group gap="xs">
            <IconCash size={20} />
            <Title order={4}>{t('sideCosts.rentAndSideCosts')}</Title>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.coldRent')}
                placeholder={t('form.coldRentPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection={<IconReceipt size={16} />}
                {...form.getInputProps('coldRent')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.additionalCosts')}
                placeholder={t('form.additionalCostsPlaceholder')}
                min={0}
                decimalScale={2}
                description={t('sideCosts.monthlyEstimate')}
                {...form.getInputProps('additionalCosts')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.heatingCosts')}
                placeholder={t('form.heatingCostsPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('heatingCosts')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.deposit')}
                placeholder={t('form.depositPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('deposit')}
              />
            </Grid.Col>
          </Grid>

          {/* Toplam Kira Hesaplama Karti */}
          {(form.values.coldRent || form.values.additionalCosts || form.values.heatingCosts) && (
            <Card withBorder p="md" radius="md">
              <Stack gap="xs">
                <Title order={5}>{t('sideCosts.rentCalculation')}</Title>
                <Grid>
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.coldRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {(form.values.coldRent || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.additionalCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {(form.values.additionalCosts || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.heatingCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {(form.values.heatingCosts || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Divider my="xs" />
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="sm" fw={600}>{t('sideCosts.totalRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={700} c="blue">
                      {warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>
          )}

          {/* Kullanım Hakları (Nutzungsrechte) Bölümü */}
          <Divider my="md" />
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <IconHome size={20} />
              <Title order={4}>{t('usageRights.title')}</Title>
              {usageRights.filter(r => r.active).length > 0 && (
                <Badge color="blue" variant="filled">
                  {usageRights.filter(r => r.active).length}
                </Badge>
              )}
            </Group>
            <Tooltip label={t('usageRights.manage')}>
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={() => setUsageRightsPanelOpened(true)}
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Selected Usage Rights Preview */}
          {usageRights.filter(r => r.active).length > 0 && (
            <Card withBorder p="sm" radius="md">
              <Group gap="xs" wrap="wrap">
                {usageRights
                  .filter(r => r.active)
                  .slice(0, 10)
                  .map(r => (
                    <Badge key={r.id} variant="light" color="gray">
                      {r.name}
                    </Badge>
                  ))}
                {usageRights.filter(r => r.active).length > 10 && (
                  <Badge variant="light" color="blue">
                    +{usageRights.filter(r => r.active).length - 10} {t('usageRights.more')}
                  </Badge>
                )}
              </Group>
            </Card>
          )}

          <Divider my="md" />

          <Grid>
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
                {...(apartmentId ? { entityId: apartmentId } : {})}
                entityType="apartment"
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
              onClick={() => router.push(`/${locale}/modules/real-estate/apartments`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createApartment.isPending || updateApartment.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>

      {/* Usage Rights Panel */}
      <UsageRightsPanel
        opened={usageRightsPanelOpened}
        onClose={() => setUsageRightsPanelOpened(false)}
        locale={locale}
        selectedRights={usageRights}
        onSave={setUsageRights}
      />
    </Paper>
  );
}







