'use client';

import { Container, Paper, Skeleton, Group } from '@mantine/core';
import { HeaderSkeleton } from '@/components/skeletons';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

export function LogsPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      <HeaderSkeleton actionsCount={2} />

      {/* Filters Skeleton */}
      <Paper p="md" mb="lg" withBorder>
        <Group align="end">
          <Skeleton height={40} width={150} />
          <Skeleton height={40} width={120} />
          <Skeleton height={40} width={120} />
          <Skeleton height={40} width={150} />
          <Skeleton height={40} width={150} />
        </Group>
      </Paper>

      <DataTableSkeleton columns={8} rows={10} showToolbar={false} />
    </Container>
  );
}




