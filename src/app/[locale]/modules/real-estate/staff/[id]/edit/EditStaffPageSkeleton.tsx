'use client';

import { Paper, Stack, Skeleton } from '@mantine/core';

export function EditStaffPageSkeleton() {
  return (
    <Paper shadow="xs" p="md" withBorder mt="md">
      <Stack gap="md">
        <Skeleton height={40} width="30%" />
        <Skeleton height={20} width="60%" />
        <Skeleton height={300} />
      </Stack>
    </Paper>
  );
}

