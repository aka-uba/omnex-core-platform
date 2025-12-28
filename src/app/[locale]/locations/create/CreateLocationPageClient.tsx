'use client';

import { useRouter } from 'next/navigation';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useCreateLocation, useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import type { LocationType } from '@/lib/schemas/location';

export function CreateLocationPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/locations');
  const { t: tGlobal } = useTranslation('global');
  const createLocation = useCreateLocation();

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

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createLocation.mutateAsync({
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
      });

      notifications.show({
        title: t('messages.createSuccess'),
        message: t('messages.createSuccess'),
        color: 'green',
      });

      router.push(`/${locale}/locations`);
    } catch (error) {
      notifications.show({
        title: t('messages.createError'),
        message: error instanceof Error ? error.message : t('messages.createError'),
        color: 'red',
      });
    }
  };

  // Prepare parent locations for select (exclude self and children)
  const parentOptions = locationsData?.locations
    .filter((loc) => loc.isActive)
    .map((loc) => ({
      value: loc.id,
      label: `${loc.name} (${t(`types.${loc.type}`)})`,
    })) || [];

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="create.title"
        description="create.description"
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/locations`, namespace: 'modules/locations' },
          { label: 'create.title', namespace: 'modules/locations' },
        ]}
        actions={[]}
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
                onClick={() => router.push(`/${locale}/locations`)}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="submit"
                loading={createLocation.isPending}
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

