'use client';

import { useState, useMemo, useCallback } from 'react';
import { Container, Stack, Badge, Group, Text, ActionIcon, Button, Alert } from '@mantine/core';
import { IconClock, IconPlus, IconEye, IconEdit, IconTrash, IconRefresh, IconCheck, IconX, IconClockPause } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AppointmentModal, Appointment } from '@/components/calendar/AppointmentModal';
import { AlertModal } from '@/components/modals/AlertModal';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useAppointmentReminders } from '@/hooks/useAppointmentReminders';
import dayjs from 'dayjs';

interface AppointmentData extends Appointment {
  id: string;
  createdAt: string;
}

export default function CalendarAppointmentsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/calendar');
  const { t: tGlobal } = useTranslation('global');
  const queryClient = useQueryClient();

  const [statusFilter] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<AppointmentData[]>({
    queryKey: ['appointments', statusFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetchWithAuth(`/api/calendar/appointments?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const response = await fetchWithAuth('/api/calendar/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showToast({
        type: 'success',
        title: t('messages.createSuccess'),
        message: '',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: '',
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetchWithAuth('/api/calendar/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showToast({
        type: 'success',
        title: t('messages.updateSuccess'),
        message: '',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: '',
      });
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const appointments = data || [];

  useAppointmentReminders(appointments.map(apt => ({
    ...apt,
    date: typeof apt.date === 'string' ? apt.date : apt.date.toISOString(),
  })));

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'yellow', label: t('appointments.status.pending') },
      confirmed: { color: 'green', label: t('appointments.status.confirmed') },
      cancelled: { color: 'red', label: t('appointments.status.cancelled') },
      completed: { color: 'blue', label: t('appointments.status.completed') },
    };
    const config = statusConfig[status] || { color: 'gray', label: status };
    return (
      <Badge color={config.color} variant="light">
        {config.label}
      </Badge>
    );
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...appointment }: Appointment & { id: string }) => {
      const response = await fetchWithAuth(`/api/calendar/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showToast({
        type: 'success',
        title: t('messages.updateSuccess'),
        message: '',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`/api/calendar/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showToast({
        type: 'success',
        title: t('messages.deleteSuccess'),
        message: '',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: '',
      });
    },
  });

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteModalOpened(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteMutation]);

  const handleSubmitAppointment = (appointment: Omit<Appointment, 'id'>) => {
    if (editingAppointment?.id) {
      updateMutation.mutate({ id: editingAppointment.id, ...appointment });
    } else {
      createMutation.mutate(appointment);
    }
  };

  const handleViewClick = (appointment: AppointmentData) => {
    setEditingAppointment(appointment);
    setViewMode(true);
    setModalOpened(true);
  };

  const handleEditClick = (appointment: AppointmentData) => {
    setEditingAppointment(appointment);
    setViewMode(false);
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setEditingAppointment(null);
    setViewMode(false);
  };

  const handleSwitchToEdit = () => {
    setViewMode(false);
    setModalOpened(true);
  };

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'title',
      label: t('appointments.table.title'),
      sortable: true,
      render: (value: string) => (
        <Text fw={500}>{value}</Text>
      ),
    },
    {
      key: 'clientName',
      label: t('appointments.table.client'),
      sortable: true,
      render: (value: string) => (
        <Text size="sm" c={value ? undefined : 'dimmed'}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'date',
      label: t('appointments.table.date'),
      sortable: true,
      render: (value: string) => (
        <Text size="sm">
          {dayjs(value).format('DD.MM.YYYY')}
        </Text>
      ),
    },
    {
      key: 'time',
      label: t('appointments.table.time'),
      sortable: true,
      render: (value: string) => (
        <Text size="sm" c={value ? undefined : 'dimmed'}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'duration',
      label: t('appointments.table.duration'),
      sortable: true,
      render: (value: number) => (
        <Text size="sm" c={value ? undefined : 'dimmed'}>
          {value ? `${value} dk` : '-'}
        </Text>
      ),
    },
    {
      key: 'status',
      label: t('appointments.table.status'),
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'actions',
      label: t('appointments.table.actions'),
      sortable: false,
      render: (_: unknown, row: AppointmentData) => (
        <Group gap="xs" justify="flex-end">
          {row.status !== 'completed' && (
            <ActionIcon
              variant="subtle"
              color="teal"
              onClick={() => handleStatusChange(row.id, 'completed')}
              title={t('appointments.status.completed')}
              loading={statusMutation.isPending}
            >
              <IconCheck size={16} />
            </ActionIcon>
          )}
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => handleStatusChange(row.id, 'cancelled')}
              title={t('appointments.status.cancelled')}
              loading={statusMutation.isPending}
            >
              <IconX size={16} />
            </ActionIcon>
          )}
          {row.status === 'pending' && (
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={() => handleStatusChange(row.id, 'confirmed')}
              title={t('appointments.status.confirmed')}
              loading={statusMutation.isPending}
            >
              <IconClockPause size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleViewClick(row)}
            title={t('actions.view')}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="yellow"
            onClick={() => handleEditClick(row)}
            title={t('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDeleteClick(row.id)}
            title={t('actions.delete')}
            loading={deleteMutation.isPending}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ], [t, statusMutation.isPending, deleteMutation.isPending, handleDeleteClick]);

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('appointments.title')}
        description={t('appointments.description')}
        namespace="modules/calendar"
        icon={<IconClock size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/calendar/dashboard`, namespace: 'modules/calendar' },
          { label: 'appointments.title', namespace: 'modules/calendar' },
        ]}
        actions={[
          {
            label: 'actions.refresh',
            icon: <IconRefresh size={18} />,
            onClick: () => refetch(),
            variant: 'light',
          },
          {
            label: 'actions.createAppointment',
            icon: <IconPlus size={18} />,
            onClick: () => setModalOpened(true),
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        {isLoading ? (
          <DataTableSkeleton columns={7} rows={8} />
        ) : error ? (
          <Alert color="red" title={t('messages.error')}>
            {error instanceof Error ? error.message : t('messages.error')}
          </Alert>
        ) : appointments.length === 0 ? (
          <Alert color="blue" title={t('appointments.empty')}>
            <Group mt="md">
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setModalOpened(true)}
              >
                {t('appointments.createNew')}
              </Button>
            </Group>
          </Alert>
        ) : (
          <DataTable
            data={appointments}
            columns={columns}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            emptyMessage={t('appointments.empty')}
            showAuditHistory={true}
            auditEntityName="Appointment"
            auditIdKey="id"
          />
        )}
      </Stack>

      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('appointments.delete.title') || tGlobal('common.delete')}
        message={t('appointments.delete.confirm') || t('messages.deleteConfirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      <AppointmentModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={handleSubmitAppointment}
        initialAppointment={editingAppointment ? {
          ...editingAppointment,
          date: new Date(editingAppointment.date),
        } : undefined}
        loading={createMutation.isPending || updateMutation.isPending}
        viewMode={viewMode}
        onEdit={handleSwitchToEdit}
      />
    </Container>
  );
}
