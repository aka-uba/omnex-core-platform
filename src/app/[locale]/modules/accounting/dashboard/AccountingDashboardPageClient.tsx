'use client';

import { Container } from '@mantine/core';
import { IconDashboard } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AccountingDashboard } from '@/modules/accounting/components/AccountingDashboard';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function AccountingDashboardPageClient({ params }: { params: Promise<{ locale: string }> }) {
  const urlParams = useParams();
  const currentLocale = (urlParams?.locale as string) || 'tr';
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        namespace="modules/accounting"
        icon={<IconDashboard size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: t('dashboard.title'), namespace: 'modules/accounting' },
        ]}
      />
      <AccountingDashboard locale={currentLocale} />
    </Container>
  );
}






