'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconHierarchy } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function LocationsHierarchyPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="Hierarchy"
        description="View location hierarchy"
        namespace="modules/locations"
        icon={<IconHierarchy size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/locations`, namespace: 'modules/locations' },
          { label: 'Hierarchy', namespace: 'modules/locations' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Location Hierarchy</Title>
          <Text c="dimmed">View the hierarchical structure of your locations</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

