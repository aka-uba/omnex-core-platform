'use client';

import { Container, Skeleton, Stack, Group, SimpleGrid, Card } from '@mantine/core';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { HeaderSkeleton } from '@/components/skeletons';

export function CompanySettingsPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      <HeaderSkeleton actionsCount={1} />

      {/* Statistics Cards Skeleton */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mt="xl">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} withBorder padding="lg" radius="md">
            <Stack gap="xs">
              <Group gap="xs">
                <Skeleton height={20} width={20} radius="sm" />
                <Skeleton height={16} width={120} radius="sm" />
              </Group>
              <Skeleton height={32} width={60} radius="sm" />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Table Section Skeleton */}
      <Stack gap="md" mt="xl">
        <Group>
          <Skeleton height={36} width="100%" radius="md" />
          <Skeleton height={36} width={100} radius="md" />
        </Group>

        <DataTableSkeleton columns={7} rows={8} showToolbar={false} />
      </Stack>
    </Container>
  );
}

