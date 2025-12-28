'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Text, Button, Stack, Group, Progress, Center } from '@mantine/core';
import { IconClock, IconLogout, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

// JWT decode utility (without verification - client side only)
function decodeJWT(token: string): { exp?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1];
        if (!base64) return null;
        const payload = JSON.parse(atob(base64));
        return payload;
    } catch {
        return null;
    }
}

// Get access token from localStorage (set during login)
function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

// Get refresh token from localStorage (set during login)
function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
}

const WARNING_TIME = 60; // Show warning 60 seconds before expiry
const COUNTDOWN_INTERVAL = 1000; // Update countdown every second

export function SessionTimeoutWarning() {
    const { logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_TIME);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoggedOutRef = useRef(false);

    // Check if on auth page
    const isAuthPage = pathname?.includes('/login') ||
                       pathname?.includes('/register') ||
                       pathname?.includes('/welcome');

    // Check token expiration
    const checkTokenExpiration = useCallback(() => {
        if (!isAuthenticated || isAuthPage || hasLoggedOutRef.current) return;

        const accessToken = getAccessToken();
        if (!accessToken) {
            // No token - session might have ended
            return;
        }

        const payload = decodeJWT(accessToken);
        if (!payload?.exp) return;

        const now = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - now;

        // If token expired, logout immediately
        if (timeLeft <= 0) {
            handleSessionExpired();
            return;
        }

        // If less than WARNING_TIME seconds left, show warning
        if (timeLeft <= WARNING_TIME && !showWarning) {
            setShowWarning(true);
            setCountdown(timeLeft);
            startCountdown(timeLeft);
        }
    }, [isAuthenticated, isAuthPage, showWarning]);

    // Start countdown timer
    const startCountdown = useCallback((initialSeconds: number) => {
        // Clear any existing countdown
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        let remaining = initialSeconds;
        setCountdown(remaining);

        countdownIntervalRef.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);

            if (remaining <= 0) {
                handleSessionExpired();
            }
        }, COUNTDOWN_INTERVAL);
    }, []);

    // Handle session expired
    const handleSessionExpired = useCallback(() => {
        if (hasLoggedOutRef.current) return;
        hasLoggedOutRef.current = true;

        // Clear intervals
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        setShowWarning(false);
        logout();
    }, [logout]);

    // Extend session by refreshing token
    const handleExtendSession = async () => {
        setIsRefreshing(true);

        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                handleSessionExpired();
                return;
            }

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();

                // Update access token in localStorage
                if (data.data?.accessToken) {
                    localStorage.setItem('accessToken', data.data.accessToken);
                }

                // Clear countdown and hide warning
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
                setShowWarning(false);
                setCountdown(WARNING_TIME);
                hasLoggedOutRef.current = false;
            } else {
                // Refresh failed - logout
                handleSessionExpired();
            }
        } catch (error) {
            console.error('Failed to refresh session:', error);
            handleSessionExpired();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Set up token expiration check
    useEffect(() => {
        if (!isAuthenticated || isAuthPage) {
            // Clear intervals when not authenticated or on auth page
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setShowWarning(false);
            return;
        }

        // Reset logout flag when authenticated
        hasLoggedOutRef.current = false;

        // Check immediately
        checkTokenExpiration();

        // Check every 10 seconds
        checkIntervalRef.current = setInterval(checkTokenExpiration, 10000);

        return () => {
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isAuthenticated, isAuthPage, checkTokenExpiration]);

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
                        Oturum Süresi Doluyor
                    </Text>
                    <Text size="sm" c="dimmed">
                        Güvenliğiniz için oturumunuz sonlandırılmak üzere.
                        Devam etmek için aşağıdaki butona tıklayın.
                    </Text>
                </Stack>

                <Stack gap="xs">
                    <Text ta="center" size="lg" fw={600} c="orange">
                        {countdown} saniye
                    </Text>
                    <Progress
                        value={(countdown / WARNING_TIME) * 100}
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
                        Çıkış Yap
                    </Button>
                    <Button
                        color="green"
                        leftSection={<IconRefresh size={18} />}
                        onClick={handleExtendSession}
                        loading={isRefreshing}
                    >
                        Oturuma Devam Et
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
