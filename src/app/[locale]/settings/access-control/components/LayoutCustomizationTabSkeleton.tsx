'use client';

import { Stack, Skeleton, Paper } from '@mantine/core';

export function LayoutCustomizationTabSkeleton() {
  return (
    <Stack gap="lg">
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Skeleton height={20} width={200} radius="sm" />
          <Skeleton height={36} width="100%" radius="md" />
          <Skeleton height={36} width="100%" radius="md" />
          <Skeleton height={24} width="100%" radius="sm" />
        </Stack>
      </Paper>
      
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Skeleton height={20} width={200} radius="sm" />
          <Skeleton height={36} width="100%" radius="md" />
          <Skeleton height={36} width="100%" radius="md" />
        </Stack>
      </Paper>
    </Stack>
  );
}















