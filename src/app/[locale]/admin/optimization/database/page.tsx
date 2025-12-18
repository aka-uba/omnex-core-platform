'use client';

import { useState } from 'react';
import { Container, Paper, Stack, Title, Text, Button, Group, Alert, Card, Badge, SimpleGrid, Modal } from '@mantine/core';
import { IconDatabase, IconTools, IconAlertCircle } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useDisclosure } from '@mantine/hooks';
import { authenticatedPost } from '@/lib/api/authenticatedFetch';

export default function DatabaseMaintenancePage() {
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const [loading, setLoading] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

    const operations = [
        {
            id: 'optimize',
            title: t('optimization.database.optimize'),
            description: t('optimization.database.optimizeDesc'),
            color: 'blue',
        },
        {
            id: 'vacuum',
            title: t('optimization.database.vacuum'),
            description: t('optimization.database.vacuumDesc'),
            color: 'teal',
        },
        {
            id: 'analyze',
            title: t('optimization.database.analyze'),
            description: t('optimization.database.analyzeDesc'),
            color: 'violet',
        },
        {
            id: 'reindex',
            title: t('optimization.database.reindex'),
            description: t('optimization.database.reindexDesc'),
            color: 'orange',
        },
    ];

    const handleOperation = async (operationId: string) => {
        try {
            setLoading(true);
            const result = await authenticatedPost('/api/admin/optimization/database/maintenance', { operation: operationId });
            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('optimization.database.operationSuccess'),
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

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {operations.map((op) => (
                            <Card key={op.id} withBorder padding="lg" radius="md">
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Title order={4}>{op.title}</Title>
                                        <Badge color={op.color} variant="light">
                                            {op.id}
                                        </Badge>
                                    </Group>
                                    <Text c="dimmed">
                                        {op.description}
                                    </Text>
                                    <Button
                                        leftSection={<IconTools size={16} />}
                                        variant="light"
                                        color={op.color}
                                        onClick={() => {
                                            setSelectedOperation(op.id);
                                            open();
                                        }}
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
                    <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                        {t('optimization.database.confirmMessage')}
                    </Alert>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={close}>
                            {t('form.cancel')}
                        </Button>
                        <Button
                            onClick={() => selectedOperation && handleOperation(selectedOperation)}
                            loading={loading}
                            color="red"
                        >
                            {t('optimization.database.confirm')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

