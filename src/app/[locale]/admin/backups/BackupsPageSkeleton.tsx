'use client';

import { Container, Paper, Skeleton, Stack, Group, Card } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';
import { HeaderSkeleton } from '@/components/skeletons';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

export function BackupsPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      <HeaderSkeleton actionsCount={1} />

      <Card withBorder padding="lg" mb="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <IconDatabase size={24} />
            <Skeleton height={28} width={200} />
          </Group>
          <Skeleton height={36} width={150} />
        </Group>
        <Skeleton height={60} mb="md" />
        <Skeleton height={40} />
      </Card>

      <DataTableSkeleton columns={7} rows={5} />
    </Container>
  );
}




