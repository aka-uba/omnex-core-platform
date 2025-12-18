'use client';

import { Container } from '@mantine/core';
import { IconUser, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { TenantDetail } from '@/modules/real-estate/components/TenantDetail';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function TenantDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const tenantId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('tenants.detail.title')}
        description={t('tenants.detail.description')}
        namespace="modules/real-estate"
        icon={<IconUser size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('tenants.title'), href: `/${currentLocale}/modules/real-estate/tenants`, namespace: 'modules/real-estate' },
          { label: t('tenants.detail.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${currentLocale}/modules/real-estate/tenants`),
            variant: 'subtle',
          },
          {
            label: t('actions.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${currentLocale}/modules/real-estate/tenants/${tenantId}/edit`),
            variant: 'filled',
          },
        ]}
      />
      <TenantDetail tenantId={tenantId} locale={currentLocale} />
    </Container>
  );
}






