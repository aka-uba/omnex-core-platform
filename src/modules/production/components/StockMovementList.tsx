'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Badge,
  Text,
} from '@mantine/core';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import type { StockMovementType } from '@/modules/production/types/product';
import dayjs from 'dayjs';

interface StockMovementListProps {
  locale: string;
}

export function StockMovementList({ locale: _locale }: StockMovementListProps) {
  const { t } = useTranslation('modules/production');
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<StockMovementType | undefined>();

  const { data, isLoading, error } = useStockMovements({
    page: 1,
    pageSize: 1000,
    ...(productFilter ? { productId: productFilter } : {}),
    ...(locationFilter ? { locationId: locationFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  // Fetch products and locations for filters
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const getTypeBadge = useCallback((type: StockMovementType) => {
    const typeColors: Record<StockMovementType, string> = {
      in: 'green',
      out: 'red',
      transfer: 'blue',
      adjustment: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`stock.types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const movements = useMemo(() => data?.movements || [], [data]);

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
      label: t('stock.table.product'),
      type: 'select',
      options: productOptions,
    },
    {
      key: 'locationId',
      label: t('stock.table.location'),
      type: 'select',
      options: locationOptions,
    },
    {
      key: 'type',
      label: t('stock.table.type'),
      type: 'select',
      options: [
        { value: 'in', label: t('stock.types.in') },
        { value: 'out', label: t('stock.types.out') },
        { value: 'transfer', label: t('stock.types.transfer') },
        { value: 'adjustment', label: t('stock.types.adjustment') },
      ],
    },
  ], [t, productOptions, locationOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setProductFilter(filters.productId || undefined);
    setLocationFilter(filters.locationId || undefined);
    setTypeFilter(filters.type as StockMovementType || undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'productName',
      label: t('stock.table.product'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) => (
        <Text fw={500}>{row.product?.name || '-'}</Text>
      ),
    },
    {
      key: 'locationName',
      label: t('stock.table.location'),
      sortable: true,
      render: (_value: string, row: Record<string, any>) => row.location?.name || '-',
    },
    {
      key: 'type',
      label: t('stock.table.type'),
      sortable: true,
      render: (value: StockMovementType) => getTypeBadge(value),
    },
    {
      key: 'quantity',
      label: t('stock.table.quantity'),
      sortable: true,
      align: 'right',
      render: (value: number) => Number(value).toLocaleString('tr-TR'),
    },
    {
      key: 'unit',
      label: t('stock.table.unit'),
      sortable: true,
    },
    {
      key: 'movementDate',
      label: t('stock.table.movementDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      key: 'referenceType',
      label: t('stock.table.referenceType'),
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'notes',
      label: t('stock.table.notes'),
      render: (value: string) => value || '-',
    },
  ], [t, getTypeBadge]);

  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={10} />;
  }

  if (error) {
    return <DataTableSkeleton columns={8} rows={5} />;
  }

  return (
    <DataTable
      columns={columns}
      data={movements}
      tableId="production-stock-movements-list"
      searchable={true}
      sortable={true}
      pageable={true}
      defaultPageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      showExportIcons={true}
      exportNamespace="modules/production"
      showColumnSettings={true}
      emptyMessage={t('stock.noData')}
      filters={filterOptions}
      onFilter={handleFilter}
    />
  );
}
