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
  MultiSelect,
} from '@mantine/core';
import { useRole, useCreateRole, useUpdateRole } from '@/hooks/useRoles';
import { useTranslation } from '@/lib/i18n/client';
import { roleSchema } from '@/lib/schemas/role';
import { useNotification } from '@/hooks/useNotification';

interface RoleModalProps {
  opened: boolean;
  onClose: () => void;
  roleId?: string | null;
}

export function RoleModal({ opened, onClose, roleId }: RoleModalProps) {
  const { t } = useTranslation('modules/roles');
  const { t: tGlobal } = useTranslation('global');
  const { showSuccess, showError, showWarning } = useNotification();
  const { data: role } = useRole(roleId || '');
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      permissions: [] as string[],
    },
    validate: zodResolver(roleSchema as any),
  });

  useEffect(() => {
    if (role && roleId) {
      form.setValues({
        name: role.name,
        description: role.description,
        permissions: role.permissions || [],
      });
    } else {
      form.reset();
    }
  }, [role, roleId]);

  const handleSubmit = async () => {
    // Temel validasyon
    if (!form.values.name || !form.values.description) {
      showWarning(tGlobal('notifications.validation.requiredFields'));
      return;
    }

    try {
      if (roleId) {
        await updateRole.mutateAsync({ roleId, data: form.values });
        showSuccess(tGlobal('notifications.success.roleUpdated'));
      } else {
        await createRole.mutateAsync(form.values);
        showSuccess(tGlobal('notifications.success.roleCreated'));
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : tGlobal('notifications.error.roleSaveFailed'));
    }
  };

  // Mock permissions - should come from API
  const permissions = [
    { value: 'client.create', label: t('permissions.clientCreate') },
    { value: 'client.edit', label: t('permissions.clientEdit') },
    { value: 'ai.generate', label: t('permissions.aiGenerate') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={roleId ? t('edit.title') : t('create.title')}
      size="lg"
    >
      <Stack gap="md">
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
        <MultiSelect
          label={t('form.permissions')}
          placeholder={t('form.selectPermissions')}
          data={permissions}
          {...form.getInputProps('permissions')}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            {tGlobal('form.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createRole.isPending || updateRole.isPending}
          >
            {roleId ? t('edit.button') : t('create.button')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}




