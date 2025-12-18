'use client';

import { Container, Paper, Title, Text, Group, Badge, Stack, Button, Grid, Code, Divider } from '@mantine/core';
import { NotificationDetailSkeleton } from './components/NotificationDetailSkeleton';
import { useNotification } from './hooks/useNotifications';
import { useTranslation } from '@/lib/i18n/client';
import { NotificationStatusBadge } from './components/shared/NotificationStatusBadge';
import { NotificationTypeIcon } from './components/shared/NotificationTypeIcon';
import { PriorityIndicator } from './components/shared/PriorityIndicator';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface NotificationDetailProps {
    id: string;
}

export function NotificationDetail({ id }: NotificationDetailProps) {
    const { t } = useTranslation('modules/notifications');
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'tr';
    const { data: notificationData, isLoading } = useNotification(id);
    const notification = notificationData;

    if (isLoading) {
        return <NotificationDetailSkeleton />;
    }

    if (!notification) {
        return (
            <Container size="md" py="xl">
                <Text>{t('validation.not_found')}</Text>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()} mb="md">
                {t('actions.cancel')}
            </Button>

            <Paper p="xl" radius="md" withBorder>
                <Group justify="space-between" mb="xl">
                    <Group>
                        <NotificationTypeIcon type={notification.type as any} size="xl" />
                        <Stack gap={0}>
                            <Title order={3}>{notification.title}</Title>
                            <Text size="sm" c="dimmed">ID: {notification.id}</Text>
                        </Stack>
                    </Group>
                    <Button component={Link} href={`/${locale}/modules/notifications/${id}/edit`} leftSection={<IconEdit size={16} />} variant="light">
                        {t('actions.edit')}
                    </Button>
                </Group>

                <Grid>
                    <Grid.Col span={12}>
                        <Group gap="md" mb="md">
                            <NotificationStatusBadge 
                                isRead={notification.status === 'read' || notification.isRead || notification.is_read} 
                                isGlobal={notification.isGlobal || notification.is_global} 
                                size="lg" 
                            />
                            {notification.priority && (
                                <PriorityIndicator priority={notification.priority as any} size="lg" />
                            )}
                            {notification.type && (
                                <Badge variant="light" color="gray">
                                    {t(`type.${notification.type}`) || notification.type}
                                </Badge>
                            )}
                        </Group>
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <Text size="lg" mb="xs" fw={500}>{t('fields.message')}</Text>
                        <Paper p="md" bg="var(--mantine-color-gray-0)" withBorder>
                            <Text>{notification.message}</Text>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>{t('fields.sender')}</Text>
                            <Text>{notification.sender?.name || '-'}</Text>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>{t('fields.created_at')}</Text>
                            <Text>
                                {notification.createdAt 
                                    ? new Date(notification.createdAt).toLocaleString() 
                                    : notification.created_at 
                                    ? new Date(notification.created_at).toLocaleString()
                                    : '-'}
                            </Text>
                        </Stack>
                    </Grid.Col>

                    {(notification.readAt || notification.read_at) && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.read_at')}</Text>
                                <Text>
                                    {notification.readAt 
                                        ? new Date(notification.readAt).toLocaleString() 
                                        : new Date(notification.read_at).toLocaleString()}
                                </Text>
                            </Stack>
                        </Grid.Col>
                    )}

                    {(notification.expiresAt || notification.expires_at) && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.expires_at')}</Text>
                                <Text>
                                    {notification.expiresAt 
                                        ? new Date(notification.expiresAt).toLocaleString() 
                                        : new Date(notification.expires_at).toLocaleString()}
                                </Text>
                            </Stack>
                        </Grid.Col>
                    )}

                    {notification.recipient && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.recipient')}</Text>
                                <Text>{notification.recipient?.name || '-'}</Text>
                            </Stack>
                        </Grid.Col>
                    )}

                    {notification.module && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.module')}</Text>
                                <Text>{notification.module}</Text>
                            </Stack>
                        </Grid.Col>
                    )}

                    {notification.type === 'task' && (notification.actionUrl || notification.action_url || notification.actionText || notification.action_text) && (
                        <Grid.Col span={12}>
                            <Paper p="md" withBorder mt="md">
                                <Title order={5} mb="md">{t('task_details.title')}</Title>
                                {(notification.actionText || notification.action_text) && (
                                    <Group mb="xs">
                                        <Text fw={500}>{t('fields.action_text')}:</Text>
                                        <Text>{notification.actionText || notification.action_text}</Text>
                                    </Group>
                                )}
                                {(notification.actionUrl || notification.action_url) && (
                                    <Group mt="xs">
                                        <Text c="blue" component="a" href={notification.actionUrl || notification.action_url} target="_blank" rel="noopener noreferrer">
                                            {notification.actionUrl || notification.action_url}
                                        </Text>
                                    </Group>
                                )}
                            </Paper>
                        </Grid.Col>
                    )}

                    {notification.attachments && notification.attachments.length > 0 && (
                        <Grid.Col span={12}>
                            <Divider my="md" />
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.attachments')}</Text>
                                <Group gap="xs">
                                    {notification.attachments.map((attachment: any, index: number) => (
                                        <Badge key={index} variant="light" component="a" href={attachment.url} target="_blank" rel="noopener noreferrer">
                                            {attachment.filename}
                                        </Badge>
                                    ))}
                                </Group>
                            </Stack>
                        </Grid.Col>
                    )}

                    {notification.data && notification.data !== '{}' && (
                        <Grid.Col span={12}>
                            <Divider my="md" />
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>{t('fields.data')}</Text>
                                <Code block style={{ maxHeight: '300px', overflow: 'auto' }}>
                                    {JSON.stringify(typeof notification.data === 'string' ? JSON.parse(notification.data || '{}') : notification.data, null, 2)}
                                </Code>
                            </Stack>
                        </Grid.Col>
                    )}
                </Grid>
            </Paper>
        </Container>
    );
}
