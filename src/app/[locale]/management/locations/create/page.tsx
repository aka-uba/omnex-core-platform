'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function CreateLocationPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/locations');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('settings.locations.createLocation')}
        description={t('settings.locations.description')}
        namespace="global"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/settings/company/locations`, namespace: 'global' },
          { label: 'Create', namespace: 'modules/locations' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('createLocation')}</Title>
          <Text c="dimmed">{t('createDescription')}</Text>
          <Text c="dimmed" size="sm">{t('comingSoon')}</Text>
        </Stack>
      </Paper>
    </Container>
  );
}
