'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Select,
} from '@mantine/core';
import { IconSearch, IconFilter, IconPlus, IconEdit, IconTrash, IconDotsVertical, IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useUsers } from '@/hooks/useUsers';
import { useTranslation } from '@/lib/i18n/client';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [roleFilter] = useState<UserRole | undefined>();
  const [statusFilter] = useState<UserStatus | undefined>();

  const { data, isLoading, error } = useUsers({
    page,
    pageSize,
    search: search || undefined,
    role: roleFilter,
    status: statusFilter,
  });

  if (isLoading) {
    return <UsersPageSkeleton />;
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Container>
    );
  }

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

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="title"
        description="description"
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
            onClick: () => router.push(`/${locale}/users/create`),
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md" className={classes.tableContainer}>
        {/* Toolbar */}
        <Group justify="space-between" mb="md" className={classes.toolbar}>
          <TextInput
            placeholder={t('table.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className={classes.searchInput}
          />
          <Button
            variant="default"
            leftSection={<IconFilter size={16} />}
            rightSection={<IconDotsVertical size={16} />}
          >
            {t('table.filters')}
          </Button>
        </Group>

        {/* Table */}
        <div className={classes.tableWrapper}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.user')}</Table.Th>
                <Table.Th>{t('table.email')}</Table.Th>
                <Table.Th>{t('table.role')}</Table.Th>
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th>{t('table.lastActive')}</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className={classes.avatar}
                            onError={(e) => {
                              // If image fails to load, show placeholder
                              e.currentTarget.style.display = 'none';
                              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        {!user.profilePicture && (
                          <div className={classes.avatarPlaceholder}>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <Text fw={500}>{user.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {user.role}
                      </Text>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(user.status)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatLastActive(user.lastActive)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => router.push(`/${locale}/users/${user.id}/edit`)}
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
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text c="dimmed">{t('table.noUsers') || 'No users found'}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <Group justify="space-between" mt="md" pt="md" className={classes.pagination}>
            <Group gap="md">
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {t('table.rowsPerPage') || 'Sayfa başına:'}
                </Text>
                <Select
                  value={pageSize.toString()}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1); // Reset to first page when page size changes
                  }}
                  data={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                  size="sm"
                  style={{ width: 80 }}
                />
              </Group>
              <Text size="sm" c="dimmed">
                {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.total)} / {data.total} {t('table.showing') || 'kayıt gösteriliyor'}
              </Text>
            </Group>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(data.total / pageSize)}
            />
          </Group>
        )}
      </Paper>
    </Container>
  );
}

