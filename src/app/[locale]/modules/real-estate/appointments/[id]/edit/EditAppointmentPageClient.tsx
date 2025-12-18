'use client';

import { Container } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AppointmentForm } from '@/modules/real-estate/components/AppointmentForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditAppointmentPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const appointmentId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('appointments.editPage.title') || t('appointments.edit')}
        description={t('appointments.editPage.description') || t('appointments.edit')}
        namespace="modules/real-estate"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('appointments.title'), href: `/${currentLocale}/modules/real-estate/appointments`, namespace: 'modules/real-estate' },
          { label: t('appointments.editPage.title') || t('appointments.edit'), namespace: 'modules/real-estate' },
        ]}
      />
      <AppointmentForm locale={currentLocale} appointmentId={appointmentId} />
    </Container>
  );
}






