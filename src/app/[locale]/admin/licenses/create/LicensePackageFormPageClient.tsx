'use client';

import { Container } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LicensePackageForm } from '@/modules/license/components/LicensePackageForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function LicensePackageFormPageClient({ locale, packageId }: { locale: string; packageId?: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={packageId ? (t('packages.edit')) : (t('packages.create'))}
        description={packageId ? (t('packages.editDescription')) : (t('packages.createDescription'))}
        namespace="modules/license"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'packages.title', href: `/${currentLocale}/modules/license/packages`, namespace: 'modules/license' },
          { label: packageId ? t('packages.edit') : t('packages.create'), namespace: 'modules/license' },
        ]}
      />
      <LicensePackageForm locale={currentLocale} packageId={packageId || null} />
    </Container>
  );
}

