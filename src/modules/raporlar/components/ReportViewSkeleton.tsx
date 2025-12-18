'use client';

import { Container, Paper, Skeleton, Stack, Group, Grid } from '@mantine/core';
import { HeaderSkeleton } from '@/components/skeletons';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

export function ReportViewSkeleton() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <HeaderSkeleton actionsCount={3} />

        {/* Report Info Skeleton */}
        <Paper shadow="sm" p="md" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Skeleton height={28} width={200} />
              <Skeleton height={24} width={100} />
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Skeleton height={24} width="100%" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Skeleton height={24} width="100%" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Skeleton height={24} width="100%" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Skeleton height={24} width="100%" />
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Report Data Skeleton */}
        <DataTableSkeleton columns={5} rows={10} />
      </Stack>
    </Container>
  );
}




