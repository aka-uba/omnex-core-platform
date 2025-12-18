'use client';

import { Container, Stack, Text, Alert, Badge, Group, Button, TextInput, Select, ActionIcon, Modal } from '@mantine/core';
import { IconDatabase, IconSearch, IconRefresh, IconPlus, IconTrash } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { useState } from 'react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { TenantsPageSkeleton } from './TenantsPageSkeleton';
import { useDisclosure } from '@mantine/hooks';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  dbName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  agency: {
    id: string;
    name: string;
  } | null;
}

interface TenantsResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  pageSize: number;
}

export default function TenantsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');
  const [page] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Hard delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/tenants/${tenantId}?hardDelete=true`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: t('tenants.deleteSuccess') || 'Başarılı',
        message: t('tenants.deleteSuccessMessage') || 'Tenant başarıyla silindi',
      });
      closeDeleteModal();
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: t('common.error') || 'Hata',
        message: error.message,
      });
    },
  });

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    openDeleteModal();
  };

  const confirmDelete = () => {
    if (selectedTenant) {
      deleteMutation.mutate(selectedTenant.id);
    }
  };

  const { data, isLoading, error, refetch } = useQuery<TenantsResponse>({
    queryKey: ['tenants', page, pageSize, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/tenants?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const result = await response.json();
      return result.data;
    },
  });

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: t('tenants.table.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('tenants.active') },
        { value: 'inactive', label: t('tenants.inactive') },
        { value: 'suspended', label: t('tenants.suspended') },
      ],
    },
  ];

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('tenants.table.name'),
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <Text fw={500}>{row.name}</Text>
      ),
    },
    {
      key: 'slug',
      label: t('tenants.table.slug'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm" c="dimmed">{value}</Text>
      ),
    },
    {
      key: 'subdomain',
      label: t('tenants.table.subdomain'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm">{value || '-'}</Text>
      ),
    },
    {
      key: 'dbName',
      label: t('tenants.table.database'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Badge variant="light" color="blue">{value}</Badge>
      ),
    },
    {
      key: 'status',
      label: t('tenants.table.status'),
      sortable: true,
      render: (value) => {
        const color = value === 'active' ? 'green' : value === 'inactive' ? 'red' : 'gray';
        return (
          <Badge color={color} variant="light">
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'agency',
      label: t('tenants.table.agency'),
      sortable: true,
      render: (value, row) => (
        <Text size="sm">{(row as Tenant).agency?.name || '-'}</Text>
      ),
    },
    {
      key: 'createdAt',
      label: t('tenants.table.createdAt'),
      sortable: true,
      render: (value) => (
        <Text size="sm">{new Date(value as string).toLocaleDateString(currentLocale)}</Text>
      ),
    },
    {
      key: 'actions',
      label: t('common.actions.title') || 'İşlemler',
      sortable: false,
      render: (_value, row) => (
        <Group gap="xs">
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => handleDeleteClick(row as Tenant)}
            title={t('common.actions.delete') || 'Sil'}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  const filteredData = data?.tenants.filter((tenant) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(searchLower) ||
      tenant.slug.toLowerCase().includes(searchLower) ||
      tenant.subdomain?.toLowerCase().includes(searchLower) ||
      tenant.dbName.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('tenants.title')}
        description={t('tenants.description')}
        namespace="global"
        icon={<IconDatabase size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'tenants.title', namespace: 'global' },
        ]}
        actions={[
          {
            label: t('tenants.create'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${currentLocale}/settings/add-company`),
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        <Group>
          <TextInput
            placeholder={t('tenants.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t('tenants.filterStatus')}
            data={[
              { value: '', label: t('tenants.all') },
              { value: 'active', label: t('tenants.active') },
              { value: 'inactive', label: t('tenants.inactive') },
              { value: 'suspended', label: t('tenants.suspended') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value || null)}
            clearable
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            variant="light"
          >
            {t('buttons.refresh')}
          </Button>
        </Group>

        {isLoading ? (
          <TenantsPageSkeleton />
        ) : error ? (
          <Alert color="red" title={t('common.error')}>
            {error instanceof Error ? error.message : t('tenants.loadError')}
          </Alert>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            emptyMessage={t('tenants.noTenants')}
            filters={filterOptions}
            onFilter={(filters) => {
              if (filters.status) setStatusFilter(filters.status);
              else setStatusFilter(null);
            }}
            showExportIcons={true}
            onExport={(format) => {
              // Export functionality
              showToast({
                type: 'info',
                title: t('export'),
                message: `${format.toUpperCase()} formatında dışa aktarma yakında eklenecek`,
              });
            }}
          />
        )}
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t('tenants.deleteConfirmTitle') || 'Tenant Silme Onayı'}
        centered
      >
        <Stack gap="md">
          <Text>
            {t('tenants.deleteConfirmMessage') || 'Bu tenant\'ı silmek istediğinizden emin misiniz?'}
          </Text>
          {selectedTenant && (
            <Alert color="red" variant="light">
              <Text fw={500}>{selectedTenant.name}</Text>
              <Text size="sm" c="dimmed">Slug: {selectedTenant.slug}</Text>
              <Text size="sm" c="dimmed">Database: {selectedTenant.dbName}</Text>
            </Alert>
          )}
          <Text size="sm" c="red">
            {t('tenants.deleteWarning') || 'Bu işlem geri alınamaz. Tenant ve ilişkili tüm veriler silinecektir.'}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDeleteModal}>
              {t('common.actions.cancel') || 'İptal'}
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
            >
              {t('common.actions.delete') || 'Sil'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

