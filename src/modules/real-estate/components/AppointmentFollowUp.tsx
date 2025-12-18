'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Select,
  Text,
  Rating,
} from '@mantine/core';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useUpdateAppointment, useAppointment } from '@/hooks/useAppointments';
import { useTranslation } from '@/lib/i18n/client';
import type { AppointmentResult, InterestLevel } from '@/modules/real-estate/types/appointment';

interface AppointmentFollowUpProps {
  appointmentId: string;
  locale: string;
  onSuccess?: () => void;
}

export function AppointmentFollowUp({ appointmentId, locale, onSuccess }: AppointmentFollowUpProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: appointment } = useAppointment(appointmentId);
  const updateAppointment = useUpdateAppointment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      rating: null as number | null,
      interestLevel: null as InterestLevel | null,
      resultNotes: '',
      outcome: '',
      nextAction: '',
      followUpNotes: '',
    },
  });

  // Load existing data if appointment has result
  useEffect(() => {
    if (appointment) {
      if (appointment.rating) {
        form.setFieldValue('rating', appointment.rating);
      }
      if (appointment.interestLevel) {
        form.setFieldValue('interestLevel', appointment.interestLevel);
      }
      if (appointment.result) {
        form.setFieldValue('resultNotes', appointment.result.notes || '');
        form.setFieldValue('outcome', appointment.result.outcome || '');
        form.setFieldValue('nextAction', appointment.result.nextAction || '');
      }
      if (appointment.followUpNotes) {
        form.setFieldValue('followUpNotes', appointment.followUpNotes);
      }
    }
  }, [appointment]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const result: AppointmentResult = {
        ...(values.resultNotes ? { notes: values.resultNotes } : {}),
        ...(values.outcome ? { outcome: values.outcome } : {}),
        ...(values.nextAction ? { nextAction: values.nextAction } : {}),
      };

      await updateAppointment.mutateAsync({
        id: appointmentId,
        input: {
          status: 'completed',
          result: result,
          ...(values.rating !== undefined && values.rating !== null ? { rating: values.rating } : {}),
          ...(values.interestLevel ? { interestLevel: values.interestLevel } : {}),
          ...(values.followUpNotes ? { followUpNotes: values.followUpNotes } : {}),
        },
      });

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('appointments.followUpSaved'),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.error'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) {
    return <Text>{tGlobal('common.loading')}</Text>;
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="lg" fw={500}>
            {t('appointments.followUpForm')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('appointments.followUpDescription')}
          </Text>

          <Grid>
            <Grid.Col span={12}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {t('appointments.rating')} {appointment.type === 'viewing' ? `(${t('appointments.forViewing')})` : ''}
                </Text>
                <Rating
                  value={form.values.rating || 0}
                  onChange={(value) => form.setFieldValue('rating', value)}
                  size="lg"
                />
                {form.values.rating && (
                  <Text size="xs" c="dimmed">
                    {form.values.rating} / 5
                  </Text>
                )}
              </Stack>
            </Grid.Col>

            {appointment.type === 'viewing' && (
              <Grid.Col span={12}>
                <Select
                  label={t('appointments.interestLevel')}
                  placeholder={t('form.select')}
                  data={[
                    { value: 'high', label: t('appointments.interestLevels.high') },
                    { value: 'medium', label: t('appointments.interestLevels.medium') },
                    { value: 'low', label: t('appointments.interestLevels.low') },
                  ]}
                  {...form.getInputProps('interestLevel')}
                />
              </Grid.Col>
            )}

            <Grid.Col span={12}>
              <Textarea
                label={t('appointments.resultNotes')}
                placeholder={t('appointments.enterResultNotes')}
                rows={4}
                {...form.getInputProps('resultNotes')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea
                label={t('appointments.outcome')}
                placeholder={t('appointments.enterOutcome')}
                rows={3}
                {...form.getInputProps('outcome')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea
                label={t('appointments.nextAction')}
                placeholder={t('appointments.enterNextAction')}
                rows={3}
                {...form.getInputProps('nextAction')}
              />
            </Grid.Col>

            {appointment.followUpRequired && (
              <Grid.Col span={12}>
                <Textarea
                  label={t('form.followUpNotes')}
                  placeholder={t('form.enterNotes')}
                  rows={3}
                  {...form.getInputProps('followUpNotes')}
                />
              </Grid.Col>
            )}
          </Grid>

          <Group justify="flex-end">
            <Button type="submit" loading={isSubmitting || updateAppointment.isPending}>
              {t('actions.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

