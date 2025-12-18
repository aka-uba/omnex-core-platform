'use client';

import { Container, Paper, Skeleton, Stack, Group, Grid } from '@mantine/core';
import { HeaderSkeleton } from './HeaderSkeleton';

interface FormPageSkeletonProps {
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
  showTabs?: boolean;
  tabsCount?: number;
  fieldsCount?: number;
  showTextarea?: boolean;
  showActions?: boolean;
}

export function FormPageSkeleton({
  showHeader = true,
  showBreadcrumbs = true,
  showTabs = false,
  tabsCount = 4,
  fieldsCount = 6,
  showTextarea = true,
  showActions = true,
}: FormPageSkeletonProps) {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        {showHeader && (
          <HeaderSkeleton
            showBreadcrumbs={showBreadcrumbs}
            showDescription={true}
            showActions={false}
          />
        )}

        {/* Tabs */}
        {showTabs && (
          <Group gap="xs" mb="md">
            {Array.from({ length: tabsCount }).map((_, i) => (
              <Skeleton key={i} height={36} width={100 + (i % 2) * 20} radius="md" />
            ))}
          </Group>
        )}

        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="xl">
            {/* Form Fields */}
            <Grid>
              {Array.from({ length: fieldsCount }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Skeleton height={16} width={100 + (i % 3) * 20} radius="sm" />
                    <Skeleton height={36} width="100%" radius="sm" />
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>

            {/* Textarea */}
            {showTextarea && (
              <Stack gap="xs">
                <Skeleton height={16} width={80} radius="sm" />
                <Skeleton height={120} width="100%" radius="sm" />
              </Stack>
            )}

            {/* Action Buttons */}
            {showActions && (
              <Group justify="flex-end" gap="md" mt="md">
                <Skeleton height={36} width={100} radius="md" />
                <Skeleton height={36} width={120} radius="md" />
              </Group>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
