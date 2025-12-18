'use client';

import { Container } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ApartmentList } from '@/modules/real-estate/components/ApartmentList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ApartmentsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('apartments.title')}
        description={t('apartments.description')}
        namespace="modules/real-estate"
        icon={<IconHome size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('apartments.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('apartments.create.title'),
            icon: <IconHome size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/apartments/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ApartmentList locale={currentLocale} />
    </Container>
  );
}






