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
  IconContract,
} from '@tabler/icons-react';
import { useContracts, useDeleteContract } from '@/hooks/useContracts';
import { useApartments } from '@/hooks/useApartments';
import { useTenants } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { ContractType, ContractStatus } from '@/modules/real-estate/types/contract';

interface ContractListProps {
  locale: string;
}

export function ContractList({ locale }: ContractListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [apartmentId, setApartmentId] = useState<string | undefined>();
  const [tenantRecordId, setTenantRecordId] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<ContractType | undefined>();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useContracts({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(apartmentId ? { apartmentId } : {}),
    ...(tenantRecordId ? { tenantRecordId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  // Fetch apartments and tenants for filters
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 1000 });

  const deleteContract = useDeleteContract();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteContract.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('delete.error'),
      });
    }
  }, [deleteId, deleteContract, t]);

  const getTypeBadge = useCallback((type: ContractType) => {
    const typeColors: Record<ContractType, string> = {
      rental: 'blue',
      sale: 'green',
      lease: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: ContractStatus) => {
    const statusColors: Record<ContractStatus, string> = {
      draft: 'gray',
      active: 'green',
      expired: 'red',
      terminated: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const getActiveBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.contracts) return [];
    return data.contracts.map((contract) => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      type: contract.type,
      apartment: contract.apartment?.unitNumber || '-',
      tenant: contract.tenantRecord?.tenantNumber || contract.tenantRecord?.id || '-',
      rentAmount: `${contract.rentAmount} ${contract.currency}`,
      status: contract.status,
      isActive: contract.isActive,
    }));
  }, [data]);

  // Memoized render functions
  const renderContractNumber = useCallback((value: string) => (
    <Group gap="xs">
      <IconContract size={16} />
      <Text fw={500}>{value}</Text>
    </Group>
  ), []);

  const renderType = useCallback((value: ContractType) => getTypeBadge(value), [getTypeBadge]);

  const renderStatus = useCallback((value: ContractStatus, row: any) => (
    <Group gap="xs">
      {getStatusBadge(value)}
      {getActiveBadge(row.isActive)}
    </Group>
  ), [getStatusBadge, getActiveBadge]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/contracts/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/contracts/${row.id}/edit`);
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
      key: 'contractNumber',
      label: t('table.contractNumber'),
      sortable: true,
      searchable: true,
      render: renderContractNumber,
    },
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'tenant',
      label: t('table.tenant'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'rentAmount',
      label: t('table.rentAmount'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'status',
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
  ], [t, renderContractNumber, renderType, renderStatus, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'apartmentId',
      label: t('filter.apartment'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        ...(apartmentsData?.apartments.map(a => ({ value: a.id, label: a.unitNumber })) || []),
      ],
    },
    {
      key: 'tenantRecordId',
      label: t('filter.tenant'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        ...(tenantsData?.tenants.map(t => ({ value: t.id, label: t.tenantNumber || t.id })) || []),
      ],
    },
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'rental', label: t('types.rental') },
        { value: 'sale', label: t('types.sale') },
        { value: 'lease', label: t('types.lease') },
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('status.draft') },
        { value: 'active', label: t('status.active') },
        { value: 'expired', label: t('status.expired') },
        { value: 'terminated', label: t('status.terminated') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.active'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
  ], [t, apartmentsData, tenantsData]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.apartmentId) {
      setApartmentId(filters.apartmentId);
    } else {
      setApartmentId(undefined);
    }
    
    if (filters.tenantRecordId) {
      setTenantRecordId(filters.tenantRecordId);
    } else {
      setTenantRecordId(undefined);
    }
    
    if (filters.type) {
      setTypeFilter(filters.type as ContractType);
    } else {
      setTypeFilter(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as ContractStatus);
    } else {
      setStatusFilter(undefined);
    }
    
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
        title={t('contracts.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-contracts"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noContracts')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('contracts.title')}
        exportNamespace="modules/real-estate"
        showAuditHistory={true}
        auditEntityName="Contract"
        auditIdKey="id"
      />
    </>
  );
}
