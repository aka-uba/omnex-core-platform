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
  Group,
  Title,
  Switch,
  Text,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  useAgreementReportTemplate,
  useCreateAgreementReportTemplate,
  useUpdateAgreementReportTemplate,
} from '@/hooks/useAgreementReportTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { AgreementReportTemplateCategory } from '@/modules/real-estate/types/agreement-report-template';

interface AgreementReportTemplateFormProps {
  locale: string;
  templateId?: string;
}

export function AgreementReportTemplateForm({ locale, templateId }: AgreementReportTemplateFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: template, isLoading: isLoadingTemplate } = useAgreementReportTemplate(templateId || '');
  const createTemplate = useCreateAgreementReportTemplate();
  const updateTemplate = useUpdateAgreementReportTemplate();

  const form = useForm({
    initialValues: {
      name: '',
      category: '' as AgreementReportTemplateCategory | '',
      description: '',
      htmlContent: '',
      textContent: '',
      isDefault: false,
      isActive: true,
    },
    validate: {
      name: (value) => (!value ? t('form.required') : null),
      category: (value) => (!value ? t('form.required') : null),
      htmlContent: (value) => (!value ? t('form.required') : null),
    },
  });

  // Load template data if editing
  useEffect(() => {
    if (template) {
      form.setValues({
        name: template.name,
        category: template.category,
        description: template.description || '',
        htmlContent: template.htmlContent,
        textContent: template.textContent || '',
        isDefault: template.isDefault,
        isActive: template.isActive,
      });
    }
  }, [template]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (templateId) {
        await updateTemplate.mutateAsync({
          id: templateId,
          input: values as any,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('agreementReportTemplate.update.success'),
        });
      } else {
        await createTemplate.mutateAsync(values as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('agreementReportTemplate.create.success'),
        });
      }

      router.push(`/${locale}/modules/real-estate/agreement-report-templates`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('agreementReportTemplate.create.error'),
      });
    }
  };

  if (isLoadingTemplate) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  return (
    <Paper shadow="xs" p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>
              {templateId
                ? t('agreementReportTemplate.edit.title')
                : t('agreementReportTemplate.create.title')}
            </Title>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              {t('actions.back')}
            </Button>
          </Group>

          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label={t('form.name')}
                placeholder={t('form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.category')}
                placeholder={t('form.selectCategory')}
                required
                data={[
                  { value: 'boss', label: t('agreementReport.types.boss') },
                  { value: 'owner', label: t('agreementReport.types.owner') },
                  { value: 'tenant', label: t('agreementReport.types.tenant') },
                  { value: 'internal', label: t('agreementReport.types.internal') },
                ]}
                {...form.getInputProps('category')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                {...form.getInputProps('description')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.htmlContent')}
                placeholder={t('form.htmlContentPlaceholder')}
                required
                rows={10}
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
                rows={5}
                {...form.getInputProps('textContent')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Switch
                label={t('form.isDefault')}
                {...form.getInputProps('isDefault', { type: 'checkbox' })}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Switch
                label={t('form.isActive')}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={createTemplate.isPending || updateTemplate.isPending}>
              {templateId ? (t('actions.update')) : (t('actions.create'))}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}








