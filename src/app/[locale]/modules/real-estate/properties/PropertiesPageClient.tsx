'use client';

import { Container } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PropertyList } from '@/modules/real-estate/components/PropertyList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PropertiesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('properties.title')}
        description={t('properties.description')}
        namespace="modules/real-estate"
        icon={<IconBuilding size={32} className="tabler-icon tabler-icon-building" />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('properties.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('properties.create.title'),
            icon: <IconBuilding size={18} className="tabler-icon tabler-icon-building" />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/properties/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <PropertyList locale={currentLocale} />
    </Container>
  );
}






