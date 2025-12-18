'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconMap } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function LocationsMapPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="Map View"
        description="View locations on map"
        namespace="modules/locations"
        icon={<IconMap size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Locations', href: `/${currentLocale}/locations`, namespace: 'modules/locations' },
          { label: 'Map View', namespace: 'modules/locations' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Map View</Title>
          <Text c="dimmed">View your locations on an interactive map</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

