'use client';

import { Container, Paper, Skeleton, Stack, Group } from '@mantine/core';
import { HeaderSkeleton } from '@/components/skeletons';

export function LicenseHistoryPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      <HeaderSkeleton showActions={false} />

      <Paper p="xl" mt="xl">
        <Stack gap="md">
          <Skeleton height={28} width={200} radius="sm" />

          {/* Payment History Table Skeleton */}
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Group key={i} justify="space-between" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
                <Skeleton height={16} width={150} radius="sm" />
                <Skeleton height={16} width={100} radius="sm" />
                <Skeleton height={24} width={80} radius="md" />
              </Group>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}






