'use client';

import { Container } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { SideCostReconciliation } from '@/modules/real-estate/components/SideCostReconciliation';

export function ReconciliationPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const { t } = useTranslation('modules/real-estate');
  const currentLocale = (params?.locale as string) || locale;

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('reconciliation.title')}
        description={t('reconciliation.description')}
        namespace="modules/real-estate"
        icon={<IconCalculator size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('reconciliation.title'), namespace: 'modules/real-estate' },
        ]}
      />

      <SideCostReconciliation locale={currentLocale} />
    </Container>
  );
}
