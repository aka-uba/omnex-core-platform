'use client';

import { Container, Paper, Text } from '@mantine/core';
import { IconComponents } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function WebBuilderComponentsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/web-builder');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="components.title"
        description="components.description"
        namespace="modules/web-builder"
        icon={<IconComponents size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/web-builder`, namespace: 'modules/web-builder' },
          { label: 'components.title', namespace: 'modules/web-builder' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed" size="sm">{t('common.comingSoon')}</Text>
      </Paper>
    </Container>
  );
}

