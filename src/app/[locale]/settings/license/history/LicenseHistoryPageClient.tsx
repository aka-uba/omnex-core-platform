'use client';

import { Container, Paper, Text, Stack, Alert } from '@mantine/core';
import { LicenseHistoryPageSkeleton } from './LicenseHistoryPageSkeleton';
import { IconHistory, IconAlertCircle } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LicensePaymentHistory } from '@/modules/license/components/LicensePaymentHistory';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrentLicense } from '@/hooks/useTenantLicenses';

export function LicenseHistoryPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');
  const { data: license, isLoading, error } = useCurrentLicense();

  return (
    <Container py="xl">
      <CentralPageHeader
        title={t('myLicense.history.title')}
        description={t('myLicense.history.description')}
        namespace="modules/license"
        icon={<IconHistory size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'myLicense.title', href: `/${currentLocale}/settings/license`, namespace: 'modules/license' },
          { label: 'myLicense.history.title', namespace: 'modules/license' },
        ]}
      />

      {isLoading && <LicenseHistoryPageSkeleton />}

      {error && (
        <Paper p="xl" mt="xl">
          <Alert icon={<IconAlertCircle size={16} />} title={t('common.error')} color="red">
            {error instanceof Error ? error.message : t('myLicense.history.loadError')}
          </Alert>
        </Paper>
      )}

      {!isLoading && !error && !license && (
        <Paper p="xl" mt="xl">
          <Alert icon={<IconAlertCircle size={16} />} title={t('myLicense.notFound')} color="yellow">
            {t('myLicense.noLicense')}
          </Alert>
        </Paper>
      )}

      {!isLoading && !error && license && (
        <Paper p="xl" mt="xl">
          <Stack gap="md">
            <Text fw={600}>
              {t('myLicense.paymentHistory')}
            </Text>
            <LicensePaymentHistory locale={currentLocale} licenseId={license.id} />
          </Stack>
        </Paper>
      )}
    </Container>
  );
}





