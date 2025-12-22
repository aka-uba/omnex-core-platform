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
  IconCalendar,
  IconCheck,
} from '@tabler/icons-react';
import { useAppointments, useDeleteAppointment, useMarkAppointmentAsCompleted } from '@/hooks/useAppointments';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { AppointmentType, AppointmentStatus } from '@/modules/real-estate/types/appointment';
import dayjs from 'dayjs';

interface AppointmentListProps {
  locale: string;
}

export function AppointmentList({ locale }: AppointmentListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [apartmentId, setApartmentId] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<AppointmentType | undefined>();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useAppointments({
    page,
    pageSize,
    ...(apartmentId ? { apartmentId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch apartments for filter
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });

  const deleteAppointment = useDeleteAppointment();
  const markAsCompleted = useMarkAppointmentAsCompleted();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteAppointment.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('appointments.delete.success') || t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('appointments.delete.error') || t('delete.error'),
      });
    }
  }, [deleteId, deleteAppointment, t]);

  const handleMarkAsCompleted = useCallback(async (id: string) => {
    try {
      await markAsCompleted.mutateAsync({ id });
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('appointments.markedAsCompleted'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('appointments.markAsCompletedError'),
      });
    }
  }, [markAsCompleted, t]);

  const getTypeBadge = useCallback((type: AppointmentType) => {
    const typeColors: Record<AppointmentType, string> = {
      viewing: 'blue',
      delivery: 'green',
      maintenance: 'orange',
      inspection: 'purple',
      meeting: 'cyan',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`appointments.types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: AppointmentStatus) => {
    const statusColors: Record<AppointmentStatus, string> = {
      scheduled: 'blue',
      completed: 'green',
      cancelled: 'red',
      no_show: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`appointments.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.appointments) return [];
    return data.appointments.map((appointment) => ({
      id: appointment.id,
      appointment: appointment,
      type: appointment.type,
      title: appointment.title,
      apartment: appointment.apartment?.unitNumber || '-',
      startDate: appointment.startDate,
      endDate: appointment.endDate,
      status: appointment.status,
    }));
  }, [data]);

  // Memoized render functions
  const renderType = useCallback((value: AppointmentType) => getTypeBadge(value), [getTypeBadge]);

  const renderStartDate = useCallback((value: Date) => (
    <Group gap="xs">
      <IconCalendar size={14} />
      <Text size="sm">
        {dayjs(value).format('DD.MM.YYYY HH:mm')}
      </Text>
    </Group>
  ), []);

  const renderEndDate = useCallback((value: Date) => (
    <Group gap="xs">
      <IconCalendar size={14} />
      <Text size="sm">
        {dayjs(value).format('DD.MM.YYYY HH:mm')}
      </Text>
    </Group>
  ), []);

  const renderStatus = useCallback((value: AppointmentStatus) => getStatusBadge(value), [getStatusBadge]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/appointments/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/appointments/${row.id}/edit`);
          }}
        >
          <IconEdit size={18} />
        </ActionIcon>
      </Tooltip>
      {row.status === 'scheduled' && (
        <Tooltip label={t('appointments.markAsCompleted')} withArrow>
          <ActionIcon
            variant="subtle"
            color="green"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsCompleted(row.id);
            }}
          >
            <IconCheck size={18} />
          </ActionIcon>
        </Tooltip>
      )}
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
  ), [router, locale, handleMarkAsCompleted, handleDeleteClick, t]);

  // Define columns with memoization
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'title',
      label: t('table.title'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'startDate',
      label: t('table.startDate'),
      sortable: true,
      searchable: false,
      render: renderStartDate,
    },
    {
      key: 'endDate',
      label: t('table.endDate'),
      sortable: true,
      searchable: false,
      render: renderEndDate,
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
  ], [t, renderType, renderStartDate, renderEndDate, renderStatus, renderActions]);

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
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'viewing', label: t('appointments.types.viewing') },
        { value: 'delivery', label: t('appointments.types.delivery') },
        { value: 'maintenance', label: t('appointments.types.maintenance') },
        { value: 'inspection', label: t('appointments.types.inspection') },
        { value: 'meeting', label: t('appointments.types.meeting') },
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'scheduled', label: t('appointments.status.scheduled') },
        { value: 'completed', label: t('appointments.status.completed') },
        { value: 'cancelled', label: t('appointments.status.cancelled') },
        { value: 'no_show', label: t('appointments.status.no_show') },
      ],
    },
  ], [t, apartmentsData]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.apartmentId) {
      setApartmentId(filters.apartmentId);
    } else {
      setApartmentId(undefined);
    }
    
    if (filters.type) {
      setTypeFilter(filters.type as AppointmentType);
    } else {
      setTypeFilter(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as AppointmentStatus);
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
        title={t('appointments.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('appointments.delete.confirm') || t('delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-appointments"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noAppointments')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('appointments.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
