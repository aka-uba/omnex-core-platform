'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Image,
  HoverCard,
  Box,
  Alert,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconBuilding,
} from '@tabler/icons-react';
import { useProperties, useDeleteProperty } from '@/hooks/useProperties';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { PropertyType } from '@/modules/real-estate/types/property';

interface PropertyListProps {
  locale: string;
}

export function PropertyList({ locale }: PropertyListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<PropertyType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useProperties({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteProperty = useDeleteProperty();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteProperty.mutateAsync(deleteId);
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
  }, [deleteId, deleteProperty, t]);

  const getTypeBadge = useCallback((type: PropertyType) => {
    const typeColors: Record<PropertyType, string> = {
      apartment: 'blue',
      complex: 'green',
      building: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.properties) return [];
    return data.properties.map((property) => ({
      id: property.id,
      preview: property,
      name: property.name,
      type: property.type,
      propertyNumber: (property as any).propertyNumber || '-',
      address: property.address,
      city: property.city,
      units: property.totalUnits,
      status: property.isActive,
    }));
  }, [data]);

  // Memoized render functions
  const renderPreview = useCallback((value: any, row: any) => {
    const property = row.preview;
    const coverImageUrl = property.coverImage 
      ? `/api/core-files/${property.coverImage}/download`
      : property.images && property.images.length > 0
      ? `/api/core-files/${property.images[0]}/download`
      : null;

    return coverImageUrl ? (
      <HoverCard 
        width={300} 
        shadow="md" 
        openDelay={200} 
        closeDelay={100}
        position="bottom"
        offset={8}
        withArrow
        arrowSize={8}
        withinPortal
      >
        <HoverCard.Target>
          <Box
            style={{
              width: 60,
              height: 60,
              minWidth: 60,
              minHeight: 60,
              maxWidth: 60,
              maxHeight: 60,
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={coverImageUrl}
              alt={property.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                minWidth: '100%',
                minHeight: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              fallbackSrc="https://placehold.co/60x60?text=No+Image"
            />
          </Box>
        </HoverCard.Target>
        <HoverCard.Dropdown style={{ zIndex: 1000 }}>
          <Box p={6}>
            <Text size="sm" fw={500} mb={4}>
              {property.name}
            </Text>
            <Image
              src={coverImageUrl}
              alt={property.name}
              width="100%"
              height={220}
              fit="cover"
              radius="sm"
              fallbackSrc="https://placehold.co/300x220?text=No+Image"
            />
          </Box>
        </HoverCard.Dropdown>
      </HoverCard>
    ) : (
      <Box
        style={{
          width: 60,
          height: 60,
          borderRadius: 'var(--mantine-radius-sm)',
          backgroundColor: 'var(--mantine-color-gray-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconBuilding size={24} color="var(--mantine-color-gray-6)" />
      </Box>
    );
  }, []);

  const renderName = useCallback((value: string) => (
    <Group gap="xs">
      <IconBuilding size={16} />
      <Text fw={500}>{value}</Text>
    </Group>
  ), []);

  const renderType = useCallback((value: PropertyType) => getTypeBadge(value), [getTypeBadge]);

  const renderStatus = useCallback((value: boolean) => getStatusBadge(value), [getStatusBadge]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/properties/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/properties/${row.id}/edit`);
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
      key: 'preview',
      label: t('table.preview'),
      sortable: false,
      searchable: false,
      render: renderPreview,
    },
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      searchable: true,
      render: renderName,
    },
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'propertyNumber',
      label: t('table.propertyNumber'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'address',
      label: t('table.address'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'city',
      label: t('table.city'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'units',
      label: t('table.units'),
      sortable: true,
      searchable: false,
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
  ], [t, renderPreview, renderName, renderType, renderStatus, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'apartment', label: t('types.apartment') },
        { value: 'complex', label: t('types.complex') },
        { value: 'building', label: t('types.building') },
      ],
    },
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
    if (filters.type) {
      setTypeFilter(filters.type as PropertyType);
    } else {
      setTypeFilter(undefined);
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
        title={t('properties.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('delete.confirm')}
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
        emptyMessage={t('table.noProperties')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('properties.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
