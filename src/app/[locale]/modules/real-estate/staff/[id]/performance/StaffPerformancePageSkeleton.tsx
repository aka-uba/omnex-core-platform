'use client';

import { Paper, Stack, Grid, Skeleton } from '@mantine/core';

export function StaffPerformancePageSkeleton() {
  return (
    <Stack gap="md" mt="md">
      {/* Date Range Filter Skeleton */}
      <Paper shadow="xs" p="md">
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Skeleton height={40} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Skeleton height={40} />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Summary Cards Skeleton */}
      <Grid>
        {[1, 2, 3, 4].map((i) => (
          <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
            <Skeleton height={120} />
          </Grid.Col>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Paper key={i} shadow="xs" p="md" withBorder>
          <Skeleton height={20} width="40%" mb="md" />
          <Skeleton height={300} />
        </Paper>
      ))}

      {/* Detailed Metrics Skeleton */}
      <Paper shadow="xs" p="md" withBorder>
        <Skeleton height={20} width="30%" mb="md" />
        <Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid.Col key={i} span={{ base: 12, md: 6 }}>
              <Skeleton height={80} />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}












