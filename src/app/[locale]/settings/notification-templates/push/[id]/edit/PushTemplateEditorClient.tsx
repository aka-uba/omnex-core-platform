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
  IconBell,
  IconDeviceFloppy,
  IconX,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { PushTemplateEditorSkeleton } from './PushTemplateEditorSkeleton';

interface PushTemplate {
  id?: string;
  name: string;
  channel: 'push';
  category?: string | null;
  notificationType?: string | null;
  description?: string | null;
  pushTitle?: string | null;
  pushBody?: string | null;
  pushIcon?: string | null;
  pushImage?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export function PushTemplateEditorClient({
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

  const [formData, setFormData] = useState<PushTemplate>({
    name: '',
    channel: 'push',
    category: null,
    notificationType: null,
    description: null,
    pushTitle: null,
    pushBody: null,
    pushIcon: null,
    pushImage: null,
    isDefault: false,
    isActive: true,
  });

  const [, setLoading] = useState(false);

  const { data: template, isLoading } = useQuery<PushTemplate>({
    queryKey: ['pushTemplate', templateId],
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
    return <PushTemplateEditorSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={isEdit ? t('editPushTemplate') : t('createPushTemplate')}
        description={t('pushTemplateDescription')}
        namespace="modules/notification-templates"
        icon={<IconBell size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/settings/notification-templates`, namespace: 'modules/notification-templates' },
          { label: isEdit ? 'editPushTemplate' : 'createPushTemplate', namespace: 'modules/notification-templates' },
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
        <TextInput
          label={t('form.pushTitle')}
          placeholder={t('form.pushTitlePlaceholder')}
          value={formData.pushTitle || ''}
          onChange={(e) => setFormData({ ...formData, pushTitle: e.currentTarget.value })}
        />
        <Textarea
          label={t('form.pushBody')}
          placeholder={t('form.pushBodyPlaceholder')}
          value={formData.pushBody || ''}
          onChange={(e) => setFormData({ ...formData, pushBody: e.currentTarget.value })}
          rows={4}
          description={t('form.pushBodyDescription')}
        />
        <TextInput
          label={t('form.pushIcon')}
          placeholder={t('form.pushIconPlaceholder')}
          value={formData.pushIcon || ''}
          onChange={(e) => setFormData({ ...formData, pushIcon: e.currentTarget.value })}
          description={t('form.pushIconDescription')}
        />
        <TextInput
          label={t('form.pushImage')}
          placeholder={t('form.pushImagePlaceholder')}
          value={formData.pushImage || ''}
          onChange={(e) => setFormData({ ...formData, pushImage: e.currentTarget.value })}
          description={t('form.pushImageDescription')}
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
