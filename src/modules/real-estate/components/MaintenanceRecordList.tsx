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
  IconTools,
  IconCalendar,
} from '@tabler/icons-react';
import {
  useRealEstateMaintenanceRecords,
  useDeleteRealEstateMaintenanceRecord,
} from '@/hooks/useRealEstateMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/real-estate/types/maintenance-record';
import dayjs from 'dayjs';

interface MaintenanceRecordListProps {
  locale: string;
}

export function MaintenanceRecordList({ locale }: MaintenanceRecordListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | undefined>();
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useRealEstateMaintenanceRecords({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const deleteRecord = useDeleteRealEstateMaintenanceRecord();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteRecord.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('maintenance.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('maintenance.delete.error'),
      });
    }
  }, [deleteId, deleteRecord, t]);

  const getTypeBadge = useCallback((type: MaintenanceType) => {
    const typeColors: Record<MaintenanceType, string> = {
      preventive: 'blue',
      corrective: 'orange',
      emergency: 'red',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`maintenance.types.${type}`) || type}
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
        {t(`maintenance.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.records) return [];
    return data.records.map((record) => {
      const apartment = (record as any).apartment;
      return {
        id: record.id,
        record: record,
        title: record.title,
        description: record.description,
        apartment: apartment ? `${apartment.unitNumber} - ${apartment.property?.name || ''}` : '-',
        type: record.type,
        status: record.status,
        scheduledDate: record.scheduledDate,
        estimatedCost: record.estimatedCost,
      };
    });
  }, [data]);

  // Memoized render functions
  const renderTitle = useCallback((value: string, row: any) => (
    <Group gap="xs">
      <IconTools size={16} />
      <div>
        <Text size="sm" fw={500}>
          {value}
        </Text>
        {row.description && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {row.description}
          </Text>
        )}
      </div>
    </Group>
  ), []);

  const renderType = useCallback((value: MaintenanceType) => getTypeBadge(value), [getTypeBadge]);

  const renderStatus = useCallback((value: MaintenanceStatus) => getStatusBadge(value), [getStatusBadge]);

  const renderScheduledDate = useCallback((value: Date) => (
    <Group gap="xs">
      <IconCalendar size={14} />
      <Text size="sm">
        {dayjs(value).format('DD.MM.YYYY')}
      </Text>
    </Group>
  ), []);

  const renderEstimatedCost = useCallback((value: number | null) =>
    value
      ? new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        }).format(Number(value))
      : '-',
  []);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/maintenance/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/maintenance/${row.id}/edit`);
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
      key: 'title',
      label: t('table.title'),
      sortable: true,
      searchable: true,
      render: renderTitle,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'scheduledDate',
      label: t('table.scheduledDate'),
      sortable: true,
      searchable: false,
      render: renderScheduledDate,
    },
    {
      key: 'estimatedCost',
      label: t('table.estimatedCost'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderEstimatedCost,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderTitle, renderType, renderStatus, renderScheduledDate, renderEstimatedCost, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'preventive', label: t('maintenance.types.preventive') },
        { value: 'corrective', label: t('maintenance.types.corrective') },
        { value: 'emergency', label: t('maintenance.types.emergency') },
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'scheduled', label: t('maintenance.status.scheduled') },
        { value: 'in_progress', label: t('maintenance.status.in_progress') },
        { value: 'completed', label: t('maintenance.status.completed') },
        { value: 'cancelled', label: t('maintenance.status.cancelled') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.type) {
      setTypeFilter(filters.type as MaintenanceType);
    } else {
      setTypeFilter(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as MaintenanceStatus);
    } else {
      setStatusFilter(undefined);
    }
    
    setPage(1);
  }, []);


  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={8} />;
  }

  if (error) {
    return (
      <Alert color="red" title={t('common.errorLoading')}>
        {error instanceof Error ? error.message : t('common.errorLoading')}
      </Alert>
    );
  }

  if (!data) {
    return <Text>{t('common.noData')}</Text>;
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('maintenance.delete.title') || t('delete.title')}
        message={t('maintenance.delete.confirm')}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-maintenance"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noMaintenanceRecords')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('maintenance.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
