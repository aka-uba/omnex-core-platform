'use client';

import { Container } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LicenseDetail } from '@/modules/license/components/LicenseDetail';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function MyLicensePageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('myLicense.title')}
        description={t('myLicense.description')}
        namespace="modules/license"
        icon={<IconShieldCheck size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'myLicense.title', namespace: 'modules/license' },
        ]}
      />
      <LicenseDetail locale={currentLocale} />
    </Container>
  );
}







