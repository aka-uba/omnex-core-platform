'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AccountingReports } from '@/modules/accounting/components/AccountingReports';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function AccountingReportsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        namespace="modules/accounting"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: t('reports.title'), namespace: 'modules/accounting' },
        ]}
      />
      <AccountingReports locale={currentLocale} />
    </Container>
  );
}






