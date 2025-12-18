'use client';

import { Container, Paper, Skeleton, Stack, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@mantine/core';

export function NotificationDetailSkeleton() {
  return (
    <Container size="md" py="xl">
      <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} mb="md" disabled>
        Geri
      </Button>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Group>
            <Skeleton height={48} width={48} circle />
            <Stack gap={0}>
              <Skeleton height={28} width={300} />
              <Skeleton height={16} width={150} mt="xs" />
            </Stack>
          </Group>
          <Skeleton height={36} width={100} />
        </Group>

        <Group gap="md" mb="md">
          <Skeleton height={24} width={100} />
          <Skeleton height={24} width={100} />
        </Group>

        <Stack gap="md" mb="md">
          <Skeleton height={20} width={100} />
          <Skeleton height={100} radius="md" />
        </Stack>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
          <Stack gap="xs">
            <Skeleton height={16} width={80} />
            <Skeleton height={20} width={150} />
          </Stack>
          <Stack gap="xs">
            <Skeleton height={16} width={100} />
            <Skeleton height={20} width={200} />
          </Stack>
        </div>
      </Paper>
    </Container>
  );
}

