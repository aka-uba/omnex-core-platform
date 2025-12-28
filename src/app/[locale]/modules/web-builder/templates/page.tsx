'use client';

import { Container, Paper, Text } from '@mantine/core';
import { IconLayout } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function WebBuilderTemplatesPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/web-builder');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="templates.title"
        description="templates.description"
        namespace="modules/web-builder"
        icon={<IconLayout size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/web-builder`, namespace: 'modules/web-builder' },
          { label: 'templates.title', namespace: 'modules/web-builder' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
      </Paper>
    </Container>
  );
}

