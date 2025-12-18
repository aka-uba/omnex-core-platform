'use client';

import { Container, Grid, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconShieldCheck, IconPackage, IconUsers } from '@tabler/icons-react';

export default function LicenseDashboard() {
  return (
    <Container size="xl" pt="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>License Dashboard</Title>
          <Text c="dimmed">Overview of license packages and tenant licenses</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconPackage size={40} color="var(--mantine-color-blue-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">License Packages</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconUsers size={40} color="var(--mantine-color-green-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Active Licenses</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconShieldCheck size={40} color="var(--mantine-color-orange-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Expiring Soon</Text>
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






