'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function AITextPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/ai');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('page.textGenerator.title')}
        description={t('page.textGenerator.description')}
        namespace="modules/ai"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/ai`, namespace: 'modules/ai' },
          { label: 'page.textGenerator.title', namespace: 'modules/ai' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('page.textGenerator.title')}</Title>
          <Text c="dimmed">{t('page.textGenerator.description')}</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

