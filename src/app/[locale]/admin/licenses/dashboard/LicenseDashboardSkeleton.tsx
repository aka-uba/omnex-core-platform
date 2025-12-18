'use client';

import { SimpleGrid, Card, Group, Stack, Skeleton } from '@mantine/core';

export function LicenseDashboardSkeleton() {
    return (
        <>
            {/* Stats Cards Skeleton */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Skeleton height={14} width={100} mb={8} />
                                <Skeleton height={28} width={60} />
                            </div>
                            <Skeleton height={48} width={48} radius="md" />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {/* Distribution Chart Skeleton */}
                <Card withBorder padding="lg" radius="md">
                    <Skeleton height={20} width={200} mb="md" />
                    <Group justify="center">
                        <Skeleton height={180} width={180} circle />
                        <Stack gap="xs">
                            <Skeleton height={24} width={120} />
                            <Skeleton height={24} width={100} />
                            <Skeleton height={24} width={130} />
                        </Stack>
                    </Group>
                </Card>

                {/* Expiring Soon Skeleton */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Skeleton height={20} width={180} />
                        <Skeleton height={24} width={80} radius="xl" />
                    </Group>
                    <Stack gap="xs">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={50} />
                        ))}
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* Recent Licenses Table Skeleton */}
            <Card withBorder padding="lg" radius="md" mt="lg">
                <Skeleton height={20} width={200} mb="md" />
                <Stack gap="xs">
                    <Skeleton height={40} /> {/* Table header */}
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} height={50} />
                    ))}
                </Stack>
            </Card>
        </>
    );
}
