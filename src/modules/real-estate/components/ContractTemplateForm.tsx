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
  Switch,
  Text,
} from '@mantine/core';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateContractTemplate, useUpdateContractTemplate, useContractTemplate } from '@/hooks/useContractTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { contractTemplateCreateSchema } from '@/modules/real-estate/schemas/contract-template.schema';

interface ContractTemplateFormProps {
  locale: string;
  templateId?: string;
}

export function ContractTemplateForm({ locale, templateId }: ContractTemplateFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  const { data: templateData, isLoading: isLoadingTemplate } = useContractTemplate(templateId || '');

  const isEdit = !!templateId;

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      type: 'rental' as 'rental' | 'sale' | 'lease' | 'general',
      category: '',
      content: '',
      isDefault: false,
    },
    validate: {
      name: (value) => (!value ? (t('form.name')) + ' ' + (tGlobal('common.required')) : null),
      type: (value) => (!value ? (t('form.type')) + ' ' + (tGlobal('common.required')) : null),
      content: (value) => (!value ? (t('form.content')) + ' ' + (tGlobal('common.required')) : null),
    },
  });

  // Load template data for edit
  useEffect(() => {
    if (isEdit && templateData && !isLoadingTemplate) {
      if (form.values.name === '') {
        form.setValues({
          name: templateData.name,
          description: templateData.description || '',
          type: templateData.type,
          category: templateData.category || '',
          content: templateData.content,
          isDefault: templateData.isDefault,
        });
      }
    }
  }, [isEdit, templateData, isLoadingTemplate, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        name: values.name,
        description: values.description || undefined,
        type: values.type,
        category: values.category || undefined,
        content: values.content,
        isDefault: values.isDefault,
      };

      const validatedData = contractTemplateCreateSchema.parse(formData) as any;

      if (isEdit && templateId) {
        await updateTemplate.mutateAsync({
          id: templateId,
          input: validatedData as any,
        });
        showToast({
          type: 'success',
          title: t('messages.updateSuccess'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createTemplate.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.createSuccess'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/real-estate/contract-templates`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.createError'),
        message: error instanceof Error ? error.message : (t('messages.createError')),
      });
    }
  };


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
                  { value: 'rental', label: t('types.rental') },
                  { value: 'sale', label: t('types.sale') },
                  { value: 'lease', label: t('types.lease') },
                  { value: 'general', label: t('types.general') },
                ]}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.category')}
                placeholder={t('form.categoryPlaceholder')}
                {...form.getInputProps('category')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch
                label={t('form.isDefault')}
                {...form.getInputProps('isDefault', { type: 'checkbox' })}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                rows={2}
                {...form.getInputProps(t('form.description'))}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.content')}
                placeholder={t('form.contentPlaceholder')}
                required
                rows={15}
                {...form.getInputProps('content')}
              />
              <Text size="xs" c="dimmed" mt="xs">
                {t('form.contentHint')}
              </Text>
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/contract-templates`)}
            >
              {tGlobal('common.cancel')}
            </Button>
            <Button type="submit" loading={createTemplate.isPending || updateTemplate.isPending}>
              {isEdit ? (t('actions.update')) : (t('actions.create'))}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

