'use client';

import { useState } from 'react';
import { Container, Paper, Stack, Title, Text, Button, Group, Alert, Card, Badge, SimpleGrid, Modal, Code } from '@mantine/core';
import { IconDatabase, IconTools, IconAlertCircle, IconClock, IconInfoCircle } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useDisclosure } from '@mantine/hooks';
import { authenticatedPost } from '@/lib/api/authenticatedFetch';

interface OperationResult {
    message: string;
    operation: string;
    duration: string;
    database: string;
}

export default function DatabaseMaintenancePage() {
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const [loading, setLoading] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<OperationResult | null>(null);

    const operations = [
        {
            id: 'analyze',
            title: t('optimization.database.analyze'),
            description: t('optimization.database.analyzeDesc'),
            color: 'violet',
            risk: 'low',
            command: 'ANALYZE',
        },
        {
            id: 'vacuum',
            title: t('optimization.database.vacuum'),
            description: t('optimization.database.vacuumDesc'),
            color: 'teal',
            risk: 'medium',
            command: 'VACUUM ANALYZE',
        },
        {
            id: 'optimize',
            title: t('optimization.database.optimize'),
            description: t('optimization.database.optimizeDesc'),
            color: 'blue',
            risk: 'medium',
            command: 'VACUUM ANALYZE',
        },
        {
            id: 'reindex',
            title: t('optimization.database.reindex'),
            description: t('optimization.database.reindexDesc'),
            color: 'orange',
            risk: 'high',
            command: 'REINDEX SCHEMA public',
        },
    ];

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'green';
            case 'medium': return 'yellow';
            case 'high': return 'red';
            default: return 'gray';
        }
    };

    const getRiskLabel = (risk: string) => {
        switch (risk) {
            case 'low': return t('optimization.database.riskLow');
            case 'medium': return t('optimization.database.riskMedium');
            case 'high': return t('optimization.database.riskHigh');
            default: return risk;
        }
    };

    const handleOperation = async (operationId: string) => {
        try {
            setLoading(true);
            setLastResult(null);
            const result = await authenticatedPost('/api/admin/optimization/database/maintenance', { operation: operationId });
            if (result.success) {
                const data = result.data as OperationResult;
                setLastResult(data);
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: data.message || t('optimization.database.operationSuccess'),
                });
                close();
            } else {
                throw new Error(result.error || 'Failed to run database maintenance');
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('optimization.database.operationError'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container py="xl">
            <CentralPageHeader
                title={t('optimization.database.title')}
                description={t('optimization.database.description')}
                namespace="global"
                icon={<IconDatabase size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'optimization.title', href: `/${currentLocale}/admin/optimization`, namespace: 'global' },
                    { label: 'optimization.database.title', namespace: 'global' },
                ]}
            />

            <Paper p="xl" withBorder mt="xl">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <div>
                            <Title order={3}>{t('optimization.database.title')}</Title>
                            <Text c="dimmed" mt="xs">
                                {t('optimization.database.description')}
                            </Text>
                        </div>
                    </Group>

                    <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                        {t('optimization.database.warning')}
                    </Alert>

                    <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                        {t('optimization.database.coreDbInfo')}
                    </Alert>

                    {lastResult && (
                        <Alert icon={<IconClock size={16} />} color="green" mb="md">
                            <Group gap="xs">
                                <Text fw={500}>{t('optimization.database.lastResult')}:</Text>
                                <Code>{lastResult.operation}</Code>
                                <Text>-</Text>
                                <Text>{lastResult.message}</Text>
                                <Badge color="blue" variant="light">{lastResult.duration}</Badge>
                            </Group>
                        </Alert>
                    )}

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {operations.map((op) => (
                            <Card key={op.id} withBorder padding="lg" radius="md">
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Title order={4}>{op.title}</Title>
                                        <Group gap="xs">
                                            <Badge color={getRiskColor(op.risk)} variant="light" size="sm">
                                                {getRiskLabel(op.risk)}
                                            </Badge>
                                        </Group>
                                    </Group>
                                    <Text c="dimmed" size="sm">
                                        {op.description}
                                    </Text>
                                    <Code>{op.command}</Code>
                                    <Button
                                        leftSection={<IconTools size={16} />}
                                        variant="light"
                                        color={op.color}
                                        onClick={() => {
                                            setSelectedOperation(op.id);
                                            open();
                                        }}
                                        loading={loading && selectedOperation === op.id}
                                    >
                                        {t('optimization.database.run')}
                                    </Button>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Paper>

            <Modal
                opened={opened}
                onClose={close}
                title={t('optimization.database.confirm')}
            >
                <Stack gap="md">
                    {selectedOperation && (
                        <>
                            <Text fw={500}>
                                {t('optimization.database.operationToRun')}: <Code>{operations.find(op => op.id === selectedOperation)?.command}</Code>
                            </Text>
                            <Alert
                                color={getRiskColor(operations.find(op => op.id === selectedOperation)?.risk || 'medium')}
                                icon={<IconAlertCircle size={16} />}
                            >
                                {t('optimization.database.confirmMessage')}
                            </Alert>
                            {operations.find(op => op.id === selectedOperation)?.risk === 'high' && (
                                <Alert color="red" icon={<IconAlertCircle size={16} />}>
                                    {t('optimization.database.highRiskWarning')}
                                </Alert>
                            )}
                        </>
                    )}
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={close}>
                            {t('form.cancel')}
                        </Button>
                        <Button
                            onClick={() => selectedOperation && handleOperation(selectedOperation)}
                            loading={loading}
                            color={getRiskColor(operations.find(op => op.id === selectedOperation)?.risk || 'medium')}
                        >
                            {t('optimization.database.confirm')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

