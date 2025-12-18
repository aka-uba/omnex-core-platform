'use client';

import { Skeleton, Stack, Group } from '@mantine/core';

interface HeaderSkeletonProps {
  showBreadcrumbs?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  actionsCount?: number;
}

export function HeaderSkeleton({
  showBreadcrumbs = true,
  showDescription = true,
  showActions = true,
  actionsCount = 1,
}: HeaderSkeletonProps) {
  return (
    <Stack gap="md" mb="xl">
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <Group gap="xs">
          <Skeleton height={14} width={60} radius="sm" />
          <Skeleton height={14} width={8} radius="sm" />
          <Skeleton height={14} width={80} radius="sm" />
          <Skeleton height={14} width={8} radius="sm" />
          <Skeleton height={14} width={100} radius="sm" />
        </Group>
      )}

      {/* Title and Actions */}
      <Group justify="space-between" align="flex-start">
        <Group gap="md" align="center">
          {/* Icon */}
          <Skeleton height={40} width={40} radius="md" />
          <Stack gap="xs">
            {/* Title */}
            <Skeleton height={28} width={250} radius="sm" />
            {/* Description */}
            {showDescription && (
              <Skeleton height={16} width={350} radius="sm" />
            )}
          </Stack>
        </Group>

        {/* Actions */}
        {showActions && (
          <Group gap="xs">
            {Array.from({ length: actionsCount }).map((_, i) => (
              <Skeleton key={i} height={36} width={i === actionsCount - 1 ? 120 : 100} radius="md" />
            ))}
          </Group>
        )}
      </Group>
    </Stack>
  );
}
