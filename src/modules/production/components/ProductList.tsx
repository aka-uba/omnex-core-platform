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
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { ProductType } from '@/modules/production/types/product';

interface ProductListProps {
  locale: string;
}

export function ProductList({ locale }: ProductListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<ProductType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();

  const { data, isLoading, error } = useProducts({
    page: 1,
    pageSize: 1000,
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteProduct = useDeleteProduct();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: t('delete.success'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : t('delete.error'),
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteProduct, t, tGlobal]);

  const getTypeBadge = useCallback((type: ProductType) => {
    const typeColors: Record<ProductType, string> = {
      hammadde: 'blue',
      yarı_mamul: 'orange',
      mamul: 'green',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getActiveBadge = useCallback((isActive: boolean) => {
    return (
      <Badge color={isActive ? 'green' : 'gray'}>
        {isActive ? t('status.active') : t('status.inactive')}
      </Badge>
    );
  }, [t]);

  const formatCurrency = useCallback((value: number | null, currency?: string) => {
    if (!value) return '-';
    return Number(value).toLocaleString('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
    });
  }, []);

  const products = useMemo(() => data?.products || [], [data]);

  // Category options from products
  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category))).sort();
    return categories.map(cat => ({ value: cat, label: cat }));
  }, [products]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'category',
      label: t('table.category'),
      type: 'select',
      options: categoryOptions,
    },
    {
      key: 'type',
      label: t('table.type'),
      type: 'select',
      options: [
        { value: 'hammadde', label: t('types.hammadde') },
        { value: 'yarı_mamul', label: t('types.yarı_mamul') },
        { value: 'mamul', label: t('types.mamul') },
      ],
    },
    {
      key: 'isActive',
      label: t('table.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
  ], [t, categoryOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setCategoryFilter(filters.category || undefined);
    setTypeFilter(filters.type as ProductType || undefined);
    setIsActiveFilter(filters.isActive ? filters.isActive === 'true' : undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'code',
      label: t('table.code'),
      sortable: true,
      searchable: true,
      render: (value: string) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'category',
      label: t('table.category'),
      sortable: true,
    },
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      render: (value: ProductType) => getTypeBadge(value),
    },
    {
      key: 'stockQuantity',
      label: t('table.stockQuantity'),
      sortable: true,
      align: 'right',
      render: (value: number, row: Record<string, any>) => {
        const stock = Number(value);
        const minStock = row.minStockLevel ? Number(row.minStockLevel) : null;
        if (minStock && stock < minStock) {
          return <Badge color="red">{stock.toLocaleString('tr-TR')}</Badge>;
        }
        return stock.toLocaleString('tr-TR');
      },
    },
    {
      key: 'unit',
      label: t('table.unit'),
      sortable: true,
    },
    {
      key: 'costPrice',
      label: t('table.costPrice'),
      sortable: true,
      align: 'right',
      render: (value: number, row: Record<string, any>) => formatCurrency(value, row.currency),
    },
    {
      key: 'sellingPrice',
      label: t('table.sellingPrice'),
      sortable: true,
      align: 'right',
      render: (value: number, row: Record<string, any>) => formatCurrency(value, row.currency),
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      render: (value: boolean) => getActiveBadge(value),
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
                router.push(`/${locale}/modules/production/products/${row.id}`);
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
                router.push(`/${locale}/modules/production/products/${row.id}/edit`);
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
  ], [t, tGlobal, getTypeBadge, getActiveBadge, formatCurrency, router, locale, handleDeleteClick]);

  if (isLoading) {
    return <DataTableSkeleton columns={10} rows={10} />;
  }

  if (error) {
    return <DataTableSkeleton columns={10} rows={5} />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        tableId="production-products-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/production"
        showColumnSettings={true}
        emptyMessage={t('products.noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/production/products/${row.id}`)}
        showAuditHistory={true}
        auditEntityName="Product"
        auditIdKey="id"
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('delete.title')}
        message={t('delete.confirm')}
        variant="danger"
        loading={deleteProduct.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
