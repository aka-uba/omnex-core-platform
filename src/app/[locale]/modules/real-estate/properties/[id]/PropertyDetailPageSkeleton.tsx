import { Container, Skeleton, Stack, Paper, Group, Grid, Box } from '@mantine/core';

export function PropertyDetailPageSkeleton() {
  return (
    <Container size="xl" pt="xl">
      {/* Header Skeleton */}
      <Stack gap="md" mb="xl">
        <Skeleton height={40} width="40%" />
        <Skeleton height={20} width="60%" />
      </Stack>

      {/* Tabs Skeleton */}
      <Box mb="md">
        <Group gap="xs">
          <Skeleton height={40} width={120} radius="md" />
          <Skeleton height={40} width={150} radius="md" />
        </Group>
      </Box>

      {/* Content Skeleton */}
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          {/* Cover Image and Title Skeleton - Gerçek sayfada görsel solda, bilgiler sağda */}
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
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Skeleton height={16} width="30%" />
                      <Skeleton height={20} width="80%" />
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
                </Grid>
              </Stack>
            </div>
          </Group>
        </Stack>
      </Paper>
      
      {/* Apartments Tab Skeleton */}
      <Paper shadow="xs" p="md" mt="md">
        <Stack gap="md">
          {[1, 2].map((i) => (
            <Paper key={i} p="md" withBorder>
              <Group align="flex-start" gap="md">
                {/* Apartment Cover Image - Sol tarafta */}
                <Skeleton height={256} width={256} radius="md" style={{ flexShrink: 0 }} />
                
                {/* Apartment Info - Sağ tarafta */}
                <div style={{ flex: 1 }}>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Skeleton height={24} width="30%" />
                      <Skeleton height={24} width={80} radius="xl" />
                    </Group>
                    <Skeleton height={16} width="40%" />
                    <Skeleton height={16} width="50%" />
                    <Skeleton height={16} width="35%" />
                    <Group gap="xs" mt="xs">
                      <Skeleton height={32} width={100} radius="md" />
                      <Skeleton height={32} width={100} radius="md" />
                    </Group>
                  </Stack>
                </div>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Container>
  );
}

