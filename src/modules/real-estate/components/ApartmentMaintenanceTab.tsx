'use client';

import { useState, useMemo } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Loader,
  Center,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTool,
  IconCalendar,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { AlertModal } from '@/components/modals/AlertModal';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import {
  useRealEstateMaintenanceRecords,
  useCreateRealEstateMaintenance,
  useUpdateRealEstateMaintenance,
  useDeleteRealEstateMaintenance,
  type RealEstateMaintenanceRecord,
  type MaintenanceRecordCreateInput,
} from '@/hooks/useRealEstateMaintenance';
import { useRealEstateStaff } from '@/hooks/useRealEstateStaff';
import { useCompany } from '@/context/CompanyContext';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';

interface ApartmentMaintenanceTabProps {
  apartmentId: string;
  apartmentUnitNumber?: string;
  locale: string;
}

interface FormData {
  type: 'preventive' | 'corrective' | 'emergency';
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  assignedStaffId: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  notes: string;
}

const initialFormData: FormData = {
  type: 'corrective',
  title: '',
  description: '',
  status: 'scheduled',
  scheduledDate: new Date(),
  startDate: null,
  endDate: null,
  assignedStaffId: null,
  estimatedCost: null,
  actualCost: null,
  notes: '',
};

export function ApartmentMaintenanceTab({
  apartmentId,
  apartmentUnitNumber,
  locale,
}: ApartmentMaintenanceTabProps) {
  const { t } = useTranslation('modules/real-estate');
  const { formatCurrency } = useCompany();

  // State
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editingRecord, setEditingRecord] = useState<RealEstateMaintenanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Queries - fetch all records for DataTable to handle pagination
  const { data, isLoading, refetch } = useRealEstateMaintenanceRecords({
    apartmentId,
    page: 1,
    pageSize: 1000, // Let DataTable handle pagination
  });

  const { data: staffData } = useRealEstateStaff({ pageSize: 1000 });

  // Mutations
  const createMutation = useCreateRealEstateMaintenance();
  const updateMutation = useUpdateRealEstateMaintenance();
  const deleteMutation = useDeleteRealEstateMaintenance();

  // Staff options for select
  const staffOptions = useMemo(() => {
    if (!staffData?.staff) return [];
    return staffData.staff.map((s) => ({
      value: s.id,
      label: s.name,
    }));
  }, [staffData]);

  // Type options
  const typeOptions = [
    { value: 'preventive', label: t('maintenance.types.preventive') },
    { value: 'corrective', label: t('maintenance.types.corrective') },
    { value: 'emergency', label: t('maintenance.types.emergency') },
  ];

  // Status options
  const statusOptions = [
    { value: 'scheduled', label: t('maintenance.status.scheduled') },
    { value: 'in_progress', label: t('maintenance.status.in_progress') },
    { value: 'completed', label: t('maintenance.status.completed') },
    { value: 'cancelled', label: t('maintenance.status.cancelled') },
  ];

  // Handlers
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData(initialFormData);
    open();
  };

  const handleOpenEdit = (record: RealEstateMaintenanceRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      title: record.title,
      description: record.description || '',
      status: record.status,
      scheduledDate: new Date(record.scheduledDate),
      startDate: record.startDate ? new Date(record.startDate) : null,
      endDate: record.endDate ? new Date(record.endDate) : null,
      assignedStaffId: record.assignedStaffId || null,
      estimatedCost: record.estimatedCost || null,
      actualCost: record.actualCost || null,
      notes: record.notes || '',
    });
    open();
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    openDelete();
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.scheduledDate) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('maintenance.validation.required'),
      });
      return;
    }

    try {
      const payload: MaintenanceRecordCreateInput = {
        apartmentId,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        scheduledDate: formData.scheduledDate.toISOString(),
        startDate: formData.startDate?.toISOString() || null,
        endDate: formData.endDate?.toISOString() || null,
        assignedStaffId: formData.assignedStaffId || null,
        estimatedCost: formData.estimatedCost || null,
        actualCost: formData.actualCost || null,
        notes: formData.notes || null,
      };

      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, ...payload });
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('maintenance.updated'),
        });
      } else {
        await createMutation.mutateAsync(payload);
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('maintenance.created'),
        });
      }
      close();
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      showToast({
        type: 'success',
        title: t('common.success'),
        message: t('maintenance.deleted'),
      });
      closeDelete();
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message,
      });
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'blue';
      case 'in_progress':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'cyan';
      case 'corrective':
        return 'orange';
      case 'emergency':
        return 'red';
      default:
        return 'gray';
    }
  };

  // DataTable columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'title',
      label: t('maintenance.table.title'),
      sortable: true,
      searchable: true,
      render: (value: string) => (
        <Text size="sm" fw={500} lineClamp={1}>
          {value}
        </Text>
      ),
    },
    {
      key: 'scheduledDate',
      label: t('maintenance.table.date'),
      sortable: true,
      render: (value: string) => (
        <Group gap={4}>
          <IconCalendar size={14} />
          <Text size="sm">{dayjs(value).format('DD.MM.YYYY')}</Text>
        </Group>
      ),
    },
    {
      key: 'type',
      label: t('maintenance.table.type'),
      sortable: true,
      render: (value: string) => (
        <Badge color={getTypeColor(value)} size="sm">
          {typeOptions.find((opt) => opt.value === value)?.label || value}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('maintenance.table.status'),
      sortable: true,
      render: (value: string) => (
        <Badge color={getStatusColor(value)} size="sm">
          {statusOptions.find((opt) => opt.value === value)?.label || value}
        </Badge>
      ),
    },
    {
      key: 'cost',
      label: t('maintenance.table.cost'),
      align: 'right' as const,
      render: (_: any, row: RealEstateMaintenanceRecord) => (
        <Text size="sm">
          {row.actualCost
            ? formatCurrency(row.actualCost)
            : row.estimatedCost
            ? `~${formatCurrency(row.estimatedCost)}`
            : '-'}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      align: 'right' as const,
      sortable: false,
      render: (_: any, row: RealEstateMaintenanceRecord) => (
        <Group justify="flex-end" gap={4}>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            title={t('actions.edit')}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDelete(row.id);
            }}
            title={t('actions.delete')}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ], [t, formatCurrency, typeOptions, statusOptions]);

  // Table data
  const tableData = useMemo(() => {
    return data?.records || [];
  }, [data]);

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconTool size={24} />
            <Text size="lg" fw={600}>
              {t('maintenance.title')}
            </Text>
            {apartmentUnitNumber && (
              <Badge variant="light">{apartmentUnitNumber}</Badge>
            )}
          </Group>
          <Button
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreate}
          >
            {t('maintenance.create.title')}
          </Button>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : tableData.length === 0 ? (
          <Paper shadow="xs" p="xl">
            <Stack align="center" gap="sm">
              <IconTool size={48} color="gray" />
              <Text c="dimmed">{t('maintenance.noData')}</Text>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={handleOpenCreate}
              >
                {t('maintenance.createFirst')}
              </Button>
            </Stack>
          </Paper>
        ) : (
          <DataTable
            columns={columns}
            data={tableData}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            emptyMessage={t('maintenance.noData')}
            showColumnSettings={false}
            showRowNumbers={false}
          />
        )}
      </Stack>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingRecord ? t('maintenance.edit') : t('maintenance.create')}
        size="lg"
      >
        <Stack>
          <Select
            label={t('maintenance.form.type')}
            data={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as FormData['type'] })}
            required
          />
          <TextInput
            label={t('maintenance.form.title')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
            required
          />
          <Textarea
            label={t('maintenance.form.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={2}
          />
          <Select
            label={t('maintenance.form.status')}
            data={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as FormData['status'] })}
            required
          />
          <DatePickerInput
            label={t('maintenance.form.scheduledDate')}
            value={formData.scheduledDate}
            onChange={(value) => setFormData({ ...formData, scheduledDate: value })}
            required
          />
          <Group grow>
            <DatePickerInput
              label={t('maintenance.form.startDate')}
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              clearable
            />
            <DatePickerInput
              label={t('maintenance.form.endDate')}
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
              clearable
            />
          </Group>
          <Select
            label={t('maintenance.form.assignedStaff')}
            data={staffOptions}
            value={formData.assignedStaffId}
            onChange={(value) => setFormData({ ...formData, assignedStaffId: value })}
            clearable
            searchable
          />
          <Group grow>
            <NumberInput
              label={t('maintenance.form.estimatedCost')}
              value={formData.estimatedCost || ''}
              onChange={(value) => setFormData({ ...formData, estimatedCost: Number(value) || null })}
              min={0}
              decimalScale={2}
            />
            <NumberInput
              label={t('maintenance.form.actualCost')}
              value={formData.actualCost || ''}
              onChange={(value) => setFormData({ ...formData, actualCost: Number(value) || null })}
              min={0}
              decimalScale={2}
            />
          </Group>
          <Textarea
            label={t('maintenance.form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
            rows={2}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRecord ? t('actions.save') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={deleteOpened}
        onClose={closeDelete}
        title={t('maintenance.delete.title')}
        message={t('maintenance.delete.confirm')}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
