'use client';

import { Container, Paper, Skeleton, Stack, Group } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';

export function UsersPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="modules/users.title"
        description="modules/users.description"
        namespace="modules/users"
        icon={<IconUsers size={32} />}
      />

      <Paper shadow="sm" p="md" radius="md">
        <Stack gap="md">
          {/* Toolbar Skeleton */}
          <Group justify="space-between">
            <Skeleton height={40} width={320} />
            <Skeleton height={40} width={120} />
          </Group>

          {/* Table Skeleton */}
          <Stack gap="xs">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={60} />
            ))}
          </Stack>

          {/* Pagination Skeleton */}
          <Group justify="space-between" mt="md">
            <Skeleton height={20} width={200} />
            <Skeleton height={36} width={200} />
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}



