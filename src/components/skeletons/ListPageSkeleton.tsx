'use client';

import { Container, Stack } from '@mantine/core';
import { HeaderSkeleton } from './HeaderSkeleton';
import { DataTableSkeleton } from '../tables/DataTableSkeleton';

interface ListPageSkeletonProps {
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
  showDescription?: boolean;
  actionsCount?: number;
  columns?: number;
  rows?: number;
  showToolbar?: boolean;
}

export function ListPageSkeleton({
  showHeader = true,
  showBreadcrumbs = true,
  showDescription = true,
  actionsCount = 1,
  columns = 5,
  rows = 8,
  showToolbar = true,
}: ListPageSkeletonProps) {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        {showHeader && (
          <HeaderSkeleton
            showBreadcrumbs={showBreadcrumbs}
            showDescription={showDescription}
            actionsCount={actionsCount}
          />
        )}
        <DataTableSkeleton
          columns={columns}
          rows={rows}
          showToolbar={showToolbar}
        />
      </Stack>
    </Container>
  );
}
