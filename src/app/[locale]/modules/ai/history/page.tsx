'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function AIHistoryPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/ai');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('history.title')}
        description={t('history.description')}
        namespace="modules/ai"
        icon={<IconHistory size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/ai`, namespace: 'modules/ai' },
          { label: 'history.title', namespace: 'modules/ai' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('history.generationHistory')}</Title>
          <Text c="dimmed">{t('history.viewHistory')}</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

