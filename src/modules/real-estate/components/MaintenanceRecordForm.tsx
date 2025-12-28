'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Grid,
  Group,
  NumberInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  useRealEstateMaintenanceRecord,
  useCreateRealEstateMaintenanceRecord,
  useUpdateRealEstateMaintenanceRecord,
} from '@/hooks/useRealEstateMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { MaintenanceType, MaintenanceStatus, RealEstateMaintenanceRecordUpdateInput } from '@/modules/real-estate/types/maintenance-record';
import { useApartments } from '@/hooks/useApartments';
import { useRealEstateStaff } from '@/hooks/useRealEstateStaff';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface MaintenanceRecordFormProps {
  locale: string;
  recordId?: string;
  apartmentId?: string;
}

export function MaintenanceRecordForm({ locale, recordId, apartmentId }: MaintenanceRecordFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { data: record, isLoading: isLoadingRecord } = useRealEstateMaintenanceRecord(recordId || '');
  const createRecord = useCreateRealEstateMaintenanceRecord();
  const updateRecord = useUpdateRealEstateMaintenanceRecord();

  // Fetch related data
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: staffData } = useRealEstateStaff({ page: 1, pageSize: 1000, isActive: true });

  // File manager for documents and photos
  const { files } = useCoreFileManager({
    tenantId: 'temp-tenant-id', // TODO: Get from auth context
    module: 'real-estate',
    entityType: 'maintenance-record',
    ...(recordId ? { entityId: recordId } : {}),
    userId: 'temp-user-id', // TODO: Get from auth context
    enabled: !!recordId, // Only load files when editing
  });

  const form = useForm({
    initialValues: {
      apartmentId: apartmentId || '',
      type: 'preventive' as MaintenanceType,
      title: '',
      description: '',
      status: 'scheduled' as MaintenanceStatus,
      scheduledDate: new Date(),
      startDate: null as Date | null,
      endDate: null as Date | null,
      assignedStaffId: '',
      performedByStaffId: '',
      estimatedCost: 0,
      actualCost: 0,
      notes: '',
    },
    validate: {
      apartmentId: (value) => (!value ? t('form.required') : null),
      title: (value) => (!value ? t('form.required') : null),
      type: (value) => (!value ? t('form.required') : null),
      scheduledDate: (value) => (!value ? t('form.required') : null),
    },
  });

  // Load record data if editing
  useEffect(() => {
    if (record) {
      form.setValues({
        apartmentId: (record as any).apartmentId || '',
        type: record.type,
        title: record.title,
        description: record.description || '',
        status: record.status,
        scheduledDate: new Date(record.scheduledDate),
        startDate: record.startDate ? new Date(record.startDate) : null,
        endDate: record.endDate ? new Date(record.endDate) : null,
        assignedStaffId: (record as any).assignedStaffId || '',
        performedByStaffId: (record as any).performedByStaffId || '',
        estimatedCost: record.estimatedCost ? Number(record.estimatedCost) : 0,
        actualCost: record.actualCost ? Number(record.actualCost) : 0,
        notes: record.notes || '',
      });
    }
  }, [record]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const input: RealEstateMaintenanceRecordUpdateInput = {
        apartmentId: values.apartmentId,
        type: values.type,
        title: values.title,
        ...(values.description ? { description: values.description } : {}),
        status: values.status,
        scheduledDate: values.scheduledDate,
        ...(values.startDate ? { startDate: values.startDate } : {}),
        ...(values.endDate ? { endDate: values.endDate } : {}),
        ...(values.assignedStaffId ? { assignedStaffId: values.assignedStaffId } : {}),
        ...(values.performedByStaffId ? { performedByStaffId: values.performedByStaffId } : {}),
        ...(values.estimatedCost > 0 ? { estimatedCost: values.estimatedCost } : {}),
        ...(values.actualCost > 0 ? { actualCost: values.actualCost } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
        documents: files.filter((f) => f.category === 'document').map((f) => f.id),
        photos: files.filter((f) => f.category === 'photo').map((f) => f.id),
      };

      if (recordId) {
        await updateRecord.mutateAsync({ id: recordId, ...input });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('maintenance.update.success'),
        });
      } else {
        await createRecord.mutateAsync(input as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('maintenance.create.success'),
        });
      }

      router.push(`/${locale}/modules/real-estate/maintenance`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('maintenance.create.error'),
      });
    }
  };

  if (isLoadingRecord) {
    return <DetailPageSkeleton />;
  }

  return (
    <Paper shadow="xs" p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={12}>
              <Select
                label={t('form.apartment')}
                placeholder={t('form.selectApartment')}
                required
                searchable
                data={
                  apartmentsData?.apartments.map((apt) => ({
                    value: apt.id,
                    label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
                  })) || []
                }
                {...form.getInputProps('apartmentId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.type')}
                placeholder={t('form.selectType')}
                required
                data={[
                  { value: 'preventive', label: t('maintenance.types.preventive') },
                  { value: 'corrective', label: t('maintenance.types.corrective') },
                  { value: 'emergency', label: t('maintenance.types.emergency') },
                ]}
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.status')}
                placeholder={t('form.selectStatus')}
                data={[
                  { value: 'scheduled', label: t('maintenance.status.scheduled') },
                  { value: 'in_progress', label: t('maintenance.status.in_progress') },
                  { value: 'completed', label: t('maintenance.status.completed') },
                  { value: 'cancelled', label: t('maintenance.status.cancelled') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label={t('form.title')}
                placeholder={t('form.titlePlaceholder')}
                required
                {...form.getInputProps('title')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                rows={4}
                {...form.getInputProps(t('form.description'))}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateTimePicker label={t('form.scheduledDate')}
                placeholder={t('form.selectDateTime')}
                required
                value={form.values.scheduledDate}
                onChange={(value: string | Date | null) => {
                  const date = value instanceof Date ? value : value ? new Date(value) : null;
                  form.setFieldValue('scheduledDate', date || new Date());
                }}
              />
            </Grid.Col>

            <Grid.Col span={6}>
          <DateTimePicker label={t('form.startDate')}
                placeholder={t('form.selectDateTime')}
                value={form.values.startDate}
                onChange={(value: string | Date | null) => {
                  const date = value instanceof Date ? value : value ? new Date(value) : null;
                  form.setFieldValue('startDate', date);
                }}
                clearable
              />
            </Grid.Col>

            <Grid.Col span={6}>
      <DateTimePicker label={t('form.endDate')}
                placeholder={t('form.selectDateTime')}
                value={form.values.endDate}
                onChange={(value: string | Date | null) => {
                  const date = value instanceof Date ? value : value ? new Date(value) : null;
                  form.setFieldValue('endDate', date);
                }}
                clearable
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.assignedStaff')}
                placeholder={t('form.selectStaff')}
                searchable
                clearable
                data={
                  staffData?.staff.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })) || []
                }
                {...form.getInputProps('assignedStaffId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.performedByStaff')}
                placeholder={t('form.selectStaff')}
                searchable
                clearable
                data={
                  staffData?.staff.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })) || []
                }
                {...form.getInputProps('performedByStaffId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label={t('form.estimatedCost')}
                placeholder={t('form.estimatedCostPlaceholder')}
                min={0}
                leftSection="₺"
                {...form.getInputProps('estimatedCost')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label={t('form.actualCost')}
                placeholder={t('form.actualCostPlaceholder')}
                min={0}
                leftSection="₺"
                {...form.getInputProps('actualCost')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={createRecord.isPending || updateRecord.isPending}>
              {recordId ? (t('actions.update')) : (t('actions.create'))}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

