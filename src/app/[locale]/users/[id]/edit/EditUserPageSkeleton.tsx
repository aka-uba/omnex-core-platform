'use client';

import { Container, Paper, Skeleton, Stack, Group, Tabs } from '@mantine/core';
import { IconUserEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';

export function EditUserPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="edit.title"
        description="edit.description"
        namespace="modules/users"
        icon={<IconUserEdit size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '#', namespace: 'global' },
          { label: 'title', href: '#', namespace: 'modules/users' },
          { label: 'edit.title', namespace: 'modules/users' },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md">
        <Stack gap="md">
          {/* Tabs Skeleton */}
          <Tabs defaultValue="personal">
            <Tabs.List>
              <Skeleton height={36} width={120} />
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
            </Tabs.List>
          </Tabs>

          {/* Form Content Skeleton */}
          <Stack gap="lg" mt="md">
            {/* Profile Picture Section */}
            <Group>
              <Skeleton height={96} width={96} radius="md" />
              <Stack gap="xs">
                <Skeleton height={20} width={200} />
                <Skeleton height={36} width={150} />
              </Stack>
            </Group>

            {/* Form Fields */}
            <Stack gap="md">
              {[1, 2, 3, 4].map((i) => (
                <Group key={i} grow>
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </Group>
              ))}
            </Stack>

            {/* Action Buttons */}
            <Group justify="flex-end" mt="xl">
              <Skeleton height={40} width={120} />
              <Skeleton height={40} width={120} />
            </Group>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}



