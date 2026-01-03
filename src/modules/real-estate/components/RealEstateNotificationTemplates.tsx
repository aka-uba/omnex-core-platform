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
  IconMail,
  IconStar,
  IconStarFilled,
  IconStarOff,
  IconSearch,
  IconRefresh,
  IconDatabase,
  IconTrashX,
  IconEye,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'email';
  category?: string | null;
  notificationType?: string | null;
  description?: string | null;
  emailSubject?: string | null;
  emailTemplateStyle?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface RealEstateNotificationTemplatesProps {
  locale: string;
}

export function RealEstateNotificationTemplates({ locale }: RealEstateNotificationTemplatesProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tNotification } = useTranslation('modules/notification-templates');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Fetch notification templates with real_estate category
  const { data, isLoading, error, refetch } = useQuery<NotificationTemplate[]>({
    queryKey: ['notificationTemplates', 'email', 'real_estate', typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('channel', 'email');
      params.append('category', 'real_estate');
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
      template.emailSubject?.toLowerCase().includes(searchLower)
    );
  }, [data, search]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: tNotification('delete.title'),
      message: tNotification('confirmDelete'),
      confirmLabel: tNotification('delete.confirm'),
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
          title: tNotification('notifications.success'),
          message: tNotification('notifications.deleted'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: tNotification('notifications.error'),
        message: error.message || tNotification('notifications.deleteError'),
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
        title: tNotification('notifications.warning'),
        message: tNotification('notifications.cannotDeleteDefault'),
      });
      return;
    }

    const confirmed = await confirm({
      title: tNotification('bulkDelete.title'),
      message: tNotification('bulkDelete.message', { count: selectedRows.length }),
      confirmLabel: tNotification('bulkDelete.confirm'),
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
          title: tNotification('notifications.success'),
          message: tNotification('notifications.bulkDeleted', { count: successCount }),
        });
        setSelectedRows([]);
        refetch();
      }

      if (errorCount > 0) {
        showToast({
          type: 'error',
          title: tNotification('notifications.error'),
          message: tNotification('notifications.bulkDeleteError', { count: errorCount }),
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: tNotification('notifications.error'),
        message: error.message || tNotification('notifications.deleteError'),
      });
    }
  }, [selectedRows, data, confirm, tNotification, refetch]);

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/notification-templates/${id}/set-default`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: tNotification('notifications.success'),
          message: tNotification('notifications.defaultUpdated'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: tNotification('notifications.error'),
        message: error.message || tNotification('notifications.defaultError'),
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
          title: tNotification('notifications.success'),
          message: tNotification('notifications.defaultRemoved'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: tNotification('notifications.error'),
        message: error.message || tNotification('notifications.defaultError'),
      });
    }
  };

  const handleSeedTemplates = async () => {
    const confirmed = await confirm({
      title: tNotification('seed.title'),
      message: tNotification('seed.message'),
      confirmLabel: tNotification('seed.confirm'),
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
          title: tNotification('notifications.success'),
          message: tNotification('notifications.seeded').replace('{{count}}', result.data.templates.length.toString()),
        });
        refetch();
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: tNotification('notifications.error'),
        message: error.message || tNotification('notifications.seedError'),
      });
    }
  };

  const getNotificationTypeBadge = (type: string | null | undefined) => {
    if (!type) return <Text size="sm" c="dimmed">-</Text>;

    const typeColors: Record<string, string> = {
      real_estate_lease_expiry: 'orange',
      real_estate_rent_reminder: 'yellow',
      real_estate_payment_received: 'green',
      real_estate_tenant_welcome: 'cyan',
      real_estate_maintenance_update: 'blue',
    };

    const typeLabels: Record<string, string> = {
      real_estate_lease_expiry: tNotification('types.realEstateLeaseExpiry'),
      real_estate_rent_reminder: tNotification('types.realEstateRentReminder'),
      real_estate_payment_received: tNotification('types.realEstatePaymentReceived'),
      real_estate_tenant_welcome: tNotification('types.realEstateTenantWelcome'),
      real_estate_maintenance_update: tNotification('types.realEstateMaintenanceUpdate'),
    };

    return (
      <Badge color={typeColors[type] || 'gray'} variant="light">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: tNotification('table.name'),
      sortable: true,
      render: (value, row: NotificationTemplate) => (
        <Group gap="xs">
          <IconMail size={18} color="var(--mantine-color-blue-6)" />
          <Text fw={500}>{value}</Text>
          {row.isDefault && (
            <IconStarFilled size={14} style={{ color: 'var(--mantine-color-yellow-6)' }} />
          )}
        </Group>
      ),
    },
    {
      key: 'notificationType',
      label: tNotification('table.notificationType'),
      sortable: true,
      render: (value) => getNotificationTypeBadge(value),
    },
    {
      key: 'emailSubject',
      label: tNotification('table.emailSubject'),
      sortable: true,
      render: (value) => (
        <Text size="sm" {...(value ? {} : { c: 'dimmed' })} lineClamp={1}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'emailTemplateStyle',
      label: tNotification('table.style'),
      sortable: true,
      render: (value) => {
        const styleLabels: Record<string, string> = {
          corporate: tNotification('styles.corporate'),
          visionary: tNotification('styles.visionary'),
          elegant: tNotification('styles.elegant'),
          modern: tNotification('styles.modern'),
        };
        return (
          <Badge variant="light" color="grape">
            {styleLabels[value as string] || value || '-'}
          </Badge>
        );
      },
    },
    {
      key: 'isActive',
      label: tNotification('table.status'),
      sortable: true,
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? tNotification('status.active') : tNotification('status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: tNotification('table.actions'),
      sortable: false,
      render: (value, row: NotificationTemplate) => (
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => router.push(`/${locale}/settings/notification-templates/email/${row.id}/edit`)}
            title={tNotification('actions.preview')}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => router.push(`/${locale}/settings/notification-templates/email/${row.id}/edit`)}
            title={tNotification('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          {row.isDefault ? (
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={() => handleUnsetDefault(row.id)}
              title={tNotification('actions.unsetDefault')}
            >
              <IconStarOff size={16} />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="subtle"
              color="yellow"
              onClick={() => handleSetDefault(row.id)}
              title={tNotification('actions.setDefault')}
            >
              <IconStar size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(row.id)}
            disabled={row.isDefault}
            title={tNotification('actions.delete')}
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
          placeholder={tNotification('search')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder={t('email.filterType')}
          data={[
            { value: '', label: tNotification('filterAll') },
            { value: 'real_estate_lease_expiry', label: tNotification('types.realEstateLeaseExpiry') },
            { value: 'real_estate_rent_reminder', label: tNotification('types.realEstateRentReminder') },
            { value: 'real_estate_payment_received', label: tNotification('types.realEstatePaymentReceived') },
            { value: 'real_estate_tenant_welcome', label: tNotification('types.realEstateTenantWelcome') },
            { value: 'real_estate_maintenance_update', label: tNotification('types.realEstateMaintenanceUpdate') },
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
            {tNotification('bulkDelete.button', { count: selectedRows.length })}
          </Button>
        )}
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={() => refetch()}
          variant="light"
        >
          {tNotification('refresh')}
        </Button>
        <Button
          leftSection={<IconDatabase size={16} />}
          onClick={handleSeedTemplates}
          variant="light"
        >
          {tNotification('seed.button')}
        </Button>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push(`/${locale}/settings/notification-templates/email/create?category=real_estate`)}
          variant="filled"
        >
          {tNotification('create')}
        </Button>
      </Group>

      {isLoading ? (
        <DataTableSkeleton columns={6} rows={8} />
      ) : error ? (
        <Alert color="red" title={tNotification('error')}>
          {error instanceof Error ? error.message : tNotification('loadError')}
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
          emptyMessage={tNotification('noTemplates')}
          selectable={true}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          rowIdKey="id"
          showAuditHistory={true}
          auditEntityName="NotificationTemplate"
          auditIdKey="id"
        />
      )}
      <ConfirmDialog />
    </Stack>
  );
}
