'use client';

import { Container } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PropertyForm } from '@/modules/real-estate/components/PropertyForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditPropertyPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const propertyId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('properties.edit.title')}
        description={t('properties.edit.description')}
        namespace="modules/real-estate"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('properties.title'), href: `/${currentLocale}/modules/real-estate/properties`, namespace: 'modules/real-estate' },
          { label: t('properties.edit.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <PropertyForm locale={currentLocale} propertyId={propertyId} />
    </Container>
  );
}






