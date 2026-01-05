'use client';

import { useEffect } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Select,
} from '@mantine/core';
import { usePermission, useCreatePermission, useUpdatePermission } from '@/hooks/usePermissions';
import { useTranslation } from '@/lib/i18n/client';
import { permissionSchema, PermissionFormData } from '@/lib/schemas/permission';
import { useNotification } from '@/hooks/useNotification';

interface PermissionModalProps {
  opened: boolean;
  onClose: () => void;
  permissionId?: string | null;
}

export function PermissionModal({ opened, onClose, permissionId }: PermissionModalProps) {
  const { t } = useTranslation('modules/permissions');
  const { t: tGlobal } = useTranslation('global');
  const { showSuccess, showError, showWarning } = useNotification();
  const { data: permission } = usePermission(permissionId || '');
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();

  const form = useForm<PermissionFormData>({
    initialValues: {
      permissionKey: '',
      name: '',
      description: '',
      category: '',
      module: '',
    },
    validate: zodResolver(permissionSchema as any),
  });

  useEffect(() => {
    if (permission && permissionId) {
      form.setValues({
        permissionKey: permission.permissionKey,
        name: permission.name,
        description: permission.description,
        category: permission.category,
        module: permission.module || '',
      });
    } else {
      form.reset();
    }
  }, [permission, permissionId]);

  const handleSubmit = async () => {
    // Temel validasyon
    if (!form.values.permissionKey || !form.values.name || !form.values.description) {
      showWarning(tGlobal('notifications.validation.requiredFields'));
      return;
    }

    // Permission key format kontrolü (module.action)
    if (!form.values.permissionKey.includes('.')) {
      showWarning(t('validation.keyFormat'));
      return;
    }

    try {
      if (permissionId) {
        await updatePermission.mutateAsync({ permissionId, data: form.values });
        showSuccess(tGlobal('notifications.success.permissionUpdated'));
      } else {
        await createPermission.mutateAsync(form.values);
        showSuccess(tGlobal('notifications.success.permissionCreated'));
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : tGlobal('notifications.error.permissionSaveFailed'));
    }
  };

  // Mock categories and modules - should come from API
  const categories = [
    t('categories.clientManagement'),
    t('categories.contentAI'),
    t('categories.scheduling'),
    t('categories.finance'),
    t('categories.general'),
  ];

  const modules = [
    'CRM',
    'Content AI',
    'Scheduler',
    'Finance',
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={permissionId ? t('edit.title') : t('create.title')}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label={t('form.permissionKey')}
          placeholder={t('form.permissionKeyPlaceholder')}
          required
          disabled={!!permissionId}
          {...form.getInputProps('permissionKey')}
        />
        <TextInput
          label={t('form.name')}
          placeholder={t('form.namePlaceholder')}
          required
          {...form.getInputProps('name')}
        />
        <Textarea
          label={t('form.description')}
          placeholder={t('form.descriptionPlaceholder')}
          required
          rows={4}
          {...form.getInputProps('description')}
        />
        <Select
          label={t('form.category')}
          placeholder={t('form.categoryPlaceholder')}
          required
          data={categories}
          {...form.getInputProps('category')}
        />
        <Select
          label={t('form.module')}
          placeholder={t('form.modulePlaceholder')}
          data={modules}
          {...form.getInputProps('module')}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            {tGlobal('form.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createPermission.isPending || updatePermission.isPending}
          >
            {permissionId ? t('edit.button') : t('create.button')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}




