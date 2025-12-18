'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function LocationsListPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="All Locations"
        description="View and manage all locations"
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/locations`, namespace: 'modules/locations' },
          { label: 'All Locations', namespace: 'modules/locations' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>All Locations</Title>
          <Text c="dimmed">View and manage all your locations</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

