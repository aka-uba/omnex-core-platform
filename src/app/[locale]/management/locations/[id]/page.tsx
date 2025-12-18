'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMapPin, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || 'tr';
  const locationId = params?.id as string;
  const { t } = useTranslation('global');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('settings.locations.title')}
        description={t('settings.locations.description')}
        namespace="global"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/settings/company/locations`, namespace: 'global' },
          { label: 'settings.locations.title', namespace: 'global' },
        ]}
        actions={[
          {
            label: t('common.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => router.push(`/${currentLocale}/settings/company/locations`)
          }
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('settings.locations.title')}</Title>
          <Text c="dimmed">Location ID: {locationId}</Text>
          <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
        </Stack>
      </Paper>
    </Container>
  );
}
