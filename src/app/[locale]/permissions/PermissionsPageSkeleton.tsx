'use client';

import { Container, Paper, Skeleton, Stack, Group } from '@mantine/core';
import { IconShieldLock } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';

export function PermissionsPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="modules/permissions.title"
        description="modules/permissions.description"
        namespace="modules/permissions"
        icon={<IconShieldLock size={32} />}
      />

      <Paper shadow="sm" p="md" radius="md">
        <Stack gap="md">
          <Group gap="md" wrap="wrap">
            <Skeleton height={40} width={300} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </Group>

          <Stack gap="xs">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={60} />
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



