'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ActionIcon, Indicator, Menu, Text, Group, Stack, ScrollArea, Avatar, Box, Button, Divider, useMantineColorScheme } from '@mantine/core';
import { IconBell, IconCheck, IconSettings } from '@tabler/icons-react';
import { useNotifications } from '../hooks/useNotifications';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { ClientIcon } from '@/components/common/ClientIcon';
import styles from './NotificationBell.module.css';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'task';
    created_at: string;
    read: boolean;
}

// Track shown browser notifications to prevent duplicates
const shownBrowserNotifications = new Set<string>();

export function NotificationBell() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation('modules/notifications');
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const { data: notificationsData, refetch } = useNotifications({
        archived: false,
        is_read: false, // Only show unread notifications in bell
        pageSize: 10
    });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const previousNotificationIds = useRef<Set<string>>(new Set());

    // Show browser notification (only once per notification)
    const showBrowserNotification = useCallback((notification: Notification) => {
        // Check if we've already shown this notification
        if (shownBrowserNotifications.has(notification.id)) {
            return;
        }

        // Mark as shown immediately to prevent duplicates
        shownBrowserNotifications.add(notification.id);

        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotif = new window.Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id, // Prevents duplicate notifications with same tag
                requireInteraction: false,
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                browserNotif.close();
            }, 5000);

            // Handle click
            browserNotif.onclick = () => {
                window.focus();
                browserNotif.close();
                const locale = pathname?.split('/')[1] || 'tr';
                router.push(`/${locale}/modules/notifications/dashboard?view=${notification.id}`);
            };
        }
    }, [pathname, router]);

    // Initialize notifications from query data and handle new notifications
    useEffect(() => {
        if (notificationsData && notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
            const mapped = notificationsData.notifications.map((n: {
                id: string;
                title: string;
                message: string;
                type: string;
                createdAt: string;
                isRead?: boolean;
                status?: string;
            }) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: (n.type || 'info') as Notification['type'],
                created_at: n.createdAt || new Date().toISOString(),
                read: n.isRead === true || n.status === 'read'
            }));

            // Check for new notifications
            const currentIds = new Set<string>(mapped.map((n: Notification) => n.id));
            const newNotifications = mapped.filter((n: Notification) =>
                !previousNotificationIds.current.has(n.id) && !n.read
            );

            // Show browser notification for each new unread notification
            if (previousNotificationIds.current.size > 0 && newNotifications.length > 0) {
                newNotifications.forEach((notification: Notification) => {
                    showBrowserNotification(notification);
                });

                // Shake the bell icon
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 1000);
            }

            // Update previous IDs
            previousNotificationIds.current = currentIds;

            setNotifications(mapped);
            setUnreadCount(mapped.filter((n: { read: boolean }) => !n.read).length);
        } else {
            // Handle empty or invalid data
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [notificationsData, showBrowserNotification]);

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    // Poll for new notifications every 10 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 10000);

        return () => clearInterval(interval);
    }, [refetch]);



    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = (notificationId: string) => {
        // Get current locale from pathname
        const locale = pathname?.split('/')[1] || 'tr';
        // Use dashboard path since /modules/notifications redirects to dashboard
        const notificationsPath = `/${locale}/modules/notifications/dashboard`;
        
        // Check if we're already on notifications page (dashboard or list)
        const isOnNotificationsPage = pathname?.includes('/modules/notifications');
        
        // Mark as read first
        handleMarkAsRead(notificationId);
        
        if (isOnNotificationsPage) {
            // If already on notifications page, just trigger modal via URL query param
            const url = new URL(window.location.href);
            url.searchParams.set('view', notificationId);
            window.history.pushState({}, '', url.toString());
            // Dispatch custom event to notify NotificationsTable
            window.dispatchEvent(new CustomEvent('notification-view', { detail: { notificationId } }));
        } else {
            // Navigate to notifications dashboard page with query param
            router.push(`${notificationsPath}?view=${notificationId}`);
        }
    };

    const lastFourNotifications = notifications.slice(0, 4);

    return (
        <Menu shadow="md" width={320} position="bottom-end" withArrow>
            <Menu.Target>
                <Indicator
                    label={unreadCount}
                    size={16}
                    offset={4}
                    color="red"
                    disabled={unreadCount === 0}
                    inline
                >
                    <ActionIcon
                        variant="subtle"
                        size="lg"
                        className={`${styles.bellButton}${isShaking ? ` ${styles.shake}` : ''}`}
                        aria-label={t('bell.ariaLabel')}
                    >
                        <ClientIcon>
                            <IconBell size={20} />
                        </ClientIcon>
                    </ActionIcon>
                </Indicator>
            </Menu.Target>

            <Menu.Dropdown p={0} {...(styles.notificationDropdown ? { className: styles.notificationDropdown } : {})}>
                <Box 
                    p="sm" 
                    style={{
                        backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                        borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`
                    }}
                >
                    <Group justify="space-between">
                        <Text size="sm" fw={600} c={isDark ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-dark-9)'}>
                            {t('title')}
                        </Text>
                        {unreadCount > 0 && (
                            <Button variant="subtle" size="xs" onClick={handleMarkAllAsRead} leftSection={
                                <ClientIcon>
                                    <IconCheck size={12} />
                                </ClientIcon>
                            }>
                                {t('actions.mark_read')}
                            </Button>
                        )}
                    </Group>
                </Box>

                <ScrollArea.Autosize 
                    mah={300}
                    {...(styles.notificationScrollArea ? { className: styles.notificationScrollArea } : {})}
                >
                    {lastFourNotifications.length > 0 ? (
                        <Stack gap={0}>
                            {lastFourNotifications.map((notification) => (
                                <Menu.Item
                                    key={notification.id}
                                    p="sm"
                                    style={{
                                        borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
                                        backgroundColor: notification.read 
                                            ? 'transparent' 
                                            : isDark 
                                                ? 'rgba(13, 127, 242, 0.15)' 
                                                : 'var(--mantine-color-blue-0)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleNotificationClick(notification.id)}
                                >
                                    <Group align="flex-start" wrap="nowrap">
                                        <Avatar radius="xl" color={notification.type === 'error' ? 'red' : 'blue'}>
                                            {notification.type === 'error' ? '!' : 'i'}
                                        </Avatar>
                                        <Box style={{ flex: 1 }}>
                                            <Text 
                                                size="sm" 
                                                fw={500} 
                                                lineClamp={1}
                                                c={isDark ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-dark-9)'}
                                            >
                                                {notification.title}
                                            </Text>
                                            <Text 
                                                size="xs" 
                                                c={isDark ? 'var(--mantine-color-gray-4)' : 'dimmed'} 
                                                lineClamp={2}
                                            >
                                                {notification.message}
                                            </Text>
                                            <Text 
                                                size="xs" 
                                                c={isDark ? 'var(--mantine-color-gray-5)' : 'dimmed'} 
                                                mt={4}
                                            >
                                                {new Date(notification.created_at).toLocaleTimeString()}
                                            </Text>
                                        </Box>
                                        {!notification.read && (
                                            <Box 
                                                w={8} 
                                                h={8} 
                                                bg={isDark ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-blue-6)'} 
                                                style={{ borderRadius: '50%' }} 
                                            />
                                        )}
                                    </Group>
                                </Menu.Item>
                            ))}
                        </Stack>
                    ) : (
                        <Box p="xl" ta="center">
                            <Text 
                                size="sm" 
                                c={isDark ? 'var(--mantine-color-gray-5)' : 'dimmed'}
                            >
                                {t('status.no_notifications')}
                            </Text>
                        </Box>
                    )}
                </ScrollArea.Autosize>

                <Divider />

                <Box p={4}>
                    <Menu.Item
                        leftSection={
                            <ClientIcon>
                                <IconSettings size={14} />
                            </ClientIcon>
                        }
                        onClick={() => {
                            const locale = pathname?.split('/')[1] || 'tr';
                            router.push(`/${locale}/modules/notifications`);
                        }}
                    >
                        {t('menu.items.list')}
                    </Menu.Item>
                </Box>
            </Menu.Dropdown>
        </Menu>
    );
}
