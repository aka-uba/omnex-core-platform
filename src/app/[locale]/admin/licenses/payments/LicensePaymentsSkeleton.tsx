'use client';

import { Card, Group, Skeleton, Stack, Tabs } from '@mantine/core';

export function LicensePaymentsSkeleton() {
    return (
        <>
            {/* Filters Skeleton */}
            <Card withBorder mb="md" p="sm">
                <Group>
                    <Skeleton height={36} style={{ flex: 1 }} />
                </Group>
            </Card>

            {/* Tabs and Table Skeleton */}
            <Card withBorder>
                <Tabs defaultValue="pending">
                    <Tabs.List>
                        <Skeleton height={36} width={120} mr="xs" />
                        <Skeleton height={36} width={120} mr="xs" />
                        <Skeleton height={36} width={120} mr="xs" />
                        <Skeleton height={36} width={80} />
                    </Tabs.List>

                    <Stack gap="xs" pt="md">
                        <Skeleton height={40} /> {/* Table header */}
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} height={60} />
                        ))}
                    </Stack>
                </Tabs>
            </Card>
        </>
    );
}
