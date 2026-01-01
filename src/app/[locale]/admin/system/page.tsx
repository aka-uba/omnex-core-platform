'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Group,
    Text,
    Box,
    Grid,
    RingProgress,
    Center,
    SimpleGrid,
    Card,
    Alert,
    Skeleton,
} from '@mantine/core';
import {
    IconServer,
    IconCpu,
    IconDeviceDesktopAnalytics,
    IconDatabase,
    IconRefresh,
    IconAlertCircle
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { authenticatedFetchJSON } from '@/lib/api/authenticatedFetch';
import { useTranslation } from '@/lib/i18n/client';

interface SystemInfo {
    hostname: string;
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
}

interface ResourceUsage {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
}

export default function SystemStatusPage() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const [info, setInfo] = useState<SystemInfo | null>(null);
    const [usage, setUsage] = useState<ResourceUsage | null>(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await authenticatedFetchJSON('/api/admin/system/info');

            if (data.success) {
                setInfo(data.data.info);
                setUsage(data.data.usage);
            } else {
                setError(data.error?.message || t('systemStatus.errors.loadFailed'));
            }
        } catch (err) {
            setError(t('systemStatus.errors.loadError'));
            showToast({ type: 'error', title: t('common.error'), message: t('systemStatus.errors.loadFailed') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    return (
        <Container py="xl">
            <CentralPageHeader
                title={t('systemStatus.title')}
                description={t('systemStatus.description')}
                namespace="global"
                icon={<IconServer size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: t('systemStatus.title'), namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('systemStatus.refresh'),
                        icon: <IconRefresh size={18} />,
                        onClick: fetchData,
                        variant: 'default',
                    },
                ]}
            />

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title={t('common.error')} color="red" mb="md">
                    {error}
                </Alert>
            )}

            {loading && !info && (
                <Grid mb="lg">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Skeleton height={120} radius="md" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Skeleton height={120} radius="md" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Skeleton height={120} radius="md" />
                    </Grid.Col>
                </Grid>
            )}

            <Grid>
                {/* Resource Usage Cards */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="md" radius="md">
                        <Group>
                            <RingProgress
                                size={80}
                                roundCaps
                                thickness={8}
                                sections={[{ value: usage?.cpuUsage || 0, color: 'blue' }]}
                                label={
                                    <Center>
                                        <IconCpu size={20} />
                                    </Center>
                                }
                            />
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700}>
                                    {t('systemStatus.cpuUsage')}
                                </Text>
                                <Text fw={700}>
                                    {usage?.cpuUsage.toFixed(1)}%
                                </Text>
                                <Text c="dimmed">
                                    {info?.cpus} {t('systemStatus.cores')}
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="md" radius="md">
                        <Group>
                            <RingProgress
                                size={80}
                                roundCaps
                                thickness={8}
                                sections={[{ value: usage?.memoryUsage || 0, color: 'cyan' }]}
                                label={
                                    <Center>
                                        <IconDeviceDesktopAnalytics size={20} />
                                    </Center>
                                }
                            />
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700}>
                                    {t('systemStatus.memoryUsage')}
                                </Text>
                                <Text fw={700}>
                                    {usage?.memoryUsage.toFixed(1)}%
                                </Text>
                                <Text c="dimmed">
                                    {info ? `${formatBytes(info.totalMemory - info.freeMemory)} / ${formatBytes(info.totalMemory)}` : '-'}
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="md" radius="md">
                        <Group>
                            <RingProgress
                                size={80}
                                roundCaps
                                thickness={8}
                                sections={[{ value: usage?.diskUsage || 0, color: 'orange' }]}
                                label={
                                    <Center>
                                        <IconDatabase size={20} />
                                    </Center>
                                }
                            />
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700}>
                                    {t('systemStatus.diskUsage')}
                                </Text>
                                <Text fw={700}>
                                    {usage?.diskUsage.toFixed(1)}%
                                </Text>
                                <Text c="dimmed">
                                    {t('systemStatus.systemStorage')}
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                {/* Server Info */}
                <Grid.Col span={12}>
                    <Card withBorder p="lg" radius="md">
                        <Group mb="md">
                            <IconServer size={24} />
                            <Text fw={500}>{t('systemStatus.serverInfo')}</Text>
                        </Group>

                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                            <Box>
                                <Text c="dimmed">{t('systemStatus.hostname')}</Text>
                                <Text fw={500}>{info?.hostname || '-'}</Text>
                            </Box>
                            <Box>
                                <Text c="dimmed">{t('systemStatus.fields.platform')}</Text>
                                <Text fw={500}>{info?.platform} ({info?.arch})</Text>
                            </Box>
                            <Box>
                                <Text c="dimmed">{t('systemStatus.fields.uptime')}</Text>
                                <Text fw={500}>{info ? formatUptime(info.uptime) : '-'}</Text>
                            </Box>
                            <Box>
                                <Text c="dimmed">{t('systemStatus.fields.nodeVersion')}</Text>
                                <Text fw={500}>{process.version}</Text>
                            </Box>
                        </SimpleGrid>
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
