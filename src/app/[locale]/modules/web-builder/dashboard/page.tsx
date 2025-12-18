'use client';

import { Container, Grid, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconLayout, IconFileText, IconPhoto } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

export default function WebBuilderDashboard() {
  const { t } = useTranslation('modules/web-builder');

  return (
    <Container size="xl" pt="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{t('dashboard.title')}</Title>
          <Text c="dimmed">{t('dashboard.description')}</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconFileText size={40} color="var(--mantine-color-blue-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.totalPages')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconLayout size={40} color="var(--mantine-color-green-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.templates')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconPhoto size={40} color="var(--mantine-color-orange-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.mediaFiles')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper shadow="sm" p="xl" withBorder>
          <Title order={3} mb="md">{t('dashboard.recentActivity')}</Title>
          <Text c="dimmed">{t('dashboard.noActivity')}</Text>
        </Paper>
      </Stack>
    </Container>
  );
}




