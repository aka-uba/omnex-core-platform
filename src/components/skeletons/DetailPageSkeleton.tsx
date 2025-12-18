'use client';

import { Paper, Skeleton, Stack, Group, Grid } from '@mantine/core';

interface DetailPageSkeletonProps {
  showTabs?: boolean;
}

export function DetailPageSkeleton({ 
  showTabs = false
}: DetailPageSkeletonProps) {
  return (
    <>
      {showTabs && (
        <Group mt="xl" mb="md">
          <Skeleton height={36} width={100} radius="md" />
          <Skeleton height={36} width={100} radius="md" />
          <Skeleton height={36} width={100} radius="md" />
        </Group>
      )}

      <Paper shadow="xs" p="md" mt="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Skeleton height={24} width={200} radius="sm" />
            <Skeleton height={24} width={100} radius="md" />
          </Group>

          <Grid>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Skeleton height={16} width={120} radius="sm" />
                  <Skeleton height={20} width={i % 2 === 0 ? '80%' : '60%'} radius="sm" />
                </Stack>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Paper>
    </>
  );
}




