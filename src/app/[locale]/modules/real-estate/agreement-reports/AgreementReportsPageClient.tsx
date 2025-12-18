'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AgreementReportList } from '@/modules/real-estate/components/AgreementReportList';
import { useTranslation } from '@/lib/i18n/client';

export function AgreementReportsPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/real-estate');
  
  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('agreementReports.title')}
        description={t('agreementReports.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('agreementReports.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('agreementReports.create.title'),
            icon: <IconFileText size={18} />,
            onClick: () => {
              window.location.href = `/${locale}/modules/real-estate/agreement-reports/create`;
            },
            variant: 'filled',
          },
        ]}
      />

      <AgreementReportList locale={locale} />
    </Container>
  );
}








