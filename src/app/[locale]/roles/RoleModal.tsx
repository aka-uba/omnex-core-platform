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
import { notifications } from '@mantine/notifications';

interface RoleModalProps {
  opened: boolean;
  onClose: () => void;
  roleId?: string | null;
}

export function RoleModal({ opened, onClose, roleId }: RoleModalProps) {
  const { t } = useTranslation('modules/roles');
  const { t: tGlobal } = useTranslation('global');
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
      notifications.show({
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.requiredFields'),
        color: 'red',
      });
      return;
    }

    try {
      if (roleId) {
        await updateRole.mutateAsync({ roleId, data: form.values });
        notifications.show({
          title: t('edit.title'),
          message: tGlobal('notifications.success.roleUpdated'),
          color: 'green',
        });
      } else {
        await createRole.mutateAsync(form.values);
        notifications.show({
          title: t('create.title'),
          message: tGlobal('notifications.success.roleCreated'),
          color: 'green',
        });
      }
      onClose();
    } catch (error) {
      notifications.show({
        title: tGlobal('notifications.error.title'),
        message: error instanceof Error ? error.message : tGlobal('notifications.error.roleSaveFailed'),
        color: 'red',
      });
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




