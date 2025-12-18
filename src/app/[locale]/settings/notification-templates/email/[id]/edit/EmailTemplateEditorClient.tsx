'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  TextInput,
  Textarea,
  Select,
  Switch,
  Group,
  Tabs,
  Paper,
  Text,
  Alert,
} from '@mantine/core';
import {
  IconMail,
  IconDeviceFloppy,
  IconX,
  IconEye,
  IconCode,
  IconSignature,
  IconPalette,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { EmailTemplateEditorSkeleton } from './EmailTemplateEditorSkeleton';

interface EmailTemplate {
  id?: string;
  name: string;
  channel: 'email';
  category?: string | null;
  notificationType?: string | null;
  description?: string | null;
  emailSubject?: string | null;
  emailPlainText?: string | null;
  emailHtmlTemplate?: string | null;
  emailTemplateStyle?: 'corporate' | 'visionary' | 'elegant' | 'modern' | null;
  emailSignatureEnabled: boolean;
  emailSignatureUserInfo: boolean;
  emailSignatureUserAvatar: boolean;
  emailSignatureCompanyLogo: boolean;
  emailSignatureCompanyInfo: boolean;
  defaultMessagePrefix?: string | null;
  defaultMessageSuffix?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export function EmailTemplateEditorClient({
  locale,
  templateId,
}: {
  locale: string;
  templateId?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/notification-templates');
  const isEdit = !!templateId;

  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    channel: 'email',
    category: null,
    notificationType: null,
    description: null,
    emailSubject: null,
    emailPlainText: null,
    emailHtmlTemplate: null,
    emailTemplateStyle: null,
    emailSignatureEnabled: true,
    emailSignatureUserInfo: true,
    emailSignatureUserAvatar: true,
    emailSignatureCompanyLogo: true,
    emailSignatureCompanyInfo: true,
    defaultMessagePrefix: null,
    defaultMessageSuffix: null,
    isDefault: false,
    isActive: true,
  });

  const [, setLoading] = useState(false);

  // Fetch template if editing
  const { data: template, isLoading } = useQuery<EmailTemplate>({
    queryKey: ['emailTemplate', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const response = await fetchWithAuth(`/api/notification-templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      const result = await response.json();
      return result.data;
    },
    enabled: isEdit && !!templateId,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/notification-templates/${templateId}`
        : '/api/notification-templates';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: isEdit
            ? t('notifications.updated')
            : t('notifications.created'),
        });
        router.push(`/${currentLocale}/settings/notification-templates`);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.saveError'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && isLoading) {
    return <EmailTemplateEditorSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={isEdit ? t('editEmailTemplate') : t('createEmailTemplate')}
        description={t('emailTemplateDescription')}
        namespace="modules/notification-templates"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/settings/notification-templates`, namespace: 'modules/notification-templates' },
          { label: isEdit ? 'editEmailTemplate' : 'createEmailTemplate', namespace: 'modules/notification-templates' },
        ]}
        actions={[
          {
            label: t('cancel'),
            icon: <IconX size={18} />,
            onClick: () => router.back(),
            variant: 'light',
          },
          {
            label: t('save'),
            icon: <IconDeviceFloppy size={18} />,
            onClick: handleSave,
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        <Tabs defaultValue="basic">
          <Tabs.List>
            <Tabs.Tab value="basic" leftSection={<IconMail size={16} />}>
              {t('tabs.basic')}
            </Tabs.Tab>
            <Tabs.Tab value="content" leftSection={<IconCode size={16} />}>
              {t('tabs.content')}
            </Tabs.Tab>
            <Tabs.Tab value="signature" leftSection={<IconSignature size={16} />}>
              {t('tabs.signature')}
            </Tabs.Tab>
            <Tabs.Tab value="design" leftSection={<IconPalette size={16} />}>
              {t('tabs.design')}
            </Tabs.Tab>
            <Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
              {t('tabs.preview')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic" pt="xl">
            <Stack gap="md">
              <TextInput
                label={t('form.name')}
                placeholder={t('form.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                required
              />
              <Textarea
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                rows={3}
              />
              <Select
                label={t('form.category')}
                placeholder={t('form.categoryPlaceholder')}
                data={[
                  { value: 'system', label: t('categories.system') },
                  { value: 'user', label: t('categories.user') },
                  { value: 'task', label: t('categories.task') },
                  { value: 'urgent', label: t('categories.urgent') },
                ]}
                value={formData.category || ''}
                onChange={(value) => setFormData({ ...formData, category: value || null })}
                clearable
              />
              <Select
                label={t('form.notificationType')}
                placeholder={t('form.notificationTypePlaceholder')}
                data={[
                  { value: 'task_assignment', label: t('types.taskAssignment') },
                  { value: 'urgent_alert', label: t('types.urgentAlert') },
                  { value: 'system_update', label: t('types.systemUpdate') },
                ]}
                value={formData.notificationType || ''}
                onChange={(value) => setFormData({ ...formData, notificationType: value || null })}
                clearable
              />
              <Group>
                <Switch
                  label={t('form.isDefault')}
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.currentTarget.checked })}
                />
                <Switch
                  label={t('form.isActive')}
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
                />
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="content" pt="xl">
            <Stack gap="md">
              <TextInput
                label={t('form.emailSubject')}
                placeholder={t('form.emailSubjectPlaceholder')}
                value={formData.emailSubject || ''}
                onChange={(e) => setFormData({ ...formData, emailSubject: e.currentTarget.value })}
                description={t('form.emailSubjectDescription')}
              />
              <Textarea
                label={t('form.defaultMessagePrefix')}
                placeholder={t('form.defaultMessagePrefixPlaceholder')}
                value={formData.defaultMessagePrefix || ''}
                onChange={(e) => setFormData({ ...formData, defaultMessagePrefix: e.currentTarget.value })}
                rows={3}
                description={t('form.defaultMessagePrefixDescription')}
              />
              <Textarea
                label={t('form.emailPlainText')}
                placeholder={t('form.emailPlainTextPlaceholder')}
                value={formData.emailPlainText || ''}
                onChange={(e) => setFormData({ ...formData, emailPlainText: e.currentTarget.value })}
                rows={8}
                description={t('form.emailPlainTextDescription')}
              />
              <Textarea
                label={t('form.defaultMessageSuffix')}
                placeholder={t('form.defaultMessageSuffixPlaceholder')}
                value={formData.defaultMessageSuffix || ''}
                onChange={(e) => setFormData({ ...formData, defaultMessageSuffix: e.currentTarget.value })}
                rows={3}
                description={t('form.defaultMessageSuffixDescription')}
              />
              <Alert color="blue" title={t('variables.title')}>
                <Text size="sm">
                  {t('variables.description')}
                </Text>
              </Alert>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="signature" pt="xl">
            <Stack gap="md">
              <Switch
                label={t('form.emailSignatureEnabled')}
                checked={formData.emailSignatureEnabled}
                onChange={(e) => setFormData({ ...formData, emailSignatureEnabled: e.currentTarget.checked })}
                description={t('form.emailSignatureEnabledDescription')}
              />
              {formData.emailSignatureEnabled && (
                <>
                  <Switch
                    label={t('form.emailSignatureUserInfo')}
                    checked={formData.emailSignatureUserInfo}
                    onChange={(e) => setFormData({ ...formData, emailSignatureUserInfo: e.currentTarget.checked })}
                    description={t('form.emailSignatureUserInfoDescription')}
                  />
                  <Switch
                    label={t('form.emailSignatureUserAvatar')}
                    checked={formData.emailSignatureUserAvatar}
                    onChange={(e) => setFormData({ ...formData, emailSignatureUserAvatar: e.currentTarget.checked })}
                    description={t('form.emailSignatureUserAvatarDescription')}
                  />
                  <Switch
                    label={t('form.emailSignatureCompanyLogo')}
                    checked={formData.emailSignatureCompanyLogo}
                    onChange={(e) => setFormData({ ...formData, emailSignatureCompanyLogo: e.currentTarget.checked })}
                    description={t('form.emailSignatureCompanyLogoDescription')}
                  />
                  <Switch
                    label={t('form.emailSignatureCompanyInfo')}
                    checked={formData.emailSignatureCompanyInfo}
                    onChange={(e) => setFormData({ ...formData, emailSignatureCompanyInfo: e.currentTarget.checked })}
                    description={t('form.emailSignatureCompanyInfoDescription')}
                  />
                </>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="design" pt="xl">
            <Stack gap="md">
              <Select
                label={t('form.emailTemplateStyle')}
                placeholder={t('form.emailTemplateStylePlaceholder')}
                data={[
                  { value: 'corporate', label: t('styles.corporate') },
                  { value: 'visionary', label: t('styles.visionary') },
                  { value: 'elegant', label: t('styles.elegant') },
                  { value: 'modern', label: t('styles.modern') },
                ]}
                value={formData.emailTemplateStyle || ''}
                onChange={(value) => setFormData({ ...formData, emailTemplateStyle: value as any || null })}
                description={t('form.emailTemplateStyleDescription')}
              />
              <Textarea
                label={t('form.emailHtmlTemplate')}
                placeholder={t('form.emailHtmlTemplatePlaceholder')}
                value={formData.emailHtmlTemplate || ''}
                onChange={(e) => setFormData({ ...formData, emailHtmlTemplate: e.currentTarget.value })}
                rows={12}
                description={t('form.emailHtmlTemplateDescription')}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="preview" pt="xl">
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" mb="md">
                {t('preview.description')}
              </Text>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}


