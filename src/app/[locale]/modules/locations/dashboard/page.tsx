'use client';

import { Container, Grid, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconMapPin, IconHierarchy, IconMap } from '@tabler/icons-react';

export default function LocationsDashboard() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Locations Dashboard</Title>
          <Text c="dimmed">Overview of your location management</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconMapPin size={40} color="var(--mantine-color-blue-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Total Locations</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconHierarchy size={40} color="var(--mantine-color-green-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Location Levels</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconMap size={40} color="var(--mantine-color-orange-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Mapped Locations</Text>
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





