'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  ActionIcon,
  Group,
  Text,
  Badge,
} from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconShieldLock } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslation } from '@/lib/i18n/client';
import { PermissionsPageSkeleton } from './PermissionsPageSkeleton';
import { PermissionModal } from './PermissionModal';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';

export function PermissionsPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/permissions');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);

  const { data, isLoading } = usePermissions({
    page: 1,
    pageSize: 1000, // DataTable handles pagination internally
  });

  // Get unique categories and modules for filters
  const categories = useMemo(() => {
    if (!data?.permissions) return [];
    const uniqueCategories = [...new Set(data.permissions.map(p => p.category).filter(Boolean))];
    return uniqueCategories.map(cat => ({ value: cat, label: cat }));
  }, [data?.permissions]);

  const modules = useMemo(() => {
    if (!data?.permissions) return [];
    const uniqueModules = [...new Set(data.permissions.map(p => p.module).filter(Boolean))];
    return uniqueModules.map(mod => ({ value: mod as string, label: mod as string }));
  }, [data?.permissions]);

  // Transform data for DataTable
  const tableData = useMemo(() => {
    if (!data?.permissions) return [];
    return data.permissions.map((permission) => ({
      id: permission.id,
      permissionKey: permission.permissionKey,
      name: permission.name,
      description: permission.description || '',
      category: permission.category,
      module: permission.module || '',
    }));
  }, [data?.permissions]);

  // DataTable columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'permissionKey',
      label: t('table.permissionKey'),
      sortable: true,
      searchable: true,
      render: (value: string) => (
        <Text size="xs" ff="monospace" c="dimmed">{value}</Text>
      ),
    },
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'description',
      label: t('table.description'),
      sortable: true,
      searchable: true,
      render: (value: string) => (
        <Text size="sm" c="dimmed" lineClamp={1}>{value || '-'}</Text>
      ),
    },
    {
      key: 'category',
      label: t('table.category'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text size="sm">{value}</Text>,
    },
    {
      key: 'module',
      label: t('table.module'),
      sortable: true,
      searchable: true,
      render: (value: string) => (
        value ? <Badge variant="light" color="blue">{value}</Badge> : <Text c="dimmed">-</Text>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      render: (_: any, row: any) => (
        <Group justify="flex-end" gap="xs">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              handleView(row.id);
            }}
            title={t('actions.view')}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.id);
            }}
            title={t('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => e.stopPropagation()}
            title={t('actions.delete')}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ], [t]);

  // Filters for DataTable
  const filters: FilterOption[] = useMemo(() => [
    {
      key: 'category',
      label: t('table.category'),
      type: 'select' as const,
      options: categories,
    },
    {
      key: 'module',
      label: t('table.module'),
      type: 'select' as const,
      options: modules,
    },
  ], [t, categories, modules]);

  const handleView = (permissionId: string) => {
    setSelectedPermission(permissionId);
    setModalOpen(true);
  };

  const handleEdit = (permissionId: string) => {
    setSelectedPermission(permissionId);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPermission(null);
    setModalOpen(true);
  };

  if (isLoading) {
    return <PermissionsPageSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="title"
        description="description"
        namespace="modules/permissions"
        icon={<IconShieldLock size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: 'title', namespace: 'modules/permissions' },
        ]}
        actions={[
          {
            label: t('create.button'),
            icon: <IconPlus size={18} />,
            onClick: handleCreate,
            variant: 'filled',
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={tableData}
        searchable
        sortable
        pageable
        defaultPageSize={25}
        showExportIcons
        showColumnSettings
        filters={filters}
        exportTitle={t('title')}
        exportNamespace="modules/permissions"
        tableId="permissions-table"
        emptyMessage={t('table.empty')}
      />

      <PermissionModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPermission(null);
        }}
        permissionId={selectedPermission}
      />
    </Container>
  );
}
