'use client';

// Unused imports removed
import { Container, Paper, Stack, Text, SimpleGrid, Card, RingProgress, Alert, Skeleton } from '@mantine/core';
import { IconChartBar, IconCpu, IconDeviceDesktopAnalytics, IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetchJSON } from '@/lib/api/authenticatedFetch';

interface PerformanceMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    responseTime: number;
    requestsPerSecond: number;
    activeConnections: number;
}

export default function PerformancePage() {
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');

    const { data, isLoading, error, refetch } = useQuery<PerformanceMetrics>({
        queryKey: ['performanceMetrics'],
        queryFn: async () => {
            const result = await authenticatedFetchJSON('/api/admin/system/metrics');
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch performance metrics');
            }
            // API'den gelen data direkt olarak metrics objesi
            const metrics = result.data || {};
            return {
                cpuUsage: metrics.cpuUsage || 0,
                memoryUsage: metrics.memoryUsage || 0,
                diskUsage: metrics.diskUsage || 0,
                responseTime: metrics.responseTime || 0,
                requestsPerSecond: metrics.requestsPerSecond || 0,
                activeConnections: metrics.activeConnections || 0,
            };
        },
        refetchInterval: 5000, // Her 5 saniyede bir güncelle
    });

    const getColor = (value: number) => {
        if (value < 50) return 'green';
        if (value < 75) return 'yellow';
        return 'red';
    };

    return (
        <Container py="xl">
            <CentralPageHeader
                title={t('optimization.performance.title')}
                description={t('optimization.performance.description')}
                namespace="global"
                icon={<IconChartBar size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'optimization.title', href: `/${currentLocale}/admin/optimization`, namespace: 'global' },
                    { label: 'optimization.performance.title', namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('buttons.refresh'),
                        icon: <IconRefresh size={18} />,
                        onClick: () => refetch(),
                        variant: 'light',
                    },
                ]}
            />

            <Paper p="xl" withBorder mt="xl">
                <Stack gap="lg">
                    {isLoading ? (
                        <Skeleton height={200} />
                    ) : error ? (
                        <Alert color="red" title={t('common.error')} icon={<IconAlertCircle size={16} />}>
                            {error instanceof Error ? error.message : t('optimization.performance.loadError')}
                        </Alert>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="md" align="center">
                                    <IconCpu size={32} color="var(--mantine-color-blue-6)" />
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.cpu')}
                                    </Text>
                                    <RingProgress
                                        size={120}
                                        thickness={12}
                                        sections={[{ value: data?.cpuUsage || 0, color: getColor(data?.cpuUsage || 0) }]}
                                        label={
                                            <Text c={getColor(data?.cpuUsage || 0)} fw={700} ta="center">
                                                {Math.round(data?.cpuUsage || 0)}%
                                            </Text>
                                        }
                                    />
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="md" align="center">
                                    <IconDeviceDesktopAnalytics size={32} color="var(--mantine-color-violet-6)" />
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.memory')}
                                    </Text>
                                    <RingProgress
                                        size={120}
                                        thickness={12}
                                        sections={[{ value: data?.memoryUsage || 0, color: getColor(data?.memoryUsage || 0) }]}
                                        label={
                                            <Text c={getColor(data?.memoryUsage || 0)} fw={700} ta="center">
                                                {Math.round(data?.memoryUsage || 0)}%
                                            </Text>
                                        }
                                    />
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="md" align="center">
                                    <IconChartBar size={32} color="var(--mantine-color-teal-6)" />
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.disk')}
                                    </Text>
                                    <RingProgress
                                        size={120}
                                        thickness={12}
                                        sections={[{ value: data?.diskUsage || 0, color: getColor(data?.diskUsage || 0) }]}
                                        label={
                                            <Text c={getColor(data?.diskUsage || 0)} fw={700} ta="center">
                                                {Math.round(data?.diskUsage || 0)}%
                                            </Text>
                                        }
                                    />
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="xs">
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.responseTime')}
                                    </Text>
                                    <Text fw={700}>
                                        {data?.responseTime || 0}ms
                                    </Text>
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="xs">
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.requestsPerSecond')}
                                    </Text>
                                    <Text fw={700}>
                                        {data?.requestsPerSecond || 0}
                                    </Text>
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg" radius="md">
                                <Stack gap="xs">
                                    <Text fw={500} c="dimmed">
                                        {t('optimization.performance.activeConnections')}
                                    </Text>
                                    <Text fw={700}>
                                        {data?.activeConnections || 0}
                                    </Text>
                                </Stack>
                            </Card>
                        </SimpleGrid>
                    )}
                </Stack>
            </Paper>
        </Container>
    );
}

