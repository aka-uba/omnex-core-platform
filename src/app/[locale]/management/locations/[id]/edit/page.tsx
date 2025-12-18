'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function EditLocationPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const locationId = params?.id as string;
  const { t } = useTranslation('modules/locations');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('settings.locations.editLocation')}
        description={t('settings.locations.description')}
        namespace="global"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/settings/company/locations`, namespace: 'global' },
          { label: 'common.edit', namespace: 'global' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('settings.locations.editLocation')}</Title>
          <Text c="dimmed">Location ID: {locationId}</Text>
          <Text c="dimmed">{t('settings.locations.description')}</Text>
          <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
        </Stack>
      </Paper>
    </Container>
  );
}
