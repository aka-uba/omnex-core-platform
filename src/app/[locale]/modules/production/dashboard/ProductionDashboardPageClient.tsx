'use client';

import { Container } from '@mantine/core';
import { IconDashboard } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ProductionDashboard } from '@/modules/production/components/ProductionDashboard';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ProductionDashboardPageClient({ params }: { params: Promise<{ locale: string }> }) {
  const urlParams = useParams();
  const currentLocale = (urlParams?.locale as string) || 'tr';
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        namespace="modules/production"
        icon={<IconDashboard size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: t('dashboard.title'), namespace: 'modules/production' },
        ]}
      />
      <ProductionDashboard locale={currentLocale} />
    </Container>
  );
}





