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
import {
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useProductionOrders, useDeleteProductionOrder } from '@/hooks/useProductionOrders';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { ProductionOrderStatus, ProductionOrderPriority } from '@/modules/production/types/product';
import dayjs from 'dayjs';

interface ProductionOrderListProps {
  locale: string;
}

export function ProductionOrderList({ locale }: ProductionOrderListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ProductionOrderStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<ProductionOrderPriority | undefined>();

  const { data, isLoading, error } = useProductionOrders({
    page: 1,
    pageSize: 1000,
    ...(productFilter ? { productId: productFilter } : {}),
    ...(locationFilter ? { locationId: locationFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(priorityFilter ? { priority: priorityFilter } : {}),
  });

  // Fetch products and locations for filters
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteOrder = useDeleteProductionOrder();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteOrder.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: t('orders.delete.success'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : t('orders.delete.error'),
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteOrder, t, tGlobal]);

  const getStatusBadge = useCallback((status: ProductionOrderStatus) => {
    const statusColors: Record<ProductionOrderStatus, string> = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`orders.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const getPriorityBadge = useCallback((priority: ProductionOrderPriority) => {
    const priorityColors: Record<ProductionOrderPriority, string> = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return (
      <Badge color={priorityColors[priority] || 'gray'}>
        {t(`orders.priority.${priority}`) || priority}
      </Badge>
    );
  }, [t]);

  const orders = useMemo(() => data?.orders || [], [data]);

  // Product options for filter
  const productOptions = useMemo(() => {
    return (productsData?.products || []).map((product) => ({
      value: product.id,
      label: product.name,
    }));
  }, [productsData]);

  // Location options for filter
  const locationOptions = useMemo(() => {
    return (locationsData?.locations || []).map((location) => ({
      value: location.id,
      label: location.name,
    }));
  }, [locationsData]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'productId',
      label: t('orders.table.product'),
      type: 'select',
      options: productOptions,
    },
    {
      key: 'locationId',
      label: t('orders.table.location'),
      type: 'select',
      options: locationOptions,
    },
    {
      key: 'status',
      label: t('orders.table.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('orders.status.pending') },
        { value: 'in_progress', label: t('orders.status.in_progress') },
        { value: 'completed', label: t('orders.status.completed') },
        { value: 'cancelled', label: t('orders.status.cancelled') },
      ],
    },
    {
      key: 'priority',
      label: t('orders.table.priority'),
      type: 'select',
      options: [
        { value: 'low', label: t('orders.priority.low') },
        { value: 'normal', label: t('orders.priority.normal') },
        { value: 'high', label: t('orders.priority.high') },
        { value: 'urgent', label: t('orders.priority.urgent') },
      ],
    },
  ], [t, productOptions, locationOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setProductFilter(filters.productId || undefined);
    setLocationFilter(filters.locationId || undefined);
    setStatusFilter(filters.status as ProductionOrderStatus || undefined);
    setPriorityFilter(filters.priority as ProductionOrderPriority || undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'orderNumber',
      label: t('orders.table.orderNumber'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'productName',
      label: t('orders.table.product'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) => row.product?.name || '-',
    },
    {
      key: 'locationName',
      label: t('orders.table.location'),
      sortable: true,
      render: (_value: string, row: Record<string, any>) => row.location?.name || '-',
    },
    {
      key: 'quantity',
      label: t('orders.table.quantity'),
      sortable: true,
      align: 'right',
      render: (value: number, row: Record<string, any>) =>
        `${Number(value).toLocaleString('tr-TR')} ${row.unit}`,
    },
    {
      key: 'status',
      label: t('orders.table.status'),
      sortable: true,
      render: (value: ProductionOrderStatus) => getStatusBadge(value),
    },
    {
      key: 'priority',
      label: t('orders.table.priority'),
      sortable: true,
      render: (value: ProductionOrderPriority) => getPriorityBadge(value),
    },
    {
      key: 'plannedStartDate',
      label: t('orders.table.plannedStart'),
      sortable: true,
      render: (value: string) => value ? dayjs(value).format('DD.MM.YYYY') : '-',
    },
    {
      key: 'plannedEndDate',
      label: t('orders.table.plannedEnd'),
      sortable: true,
      render: (value: string) => value ? dayjs(value).format('DD.MM.YYYY') : '-',
    },
    {
      key: 'actions',
      label: tGlobal('table.actions'),
      align: 'right',
      render: (_value: any, row: Record<string, any>) => (
        <Group gap="xs" justify="flex-end">
          <Tooltip label={t('actions.view')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/production/orders/${row.id}`);
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
                router.push(`/${locale}/modules/production/orders/${row.id}/edit`);
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
      ),
    },
  ], [t, tGlobal, getStatusBadge, getPriorityBadge, router, locale, handleDeleteClick]);

  if (isLoading) {
    return <DataTableSkeleton columns={9} rows={10} />;
  }

  if (error) {
    return <DataTableSkeleton columns={9} rows={5} />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={orders}
        tableId="production-orders-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/production"
        showColumnSettings={true}
        emptyMessage={t('orders.noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/production/orders/${row.id}`)}
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('orders.delete.title')}
        message={t('orders.delete.confirm')}
        variant="danger"
        loading={deleteOrder.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
