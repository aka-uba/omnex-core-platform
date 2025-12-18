'use client';

import { Container, Paper, Skeleton, Stack, Group, Tabs } from '@mantine/core';

export function PageAnalysisPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      <Stack gap="lg">
        {/* Header Skeleton */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Skeleton height={40} width={400} radius="md" mb="xs" />
            <Skeleton height={24} width={500} radius="md" />
          </div>
          <Skeleton height={36} width={100} radius="md" />
        </Group>

        {/* Stats Skeleton */}
        <Paper p="md" withBorder>
          <Group gap="lg">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <Skeleton height={14} width={100} radius="sm" mb="xs" />
                <Skeleton height={32} width={60} radius="sm" />
              </div>
            ))}
          </Group>
        </Paper>

        {/* Tabs Skeleton */}
        <Tabs defaultValue="overview">
          <Tabs.List>
            {['Genel Bakış', 'Kategoriler', 'Çakışmalar', 'Tekrarlar', 'Yönlendirmeler', 'Tüm Sayfalar'].map((label, index) => (
              <Tabs.Tab key={index} value={label}>
                <Skeleton height={20} width={label.length * 8} radius="sm" />
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="overview" pt="lg">
            <Stack gap="md">
              {/* Alert Skeleton */}
              <Paper p="md" withBorder>
                <Skeleton height={20} width="100%" radius="sm" mb="xs" />
                <Skeleton height={16} width="80%" radius="sm" />
              </Paper>

              {/* Content Cards Skeleton */}
              {[1, 2, 3].map((i) => (
                <Paper key={i} p="md" withBorder>
                  <Stack gap="sm">
                    <Skeleton height={24} width={200} radius="sm" />
                    <Skeleton height={16} width="100%" radius="sm" />
                    <Skeleton height={16} width="90%" radius="sm" />
                    <Skeleton height={16} width="95%" radius="sm" />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}






