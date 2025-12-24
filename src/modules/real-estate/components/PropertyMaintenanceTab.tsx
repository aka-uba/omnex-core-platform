'use client';

import { useState, useMemo } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Loader,
  Center,
  Pagination,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTool,
  IconCalendar,
  IconHome,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { AlertModal } from '@/components/modals/AlertModal';
import {
  useRealEstateMaintenanceRecords,
  useCreateRealEstateMaintenance,
  useUpdateRealEstateMaintenance,
  useDeleteRealEstateMaintenance,
  type RealEstateMaintenanceRecord,
  type MaintenanceRecordCreateInput,
} from '@/hooks/useRealEstateMaintenance';
import { useApartments } from '@/hooks/useApartments';
import { useRealEstateStaff } from '@/hooks/useRealEstateStaff';
import { useCompany } from '@/context/CompanyContext';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';

interface PropertyMaintenanceTabProps {
  propertyId: string;
  propertyName?: string;
  locale: string;
}

interface FormData {
  apartmentId: string | null;
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
  apartmentId: null,
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

export function PropertyMaintenanceTab({
  propertyId,
  propertyName,
  locale,
}: PropertyMaintenanceTabProps) {
  const { t } = useTranslation('modules/real-estate');
  const { formatCurrency } = useCompany();

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editingRecord, setEditingRecord] = useState<RealEstateMaintenanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Queries - get all maintenance records for this property
  const { data, isLoading, refetch } = useRealEstateMaintenanceRecords({
    propertyId,
    page,
    pageSize,
  });

  // Get apartments for this property
  const { data: apartmentsData } = useApartments({ propertyId, pageSize: 1000 });
  const { data: staffData } = useRealEstateStaff({ pageSize: 1000 });

  // Mutations
  const createMutation = useCreateRealEstateMaintenance();
  const updateMutation = useUpdateRealEstateMaintenance();
  const deleteMutation = useDeleteRealEstateMaintenance();

  // Apartment options
  const apartmentOptions = useMemo(() => {
    if (!apartmentsData?.apartments) return [];
    return apartmentsData.apartments.map((a) => ({
      value: a.id,
      label: `${a.unitNumber}${a.floor ? ` (Kat: ${a.floor})` : ''}`,
    }));
  }, [apartmentsData]);

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
    { value: 'preventive', label: t('maintenance.types.preventive') || 'Preventive' },
    { value: 'corrective', label: t('maintenance.types.corrective') || 'Corrective' },
    { value: 'emergency', label: t('maintenance.types.emergency') || 'Emergency' },
  ];

  // Status options
  const statusOptions = [
    { value: 'scheduled', label: t('maintenance.status.scheduled') || 'Scheduled' },
    { value: 'in_progress', label: t('maintenance.status.in_progress') || 'In Progress' },
    { value: 'completed', label: t('maintenance.status.completed') || 'Completed' },
    { value: 'cancelled', label: t('maintenance.status.cancelled') || 'Cancelled' },
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
      apartmentId: record.apartmentId,
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
    if (!formData.apartmentId || !formData.title || !formData.scheduledDate) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('maintenance.validation.required') || 'Please fill required fields',
      });
      return;
    }

    try {
      const payload: MaintenanceRecordCreateInput = {
        apartmentId: formData.apartmentId,
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
          message: t('maintenance.updated') || 'Maintenance record updated',
        });
      } else {
        await createMutation.mutateAsync(payload);
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('maintenance.created') || 'Maintenance record created',
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
        message: t('maintenance.deleted') || 'Maintenance record deleted',
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

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <>
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconTool size={24} />
              <Text size="lg" fw={600}>
                {t('maintenance.title') || 'Maintenance Records'}
              </Text>
              {propertyName && (
                <Badge variant="light">{propertyName}</Badge>
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
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('maintenance.table.date') || 'Date'}</Table.Th>
                    <Table.Th>{t('apartments.title') || 'Apartment'}</Table.Th>
                    <Table.Th>{t('maintenance.table.type') || 'Type'}</Table.Th>
                    <Table.Th>{t('maintenance.table.title') || 'Title'}</Table.Th>
                    <Table.Th>{t('maintenance.table.status') || 'Status'}</Table.Th>
                    <Table.Th ta="right">{t('maintenance.table.cost') || 'Cost'}</Table.Th>
                    <Table.Th ta="center">{t('common.actions') || 'Actions'}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.records && data.records.length > 0 ? (
                    data.records.map((record) => (
                      <Table.Tr key={record.id}>
                        <Table.Td>
                          <Group gap={4}>
                            <IconCalendar size={14} />
                            {dayjs(record.scheduledDate).format('DD.MM.YYYY')}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconHome size={14} />
                            {record.apartment?.unitNumber || '-'}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getTypeColor(record.type)} size="sm">
                            {typeOptions.find((t) => t.value === record.type)?.label || record.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {record.title}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(record.status)} size="sm">
                            {statusOptions.find((s) => s.value === record.status)?.label || record.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="right">
                          {record.actualCost
                            ? formatCurrency(record.actualCost)
                            : record.estimatedCost
                            ? `~${formatCurrency(record.estimatedCost)}`
                            : '-'}
                        </Table.Td>
                        <Table.Td>
                          <Group justify="center" gap={4}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color="blue"
                              onClick={() => handleOpenEdit(record)}
                              title={t('common.edit')}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color="red"
                              onClick={() => handleOpenDelete(record.id)}
                              title={t('common.delete')}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center" py="xl">
                        <Stack align="center" gap="sm">
                          <IconTool size={48} color="gray" />
                          <Text c="dimmed">{t('maintenance.noData') || 'No maintenance records'}</Text>
                          <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={handleOpenCreate}
                          >
                            {t('maintenance.createFirst') || 'Create first record'}
                          </Button>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              {totalPages > 1 && (
                <Group justify="center">
                  <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingRecord ? t('maintenance.edit') || 'Edit Maintenance' : t('maintenance.create') || 'New Maintenance'}
        size="lg"
      >
        <Stack>
          <Select
            label={t('apartments.title') || 'Apartment'}
            data={apartmentOptions}
            value={formData.apartmentId}
            onChange={(value) => setFormData({ ...formData, apartmentId: value })}
            searchable
            required
            placeholder={t('maintenance.form.selectApartment') || 'Select apartment'}
          />
          <Select
            label={t('maintenance.form.type') || 'Type'}
            data={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as FormData['type'] })}
            required
          />
          <TextInput
            label={t('maintenance.form.title') || 'Title'}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
            required
          />
          <Textarea
            label={t('maintenance.form.description') || 'Description'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={2}
          />
          <Select
            label={t('maintenance.form.status') || 'Status'}
            data={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as FormData['status'] })}
            required
          />
          <DatePickerInput
            label={t('maintenance.form.scheduledDate') || 'Scheduled Date'}
            value={formData.scheduledDate}
            onChange={(value) => setFormData({ ...formData, scheduledDate: value })}
            required
          />
          <Group grow>
            <DatePickerInput
              label={t('maintenance.form.startDate') || 'Start Date'}
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              clearable
            />
            <DatePickerInput
              label={t('maintenance.form.endDate') || 'End Date'}
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
              clearable
            />
          </Group>
          <Select
            label={t('maintenance.form.assignedStaff') || 'Assigned Staff'}
            data={staffOptions}
            value={formData.assignedStaffId}
            onChange={(value) => setFormData({ ...formData, assignedStaffId: value })}
            clearable
            searchable
          />
          <Group grow>
            <NumberInput
              label={t('maintenance.form.estimatedCost') || 'Estimated Cost'}
              value={formData.estimatedCost || ''}
              onChange={(value) => setFormData({ ...formData, estimatedCost: Number(value) || null })}
              min={0}
              decimalScale={2}
            />
            <NumberInput
              label={t('maintenance.form.actualCost') || 'Actual Cost'}
              value={formData.actualCost || ''}
              onChange={(value) => setFormData({ ...formData, actualCost: Number(value) || null })}
              min={0}
              decimalScale={2}
            />
          </Group>
          <Textarea
            label={t('maintenance.form.notes') || 'Notes'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
            rows={2}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRecord ? t('common.save') || 'Save' : t('common.create') || 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={deleteOpened}
        onClose={closeDelete}
        title={t('maintenance.delete.title') || 'Delete Maintenance Record'}
        message={t('maintenance.delete.confirm') || 'Are you sure you want to delete this record?'}
        confirmLabel={t('actions.delete') || 'Delete'}
        cancelLabel={t('actions.cancel') || 'Cancel'}
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
