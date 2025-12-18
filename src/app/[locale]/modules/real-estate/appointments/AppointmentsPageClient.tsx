'use client';

import { Container, Tabs } from '@mantine/core';
import { IconCalendar, IconList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AppointmentList } from '@/modules/real-estate/components/AppointmentList';
import { AppointmentCalendar } from '@/modules/real-estate/components/AppointmentCalendar';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useAppointmentReminders } from '@/modules/real-estate/hooks/useAppointmentReminders';

export function AppointmentsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  // Enable appointment reminders (browser notifications)
  useAppointmentReminders();

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('appointments.title')}
        description={t('appointments.description')}
        namespace="modules/real-estate"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('appointments.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('appointments.create') || t('appointments.createPage.title'),
            icon: <IconCalendar size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/appointments/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <Tabs defaultValue="calendar" mt="md">
        <Tabs.List>
          <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
            {tGlobal('calendar')}
          </Tabs.Tab>
          <Tabs.Tab value="list" leftSection={<IconList size={16} />}>
            {tGlobal('list')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="calendar" pt="md">
          <AppointmentCalendar locale={currentLocale} />
        </Tabs.Panel>

        <Tabs.Panel value="list" pt="md">
          <AppointmentList locale={currentLocale} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}






