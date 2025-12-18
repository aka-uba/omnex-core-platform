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
  Card,
  Divider,
  Badge,
  Paper,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar, IconClock, IconUser, IconTag, IconFileText } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import type { CalendarEvent } from './CalendarView';

interface EventModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, 'id'>) => void;
  initialDate?: Date | undefined;
  initialEvent?: CalendarEvent | undefined;
  loading?: boolean;
  viewMode?: boolean;
  onEdit?: () => void;
}

export function EventModal({
  opened,
  onClose,
  onSubmit,
  initialDate,
  initialEvent,
  loading = false,
  viewMode = false,
  onEdit,
}: EventModalProps) {
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

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      client: '',
      date: initialDate || new Date(),
      time: '',
      status: 'scheduled' as const,
      color: 'blue' as const,
    },
    validate: {
      title: (value) => (!value ? (t('form.titleRequired')) : null),
      date: (value) => (!value ? (t('form.dateRequired')) : null),
    },
  });

  useEffect(() => {
    if (initialEvent) {
      const eventDate = new Date(initialEvent.date);
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      form.setValues({
        title: initialEvent.title,
        description: initialEvent.description || '',
        client: initialEvent.client || '',
        date: eventDate,
        time: timeString,
        status: (initialEvent.status || 'scheduled') as any,
        color: (initialEvent.color || 'blue') as any,
      });
    } else if (initialDate) {
      form.setValues({
        date: initialDate,
        time: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEvent, initialDate, opened]);

  const handleSubmit = () => {
    // Temel validasyon
    if (!form.values.title || !form.values.date) {
      return; // Form hatalarını Mantine form gösterir
    }

    const [hours, minutes] = form.values.time
      ? form.values.time.split(':').map(Number)
      : [0, 0];
    
    const eventDate = new Date(form.values.date);
    eventDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    onSubmit({
      title: form.values.title,
      description: form.values.description,
      client: form.values.client,
      date: eventDate,
      status: form.values.status,
      color: form.values.color,
    });

    if (!initialEvent) {
      form.reset();
    }
    onClose();
  };

  const handleClose = () => {
    if (!initialEvent) {
      form.reset();
    }
    onClose();
  };

  const modalTitle = viewMode
    ? (t('form.viewEvent'))
    : initialEvent
    ? (t('form.editEvent'))
    : (t('form.createEvent'));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      {viewMode ? (
        <Stack gap="lg">
          {/* Header Card */}
          <Card padding="lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text size="xl" fw={700}>
                    {initialEvent?.title || '-'}
                  </Text>
                  {initialEvent?.client && (
                    <Group gap="xs" mt={4}>
                      <IconUser size={16} style={{ color: 'var(--text-secondary)' }} />
                      <Text size="sm" c="dimmed">
                        {initialEvent.client}
                      </Text>
                    </Group>
                  )}
                </Stack>
                <Badge
                  size="lg"
                  variant="light"
                  color={
                    initialEvent?.status === 'published'
                      ? 'green'
                      : initialEvent?.status === 'scheduled'
                      ? 'blue'
                      : initialEvent?.status === 'draft'
                      ? 'gray'
                      : 'red'
                  }
                >
                  {initialEvent?.status === 'draft'
                    ? (t('form.statusDraft'))
                    : initialEvent?.status === 'scheduled'
                    ? (t('form.statusScheduled'))
                    : initialEvent?.status === 'published'
                    ? (t('form.statusPublished'))
                    : initialEvent?.status === 'needs-revision'
                    ? (t('form.statusNeedsRevision'))
                    : '-'}
                </Badge>
              </Group>
            </Stack>
          </Card>

          {/* Details Grid */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
                <Group gap="sm" mb="xs">
                  <IconCalendar size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <Text size="sm" fw={600} c="dimmed">
                    {t('form.date')}
                  </Text>
                </Group>
                <Text size="md" fw={500}>
                  {initialEvent?.date
                    ? new Date(initialEvent.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
                <Group gap="sm" mb="xs">
                  <IconClock size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <Text size="sm" fw={600} c="dimmed">
                    {t('form.time')}
                  </Text>
                </Group>
                <Text size="md" fw={500}>
                  {initialEvent?.date
                    ? new Date(initialEvent.date).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Description */}
          {initialEvent?.description && (
            <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
              <Group gap="sm" mb="xs">
                <IconFileText size={20} style={{ color: 'var(--color-primary-600)' }} />
                <Text size="sm" fw={600} c="dimmed">
                  {t('form.description')}
                </Text>
              </Group>
              <Text size="md" style={{ lineHeight: 1.6 }}>
                {initialEvent.description}
              </Text>
            </Paper>
          )}

          {/* Color Badge */}
          {initialEvent?.color && (
            <Paper p="md" style={{ border: '1px solid var(--border-color)' }}>
              <Group gap="sm" mb="xs">
                <IconTag size={20} style={{ color: 'var(--color-primary-600)' }} />
                <Text size="sm" fw={600} c="dimmed">
                  {t('form.color')}
                </Text>
              </Group>
              <Badge
                size="lg"
                variant="light"
                color={
                  initialEvent.color === 'yellow'
                    ? 'yellow'
                    : initialEvent.color === 'green'
                    ? 'green'
                    : initialEvent.color === 'red'
                    ? 'red'
                    : initialEvent.color === 'blue'
                    ? 'blue'
                    : initialEvent.color === 'purple'
                    ? 'violet'
                    : 'gray'
                }
              >
                {initialEvent.color === 'yellow'
                  ? (t('form.colorYellow'))
                  : initialEvent.color === 'green'
                  ? (t('form.colorGreen'))
                  : initialEvent.color === 'red'
                  ? (t('form.colorRed'))
                  : initialEvent.color === 'blue'
                  ? (t('form.colorBlue'))
                  : initialEvent.color === 'purple'
                  ? (t('form.colorPurple'))
                  : (t('form.colorSlate'))}
              </Badge>
            </Paper>
          )}

          <Divider />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {t('form.close')}
            </Button>
            <Button
              onClick={() => {
                handleClose();
                onEdit?.();
              }}
            >
              {t('form.edit')}
            </Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                label={t('form.title')}
                placeholder={t('form.titlePlaceholder')}
                required
                {...form.getInputProps('title')}
                data-autofocus
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('form.status')}
                data={[
                  { value: 'draft', label: t('form.statusDraft') },
                  { value: 'scheduled', label: t('form.statusScheduled') },
                  { value: 'published', label: t('form.statusPublished') },
                  { value: 'needs-revision', label: t('form.statusNeedsRevision') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label={t('form.description')}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
            {...form.getInputProps('description')}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.client')}
                placeholder={t('form.clientPlaceholder')}
                {...form.getInputProps('client')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.color')}
                data={[
                  { value: 'yellow', label: t('form.colorYellow') },
                  { value: 'green', label: t('form.colorGreen') },
                  { value: 'red', label: t('form.colorRed') },
                  { value: 'blue', label: t('form.colorBlue') },
                  { value: 'purple', label: t('form.colorPurple') },
                  { value: 'slate', label: t('form.colorSlate') },
                ]}
                {...form.getInputProps('color')}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label={t('form.date')}
                required
                {...form.getInputProps('date')}
               locale={dayjsLocale} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.time')}
                placeholder={t('form.timePlaceholder')}
                data={timeOptions}
                searchable
                {...form.getInputProps('time')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {initialEvent
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

