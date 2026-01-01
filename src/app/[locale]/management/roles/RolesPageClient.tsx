'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  ActionIcon,
  Group,
  Text,
  Badge,
} from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconUsersGroup } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useRoles } from '@/hooks/useRoles';
import { useTranslation } from '@/lib/i18n/client';
import { RolesPageSkeleton } from './RolesPageSkeleton';
import { RoleModal } from './RoleModal';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';

// Helper function to translate i18n keys from database
function translateKey(t: (key: string) => string, key: string): string {
  // If key starts with 'permissions.' or 'roles.', it's an i18n key
  if (key && (key.startsWith('permissions.') || key.startsWith('roles.'))) {
    const translated = t(key);
    // If translation returns the key itself, it means translation not found
    return translated !== key ? translated : key.split('.').pop() || key;
  }
  return key;
}

export function RolesPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/roles');
  const { t: tGlobal } = useTranslation('global');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data, isLoading } = useRoles({
    page: 1,
    pageSize: 1000, // DataTable handles pagination internally
  });

  // Transform data for DataTable with i18n translation
  const tableData = useMemo(() => {
    if (!data?.roles) return [];
    return data.roles.map((role) => ({
      id: role.id,
      roleName: translateKey(tGlobal, role.name),
      description: translateKey(tGlobal, role.description || ''),
      usersAssigned: role.usersCount || 0,
    }));
  }, [data?.roles, tGlobal]);

  // DataTable columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'roleName',
      label: t('table.roleName'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'description',
      label: t('table.description'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text size="sm" c="dimmed">{value || '-'}</Text>,
    },
    {
      key: 'usersAssigned',
      label: t('table.usersAssigned'),
      sortable: true,
      searchable: false,
      render: (value: number) => <Badge variant="light">{value}</Badge>,
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

  const handleView = (roleId: string) => {
    setSelectedRole(roleId);
    setModalOpen(true);
  };

  const handleEdit = (roleId: string) => {
    setSelectedRole(roleId);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setModalOpen(true);
  };

  if (isLoading) {
    return <RolesPageSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="management.roles.title"
        description="management.roles.description"
        namespace="global"
        icon={<IconUsersGroup size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'management.users.title', href: `/${locale}/management/users`, namespace: 'global' },
          { label: 'management.roles.title', namespace: 'global' },
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
        exportTitle={t('title')}
        exportNamespace="modules/roles"
        tableId="roles-table"
        emptyMessage={t('table.empty')}
        showAuditHistory={true}
        auditEntityName="Role"
        auditIdKey="id"
      />

      <RoleModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRole(null);
        }}
        roleId={selectedRole}
      />
    </Container>
  );
}

