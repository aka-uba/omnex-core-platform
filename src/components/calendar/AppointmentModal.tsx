'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Card,
  Text,
  Badge,
  Paper,
  Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { IconUser, IconCalendar, IconClock, IconFileText, IconHourglass, IconBell } from '@tabler/icons-react';

export interface Appointment {
  id?: string;
  title: string;
  clientName?: string;
  date: Date;
  time?: string;
  duration?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  description?: string;
  reminderMinutes?: number; // Minutes before appointment to remind
}

interface AppointmentModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id'>) => void;
  initialDate?: Date;
  initialAppointment?: Appointment;
  loading?: boolean;
  viewMode?: boolean;
  onEdit?: () => void;
}

export function AppointmentModal({
  opened,
  onClose,
  onSubmit,
  initialDate,
  initialAppointment,
  loading = false,
  viewMode = false,
  onEdit,
}: AppointmentModalProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  const { t } = useTranslation('modules/calendar');
  const { t: tGlobal } = useTranslation('global');

  // Generate time options (00:00 to 23:30 in 30-minute intervals)
  const timeOptions = useMemo(() => {
    const times: { value: string; label: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  }, []);

  // Reminder options
  const reminderOptions = useMemo(() => [
    { value: '0', label: t('appointments.form.reminderNone') },
    { value: '5', label: t('appointments.form.reminder5min') },
    { value: '15', label: t('appointments.form.reminder15min') },
    { value: '30', label: t('appointments.form.reminder30min') },
    { value: '60', label: t('appointments.form.reminder1hour') },
    { value: '120', label: t('appointments.form.reminder2hours') },
    { value: '1440', label: t('appointments.form.reminder1day') },
  ], [t]);

  const form = useForm({
    initialValues: {
      title: '',
      clientName: '',
      date: initialDate || new Date(),
      time: '',
      duration: 30,
      status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
      description: '',
      reminderMinutes: '0',
    },
    validate: {
      title: (value) => (!value ? t('appointments.form.titleRequired') : null),
      date: (value) => (!value ? t('appointments.form.dateRequired') : null),
    },
  });

  useEffect(() => {
    if (initialAppointment) {
      const appointmentDate = new Date(initialAppointment.date);

      form.setValues({
        title: initialAppointment.title,
        clientName: initialAppointment.clientName || '',
        date: appointmentDate,
        time: initialAppointment.time || '',
        duration: initialAppointment.duration || 30,
        status: initialAppointment.status || 'pending',
        description: initialAppointment.description || '',
        reminderMinutes: String(initialAppointment.reminderMinutes || 0),
      });
    } else if (initialDate) {
      form.setValues({
        ...form.values,
        date: initialDate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAppointment, initialDate, opened]);

  const handleSubmit = () => {
    if (!form.values.title || !form.values.date) {
      return;
    }

    const appointmentDate = new Date(form.values.date);
    const reminderMinutes = parseInt(form.values.reminderMinutes) || 0;

    onSubmit({
      title: form.values.title,
      clientName: form.values.clientName || undefined,
      date: appointmentDate,
      time: form.values.time || undefined,
      duration: form.values.duration || undefined,
      status: form.values.status,
      description: form.values.description || undefined,
      reminderMinutes: reminderMinutes > 0 ? reminderMinutes : undefined,
    });

    if (!initialAppointment) {
      form.reset();
    }
    onClose();
  };

  const handleClose = () => {
    if (!initialAppointment) {
      form.reset();
    }
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'yellow', label: t('appointments.status.pending') },
      confirmed: { color: 'green', label: t('appointments.status.confirmed') },
      cancelled: { color: 'red', label: t('appointments.status.cancelled') },
      completed: { color: 'blue', label: t('appointments.status.completed') },
    };
    const config = statusConfig[status] || { color: 'gray', label: status };
    return (
      <Badge color={config.color} variant="light" size="lg">
        {config.label}
      </Badge>
    );
  };

  const modalTitle = viewMode
    ? t('appointments.form.viewTitle')
    : initialAppointment
    ? t('appointments.form.editTitle')
    : t('appointments.form.createTitle');

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      {viewMode && initialAppointment ? (
        <Stack gap="lg">
          <Card padding="lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text size="xl" fw={700}>{initialAppointment.title}</Text>
                  {initialAppointment.clientName && (
                    <Group gap="xs" mt={4}>
                      <IconUser size={16} style={{ color: 'var(--text-secondary)' }} />
                      <Text size="sm" c="dimmed">{initialAppointment.clientName}</Text>
                    </Group>
                  )}
                </Stack>
                {getStatusBadge(initialAppointment.status)}
              </Group>
            </Stack>
          </Card>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
                <Group gap="sm" mb="xs">
                  <IconCalendar size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <Text size="sm" fw={600} c="dimmed">{t('appointments.form.date')}</Text>
                </Group>
                <Text size="md" fw={500}>
                  {new Date(initialAppointment.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
                <Group gap="sm" mb="xs">
                  <IconClock size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <Text size="sm" fw={600} c="dimmed">{t('appointments.form.time')}</Text>
                </Group>
                <Text size="md" fw={500}>{initialAppointment.time || '-'}</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
                <Group gap="sm" mb="xs">
                  <IconHourglass size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <Text size="sm" fw={600} c="dimmed">{t('appointments.form.duration')}</Text>
                </Group>
                <Text size="md" fw={500}>{initialAppointment.duration ? `${initialAppointment.duration} dk` : '-'}</Text>
              </Paper>
            </Grid.Col>
          </Grid>
          {initialAppointment.reminderMinutes && initialAppointment.reminderMinutes > 0 && (
            <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
              <Group gap="sm" mb="xs">
                <IconBell size={20} style={{ color: 'var(--color-primary-600)' }} />
                <Text size="sm" fw={600} c="dimmed">{t('appointments.form.reminder')}</Text>
              </Group>
              <Text size="md" fw={500}>
                {reminderOptions.find(opt => opt.value === String(initialAppointment.reminderMinutes))?.label || `${initialAppointment.reminderMinutes} dk önce`}
              </Text>
            </Paper>
          )}
          {initialAppointment.description && (
            <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
              <Group gap="sm" mb="xs">
                <IconFileText size={20} style={{ color: 'var(--color-primary-600)' }} />
                <Text size="sm" fw={600} c="dimmed">{t('appointments.form.description')}</Text>
              </Group>
              <Text size="md" style={{ lineHeight: 1.6 }}>{initialAppointment.description}</Text>
            </Paper>
          )}
          <Divider />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>{tGlobal('form.close')}</Button>
            <Button onClick={() => { handleClose(); onEdit?.(); }}>{tGlobal('form.edit')}</Button>
          </Group>
        </Stack>
      ) : (
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                label={t('appointments.form.title')}
                placeholder={t('appointments.form.titlePlaceholder')}
                required
                {...form.getInputProps('title')}
                data-autofocus
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('appointments.form.status')}
                data={[
                  { value: 'pending', label: t('appointments.status.pending') },
                  { value: 'confirmed', label: t('appointments.status.confirmed') },
                  { value: 'cancelled', label: t('appointments.status.cancelled') },
                  { value: 'completed', label: t('appointments.status.completed') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label={t('appointments.form.client')}
            placeholder={t('appointments.form.clientPlaceholder')}
            {...form.getInputProps('clientName')}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('appointments.form.date')}
                required
                {...form.getInputProps('date')}
                locale={dayjsLocale}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('appointments.form.time')}
                placeholder={t('appointments.form.timePlaceholder')}
                data={timeOptions}
                searchable
                {...form.getInputProps('time')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('appointments.form.duration')}
                placeholder={t('appointments.form.durationPlaceholder')}
                min={5}
                max={480}
                step={5}
                {...form.getInputProps('duration')}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('appointments.form.reminder')}
                placeholder={t('appointments.form.reminderPlaceholder')}
                data={reminderOptions}
                leftSection={<IconBell size={16} />}
                {...form.getInputProps('reminderMinutes')}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label={t('appointments.form.description')}
            placeholder={t('appointments.form.descriptionPlaceholder')}
            rows={3}
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {initialAppointment
                ? tGlobal('form.save')
                : tGlobal('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
      )}
    </Modal>
  );
}
