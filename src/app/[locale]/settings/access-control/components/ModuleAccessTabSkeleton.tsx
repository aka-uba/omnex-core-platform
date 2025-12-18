'use client';

import { Stack, Skeleton, Paper } from '@mantine/core';

export function ModuleAccessTabSkeleton() {
  return (
    <Stack gap="md">
      {Array.from({ length: 6 }).map((_, i) => (
        <Paper key={i} p="md" withBorder>
          <Stack gap="sm">
            <Skeleton height={24} width={200} radius="sm" />
            <Skeleton height={20} width="100%" radius="sm" />
            <Skeleton height={24} width="100%" radius="sm" />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}















