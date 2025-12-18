'use client';

import { Container } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { TenantList } from '@/modules/real-estate/components/TenantList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function TenantsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('tenants.title')}
        description={t('tenants.description')}
        namespace="modules/real-estate"
        icon={<IconUser size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('tenants.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('tenants.create.title'),
            icon: <IconUser size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/tenants/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <TenantList locale={currentLocale} />
    </Container>
  );
}






