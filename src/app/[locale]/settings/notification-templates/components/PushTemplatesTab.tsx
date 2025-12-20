'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Group,
  Button,
  Text,
  Badge,
  ActionIcon,
  Stack,
  Alert,
  Select,
  TextInput,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBell,
  IconStar,
  IconStarFilled,
  IconStarOff,
  IconSearch,
  IconRefresh,
  IconDatabase,
  IconTrashX,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface PushTemplate {
  id: string;
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
  createdAt: string;
}

export function PushTemplatesTab({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/notification-templates');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery<PushTemplate[]>({
    queryKey: ['notificationTemplates', 'push', categoryFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('channel', 'push');
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('notificationType', typeFilter);

      const response = await fetchWithAuth(`/api/notification-templates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const searchLower = search.toLowerCase();
    return data.filter((template) =>
      template.name.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      template.pushTitle?.toLowerCase().includes(searchLower)
    );
  }, [data, search]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('delete.title'),
      message: t('confirmDelete'),
      confirmLabel: t('delete.confirm'),
      confirmColor: 'red',
    });

    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/notification-templates/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: t('notifications.deleted'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.deleteError'),
      });
    }
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) return;

    const hasDefaultTemplate = data?.some(
      (template) => selectedRows.includes(template.id) && template.isDefault
    );

    if (hasDefaultTemplate) {
      showToast({
        type: 'warning',
        title: t('notifications.warning'),
        message: t('notifications.cannotDeleteDefault'),
      });
      return;
    }

    const confirmed = await confirm({
      title: t('bulkDelete.title'),
      message: t('bulkDelete.message', { count: selectedRows.length }),
      confirmLabel: t('bulkDelete.confirm'),
      confirmColor: 'red',
    });

    if (!confirmed) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedRows) {
        try {
          const response = await fetchWithAuth(`/api/notification-templates/${id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: t('notifications.bulkDeleted', { count: successCount }),
        });
        setSelectedRows([]);
        refetch();
      }

      if (errorCount > 0) {
        showToast({
          type: 'error',
          title: t('notifications.error'),
          message: t('notifications.bulkDeleteError', { count: errorCount }),
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.deleteError'),
      });
    }
  }, [selectedRows, data, confirm, t, refetch]);

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/notification-templates/${id}/set-default`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: t('notifications.defaultUpdated'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.defaultError'),
      });
    }
  };

  const handleUnsetDefault = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/notification-templates/${id}/unset-default`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: t('notifications.defaultRemoved'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.defaultError'),
      });
    }
  };

  const handleSeedTemplates = async () => {
    const confirmed = await confirm({
      title: t('seed.title'),
      message: t('seedConfirm'),
      confirmLabel: t('seed.confirm'),
      confirmColor: 'blue',
    });

    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/notification-templates/seed', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('notifications.success'),
          message: t('notifications.seeded').replace('{{count}}', result.data.templates.length.toString()),
        });
        refetch();
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('notifications.error'),
        message: error.message || t('notifications.seedError'),
      });
    }
  };

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      render: (value, row: PushTemplate) => (
        <Group gap="xs">
          <IconBell size={18} color="var(--mantine-color-orange-6)" />
          <Text fw={500}>{value}</Text>
          {row.isDefault && (
            <IconStarFilled size={14} style={{ color: 'var(--mantine-color-yellow-6)' }} />
          )}
        </Group>
      ),
    },
    {
      key: 'category',
      label: t('table.category'),
      sortable: true,
      render: (value) => (
        <Badge variant="light" color="orange">
          {value || '-'}
        </Badge>
      ),
    },
    {
      key: 'notificationType',
      label: t('table.notificationType'),
      sortable: true,
      render: (value) => (
        <Text size="sm" {...(value ? {} : { c: 'dimmed' })}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'pushTitle',
      label: t('table.pushTitle'),
      sortable: true,
      render: (value) => (
        <Text size="sm" {...(value ? {} : { c: 'dimmed' })}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'pushBody',
      label: t('table.pushBody'),
      sortable: false,
      render: (value) => (
        <Text size="sm" {...(value ? {} : { c: 'dimmed' })} lineClamp={2}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? t('status.active') : t('status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      render: (value, row: PushTemplate) => (
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => router.push(`/${locale}/settings/notification-templates/push/${row.id}/edit`)}
            title={t('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          {row.isDefault ? (
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={() => handleUnsetDefault(row.id)}
              title={t('actions.unsetDefault')}
            >
              <IconStarOff size={16} />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="subtle"
              color="yellow"
              onClick={() => handleSetDefault(row.id)}
              title={t('actions.setDefault')}
            >
              <IconStar size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(row.id)}
            disabled={row.isDefault}
            title={t('actions.delete')}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder={t('search')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder={t('filterCategory')}
          data={[
            { value: '', label: t('filterAll') },
            { value: 'system', label: t('categories.system') },
            { value: 'user', label: t('categories.user') },
            { value: 'task', label: t('categories.task') },
            { value: 'urgent', label: t('categories.urgent') },
          ]}
          value={categoryFilter || ''}
          onChange={(value) => setCategoryFilter(value || null)}
          clearable
        />
        <Select
          placeholder={t('filterType')}
          data={[
            { value: '', label: t('filterAll') },
            { value: 'task_assignment', label: t('types.taskAssignment') },
            { value: 'urgent_alert', label: t('types.urgentAlert') },
            { value: 'system_update', label: t('types.systemUpdate') },
          ]}
          value={typeFilter || ''}
          onChange={(value) => setTypeFilter(value || null)}
          clearable
        />
        {selectedRows.length > 0 && (
          <Button
            leftSection={<IconTrashX size={16} />}
            onClick={handleBulkDelete}
            variant="light"
            color="red"
          >
            {t('bulkDelete.button', { count: selectedRows.length })}
          </Button>
        )}
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={() => refetch()}
          variant="light"
        >
          {t('refresh')}
        </Button>
        <Button
          leftSection={<IconDatabase size={16} />}
          onClick={handleSeedTemplates}
          variant="light"
        >
          {t('seed')}
        </Button>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push(`/${locale}/settings/notification-templates/push/create`)}
          variant="filled"
        >
          {t('create')}
        </Button>
      </Group>

      {isLoading ? (
        <DataTableSkeleton columns={7} rows={8} />
      ) : error ? (
        <Alert color="red" title={t('error')}>
          {error instanceof Error ? error.message : t('loadError')}
        </Alert>
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          searchable={true}
          sortable={true}
          pageable={true}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          emptyMessage={t('noTemplates')}
          selectable={true}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          rowIdKey="id"
        />
      )}
      <ConfirmDialog />
    </Stack>
  );
}
