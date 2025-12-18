'use client';

import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconPackage, IconClipboardList, IconBuilding } from '@tabler/icons-react';

export default function ProductionDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Container size="xl" pt="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Production Dashboard</Title>
          <Text c="dimmed">Overview of your production and product management</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                {mounted ? (
                  <IconPackage size={40} color="var(--mantine-color-blue-6)" />
                ) : (
                  <div style={{ width: 40, height: 40 }} />
                )}
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Total Products</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                {mounted ? (
                  <IconClipboardList size={40} color="var(--mantine-color-green-6)" />
                ) : (
                  <div style={{ width: 40, height: 40 }} />
                )}
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Active Orders</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                {mounted ? (
                  <IconBuilding size={40} color="var(--mantine-color-orange-6)" />
                ) : (
                  <div style={{ width: 40, height: 40 }} />
                )}
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Stock Items</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper shadow="sm" p="xl" withBorder>
          <Title order={3} mb="md">Recent Activity</Title>
          <Text c="dimmed">No recent activity</Text>
        </Paper>
      </Stack>
    </Container>
  );
}
