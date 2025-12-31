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
  Avatar,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconBuilding,
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
      const email = tenant.email || tenant.contact?.email || tenant.user?.email || '-';
      const phone = tenant.phone || tenant.contact?.phone || tenant.user?.phone || '-';
      const mobile = tenant.mobile || '-';
      // Build full address
      const addressParts = [
        tenant.street ? `${tenant.street} ${tenant.houseNumber || ''}`.trim() : null,
        `${tenant.postalCode || ''} ${tenant.city || ''}`.trim() || null
      ].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join('\n') : '-';

      return {
        id: tenant.id,
        isActive: tenant.isActive,
        tenantType: tenant.tenantType || 'person',
        companyName: tenant.companyName || '-',
        salutation: tenant.salutation || '-',
        firstName: firstName,
        lastName: lastName,
        birthDate: tenant.birthDate,
        phone: phone,
        mobile: mobile,
        email: email,
        address: address,
        tenantNumber: tenant.tenantNumber || '-',
        moveInDate: tenant.moveInDate,
        coverImage: tenant.coverImage,
        images: tenant.images || [],
      };
    });
  }, [data]);

  // Memoized render functions
  const renderAvatar = useCallback((value: any, row: any) => {
    const imageUrl = row.coverImage
      ? `/api/core-files/${row.coverImage}/download?inline=true`
      : row.images && row.images.length > 0
      ? `/api/core-files/${row.images[0]}/download?inline=true`
      : null;

    const initials = row.tenantType === 'company'
      ? (row.companyName || 'C').substring(0, 2).toUpperCase()
      : `${(row.firstName || '').charAt(0)}${(row.lastName || '').charAt(0)}`.toUpperCase() || 'T';

    return (
      <Avatar
        src={imageUrl}
        size="sm"
        radius="xl"
        color={row.tenantType === 'company' ? 'blue' : 'grape'}
      >
        {row.tenantType === 'company' ? <IconBuilding size={14} /> : initials}
      </Avatar>
    );
  }, []);

  const renderStatus = useCallback((value: boolean) => getActiveBadge(value), [getActiveBadge]);

  const renderTenantType = useCallback((value: string) => {
    const typeLabels: Record<string, string> = {
      person: t('tenantTypes.person'),
      company: t('tenantTypes.company'),
    };
    return (
      <Badge color={value === 'company' ? 'blue' : 'gray'} variant="light">
        {typeLabels[value] || value}
      </Badge>
    );
  }, [t]);

  const renderSalutation = useCallback((value: string) => {
    if (!value || value === '-') return '-';
    const salutationLabels: Record<string, string> = {
      Herr: t('salutations.mr'),
      Frau: t('salutations.mrs'),
    };
    return <Text size="sm">{salutationLabels[value] || value}</Text>;
  }, [t]);

  const renderDate = useCallback((value: Date | string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('de-DE');
  }, []);

  const renderAddress = useCallback((value: string) => (
    <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{value}</Text>
  ), []);

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

  // Define columns with memoization - Customer table order
  // #(rowNumber) is handled by DataTable automatically
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'avatar',
      label: '',
      sortable: false,
      searchable: false,
      render: renderAvatar,
      width: 50,
    },
    {
      key: 'isActive',
      label: t('table.active'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'tenantType',
      label: t('table.tenantType'),
      sortable: true,
      searchable: false,
      render: renderTenantType,
    },
    {
      key: 'companyName',
      label: t('table.companyName'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'salutation',
      label: t('table.salutation'),
      sortable: true,
      searchable: false,
      render: renderSalutation,
    },
    {
      key: 'firstName',
      label: t('table.firstName'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'lastName',
      label: t('table.lastName'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'birthDate',
      label: t('table.birthDate'),
      sortable: true,
      searchable: false,
      render: renderDate,
      hidden: true, // Hidden by default
    },
    {
      key: 'phone',
      label: t('table.phone'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'mobile',
      label: t('table.mobile'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'email',
      label: t('table.email'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'address',
      label: t('table.address'),
      sortable: true,
      searchable: true,
      render: renderAddress,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderAvatar, renderStatus, renderTenantType, renderSalutation, renderDate, renderAddress, renderActions]);

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
        tableId="real-estate-tenants"
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
