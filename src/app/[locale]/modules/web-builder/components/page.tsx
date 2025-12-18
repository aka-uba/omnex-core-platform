'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconComponents } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function WebBuilderComponentsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

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
        <Stack gap="md">
          <Title order={3}>Components</Title>
          <Text c="dimmed">Create and manage reusable components</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

