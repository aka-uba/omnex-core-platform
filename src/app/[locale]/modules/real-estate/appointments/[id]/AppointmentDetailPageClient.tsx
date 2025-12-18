'use client';

import { Container, Tabs, Paper, Stack, Group, Text, Badge, Grid } from '@mantine/core';
import { IconCalendar, IconFileText, IconCheck } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AppointmentFollowUp } from '@/modules/real-estate/components/AppointmentFollowUp';
import { useAppointment } from '@/hooks/useAppointments';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { AppointmentType, AppointmentStatus } from '@/modules/real-estate/types/appointment';

export function AppointmentDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const currentLocale = (params?.locale as string) || locale;
  const appointmentId = params?.id as string;

  const { data: appointment, isLoading } = useAppointment(appointmentId);

  if (isLoading) {
    return (
      <Container size="xl" pt="xl">
        <Text>{tGlobal('common.loading')}</Text>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: AppointmentType) => {
    const typeColors: Record<AppointmentType, string> = {
      viewing: 'blue',
      delivery: 'green',
      maintenance: 'orange',
      inspection: 'purple',
      meeting: 'cyan',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`appointments.types.${type}`)}
      </Badge>
    );
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusColors: Record<AppointmentStatus, string> = {
      scheduled: 'blue',
      completed: 'green',
      cancelled: 'red',
      no_show: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`appointments.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={appointment.title}
        {...(appointment.description ? { description: appointment.description } : {})}
        namespace="modules/real-estate"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('appointments.title'), href: `/${currentLocale}/modules/real-estate/appointments`, namespace: 'modules/real-estate' },
          { label: appointment.title, namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.edit'),
            onClick: () => {
              router.push(`/${currentLocale}/modules/real-estate/appointments/${appointmentId}/edit`);
            },
            variant: 'outline',
          },
        ]}
      />

      <Tabs defaultValue="details" mt="md">
        <Tabs.List>
          <Tabs.Tab value="details" leftSection={<IconFileText size={16} />}>
            {t('appointments.details')}
          </Tabs.Tab>
          {appointment.status === 'completed' || appointment.status === 'scheduled' ? (
            <Tabs.Tab value="followup" leftSection={<IconCheck size={16} />}>
              {t('appointments.followUp')}
            </Tabs.Tab>
          ) : null}
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper shadow="xs" p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  {getTypeBadge(appointment.type)}
                  {getStatusBadge(appointment.status)}
                </Group>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.startDate')}
                    </Text>
                    <Text>{dayjs(appointment.startDate).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.endDate')}
                    </Text>
                    <Text>{dayjs(appointment.endDate).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>

                {appointment.duration && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.duration')}
                      </Text>
                      <Text>{appointment.duration} {t('appointments.minutes')}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.apartment && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('table.apartment')}
                      </Text>
                      <Text>{appointment.apartment.unitNumber}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.location && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.location')}
                      </Text>
                      <Text>{appointment.location}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.notes && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.notes')}
                      </Text>
                      <Text>{appointment.notes}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.rating && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('appointments.rating')}
                      </Text>
                      <Text>{appointment.rating} / 5</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.interestLevel && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('appointments.interestLevel')}
                      </Text>
                      <Badge color={appointment.interestLevel === 'high' ? 'green' : appointment.interestLevel === 'medium' ? 'yellow' : 'red'}>
                        {t(`appointments.interestLevels.${appointment.interestLevel}`)}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                )}

                {appointment.result && (
                  <Grid.Col span={12}>
                    <Stack gap="md">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('appointments.result')}
                      </Text>
                      {appointment.result.notes && (
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>
                            {t('appointments.resultNotes')}
                          </Text>
                          <Text>{appointment.result.notes}</Text>
                        </Stack>
                      )}
                      {appointment.result.outcome && (
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>
                            {t('appointments.outcome')}
                          </Text>
                          <Text>{appointment.result.outcome}</Text>
                        </Stack>
                      )}
                      {appointment.result.nextAction && (
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>
                            {t('appointments.nextAction')}
                          </Text>
                          <Text>{appointment.result.nextAction}</Text>
                        </Stack>
                      )}
                    </Stack>
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {(appointment.status === 'completed' || appointment.status === 'scheduled') && (
          <Tabs.Panel value="followup" pt="md">
            <AppointmentFollowUp
              appointmentId={appointmentId}
              locale={currentLocale}
              onSuccess={() => {
                // Refresh appointment data
                window.location.reload();
              }}
            />
          </Tabs.Panel>
        )}
      </Tabs>
    </Container>
  );
}






