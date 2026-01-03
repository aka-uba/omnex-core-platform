'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Text, Button, Stack, Group, Progress, Center } from '@mantine/core';
import { IconClock, IconLogout, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

// Activity tracking constants
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const WARNING_BEFORE_TIMEOUT = 60; // Show warning 60 seconds before timeout
const CHECK_INTERVAL = 1000; // Check every second

// Storage keys
const LAST_ACTIVITY_KEY = 'omnex-last-activity';
const SESSION_MARKER_KEY = 'omnex-session-active';
const SESSION_INITIALIZED_KEY = 'omnex-session-initialized';

export function SessionTimeoutWarning() {
    const { logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const { t } = useTranslation('global');
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_BEFORE_TIMEOUT);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30); // Default 30 minutes
    const [isInitialized, setIsInitialized] = useState(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoggedOutRef = useRef(false);
    const lastActivityUpdateRef = useRef<number>(0);
    const showWarningRef = useRef(false);

    // Keep ref in sync with state
    useEffect(() => {
        showWarningRef.current = showWarning;
    }, [showWarning]);

    // Check if on auth page
    const isAuthPage = pathname?.includes('/login') ||
                       pathname?.includes('/register') ||
                       pathname?.includes('/welcome') ||
                       pathname?.includes('/forgot-password');

    // Get last activity timestamp from localStorage (persists across tabs)
    const getLastActivity = useCallback((): number => {
        if (typeof window === 'undefined') return Date.now();
        const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
        return stored ? parseInt(stored, 10) : Date.now();
    }, []);

    // Update last activity timestamp
    const updateLastActivity = useCallback(() => {
        if (typeof window === 'undefined') return;
        const now = Date.now();
        // Throttle updates to prevent excessive writes
        if (now - lastActivityUpdateRef.current < 1000) return;
        lastActivityUpdateRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    }, []);

    // Handle session expired
    const handleSessionExpired = useCallback(() => {
        if (hasLoggedOutRef.current) return;
        hasLoggedOutRef.current = true;

        // Clear intervals
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }

        // Clear storage
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SESSION_INITIALIZED_KEY);
        sessionStorage.removeItem(SESSION_MARKER_KEY);

        setShowWarning(false);
        logout();
    }, [logout]);

    // Extend session
    const handleExtendSession = useCallback(async () => {
        setIsRefreshing(true);

        try {
            // Update last activity
            const now = Date.now();
            localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
            lastActivityUpdateRef.current = now;

            // Try to refresh token if available
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.data?.accessToken) {
                        localStorage.setItem('accessToken', data.data.accessToken);
                    }
                }
            }

            setShowWarning(false);
            setCountdown(WARNING_BEFORE_TIMEOUT);
            hasLoggedOutRef.current = false;
        } catch (error) {
            console.error('Failed to extend session:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Fetch session timeout setting
    useEffect(() => {
        if (!isAuthenticated || isAuthPage) return;

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/general-settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.data?.sessionTimeout) {
                        setSessionTimeout(data.data.sessionTimeout);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch session settings:', error);
            }
        };

        fetchSettings();
    }, [isAuthenticated, isAuthPage]);

    // Initialize session and check for browser restart
    useEffect(() => {
        if (typeof window === 'undefined' || !isAuthenticated || isAuthPage) return;

        const sessionMarker = sessionStorage.getItem(SESSION_MARKER_KEY);
        const wasInitialized = localStorage.getItem(SESSION_INITIALIZED_KEY);

        // Case 1: Session marker exists - same browser session, continue
        if (sessionMarker) {
            setIsInitialized(true);
            return;
        }

        // Case 2: No session marker but was initialized before - browser was restarted
        if (wasInitialized && !sessionMarker) {
            // Browser was closed and reopened - force logout
            handleSessionExpired();
            return;
        }

        // Case 3: Fresh login - set both markers
        sessionStorage.setItem(SESSION_MARKER_KEY, 'true');
        localStorage.setItem(SESSION_INITIALIZED_KEY, 'true');
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        setIsInitialized(true);

    }, [isAuthenticated, isAuthPage, handleSessionExpired]);

    // Check inactivity timeout - using ref for showWarning to avoid stale closure
    const checkInactivityTimeout = useCallback(() => {
        if (!isAuthenticated || isAuthPage || hasLoggedOutRef.current || !isInitialized) return;

        const lastActivity = getLastActivity();
        const now = Date.now();
        const inactiveMs = now - lastActivity;
        const timeoutMs = sessionTimeout * 60 * 1000; // Convert minutes to ms
        const warningMs = timeoutMs - (WARNING_BEFORE_TIMEOUT * 1000);

        // If inactive time exceeds timeout, logout immediately
        if (inactiveMs >= timeoutMs) {
            handleSessionExpired();
            return;
        }

        // If approaching timeout, show warning
        if (inactiveMs >= warningMs) {
            const remainingSeconds = Math.ceil((timeoutMs - inactiveMs) / 1000);
            setCountdown(remainingSeconds);
            if (!showWarningRef.current) {
                setShowWarning(true);
            }
        } else {
            // Not in warning zone, reset
            if (showWarningRef.current) {
                setShowWarning(false);
                setCountdown(WARNING_BEFORE_TIMEOUT);
            }
        }
    }, [isAuthenticated, isAuthPage, sessionTimeout, getLastActivity, handleSessionExpired, isInitialized]);

    // Set up activity tracking
    useEffect(() => {
        if (!isAuthenticated || isAuthPage || !isInitialized) return;

        // Track user activity
        const activityHandler = () => {
            updateLastActivity();
            // If warning is showing, user activity should extend session
            if (showWarningRef.current) {
                handleExtendSession();
            }
        };

        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, activityHandler, { passive: true });
        });

        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
        };
    }, [isAuthenticated, isAuthPage, updateLastActivity, handleExtendSession, isInitialized]);

    // Set up inactivity check interval
    useEffect(() => {
        if (!isAuthenticated || isAuthPage || !isInitialized) {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            setShowWarning(false);
            return;
        }

        // Reset logout flag
        hasLoggedOutRef.current = false;

        // Check immediately
        checkInactivityTimeout();

        // Check every second
        checkIntervalRef.current = setInterval(checkInactivityTimeout, CHECK_INTERVAL);

        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
        };
    }, [isAuthenticated, isAuthPage, checkInactivityTimeout, isInitialized]);

    // Handle visibility change
    useEffect(() => {
        if (typeof window === 'undefined' || !isInitialized) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                // When tab becomes visible, check if session marker still exists
                const sessionMarker = sessionStorage.getItem(SESSION_MARKER_KEY);
                if (!sessionMarker) {
                    handleSessionExpired();
                    return;
                }
                checkInactivityTimeout();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, checkInactivityTimeout, handleSessionExpired, isInitialized]);

    // Don't render on auth pages
    if (isAuthPage) return null;

    return (
        <Modal
            opened={showWarning}
            onClose={() => {}} // Prevent closing by clicking outside
            withCloseButton={false}
            centered
            size="sm"
            styles={{
                content: {
                    borderRadius: 'var(--mantine-radius-lg)',
                },
            }}
        >
            <Stack gap="lg" py="md">
                <Center>
                    <IconClock size={64} color="var(--mantine-color-orange-6)" />
                </Center>

                <Stack gap="xs" ta="center">
                    <Text size="xl" fw={600}>
                        {t('session.timeoutWarning.title')}
                    </Text>
                    <Text size="sm" c="dimmed">
                        {t('session.timeoutWarning.message')}
                    </Text>
                </Stack>

                <Stack gap="xs">
                    <Text ta="center" size="lg" fw={600} c="orange">
                        {countdown} {t('session.timeoutWarning.seconds')}
                    </Text>
                    <Progress
                        value={(countdown / WARNING_BEFORE_TIMEOUT) * 100}
                        color="orange"
                        size="sm"
                        radius="xl"
                        animated
                    />
                </Stack>

                <Group grow>
                    <Button
                        variant="outline"
                        color="red"
                        leftSection={<IconLogout size={18} />}
                        onClick={handleSessionExpired}
                    >
                        {t('session.timeoutWarning.logout')}
                    </Button>
                    <Button
                        color="green"
                        leftSection={<IconRefresh size={18} />}
                        onClick={handleExtendSession}
                        loading={isRefreshing}
                    >
                        {t('session.timeoutWarning.extend')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
