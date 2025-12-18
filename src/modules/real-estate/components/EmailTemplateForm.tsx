'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Grid,
  Switch,
  Group,
  Title,
  Text,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate } from '@/hooks/useEmailTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { emailTemplateCreateSchema } from '@/modules/real-estate/schemas/email-template.schema';
import type { EmailTemplateCategory } from '@/modules/real-estate/types/email-template';

interface EmailTemplateFormProps {
  locale: string;
  templateId?: string;
}

export function EmailTemplateForm({ locale, templateId }: EmailTemplateFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const isEdit = !!templateId;

  const { data: existingTemplate, isLoading: isLoadingTemplate } = useEmailTemplate(templateId || '');
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();

  const form = useForm({
    initialValues: {
      name: '',
      category: 'promotion' as EmailTemplateCategory,
      subject: '',
      htmlContent: '',
      textContent: '',
      isDefault: false,
      isActive: true,
    },
    validate: {
      name: (value) => (value.length < 1 ? t('validation.required') : null),
      category: (value) => (!value ? t('validation.required') : null),
      subject: (value) => (value.length < 1 ? t('validation.required') : null),
      htmlContent: (value) => (value.length < 1 ? t('validation.required') : null),
    },
  });

  // Load existing template data
  useEffect(() => {
    if (isEdit && existingTemplate) {
      form.setValues({
        name: existingTemplate.name,
        category: existingTemplate.category,
        subject: existingTemplate.subject,
        htmlContent: existingTemplate.htmlContent,
        textContent: existingTemplate.textContent || '',
        isDefault: existingTemplate.isDefault,
        isActive: existingTemplate.isActive,
      });
    }
  }, [isEdit, existingTemplate]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const validatedData = emailTemplateCreateSchema.parse(values);

      if (isEdit && templateId) {
        // Clean variables to remove undefined optional properties for exactOptionalPropertyTypes
        const cleanedVariables = validatedData.variables?.map(v => {
          const cleaned: {
            key: string;
            label: string;
            type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
            description?: string;
            required?: boolean;
            defaultValue?: any;
          } = {
            key: v.key,
            label: v.label,
            type: v.type,
          };
          if (v.description !== undefined && v.description !== null) cleaned.description = v.description;
          if (v.required !== undefined) cleaned.required = v.required;
          if (v.defaultValue !== undefined) cleaned.defaultValue = v.defaultValue;
          return cleaned;
        });
        
        const updateInput: any = {
          category: validatedData.category,
          subject: validatedData.subject,
          htmlContent: validatedData.htmlContent,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
        };
        if (validatedData.textContent) updateInput.textContent = validatedData.textContent;
        if (cleanedVariables) updateInput.variables = cleanedVariables;
        
        await updateTemplate.mutateAsync({
          id: templateId,
          input: updateInput,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('email.update.success'),
        });
      } else {
        // Clean variables to remove undefined optional properties for exactOptionalPropertyTypes
        const cleanedVariables = validatedData.variables?.map(v => {
          const cleaned: {
            key: string;
            label: string;
            type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
            description?: string;
            required?: boolean;
            defaultValue?: any;
          } = {
            key: v.key,
            label: v.label,
            type: v.type,
          };
          if (v.description !== undefined && v.description !== null) cleaned.description = v.description;
          if (v.required !== undefined) cleaned.required = v.required;
          if (v.defaultValue !== undefined) cleaned.defaultValue = v.defaultValue;
          return cleaned;
        });
        
        const createInput: any = {
          name: validatedData.name,
          category: validatedData.category,
          subject: validatedData.subject,
          htmlContent: validatedData.htmlContent,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
        };
        if (validatedData.textContent) createInput.textContent = validatedData.textContent;
        if (cleanedVariables) createInput.variables = cleanedVariables;
        
        await createTemplate.mutateAsync(createInput);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('email.create.success'),
        });
      }

      router.push(`/${locale}/modules/real-estate/email/templates`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.save.error'),
      });
    }
  };

  if (isEdit && isLoadingTemplate) {
    return <Paper shadow="xs" p="md">{tGlobal('common.loading')}</Paper>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Title order={3}>
            {isEdit ? t('email.edit') : t('email.create')}
          </Title>

          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label={t('form.name')}
                placeholder={t('form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label={t('form.category')}
                placeholder={t('form.categoryPlaceholder')}
                required
                data={[
                  { value: 'promotion', label: t('email.categories.promotion') },
                  { value: 'announcement', label: t('email.categories.announcement') },
                  { value: 'reminder', label: t('email.categories.reminder') },
                  { value: 'welcome', label: t('email.categories.welcome') },
                  { value: 'agreement', label: t('email.categories.agreement') },
                ]}
                {...form.getInputProps('category')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label={t('form.subject')}
                placeholder={t('form.subjectPlaceholder')}
                required
                {...form.getInputProps('subject')}
              />
              <Text size="xs" c="dimmed" mt={4}>
                {t('form.subjectHint')}
              </Text>
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.htmlContent')}
                placeholder={t('form.htmlContentPlaceholder')}
                required
                rows={15}
                {...form.getInputProps('htmlContent')}
              />
              <Text size="xs" c="dimmed" mt={4}>
                {t('form.htmlContentHint')}
              </Text>
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.textContent')}
                placeholder={t('form.textContentPlaceholder')}
                rows={8}
                {...form.getInputProps('textContent')}
              />
              <Text size="xs" c="dimmed" mt={4}>
                {t('form.textContentHint')}
              </Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label={t('form.isDefault')}
                description={t('form.isDefaultDescription')}
                {...form.getInputProps('isDefault', { type: 'checkbox' })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label={t('form.isActive')}
                description={t('form.isActiveDescription')}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/email/templates`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createTemplate.isPending || updateTemplate.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

