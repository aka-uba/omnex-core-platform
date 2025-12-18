'use client';

import { Modal, Paper, Title, Text, Group, Stack, Grid, Code, Button, Skeleton, Badge, Divider } from '@mantine/core';
import { useNotification } from '../hooks/useNotifications';
import { useTranslation } from '@/lib/i18n/client';
import { NotificationStatusBadge } from './shared/NotificationStatusBadge';
import { NotificationTypeIcon } from './shared/NotificationTypeIcon';
import { PriorityIndicator } from './shared/PriorityIndicator';
import { IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NotificationViewModalProps {
    opened: boolean;
    onClose: () => void;
    notificationId: string;
}

export function NotificationViewModal({ opened, onClose, notificationId }: NotificationViewModalProps) {
    const { t } = useTranslation('modules/notifications');
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';
    const { data: notification, isLoading } = useNotification(notificationId);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="sm">
                    {notification && <NotificationTypeIcon type={notification.type as any} size="md" />}
                    <Text fw={600} size="lg">
                        {t('actions.view')}
                    </Text>
                </Group>
            }
            size="lg"
            centered
            styles={{
                header: {
                    padding: 'var(--mantine-spacing-lg)',
                },
                body: {
                    padding: 'var(--mantine-spacing-lg)',
                },
            }}
        >
            {isLoading ? (
                <Stack gap="md">
                    <Skeleton height={40} />
                    <Skeleton height={100} />
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                </Stack>
            ) : !notification ? (
                <Text c="dimmed">{t('validation.not_found')}</Text>
            ) : (
                <Stack gap="md">
                    {/* Header Section */}
                    <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Title order={4}>{notification.title}</Title>
                            <Text size="sm" c="dimmed">ID: {notification.id}</Text>
                        </Stack>
                        <Button
                            component={Link}
                            href={`/${currentLocale}/modules/notifications/${notificationId}/edit`}
                            leftSection={<IconEdit size={16} />}
                            variant="light"
                            size="sm"
                            onClick={onClose}
                        >
                            {t('actions.edit')}
                        </Button>
                    </Group>

                    {/* Status and Priority */}
                    <Group gap="md">
                        <NotificationStatusBadge
                            isRead={notification.status === 'read' || notification.isRead || notification.is_read}
                            isGlobal={notification.isGlobal || notification.is_global}
                            size="lg"
                        />
                        {notification.priority && (
                            <PriorityIndicator priority={notification.priority as any} size="lg" />
                        )}
                    </Group>

                    {/* Message */}
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            {t('fields.message')}
                        </Text>
                        <Paper p="md" bg="var(--mantine-color-gray-0)" withBorder>
                            <Text>{notification.message}</Text>
                        </Paper>
                    </Stack>

                    {/* Details Grid */}
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>
                                    {t('fields.sender')}
                                </Text>
                                <Text>{notification.sender?.name || '-'}</Text>
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>
                                    {t('fields.recipient')}
                                </Text>
                                <Text>
                                    {notification.recipient?.name 
                                        || (notification.isGlobal || notification.is_global ? t('status.global') : '-')}
                                </Text>
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>
                                    {t('fields.created_at')}
                                </Text>
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
                                    <Text size="sm" fw={500}>
                                        {t('fields.read_at')}
                                    </Text>
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
                                    <Text size="sm" fw={500}>
                                        {t('fields.expires_at')}
                                    </Text>
                                    <Text>
                                        {notification.expiresAt 
                                            ? new Date(notification.expiresAt).toLocaleString() 
                                            : new Date(notification.expires_at).toLocaleString()}
                                    </Text>
                                </Stack>
                            </Grid.Col>
                        )}

                        {notification.location && (
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Stack gap="xs">
                                    <Text size="sm" fw={500}>
                                        {t('fields.location')}
                                    </Text>
                                    <Text>{notification.location.name || notification.location_id || '-'}</Text>
                                </Stack>
                            </Grid.Col>
                        )}
                    </Grid>

                    {/* Type Badge */}
                    {notification.type && (
                        <Group gap="xs">
                            <Text size="sm" fw={500}>{t('fields.type')}:</Text>
                            <Badge variant="light" color="gray">
                                {t(`type.${notification.type}`) || notification.type}
                            </Badge>
                        </Group>
                    )}

                    {/* Task Action Details */}
                    {notification.type === 'task' && (notification.actionUrl || notification.action_url || notification.actionText || notification.action_text) && (
                        <Paper p="md" withBorder>
                            <Text size="sm" fw={500} mb="md">
                                {t('task_details.title')}
                            </Text>
                            {(notification.actionText || notification.action_text) && (
                                <Group gap="xs" mb="xs">
                                    <Text size="sm" fw={500}>
                                        {t('fields.action_text')}:
                                    </Text>
                                    <Text size="sm">{notification.actionText || notification.action_text}</Text>
                                </Group>
                            )}
                            {(notification.actionUrl || notification.action_url) && (
                                <Text size="sm" c="blue" component="a" href={notification.actionUrl || notification.action_url} target="_blank" rel="noopener noreferrer">
                                    {notification.actionUrl || notification.action_url}
                                </Text>
                            )}
                        </Paper>
                    )}

                    {/* Attachments */}
                    {notification.attachments && notification.attachments.length > 0 && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                {t('fields.attachments')}
                            </Text>
                            <Group gap="xs">
                                {notification.attachments.map((attachment: any, index: number) => (
                                    <Badge key={index} variant="light" component="a" href={attachment.url} target="_blank" rel="noopener noreferrer">
                                        {attachment.filename}
                                    </Badge>
                                ))}
                            </Group>
                        </Stack>
                    )}

                    {/* Additional Data */}
                    {notification.data && notification.data !== '{}' && (
                        <Stack gap="xs">
                            <Divider />
                            <Text size="sm" fw={500}>
                                {t('fields.data')}
                            </Text>
                            <Code block style={{ maxHeight: '200px', overflow: 'auto' }}>
                                {JSON.stringify(typeof notification.data === 'string' ? JSON.parse(notification.data || '{}') : notification.data, null, 2)}
                            </Code>
                        </Stack>
                    )}

                </Stack>
            )}
        </Modal>
    );
}

