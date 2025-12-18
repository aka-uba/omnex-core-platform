'use client';

import { Container } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { TenantForm } from '@/modules/real-estate/components/TenantForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditTenantPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const tenantId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('tenants.edit.title')}
        description={t('tenants.edit.description')}
        namespace="modules/real-estate"
        icon={<IconUser size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('tenants.title'), href: `/${currentLocale}/modules/real-estate/tenants`, namespace: 'modules/real-estate' },
          { label: t('tenants.edit.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <TenantForm locale={currentLocale} tenantId={tenantId} />
    </Container>
  );
}






