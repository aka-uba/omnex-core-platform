'use client';

import { Container, Paper, Text } from '@mantine/core';
import { IconVideo } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function AIVideoPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/ai');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('page.videoGenerator.title')}
        description={t('page.videoGenerator.description')}
        namespace="modules/ai"
        icon={<IconVideo size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/ai`, namespace: 'modules/ai' },
          { label: 'page.videoGenerator.title', namespace: 'modules/ai' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
      </Paper>
    </Container>
  );
}

