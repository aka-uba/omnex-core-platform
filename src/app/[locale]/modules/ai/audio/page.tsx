'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMicrophone } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function AIAudioPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/ai');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('page.voiceGenerator.title')}
        description={t('page.voiceGenerator.description')}
        namespace="modules/ai"
        icon={<IconMicrophone size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/ai`, namespace: 'modules/ai' },
          { label: 'page.voiceGenerator.title', namespace: 'modules/ai' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('page.voiceGenerator.title')}</Title>
          <Text c="dimmed">{t('page.voiceGenerator.description')}</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

