'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AgreementReportForm } from '@/modules/real-estate/components/AgreementReportForm';
import { useTranslation } from '@/lib/i18n/client';

export function CreateAgreementReportPageClient({
  locale,
  appointmentId,
}: {
  locale: string;
  appointmentId?: string;
}) {
  const { t } = useTranslation('modules/real-estate');
  
  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('agreementReports.create.title')}
        description={t('agreementReports.create.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('agreementReports.title'), href: `/${locale}/modules/real-estate/agreement-reports`, namespace: 'modules/real-estate' },
          { label: t('agreementReports.create.title'), namespace: 'modules/real-estate' },
        ]}
      />

      <AgreementReportForm locale={locale} {...(appointmentId ? { appointmentId } : {})} />
    </Container>
  );
}








