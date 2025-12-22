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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateTenant, useUpdateTenant, useTenant } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { tenantCreateSchema } from '@/modules/real-estate/schemas/tenant.schema';
import { MediaGallery } from './MediaGallery';
import { useAuth } from '@/hooks/useAuth';

interface TenantFormProps {
  locale: string;
  tenantId?: string;
}

export function TenantForm({ locale, tenantId }: TenantFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: tenantData, isLoading: isLoadingTenant } = useTenant(tenantId || '');
  const { user } = useAuth();

  const isEdit = !!tenantId;

  const form = useForm({
    initialValues: {
      userId: null as string | null,
      contactId: null as string | null,
      tenantNumber: '',
      moveInDate: null as Date | null,
      moveOutDate: null as Date | null,
      notes: '',
      images: [] as string[],
      documents: [] as string[],
      coverImage: undefined as string | undefined,
    },
    validate: {
      tenantNumber: (value) => (!value ? t('form.tenantNumber') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load tenant data for edit
  useEffect(() => {
    if (isEdit && tenantData && !isLoadingTenant) {
      if (form.values.tenantNumber === '') {
        form.setValues({
          userId: tenantData.userId ?? null,
          contactId: tenantData.contactId ?? null,
          tenantNumber: tenantData.tenantNumber || '',
          moveInDate: tenantData.moveInDate ? new Date(tenantData.moveInDate) : null,
          moveOutDate: tenantData.moveOutDate ? new Date(tenantData.moveOutDate) : null,
          notes: tenantData.notes || '',
          images: (tenantData as any).images || [],
          documents: (tenantData as any).documents || [],
          coverImage: (tenantData as any).coverImage ?? undefined,
        });
      }
    }
  }, [isEdit, tenantData, isLoadingTenant, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        userId: values.userId || undefined,
        contactId: values.contactId || undefined,
        tenantNumber: values.tenantNumber || undefined,
        moveInDate: values.moveInDate || undefined,
        moveOutDate: values.moveOutDate || undefined,
        notes: values.notes || undefined,
        images: values.images || [],
        documents: values.documents || [],
        coverImage: values.coverImage || undefined,
      };

      const validatedData = tenantCreateSchema.parse(formData) as any;

      if (isEdit && tenantId) {
        await updateTenant.mutateAsync({
          id: tenantId,
          input: validatedData as any,
        });
        notifications.show({
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
          color: 'green',
        });
      } else {
        await createTenant.mutateAsync(validatedData as any);
        notifications.show({
          title: t('messages.success'),
          message: t('messages.createSuccess'),
          color: 'green',
        });
      }

      router.push(`/${locale}/modules/real-estate/tenants`);
    } catch (error) {
      notifications.show({
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
        color: 'red',
      });
    }
  };

  if (isEdit && isLoadingTenant) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.tenantNumber')}
                placeholder={t('form.tenantNumberPlaceholder')}
                required
                {...form.getInputProps('tenantNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.userId')}
                placeholder={t('form.userIdPlaceholder')}
                {...form.getInputProps('userId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.contactId')}
                placeholder={t('form.contactIdPlaceholder')}
                {...form.getInputProps('contactId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.moveInDate')}
                placeholder={t('form.moveInDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('moveInDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.moveOutDate')}
                placeholder={t('form.moveOutDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('moveOutDate')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <MediaGallery
                tenantId="temp-tenant-id"
                {...(tenantId ? { entityId: tenantId } : {})}
                entityType="tenant"
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
              onClick={() => router.push(`/${locale}/modules/real-estate/tenants`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createTenant.isPending || updateTenant.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

