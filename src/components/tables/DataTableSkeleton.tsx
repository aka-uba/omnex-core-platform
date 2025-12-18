'use client';

import { Paper, Skeleton, Stack, Group } from '@mantine/core';

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  showToolbar?: boolean;
}

export function DataTableSkeleton({ 
  columns = 5, 
  rows = 8,
  showToolbar = true 
}: DataTableSkeletonProps) {
  return (
    <Paper shadow="sm" p="md" radius="md">
      <Stack gap="md">
        {/* Toolbar Skeleton */}
        {showToolbar && (
          <Group justify="space-between" wrap="nowrap" mb="md">
            <Skeleton height={36} width={300} radius="md" />
            <Group gap="xs" wrap="nowrap">
              <Skeleton height={36} width={36} radius="md" />
              <Skeleton height={36} width={36} radius="md" />
              <Skeleton height={36} width={36} radius="md" />
            </Group>
          </Group>
        )}

        {/* Table Skeleton */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} style={{ padding: '12px', textAlign: index === 0 ? 'left' : index === columns - 1 ? 'right' : 'center' }}>
                    <Skeleton height={16} width={index === 0 ? 120 : index === columns - 1 ? 100 : 80} radius="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} style={{ padding: '12px', textAlign: colIndex === 0 ? 'left' : colIndex === columns - 1 ? 'right' : 'center' }}>
                      {colIndex === 0 ? (
                        <Group gap="xs">
                          <Skeleton height={40} width={40} radius="sm" />
                          <Skeleton height={16} width={120} radius="sm" />
                        </Group>
                      ) : colIndex === columns - 1 ? (
                        <Group gap="xs" justify="flex-end">
                          <Skeleton height={28} width={28} radius="sm" />
                          <Skeleton height={28} width={28} radius="sm" />
                          <Skeleton height={28} width={28} radius="sm" />
                        </Group>
                      ) : (
                        <Skeleton height={16} width={colIndex === 1 ? 100 : 60} radius="sm" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="md">
            <Group gap="xs">
              <Skeleton height={16} width={80} radius="sm" />
              <Skeleton height={32} width={80} radius="sm" />
            </Group>
            <Skeleton height={16} width={150} radius="sm" />
          </Group>
          <Group gap="xs">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height={32} width={32} radius="sm" />
            ))}
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}

















