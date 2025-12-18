'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Switch,
} from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateMaintenanceRecord, useUpdateMaintenanceRecord, useMaintenanceRecord } from '@/hooks/useMaintenanceRecords';
import { useLocations } from '@/hooks/useLocations';
import { useEquipment } from '@/hooks/useEquipment';
import { useTranslation } from '@/lib/i18n/client';
import { maintenanceRecordCreateSchema } from '@/modules/maintenance/schemas/maintenance.schema';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/maintenance/types/maintenance';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface MaintenanceRecordFormProps {
  locale: string;
  recordId?: string;
}

export function MaintenanceRecordForm({ locale, recordId }: MaintenanceRecordFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/maintenance');
  const { t: tGlobal } = useTranslation('global');
  const createRecord = useCreateMaintenanceRecord();
  const updateRecord = useUpdateMaintenanceRecord();
  const { data: recordData, isLoading: isLoadingRecord } = useMaintenanceRecord(recordId || '');

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!recordId;

  const form = useForm({
    initialValues: {
      locationId: '',
      equipmentId: '',
      type: 'preventive' as MaintenanceType,
      title: '',
      description: '',
      scheduledDate: new Date(),
      startDate: null as Date | null,
      endDate: null as Date | null,
      assignedTo: null as string | null,
      performedBy: null as string | null,
      estimatedCost: null as number | null,
      actualCost: null as number | null,
      notes: '',
      documents: [] as string[],
      status: 'scheduled' as MaintenanceStatus,
      isActive: true,
    },
    validate: {
      locationId: (value) => (!value ? t('form.location') + ' ' + tGlobal('common.required') : null),
      equipmentId: (value) => (!value ? t('form.equipment') + ' ' + tGlobal('common.required') : null),
      title: (value) => (!value ? t('form.title') + ' ' + tGlobal('common.required') : null),
      scheduledDate: (value) => (!value ? t('form.scheduledDate') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Fetch locations and equipment
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });
  const { data: equipmentData } = useEquipment({
    page: 1,
    pageSize: 1000,
    ...(form.values.locationId ? { locationId: form.values.locationId } : {}),
    isActive: true,
  });

  // Load record data for edit
  useEffect(() => {
    if (isEdit && recordData && !isLoadingRecord) {
      if (form.values.title === '') {
        form.setValues({
          locationId: recordData.locationId,
          equipmentId: recordData.equipmentId,
          type: recordData.type,
          title: recordData.title,
          description: recordData.description || '',
          scheduledDate: new Date(recordData.scheduledDate),
          startDate: recordData.startDate ? new Date(recordData.startDate) : null,
          endDate: recordData.endDate ? new Date(recordData.endDate) : null,
          assignedTo: recordData.assignedTo || null,
          performedBy: recordData.performedBy || null,
          estimatedCost: recordData.estimatedCost || null,
          actualCost: recordData.actualCost || null,
          notes: recordData.notes || '',
          documents: recordData.documents || [],
          status: recordData.status,
          isActive: recordData.isActive,
        });
      }
    }
  }, [isEdit, recordData, isLoadingRecord, form]);

  // Get equipment for selected location
  const equipmentOptions: Array<{ value: string; label: string }> = 
    (equipmentData?.equipment || []).map((eq) => ({
      value: eq.id,
      label: `${eq.name}${eq.code ? ` (${eq.code})` : ''}`,
    }));

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        locationId: values.locationId,
        equipmentId: values.equipmentId,
        type: values.type,
        title: values.title,
        description: values.description || undefined,
        scheduledDate: values.scheduledDate.toISOString(),
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        assignedTo: values.assignedTo || undefined,
        performedBy: values.performedBy || undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        actualCost: values.actualCost ?? undefined,
        notes: values.notes || undefined,
        documents: values.documents || [],
      };

      const validatedData = maintenanceRecordCreateSchema.parse(formData);

      if (isEdit && recordId) {
        await updateRecord.mutateAsync({
          id: recordId,
          ...(validatedData as any),
          status: values.status,
          isActive: values.isActive,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createRecord.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/maintenance/records`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingRecord) {
    return <DetailPageSkeleton />;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/maintenance/records`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.location')}
                placeholder={t('form.locationPlaceholder')}
                data={[
                  ...(locationsData?.locations || []).map((location) => ({
                    value: location.id,
                    label: location.name,
                  })),
                ]}
                searchable
                required
                {...form.getInputProps('locationId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.equipment')}
                placeholder={t('form.equipmentPlaceholder')}
                data={equipmentOptions}
                searchable
                required
                disabled={!form.values.locationId}
                {...form.getInputProps('equipmentId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.type')}
                placeholder={t('form.typePlaceholder')}
                data={[
                  { value: 'preventive', label: t('types.preventive') },
                  { value: 'corrective', label: t('types.corrective') },
                  { value: 'emergency', label: t('types.emergency') },
                ]}
                required
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
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
                rows={3}
                {...form.getInputProps('description')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DatePickerInput
                label={t('form.scheduledDate')}
                placeholder={t('form.scheduledDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('scheduledDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DatePickerInput
                label={t('form.startDate')}
                placeholder={t('form.startDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('startDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DatePickerInput
                label={t('form.endDate')}
                placeholder={t('form.endDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('endDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.estimatedCost')}
                placeholder={t('form.estimatedCostPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('estimatedCost')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.actualCost')}
                placeholder={t('form.actualCostPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('actualCost')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notesPlaceholder')}
                rows={3}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>

            {isEdit && (
              <>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={t('form.status')}
                    placeholder={t('form.statusPlaceholder')}
                    data={[
                      { value: 'scheduled', label: t('status.scheduled') },
                      { value: 'in_progress', label: t('status.in_progress') },
                      { value: 'completed', label: t('status.completed') },
                      { value: 'cancelled', label: t('status.cancelled') },
                    ]}
                    {...form.getInputProps('status')}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Switch
                    label={t('form.isActive')}
                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                  />
                </Grid.Col>
              </>
            )}
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/maintenance/records`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createRecord.isPending || updateRecord.isPending}
            >
              {isEdit ? tGlobal('form.save') : tGlobal('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

