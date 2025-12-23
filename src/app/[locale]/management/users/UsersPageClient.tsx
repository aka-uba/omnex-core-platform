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
  Modal,
  Stack,
  Avatar,
  Divider,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconEye, IconToggleLeft, IconToggleRight } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useUsers, useToggleUserStatus } from '@/hooks/useUsers';
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
  const [quickViewUser, setQuickViewUser] = useState<any | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const toggleStatus = useToggleUserStatus();

  const { data, isLoading, error, refetch } = useUsers({
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
          {/* Quick View */}
          <Tooltip label={t('actions.view')}>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewUser(row);
                setQuickViewOpen(true);
              }}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          {/* Toggle Status */}
          <Tooltip label={row.status === 'active' ? t('actions.deactivate') : t('actions.activate')}>
            <ActionIcon
              variant="subtle"
              color={row.status === 'active' ? 'green' : 'gray'}
              onClick={async (e) => {
                e.stopPropagation();
                const newStatus = row.status === 'active' ? 'inactive' : 'active';
                try {
                  await toggleStatus.mutateAsync({ userId: row.id, status: newStatus });
                  refetch();
                  showToast({
                    type: 'success',
                    title: t('actions.statusUpdated'),
                    message: newStatus === 'active' ? t('actions.userActivated') : t('actions.userDeactivated'),
                  });
                } catch (error) {
                  showToast({
                    type: 'error',
                    title: tGlobal('notifications.error.title'),
                    message: error instanceof Error ? error.message : tGlobal('notifications.error.statusUpdateFailed'),
                  });
                }
              }}
            >
              {row.status === 'active' ? <IconToggleRight size={16} /> : <IconToggleLeft size={16} />}
            </ActionIcon>
          </Tooltip>
          {/* Edit */}
          <Tooltip label={t('actions.edit')}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => router.push(`/${locale}/management/users/${row.id}/edit`)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          {/* Delete */}
          <Tooltip label={t('actions.delete')}>
            <ActionIcon
              variant="subtle"
              color="red"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
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

      {/* Quick View Modal */}
      <Modal
        opened={quickViewOpen}
        onClose={() => {
          setQuickViewOpen(false);
          setQuickViewUser(null);
        }}
        title={
          <Group gap="sm">
            <IconEye size={20} />
            <Text fw={600}>{t('quickView.title')}</Text>
          </Group>
        }
        size="md"
        centered
      >
        {quickViewUser && (
          <Stack gap="md">
            {/* User Header */}
            <Group gap="md" align="center">
              <Avatar
                src={quickViewUser.profilePicture}
                size={80}
                radius="xl"
                color="blue"
              >
                {quickViewUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Stack gap={4}>
                <Text size="xl" fw={600}>{quickViewUser.name}</Text>
                <Text size="sm" c="dimmed">{quickViewUser.email}</Text>
                <Badge
                  color={quickViewUser.status === 'active' ? 'green' : quickViewUser.status === 'pending' ? 'yellow' : 'gray'}
                  size="md"
                >
                  {quickViewUser.status === 'active' ? t('status.active') : quickViewUser.status === 'pending' ? t('status.pending') : t('status.inactive')}
                </Badge>
              </Stack>
            </Group>

            <Divider />

            {/* User Details */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t('table.role')}</Text>
                <Text size="sm" fw={500}>{quickViewUser.role}</Text>
              </Group>
              {quickViewUser.department && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.work.department')}</Text>
                  <Text size="sm" fw={500}>{quickViewUser.department}</Text>
                </Group>
              )}
              {quickViewUser.position && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.work.position')}</Text>
                  <Text size="sm" fw={500}>{quickViewUser.position}</Text>
                </Group>
              )}
              {quickViewUser.phone && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.personal.phone')}</Text>
                  <Text size="sm" fw={500}>{quickViewUser.phone}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t('table.lastActive')}</Text>
                <Text size="sm" fw={500}>{formatLastActive(quickViewUser.lastActive)}</Text>
              </Group>
              {quickViewUser.createdAt && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('quickView.createdAt')}</Text>
                  <Text size="sm" fw={500}>{dayjs(quickViewUser.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Group>
              )}
            </Stack>

            <Divider />

            {/* Actions */}
            <Group justify="flex-end" gap="xs">
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={() => {
                  setQuickViewOpen(false);
                  router.push(`/${locale}/management/users/${quickViewUser.id}/edit`);
                }}
                title={t('actions.edit')}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

