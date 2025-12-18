'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function WebBuilderMediaPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="media.title"
        description="media.description"
        namespace="modules/web-builder"
        icon={<IconPhoto size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/web-builder`, namespace: 'modules/web-builder' },
          { label: 'media.title', namespace: 'modules/web-builder' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Media Library</Title>
          <Text c="dimmed">Upload and manage your media files</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

