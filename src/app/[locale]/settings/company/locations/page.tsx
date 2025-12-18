'use client';

import { Container } from '@mantine/core';
import { IconMapPin, IconPlus } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { LocationsPageClient } from './components/LocationsPageClient';
import { useRef } from 'react';

export default function CompanyLocationsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');
  const locationsPageRef = useRef<{ openCreateForm: () => void; openSubAreaForm: () => void }>(null);

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('settings.locations.title')}
        description={t('settings.locations.allLocations')}
        namespace="global"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'settings.company.title', href: `/${currentLocale}/settings/company`, namespace: 'global' },
          { label: 'settings.locations.title', namespace: 'global' },
        ]}
        actions={[
          {
            label: t('settings.locations.create'),
            icon: <IconPlus size={18} />,
            onClick: () => {
              locationsPageRef.current?.openCreateForm();
            },
            variant: 'filled',
          },
          {
            label: t('settings.locations.createSubArea'),
            icon: <IconPlus size={18} />,
            onClick: () => {
              locationsPageRef.current?.openSubAreaForm();
            },
            variant: 'filled',
            color: 'green',
          },
        ]}
      />
      <LocationsPageClient ref={locationsPageRef} />
    </Container>
  );
}

