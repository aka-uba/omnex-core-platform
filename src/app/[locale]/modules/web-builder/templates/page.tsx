'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconLayout } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function WebBuilderTemplatesPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

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
        <Stack gap="md">
          <Title order={3}>Templates</Title>
          <Text c="dimmed">Browse and use pre-built website templates</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

