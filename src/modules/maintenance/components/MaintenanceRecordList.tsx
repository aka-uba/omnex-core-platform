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
import { useMaintenanceRecords, useDeleteMaintenanceRecord } from '@/hooks/useMaintenanceRecords';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/maintenance/types/maintenance';
import dayjs from 'dayjs';

interface MaintenanceRecordListProps {
  locale: string;
}

export function MaintenanceRecordList({ locale }: MaintenanceRecordListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/maintenance');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | undefined>();
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | undefined>();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();

  const { data, isLoading, error } = useMaintenanceRecords({
    page: 1,
    pageSize: 1000,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(locationFilter ? { locationId: locationFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  // Fetch locations for filter
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteRecord = useDeleteMaintenanceRecord();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteRecord.mutateAsync(deleteId);
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
  }, [deleteId, deleteRecord, t, tGlobal]);

  const getTypeBadge = useCallback((type: MaintenanceType) => {
    const typeColors: Record<MaintenanceType, string> = {
      preventive: 'blue',
      corrective: 'orange',
      emergency: 'red',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: MaintenanceStatus) => {
    const statusColors: Record<MaintenanceStatus, string> = {
      scheduled: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const formatCurrency = useCallback((value: number | null) => {
    if (!value) return '-';
    return Number(value).toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    });
  }, []);

  const records = useMemo(() => data?.records || [], [data]);

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
      key: 'type',
      label: t('table.type'),
      type: 'select',
      options: [
        { value: 'preventive', label: t('types.preventive') },
        { value: 'corrective', label: t('types.corrective') },
        { value: 'emergency', label: t('types.emergency') },
      ],
    },
    {
      key: 'status',
      label: t('table.status'),
      type: 'select',
      options: [
        { value: 'scheduled', label: t('status.scheduled') },
        { value: 'in_progress', label: t('status.in_progress') },
        { value: 'completed', label: t('status.completed') },
        { value: 'cancelled', label: t('status.cancelled') },
      ],
    },
    {
      key: 'locationId',
      label: t('table.location'),
      type: 'select',
      options: locationOptions,
    },
    {
      key: 'isActive',
      label: tGlobal('status.title'),
      type: 'select',
      options: [
        { value: 'true', label: tGlobal('status.active') },
        { value: 'false', label: tGlobal('status.inactive') },
      ],
    },
  ], [t, tGlobal, locationOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setTypeFilter(filters.type as MaintenanceType || undefined);
    setStatusFilter(filters.status as MaintenanceStatus || undefined);
    setLocationFilter(filters.locationId || undefined);
    setIsActiveFilter(filters.isActive ? filters.isActive === 'true' : undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'title',
      label: t('table.title'),
      sortable: true,
      searchable: true,
      render: (value: string, row: Record<string, any>) => (
        <>
          <Text fw={500}>{value}</Text>
          {row.description && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {row.description}
            </Text>
          )}
        </>
      ),
    },
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      render: (value: MaintenanceType) => getTypeBadge(value),
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      render: (value: MaintenanceStatus) => getStatusBadge(value),
    },
    {
      key: 'locationName',
      label: t('table.location'),
      sortable: true,
      render: (_value: string, row: Record<string, any>) => row.location?.name || '-',
    },
    {
      key: 'equipmentName',
      label: t('table.equipment'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) => row.equipment?.name || '-',
    },
    {
      key: 'scheduledDate',
      label: t('table.scheduledDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'estimatedCost',
      label: t('table.estimatedCost'),
      sortable: true,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'isActive',
      label: tGlobal('status.title'),
      sortable: true,
      render: (value: boolean) => (
        <Badge color={value ? 'green' : 'gray'}>
          {value ? tGlobal('status.active') : tGlobal('status.inactive')}
        </Badge>
      ),
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
                router.push(`/${locale}/modules/maintenance/records/${row.id}`);
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
                router.push(`/${locale}/modules/maintenance/records/${row.id}/edit`);
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
  ], [t, tGlobal, getTypeBadge, getStatusBadge, formatCurrency, router, locale, handleDeleteClick]);

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
        data={records}
        tableId="maintenance-records-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/maintenance"
        showColumnSettings={true}
        emptyMessage={t('noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/maintenance/records/${row.id}`)}
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('delete.title')}
        message={t('delete.confirm')}
        variant="danger"
        loading={deleteRecord.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
