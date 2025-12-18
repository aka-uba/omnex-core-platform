'use client';

import { Container, Paper, Skeleton, Stack, Group, Grid } from '@mantine/core';

export function NotificationEditSkeleton() {
  return (
    <Container size="md" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Skeleton height={32} width={200} mb="xl" />

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Skeleton height={40} />
              <Skeleton height={120} />
              <Group>
                <Skeleton height={40} width="48%" />
                <Skeleton height={40} width="48%" />
              </Group>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" bg="var(--mantine-color-gray-0)" withBorder>
              <Stack gap="md">
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={12}>
            <Group justify="flex-end" mt="xl">
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}




