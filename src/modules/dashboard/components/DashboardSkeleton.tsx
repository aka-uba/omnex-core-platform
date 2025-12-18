'use client';

import { Skeleton, SimpleGrid, Container } from '@mantine/core';

export function DashboardSkeleton() {
  return (
    <Container size="xl" py="xl">
      {/* Header Skeleton */}
      <div className="mb-6">
        <Skeleton height={40} width={200} radius="md" className="mb-2" />
        <Skeleton height={20} width={400} radius="md" />
      </div>

      {/* KPI Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" className="mb-6">
        <Skeleton height={112} radius="xl" />
        <Skeleton height={112} radius="xl" />
        <Skeleton height={112} radius="xl" />
        <Skeleton height={112} radius="xl" />
      </SimpleGrid>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Skeleton height={288} radius="xl" className="lg:col-span-2" />
        <Skeleton height={288} radius="xl" />
      </div>

      {/* Finance Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton height={256} radius="xl" />
        <Skeleton height={256} radius="xl" className="lg:col-span-2" />
      </div>
    </Container>
  );
}






