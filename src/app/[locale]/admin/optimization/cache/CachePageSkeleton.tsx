'use client';

import { Container, Paper, Skeleton, Group, Stack, SimpleGrid, Card, Tabs } from '@mantine/core';
import { HeaderSkeleton } from '@/components/skeletons';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { IconFolder, IconFile } from '@tabler/icons-react';

export function CachePageSkeleton() {
  return (
    <Container py="xl">
      <HeaderSkeleton actionsCount={2} />

      <Stack gap="lg" mt="xl">
        {/* Statistics Cards Skeleton */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} withBorder padding="md" radius="md">
              <Stack gap="xs">
                <Skeleton height={16} width="60%" />
                <Skeleton height={24} width="40%" />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {/* Alert Skeleton */}
        <Paper p="md" withBorder radius="md">
          <Group gap="xs">
            <Skeleton circle height={20} />
            <Skeleton height={16} width="70%" />
          </Group>
        </Paper>

        {/* Tabs Skeleton */}
        <Paper withBorder radius="md">
          <Tabs defaultValue="directories">
            <Tabs.List>
              <Tabs.Tab value="directories" leftSection={<IconFolder size={16} />}>
                <Skeleton height={16} width={100} />
              </Tabs.Tab>
              <Tabs.Tab value="entries" leftSection={<IconFile size={16} />}>
                <Skeleton height={16} width={80} />
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="directories" pt="md">
              <DataTableSkeleton columns={5} rows={6} showToolbar />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
