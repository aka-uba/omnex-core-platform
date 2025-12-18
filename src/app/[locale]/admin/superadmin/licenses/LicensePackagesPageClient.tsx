'use client';

import { Container } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LicensePackageList } from '@/modules/license/components/LicensePackageList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function LicensePackagesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('packages.title')}
        description={t('packages.description')}
        namespace="modules/license"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'packages.title', href: `/${currentLocale}/modules/license/packages`, namespace: 'modules/license' },
        ]}
        actions={[
          {
            label: t('packages.create'),
            icon: <IconPackage size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/license/packages/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <LicensePackageList locale={currentLocale} />
    </Container>
  );
}


