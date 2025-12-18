'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { TenantLicenseForm } from '@/modules/license/components/TenantLicenseForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function TenantLicenseFormPageClient({ locale, licenseId }: { locale: string; licenseId?: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={licenseId ? (t('tenantLicenses.edit')) : (t('tenantLicenses.create'))}
        description={licenseId ? (t('tenantLicenses.editDescription')) : (t('tenantLicenses.createDescription'))}
        namespace="modules/license"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'tenantLicenses.title', href: `/${currentLocale}/modules/license/tenants`, namespace: 'modules/license' },
          { label: licenseId ? t('tenantLicenses.edit') : t('tenantLicenses.create'), namespace: 'modules/license' },
        ]}
      />
      <TenantLicenseForm locale={currentLocale} {...(licenseId ? { licenseId } : {})} />
    </Container>
  );
}


