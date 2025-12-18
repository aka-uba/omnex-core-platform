'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function MaintenanceReportsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="reports.title"
        description="reports.description"
        namespace="modules/maintenance"
        icon={<IconChartBar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/maintenance`, namespace: 'modules/maintenance' },
          { label: 'reports.title', namespace: 'modules/maintenance' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Maintenance Reports</Title>
          <Text c="dimmed">View maintenance analytics and reports</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

