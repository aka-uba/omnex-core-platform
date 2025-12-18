'use client';

import { Container } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ApartmentForm } from '@/modules/real-estate/components/ApartmentForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateApartmentPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('apartments.create.title')}
        description={t('apartments.create.description')}
        namespace="modules/real-estate"
        icon={<IconHome size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('apartments.title'), href: `/${currentLocale}/modules/real-estate/apartments`, namespace: 'modules/real-estate' },
          { label: t('apartments.create.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <ApartmentForm locale={currentLocale} />
    </Container>
  );
}






