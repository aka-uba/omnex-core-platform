'use client';

import { Container } from '@mantine/core';
import { IconContract } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractTracking } from '@/modules/real-estate/components/ContractTracking';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ContractTrackingPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.tracking.title')}
        description={t('contracts.tracking.description')}
        namespace="modules/real-estate"
        icon={<IconContract size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('contracts.title'), href: `/${currentLocale}/modules/real-estate/contracts`, namespace: 'modules/real-estate' },
          { label: t('contracts.tracking.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <ContractTracking locale={currentLocale} />
    </Container>
  );
}

