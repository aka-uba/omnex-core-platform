'use client';

import { Container, Paper, Text } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function LicenseMyLicensePage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/license');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="myLicensePage.title"
        description="myLicensePage.description"
        namespace="modules/license"
        icon={<IconShieldCheck size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/license`, namespace: 'modules/license' },
          { label: 'myLicensePage.title', namespace: 'modules/license' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
      </Paper>
    </Container>
  );
}

