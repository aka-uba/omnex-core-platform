'use client';

import { Container, Paper, Title, Text, Stack } from '@mantine/core';
import { IconFileText, IconPlus } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';

export default function WebBuilderPagesPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="pages.title"
        description="pages.description"
        namespace="modules/web-builder"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/web-builder`, namespace: 'modules/web-builder' },
          { label: 'pages.title', namespace: 'modules/web-builder' },
        ]}
        actions={[
          {
            label: 'pages.newPage',
            icon: <IconPlus size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/web-builder/pages/create`;
            },
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <Title order={3}>Pages</Title>
          <Text c="dimmed">Create and manage your website pages</Text>
          <Text c="dimmed" size="sm">This feature is coming soon...</Text>
        </Stack>
      </Paper>
    </Container>
  );
}

