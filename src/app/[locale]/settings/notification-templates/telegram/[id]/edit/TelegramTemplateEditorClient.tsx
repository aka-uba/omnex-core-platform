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
  Alert,
  Text,
} from '@mantine/core';
import {
  IconBrandTelegram,
  IconDeviceFloppy,
  IconX,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { TelegramTemplateEditorSkeleton } from './TelegramTemplateEditorSkeleton';

interface TelegramTemplate {
  id?: string;
  name: string;
  channel: 'telegram';
  category?: string | null;
  notificationType?: string | null;
  description?: string | null;
  socialContent?: string | null;
  socialImageUrl?: string | null;
  socialImageDescription?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export function TelegramTemplateEditorClient({
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

  const [formData, setFormData] = useState<TelegramTemplate>({
    name: '',
    channel: 'telegram',
    category: null,
    notificationType: null,
    description: null,
    socialContent: null,
    socialImageUrl: null,
    socialImageDescription: null,
    isDefault: false,
    isActive: true,
  });

  const [, setLoading] = useState(false);

  const { data: template, isLoading } = useQuery<TelegramTemplate>({
    queryKey: ['telegramTemplate', templateId],
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
    return <TelegramTemplateEditorSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={isEdit ? t('editTelegramTemplate') : t('createTelegramTemplate')}
        description={t('telegramTemplateDescription')}
        namespace="modules/notification-templates"
        icon={<IconBrandTelegram size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/settings/notification-templates`, namespace: 'modules/notification-templates' },
          { label: isEdit ? 'editTelegramTemplate' : 'createTelegramTemplate', namespace: 'modules/notification-templates' },
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
        <Textarea
          label={t('form.socialContent')}
          placeholder={t('form.socialContentPlaceholder')}
          value={formData.socialContent || ''}
          onChange={(e) => setFormData({ ...formData, socialContent: e.currentTarget.value })}
          rows={6}
          description={t('form.socialContentDescription')}
        />
        <TextInput
          label={t('form.socialImageUrl')}
          placeholder={t('form.socialImageUrlPlaceholder')}
          value={formData.socialImageUrl || ''}
          onChange={(e) => setFormData({ ...formData, socialImageUrl: e.currentTarget.value })}
          description={t('form.socialImageUrlDescription')}
        />
        <TextInput
          label={t('form.socialImageDescription')}
          placeholder={t('form.socialImageDescriptionPlaceholder')}
          value={formData.socialImageDescription || ''}
          onChange={(e) => setFormData({ ...formData, socialImageDescription: e.currentTarget.value })}
        />
        <Alert color="blue" title={t('variables.title')}>
          <Text size="sm">
            {t('variables.description')}
          </Text>
        </Alert>
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
    </Container>
  );
}
