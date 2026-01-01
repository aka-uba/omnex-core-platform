'use client';

import { Skeleton, SimpleGrid, Container, Paper, Group, Stack } from '@mantine/core';

export function DashboardSkeleton() {
  return (
    <Container size="xl" py="xl">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Group gap="md" mb="sm">
          <Skeleton height={48} width={48} radius="lg" />
          <div>
            <Skeleton height={32} width={150} radius="md" mb={8} />
            <Skeleton height={16} width={250} radius="md" />
          </div>
        </Group>
      </div>

      {/* Alert Banner Skeleton */}
      <Skeleton height={72} radius="lg" mb="xl" />

      {/* Module Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg" mb="xl">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Paper key={i} p="lg" radius="lg" withBorder>
            {/* Card Header */}
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <Skeleton height={36} width={36} radius="md" />
                <Skeleton height={24} width={120} radius="md" />
              </Group>
              <Skeleton height={16} width={16} radius="sm" />
            </Group>

            {/* Stats Grid */}
            <SimpleGrid cols={2} spacing="md" mb="lg">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <Skeleton height={12} width={60} radius="sm" mb={8} />
                  <Skeleton height={28} width={40} radius="md" />
                </div>
              ))}
            </SimpleGrid>

            {/* Quick Actions */}
            <Group gap="xs">
              <Skeleton height={32} radius="md" style={{ flex: 1 }} />
              <Skeleton height={32} radius="md" style={{ flex: 1 }} />
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Card */}
        <div className="lg:col-span-2">
          <Paper radius="xl" p="lg" withBorder style={{ minHeight: 450 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <Skeleton height={12} width={100} radius="sm" mb={8} />
                <Skeleton height={32} width={220} radius="md" mb={8} />
                <Skeleton height={16} width={300} radius="sm" />
              </div>
              <Skeleton height={80} width={180} radius="lg" />
            </div>

            {/* Events List */}
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <Paper key={i} p="md" radius="lg" withBorder>
                  <Group gap="md">
                    <Skeleton height={48} width={48} radius="xl" />
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" mb={8}>
                        <Skeleton height={20} width={180} radius="md" />
                        <Skeleton height={20} width={70} radius="md" />
                      </Group>
                      <Group gap="sm">
                        <Skeleton height={14} width={80} radius="sm" />
                        <Skeleton height={14} width={100} radius="sm" />
                      </Group>
                    </div>
                    <Skeleton height={16} width={16} radius="sm" />
                  </Group>
                </Paper>
              ))}
            </Stack>

            {/* Footer */}
            <div className="mt-4 pt-4 flex justify-center border-t border-gray-200 dark:border-gray-700">
              <Skeleton height={32} width={180} radius="md" />
            </div>
          </Paper>
        </div>

        {/* Quick Overview Sidebar */}
        <div className="lg:col-span-1">
          <Paper p="lg" radius="lg" withBorder h="100%">
            <Group gap="sm" mb="lg">
              <Skeleton height={36} width={36} radius="md" />
              <Skeleton height={24} width={100} radius="md" />
            </Group>

            <Stack gap="sm">
              {[1, 2, 3, 4].map((i) => (
                <Paper key={i} p="md" radius="lg" withBorder>
                  <Group justify="space-between">
                    <div style={{ flex: 1 }}>
                      <Skeleton height={18} width={100} radius="md" mb={8} />
                      <Skeleton height={14} width={150} radius="sm" />
                    </div>
                    <Skeleton height={24} width={24} radius="sm" />
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </div>
      </div>
    </Container>
  );
}
