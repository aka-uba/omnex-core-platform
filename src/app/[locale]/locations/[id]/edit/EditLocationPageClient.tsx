'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Switch,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useLocation, useUpdateLocation, useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import type { LocationType } from '@/lib/schemas/location';

export function EditLocationPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslation('modules/locations');
  const { t: tGlobal } = useTranslation('global');
  const updateLocation = useUpdateLocation();

  // Fetch current location
  const { data: locationData, isLoading } = useLocation(id);

  // Fetch locations for parent selection
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const form = useForm({
    initialValues: {
      name: '',
      type: 'lokasyon' as LocationType,
      code: '',
      description: '',
      parentId: null as string | null,
      address: '',
      city: '',
      country: '',
      postalCode: '',
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('form.name') + ' ' + tGlobal('common.required') : null),
      type: (value) => (!value ? t('form.type') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Populate form when location data is loaded
  useEffect(() => {
    if (locationData?.location) {
      const loc = locationData.location;
      form.setValues({
        name: loc.name,
        type: loc.type as LocationType,
        code: loc.code || '',
        description: loc.description || '',
        parentId: loc.parentId || null,
        address: loc.address || '',
        city: loc.city || '',
        country: loc.country || '',
        postalCode: loc.postalCode || '',
        isActive: loc.isActive,
      });
    }
  }, [locationData]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!id) return;

    try {
      await updateLocation.mutateAsync({
        id,
        data: {
          name: values.name,
          type: values.type,
          code: values.code || undefined,
          description: values.description || undefined,
          parentId: values.parentId || undefined,
          address: values.address || undefined,
          city: values.city || undefined,
          country: values.country || undefined,
          postalCode: values.postalCode || undefined,
          isActive: values.isActive,
        },
      });

      notifications.show({
        title: t('messages.updateSuccess'),
        message: t('messages.updateSuccess'),
        color: 'green',
      });

      router.push(`/${locale}/locations/${id}`);
    } catch (error) {
      notifications.show({
        title: t('messages.updateError'),
        message: error instanceof Error ? error.message : t('messages.updateError'),
        color: 'red',
      });
    }
  };

  // Prepare parent locations for select (exclude self and children)
  const parentOptions = locationsData?.locations
    .filter((loc) => loc.isActive && loc.id !== id)
    .map((loc) => ({
      value: loc.id,
      label: `${loc.name} (${t(`types.${loc.type}`)})`,
    })) || [];

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="edit.title"
        description="edit.description"
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/locations`, namespace: 'modules/locations' },
          { label: locationData?.location.name || '', href: `/${locale}/locations/${id}` },
          { label: 'edit.title', namespace: 'modules/locations' },
        ]}
        actions={[
          {
            label: tGlobal('common.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${locale}/locations/${id}`),
            variant: 'default',
          },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md" mt="md">
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
                  placeholder={t('form.type')}
                  required
                  data={[
                    { value: 'firma', label: t('types.firma') },
                    { value: 'lokasyon', label: t('types.lokasyon') },
                    { value: 'isletme', label: t('types.isletme') },
                    { value: 'koridor', label: t('types.koridor') },
                    { value: 'oda', label: t('types.oda') },
                  ]}
                  {...form.getInputProps('type')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.code')}
                  placeholder={t('form.codePlaceholder')}
                  {...form.getInputProps('code')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('form.parent')}
                  placeholder={t('form.parentPlaceholder')}
                  data={parentOptions}
                  searchable
                  clearable
                  {...form.getInputProps('parentId')}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label={t('form.description')}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
              {...form.getInputProps('description')}
            />

            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label={t('form.address')}
                  placeholder={t('form.addressPlaceholder')}
                  {...form.getInputProps('address')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.postalCode')}
                  placeholder={t('form.postalCodePlaceholder')}
                  {...form.getInputProps('postalCode')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.city')}
                  placeholder={t('form.cityPlaceholder')}
                  {...form.getInputProps('city')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.country')}
                  placeholder={t('form.countryPlaceholder')}
                  {...form.getInputProps('country')}
                />
              </Grid.Col>
            </Grid>

            <Switch
              label={t('form.isActive')}
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="default"
                onClick={() => router.push(`/${locale}/locations/${id}`)}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="submit"
                loading={updateLocation.isPending}
              >
                {t('form.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

