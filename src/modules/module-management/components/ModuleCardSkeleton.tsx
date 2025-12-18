'use client';

import { Card, Skeleton, Stack, Group } from '@mantine/core';

export function ModuleCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder className="flex flex-col justify-between h-full">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Skeleton height={24} width="60%" />
          <Skeleton height={20} width={60} radius="xl" />
        </Group>
        <Skeleton height={16} width="40%" />
        <Skeleton height={60} width="100%" />
      </Stack>
      <Group gap="xs" mt="md">
        <Skeleton height={36} flex={1} />
        <Skeleton height={36} flex={1} />
        <Skeleton height={36} width={36} />
      </Group>
    </Card>
  );
}






