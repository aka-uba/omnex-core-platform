'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconEye, IconTrash } from '@tabler/icons-react';
import { useBulkOperations, useDeleteBulkOperation } from '@/hooks/useBulkOperations';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import dayjs from 'dayjs';

interface BulkOperationListProps {
  locale: string;
}

export function BulkOperationList({ locale }: BulkOperationListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useBulkOperations({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter as any } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const deleteOperation = useDeleteBulkOperation();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteOperation.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('bulkOperations.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('bulkOperations.delete.error'),
      });
    }
  }, [deleteId, deleteOperation, t]);

  const getStatusBadge = useCallback((status: string) => {
    const colors: Record<string, string> = {
      pending: 'gray',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'orange',
    };
    return (
      <Badge color={colors[status] || 'gray'} variant="light">
        {t(`bulkOperations.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const getTypeLabel = useCallback((type: string) => {
    return t(`bulkOperations.types.${type}`) || type;
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.operations) return [];
    return data.operations.map((operation) => ({
      id: operation.id,
      title: operation.title,
      type: operation.type,
      status: operation.status,
      affectedCount: operation.affectedCount,
      successCount: operation.successCount,
      failedCount: operation.failedCount,
      createdAt: operation.createdAt,
    }));
  }, [data]);

  // Memoized render functions
  const renderType = useCallback((value: string) => getTypeLabel(value), [getTypeLabel]);

  const renderStatus = useCallback((value: string) => getStatusBadge(value), [getStatusBadge]);

  const renderSuccessCount = useCallback((value: number) => <Text c="green">{value}</Text>, []);

  const renderFailedCount = useCallback((value: number) => <Text c="red">{value}</Text>, []);

  const renderCreatedAt = useCallback((value: Date) => dayjs(value).format('DD.MM.YYYY HH:mm'), []);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/bulk-operations/${row.id}`);
          }}
        >
          <IconEye size={18} />
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
          loading={deleteOperation.isPending}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  ), [router, locale, handleDeleteClick, deleteOperation.isPending, t]);

  // Define columns with memoization
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'title',
      label: t('bulkOperations.table.title'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'type',
      label: t('bulkOperations.table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'status',
      label: t('bulkOperations.table.status'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'affectedCount',
      label: t('bulkOperations.table.affected'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'successCount',
      label: t('bulkOperations.table.success'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderSuccessCount,
    },
    {
      key: 'failedCount',
      label: t('bulkOperations.table.failed'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderFailedCount,
    },
    {
      key: 'createdAt',
      label: t('bulkOperations.table.createdAt'),
      sortable: true,
      searchable: false,
      render: renderCreatedAt,
    },
    {
      key: 'actions',
      label: t('actions.title'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderType, renderStatus, renderSuccessCount, renderFailedCount, renderCreatedAt, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('bulkOperations.filter.type'),
      type: 'select',
      options: [
        { value: 'rent_increase', label: t('bulkOperations.types.rent_increase') },
        { value: 'fee_update', label: t('bulkOperations.types.fee_update') },
      ],
    },
    {
      key: 'status',
      label: t('bulkOperations.filter.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('bulkOperations.status.pending') },
        { value: 'processing', label: t('bulkOperations.status.processing') },
        { value: 'completed', label: t('bulkOperations.status.completed') },
        { value: 'failed', label: t('bulkOperations.status.failed') },
        { value: 'cancelled', label: t('bulkOperations.status.cancelled') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.type) {
      setTypeFilter(filters.type);
    } else {
      setTypeFilter('');
    }
    
    if (filters.status) {
      setStatusFilter(filters.status);
    } else {
      setStatusFilter('');
    }
    
    setPage(1);
  }, []);

  if (isLoading) {
    return <DataTableSkeleton columns={7} rows={8} />;
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('bulkOperations.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('bulkOperations.delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-bulk-operations"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('bulkOperations.empty')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('bulkOperations.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
