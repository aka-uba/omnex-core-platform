'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { TenantLicenseList } from '@/modules/license/components/TenantLicenseList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function TenantLicensesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('tenantLicenses.title')}
        description={t('tenantLicenses.description')}
        namespace="modules/license"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'tenantLicenses.title', href: `/${currentLocale}/modules/license/tenants`, namespace: 'modules/license' },
        ]}
        actions={[
          {
            label: t('tenantLicenses.create'),
            icon: <IconUsers size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/license/tenants/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <TenantLicenseList locale={currentLocale} />
    </Container>
  );
}


