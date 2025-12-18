'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function LicenseMyLicensePage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="myLicensePage.title"
        description="myLicensePage.description"
        namespace="modules/license"
        icon={<IconShieldCheck size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/license`, namespace: 'modules/license' },
          { label: 'myLicensePage.title', namespace: 'modules/license' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>My License</Title>
          <Text c="dimmed">View your license information</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

