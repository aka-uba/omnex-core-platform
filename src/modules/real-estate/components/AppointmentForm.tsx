'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Select,
  NumberInput,
  Switch,
  Text,
  ActionIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateAppointment, useUpdateAppointment, useAppointment } from '@/hooks/useAppointments';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import type { AppointmentType, AppointmentStatus, ExternalParticipant } from '@/modules/real-estate/types/appointment';
import dayjs from 'dayjs';

interface AppointmentFormProps {
  locale: string;
  appointmentId?: string;
}

export function AppointmentForm({ locale, appointmentId }: AppointmentFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const { data: appointmentData, isLoading: isLoadingAppointment } = useAppointment(appointmentId || '');
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });

  const isEdit = !!appointmentId;

  const [externalParticipants, setExternalParticipants] = useState<ExternalParticipant[]>([]);

  const form = useForm({
    initialValues: {
      apartmentId: null as string | null,
      type: 'viewing' as AppointmentType,
      title: '',
      description: '' as string,
      startDate: null as Date | null,
      endDate: null as Date | null,
      duration: null as number | null,
      staffIds: [] as string[],
      status: 'scheduled' as AppointmentStatus,
      followUpRequired: false,
      followUpDate: null as Date | null,
      followUpNotes: '' as string,
      location: '' as string,
      notes: '' as string,
    },
    validate: {
      title: (value) => (!value ? t('form.required') : null),
      startDate: (value) => (!value ? t('form.required') : null),
      endDate: (value, values) => {
        if (!value) return t('form.required');
        if (values.startDate && value < values.startDate) {
          return t('form.endDateAfterStart');
        }
        return null;
      },
    },
  });

  // Load appointment data for edit
  useEffect(() => {
    if (isEdit && appointmentData) {
      form.setValues({
        apartmentId: appointmentData.apartmentId || null,
        type: appointmentData.type,
        title: appointmentData.title,
        description: appointmentData.description || '',
        startDate: appointmentData.startDate ? new Date(appointmentData.startDate) : null,
        endDate: appointmentData.endDate ? new Date(appointmentData.endDate) : null,
        duration: appointmentData.duration || null,
        staffIds: appointmentData.staffIds || [],
        status: appointmentData.status,
        followUpRequired: appointmentData.followUpRequired,
        followUpDate: appointmentData.followUpDate ? new Date(appointmentData.followUpDate) : null,
        followUpNotes: appointmentData.followUpNotes || '',
        location: appointmentData.location || '',
        notes: appointmentData.notes || '',
      });
      if (appointmentData.externalParticipants && Array.isArray(appointmentData.externalParticipants)) {
        setExternalParticipants(appointmentData.externalParticipants);
      }
    }
  }, [appointmentData, isEdit]);

  // Calculate duration when dates change
  useEffect(() => {
    if (form.values.startDate && form.values.endDate) {
      const duration = dayjs(form.values.endDate).diff(form.values.startDate, 'minute');
      form.setFieldValue('duration', duration > 0 ? duration : null);
    }
  }, [form.values.startDate, form.values.endDate]);

  const addExternalParticipant = () => {
    setExternalParticipants([...externalParticipants, { name: '' }]);
  };

  const removeExternalParticipant = (index: number) => {
    setExternalParticipants(externalParticipants.filter((_, i) => i !== index));
  };

  const updateExternalParticipant = (index: number, field: keyof ExternalParticipant, value: string) => {
    const updated = [...externalParticipants];
    const current = updated[index];
    if (current) {
      updated[index] = { 
        ...current, 
        [field]: value 
      };
      setExternalParticipants(updated);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const appointmentData: any = {
        ...values,
        externalParticipants: externalParticipants.length > 0 ? externalParticipants : undefined,
      };

      if (isEdit && appointmentId) {
        await updateAppointment.mutateAsync({ id: appointmentId, input: appointmentData as any });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createAppointment.mutateAsync(appointmentData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }
      router.push(`/${locale}/modules/real-estate/appointments`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingAppointment) {
    return <Text>{tGlobal('common.loading')}</Text>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.apartment')}
                placeholder={t('form.selectApartment')}
                data={[
                  { value: '', label: t('form.none') },
                  ...(apartmentsData?.apartments.map(a => ({ value: a.id, label: a.unitNumber })) || []),
                ]}
                clearable
                {...form.getInputProps('apartmentId')}
                onChange={(value) => form.setFieldValue('apartmentId', value || null)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.type')}
                data={[
                  { value: 'viewing', label: t('appointments.types.viewing') },
                  { value: 'delivery', label: t('appointments.types.delivery') },
                  { value: 'maintenance', label: t('appointments.types.maintenance') },
                  { value: 'inspection', label: t('appointments.types.inspection') },
                  { value: 'meeting', label: t('appointments.types.meeting') },
                ]}
                required
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label={t('form.title')}
                placeholder={t('form.enterTitle')}
                required
                {...form.getInputProps('title')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.description')}
                placeholder={t('form.enterDescription')}
                rows={3}
                {...form.getInputProps('description')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.startDate')}
                placeholder={t('form.selectDate')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                value={form.values.startDate}
                onChange={(value) => {
                  if (value) {
                    const newDate = new Date(value);
                    if (form.values.startDate) {
                      newDate.setHours(form.values.startDate.getHours(), form.values.startDate.getMinutes());
                    }
                    form.setFieldValue('startDate', newDate);
                    if (form.values.endDate && newDate > form.values.endDate) {
                      form.setFieldValue('endDate', newDate);
                    }
                  } else {
                    form.setFieldValue('startDate', null);
                  }
                }}
              />
              <TextInput
                label={t('form.startTime')}
                placeholder="14:30"
                mt="xs"
                value={form.values.startDate ? dayjs(form.values.startDate).format('HH:mm') : ''}
                onChange={(e) => {
                  if (form.values.startDate && e.target.value.match(/^\d{2}:\d{2}$/)) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(form.values.startDate);
                    newDate.setHours(parseInt(hours || '0') || 0, parseInt(minutes || '0') || 0);
                    form.setFieldValue('startDate', newDate);
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.endDate')}
                placeholder={t('form.selectDate')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                value={form.values.endDate}
                onChange={(value) => {
                  if (value) {
                    const newDate = new Date(value);
                    if (form.values.endDate) {
                      newDate.setHours(form.values.endDate.getHours(), form.values.endDate.getMinutes());
                    }
                    form.setFieldValue('endDate', newDate);
                    if (form.values.startDate && newDate < form.values.startDate) {
                      form.setFieldValue('startDate', newDate);
                    }
                  } else {
                    form.setFieldValue('endDate', null);
                  }
                }}
              />
              <TextInput
                label={t('form.endTime')}
                placeholder="16:00"
                mt="xs"
                value={form.values.endDate ? dayjs(form.values.endDate).format('HH:mm') : ''}
                onChange={(e) => {
                  if (form.values.endDate && e.target.value.match(/^\d{2}:\d{2}$/)) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(form.values.endDate);
                    newDate.setHours(parseInt(hours || '0') || 0, parseInt(minutes || '0') || 0);
                    form.setFieldValue('endDate', newDate);
                  }
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.duration')}
                placeholder={t('form.enterDuration')}
                min={1}
                {...form.getInputProps('duration')}
                disabled
                description={t('form.durationAutoCalculated')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.status')}
                data={[
                  { value: 'scheduled', label: t('appointments.status.scheduled') },
                  { value: 'completed', label: t('appointments.status.completed') },
                  { value: 'cancelled', label: t('appointments.status.cancelled') },
                  { value: 'no_show', label: t('appointments.status.no_show') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label={t('form.location')}
                placeholder={t('form.enterLocation')}
                {...form.getInputProps('location')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {t('form.externalParticipants')}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={addExternalParticipant}
                  >
                    {t('form.addParticipant')}
                  </Button>
                </Group>
                {externalParticipants.map((participant, index) => (
                  <Group key={index} gap="xs">
                    <TextInput
                      placeholder={t('form.name')}
                      value={participant.name}
                      onChange={(e) => updateExternalParticipant(index, 'name', e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      placeholder={t('form.phone')}
                      value={participant.phone || ''}
                      onChange={(e) => updateExternalParticipant(index, 'phone', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      placeholder={t('form.email')}
                      value={participant.email || ''}
                      onChange={(e) => updateExternalParticipant(index, 'email', e.target.value)}
                      type="email"
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeExternalParticipant(index)}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Grid.Col>

            <Grid.Col span={12}>
              <Switch
                label={t('form.followUpRequired')}
                {...form.getInputProps('followUpRequired', { type: 'checkbox' })}
              />
            </Grid.Col>

            {form.values.followUpRequired && (
              <>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateInput
                    label={t('form.followUpDate')}
                    placeholder={t('form.selectDate')}
                    locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                    {...form.getInputProps('followUpDate')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label={t('form.followUpNotes')}
                    placeholder={t('form.enterNotes')}
                    rows={2}
                    {...form.getInputProps('followUpNotes')}
                  />
                </Grid.Col>
              </>
            )}

            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.enterNotes')}
                rows={3}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button type="submit" loading={createAppointment.isPending || updateAppointment.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

