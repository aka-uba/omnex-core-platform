'use client';

import { Card, Group, Skeleton, Stack } from '@mantine/core';

export function TenantLicensesSkeleton() {
    return (
        <>
            {/* Filters Skeleton */}
            <Card withBorder mb="md" p="sm">
                <Group>
                    <Skeleton height={36} style={{ flex: 1 }} />
                    <Skeleton height={36} width={180} />
                </Group>
            </Card>

            {/* Table Skeleton */}
            <Card withBorder>
                <Stack gap="xs">
                    <Skeleton height={40} /> {/* Table header */}
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <Skeleton key={i} height={60} />
                    ))}
                </Stack>
            </Card>
        </>
    );
}
