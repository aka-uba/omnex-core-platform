'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Alert,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconUser,
} from '@tabler/icons-react';
import { useTenants, useDeleteTenant } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';

interface TenantListProps {
  locale: string;
}

export function TenantList({ locale }: TenantListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useTenants({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteTenant = useDeleteTenant();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteTenant.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('tenants.delete.success') || t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('tenants.delete.error') || t('delete.error'),
      });
    }
  }, [deleteId, deleteTenant, t]);

  const getActiveBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.tenants) return [];
    return data.tenants.map((tenant: any) => {
      // Use Tenant model's direct fields first, then fallback to contact/user relations
      const firstName = tenant.firstName || tenant.contact?.name?.split(' ')[0] || tenant.user?.name?.split(' ')[0] || '-';
      const lastName = tenant.lastName || tenant.contact?.name?.split(' ').slice(1).join(' ') || tenant.user?.name?.split(' ').slice(1).join(' ') || '-';
      const fullName = tenant.firstName && tenant.lastName 
        ? `${tenant.firstName} ${tenant.lastName}`.trim()
        : tenant.contact?.name || tenant.user?.name || '-';
      const email = tenant.email || tenant.contact?.email || tenant.user?.email || '-';
      const phone = tenant.phone || tenant.mobile || tenant.contact?.phone || tenant.user?.phone || '-';
      // City: Use Tenant model's city field (handle null, undefined, and empty string)
      const city = (tenant.city && tenant.city.trim()) || '-';
      
      return {
        id: tenant.id,
        tenantNumber: tenant.tenantNumber || '-',
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        phone: phone,
        email: email,
        city: city,
        moveInDate: tenant.moveInDate,
        isActive: tenant.isActive,
      };
    });
  }, [data]);

  // Memoized render functions
  const renderTenantNumber = useCallback((value: string) => (
    <Group gap="xs">
      <IconUser size={16} />
      <Text fw={500}>{value}</Text>
    </Group>
  ), []);

  const renderFullName = useCallback((value: string) => (
    <Text fw={500}>{value}</Text>
  ), []);

  const renderPhone = useCallback((value: string) => (
    <Text size="sm">{value}</Text>
  ), []);

  const renderEmail = useCallback((value: string) => (
    <Text size="sm">{value}</Text>
  ), []);

  const renderCity = useCallback((value: string) => (
    <Text size="sm">{value}</Text>
  ), []);

  const renderMoveInDate = useCallback((value: Date | null) => value ? new Date(value).toLocaleDateString() : '-', []);

  const renderStatus = useCallback((value: boolean) => getActiveBadge(value), [getActiveBadge]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/tenants/${row.id}`);
          }}
        >
          <IconEye size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('actions.edit')} withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/tenants/${row.id}/edit`);
          }}
        >
          <IconEdit size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('actions.delete')} withArrow>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(row.id);
          }}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  ), [router, locale, handleDeleteClick, t]);

  // Define columns with memoization
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'tenantNumber',
      label: t('table.tenantNumber'),
      sortable: true,
      searchable: true,
      render: renderTenantNumber,
    },
    {
      key: 'fullName',
      label: t('table.fullName'),
      sortable: true,
      searchable: true,
      render: renderFullName,
    },
    {
      key: 'phone',
      label: t('table.phone'),
      sortable: true,
      searchable: true,
      render: renderPhone,
    },
    {
      key: 'email',
      label: t('table.email'),
      sortable: true,
      searchable: true,
      render: renderEmail,
    },
    {
      key: 'city',
      label: t('table.city'),
      sortable: true,
      searchable: true,
      render: renderCity,
    },
    {
      key: 'moveInDate',
      label: t('table.moveInDate'),
      sortable: true,
      searchable: false,
      render: renderMoveInDate,
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderTenantNumber, renderFullName, renderPhone, renderEmail, renderCity, renderMoveInDate, renderStatus, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'isActive',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.isActive) {
      setIsActiveFilter(filters.isActive === 'true');
    } else {
      setIsActiveFilter(undefined);
    }
    
    setPage(1);
  }, []);


  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={8} />;
  }

  if (error) {
    return (
      <Alert color="red" title={tGlobal('common.errorLoading')}>
        {error instanceof Error ? error.message : tGlobal('common.errorLoading')}
      </Alert>
    );
  }

  if (!data) {
    return <Text>{tGlobal('common.noData')}</Text>;
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('tenants.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('tenants.delete.confirm') || t('delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noTenants')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('tenants.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
