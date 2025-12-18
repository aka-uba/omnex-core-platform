import { Container, Skeleton, Stack, Paper, Group, Grid } from '@mantine/core';

export function ApartmentDetailPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      {/* Header Skeleton */}
      <Stack gap="md" mb="xl">
        <Skeleton height={40} width="40%" />
        <Skeleton height={20} width="60%" />
      </Stack>

      {/* Tabs Skeleton */}
      <Group gap="xs" mb="md">
        <Skeleton height={36} width={120} />
        <Skeleton height={36} width={120} />
      </Group>

      {/* Content Skeleton */}
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          {/* Cover Image and Title Skeleton */}
          <Group align="flex-start" gap="xl">
            <Skeleton height={200} width={300} radius="md" />
            <div style={{ flex: 1 }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Skeleton height={32} width="40%" />
                  <Group>
                    <Skeleton height={24} width={80} radius="xl" />
                    <Skeleton height={24} width={80} radius="xl" />
                  </Group>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="60%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="60%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="50%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="50%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="40%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="40%" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={60} width="100%" />
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </div>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
