'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Badge,
  ActionIcon,
  Group,
  Text,
  Alert,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useUsers } from '@/hooks/useUsers';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { UsersPageSkeleton } from './UsersPageSkeleton';
import classes from './UsersPage.module.css';
import type { UserRole, UserStatus } from '@/lib/schemas/user';

export function UsersPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');
  const [page] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();

  const { data, isLoading, error } = useUsers({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const filterOptions: FilterOption[] = [
    {
      key: 'role',
      label: t('table.role'),
      type: 'select',
      options: [
        { value: 'SuperAdmin', label: 'SuperAdmin' },
        { value: 'Admin', label: 'Admin' },
        { value: 'ClientUser', label: 'ClientUser' },
      ],
    },
    {
      key: 'status',
      label: t('table.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('status.active') },
        { value: 'inactive', label: t('status.inactive') },
        { value: 'pending', label: t('status.pending') },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green">{t('status.active')}</Badge>;
      case 'inactive':
        return <Badge color="gray">{t('status.inactive')}</Badge>;
      case 'pending':
        return <Badge color="yellow">{t('status.pending')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return t('table.lastActive');
    try {
      return dayjs(dateString).fromNow();
    } catch {
      return dateString;
    }
  };

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('table.user'),
      sortable: true,
      searchable: true,
      render: (value, row: any) => (
        <Group gap="sm">
          {row.profilePicture ? (
            <img
              src={row.profilePicture}
              alt={row.name}
              className={classes.avatar}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          {!row.profilePicture && (
            <div className={classes.avatarPlaceholder}>
              {row.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <Text fw={500}>{value}</Text>
        </Group>
      ),
    },
    {
      key: 'email',
      label: t('table.email'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm" c="dimmed">
          {value}
        </Text>
      ),
    },
    {
      key: 'role',
      label: t('table.role'),
      sortable: true,
      render: (value) => (
        <Text size="sm" c="dimmed">
          {value}
        </Text>
      ),
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      render: (value) => getStatusBadge(value as string),
    },
    {
      key: 'lastActive',
      label: t('table.lastActive'),
      sortable: true,
      render: (value, row: any) => (
        <Text size="sm" c="dimmed">
          {formatLastActive(row.lastActive)}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      render: (value, row: any) => (
        <Group justify="flex-end" gap="xs">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => router.push(`/${locale}/management/users/${row.id}/edit`)}
            title={t('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            title={t('actions.delete')}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/users"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', namespace: 'modules/users' },
        ]}
        actions={[
          {
            label: t('create.button'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${locale}/management/users/create`),
            variant: 'filled',
          },
        ]}
      />

      {isLoading ? (
        <UsersPageSkeleton />
      ) : error ? (
        <Alert color="red" title={tGlobal('common.errorLoading')}>
          {error instanceof Error ? error.message : tGlobal('common.errorLoading')}
        </Alert>
      ) : (
        <DataTable
          data={data?.users || []}
          columns={columns}
          searchable={true}
          sortable={true}
          pageable={true}
          defaultPageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          emptyMessage={t('table.noUsers')}
          filters={filterOptions}
          onFilter={(filters) => {
            if (filters.role) setRoleFilter(filters.role as UserRole);
            else setRoleFilter(undefined);
            
            if (filters.status) setStatusFilter(filters.status as UserStatus);
            else setStatusFilter(undefined);
          }}
          showExportIcons={true}
            onExport={(format) => {
              showToast({
                type: 'info',
                title: tGlobal('export.report'),
                message: tGlobal('exportComingSoon', { format: format.toUpperCase() }),
              });
            }}
        />
      )}
    </Container>
  );
}

