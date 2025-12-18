'use client';

import { Container, Paper, Skeleton, Stack, Group } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';

export function RolesPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="modules/roles.title"
        description="modules/roles.description"
        namespace="modules/roles"
        icon={<IconUsersGroup size={32} />}
      />

      <Paper shadow="sm" p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Skeleton height={40} width={400} />
            <Group>
              <Skeleton height={40} width={120} />
              <Skeleton height={40} width={120} />
            </Group>
          </Group>

          <Stack gap="xs">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={72} />
            ))}
          </Stack>

          <Group justify="space-between" mt="md">
            <Skeleton height={20} width={200} />
            <Skeleton height={36} width={200} />
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}



