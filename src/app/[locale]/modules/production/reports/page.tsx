'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function ProductionReportsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="reports.title"
        description="reports.description"
        namespace="modules/production"
        icon={<IconChartBar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'reports.title', namespace: 'modules/production' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Production Reports</Title>
          <Text c="dimmed">View production and product reports</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

