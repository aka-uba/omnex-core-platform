'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Loader,
  ThemeIcon,
  Alert,
  Box,
  RingProgress,
  Center,
  useMantineColorScheme,
  Select,
  ActionIcon,
  Group,
} from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle, IconRefresh, IconLanguage, IconSun, IconMoon } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { localeNames, locales } from '@/lib/i18n/config';

type ActivationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already-activated';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

const REDIRECT_COUNTDOWN = 5; // seconds

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const locale = (params?.locale as string) || 'tr';
  const token = searchParams.get('token');

  const { t } = useTranslation('auth');

  const [status, setStatus] = useState<ActivationStatus>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN);
  const [mounted, setMounted] = useState(false);

  const activateAccount = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setMessage(t('activate.error.message'));
      return;
    }

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyActivated) {
          setStatus('already-activated');
          setMessage(t('activate.alreadyActive.message'));
        } else {
          setStatus('success');
          setMessage(data.message || t('activate.success.message'));
        }
      } else {
        if (data.expired) {
          setStatus('expired');
          setMessage(data.message || t('activate.expired.message'));
        } else {
          setStatus('error');
          setMessage(data.message || t('activate.error.message'));
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage(t('activate.error.generic'));
    }
  }, [token, t]);

  useEffect(() => {
    setMounted(true);
    if (token) {
      activateAccount();
    } else {
      setStatus('error');
      setMessage(t('activate.error.message'));
    }
  }, [token, activateAccount, t]);

  // Countdown and redirect for success states
  useEffect(() => {
    if (status === 'success' || status === 'already-activated') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(`/${locale}/auth/login`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [status, locale, router]);

  const handleLocaleChange = (value: string | null) => {
    if (value && locales.includes(value)) {
      localStorage.setItem('preferred-locale', value);
      // Full page reload required for i18n provider to load new locale
      const newUrl = `/${value}/auth/activate${token ? `?token=${token}` : ''}`;
      window.location.href = newUrl;
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleResendActivation = () => {
    router.push(`/${locale}/auth/resend-activation`);
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/auth/login`);
  };

  const isDark = mounted && colorScheme === 'dark';

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#1a1b1e' : '#f8f9fa',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Top Right Controls */}
      <Box
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}
      >
        <Group gap="xs">
          <Select
            data={languageOptions}
            value={locale}
            onChange={handleLocaleChange}
            size="xs"
            w={120}
            leftSection={mounted ? <IconLanguage size={14} /> : null}
          />
          <ActionIcon
            variant="default"
            size="md"
            onClick={toggleColorScheme}
            aria-label="Toggle color scheme"
          >
            {mounted && (isDark ? <IconSun size={18} /> : <IconMoon size={18} />)}
          </ActionIcon>
        </Group>
      </Box>

      <Container size="xs">
        <Paper shadow="xl" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            {status === 'loading' && (
              <>
                <Loader size="xl" />
                <Title order={2} ta="center">{t('activate.loading.title')}</Title>
                <Text c="dimmed" ta="center">
                  {t('activate.loading.message')}
                </Text>
              </>
            )}

            {status === 'success' && (
              <>
                <ThemeIcon size={100} radius={50} color="green" variant="light">
                  <IconCheck size={60} stroke={2} />
                </ThemeIcon>
                <Title order={2} c="green" ta="center">
                  {t('activate.success.title')}
                </Title>
                <Text ta="center" size="lg">
                  {message}
                </Text>
                <Box mt="md">
                  <Center>
                    <RingProgress
                      size={80}
                      thickness={6}
                      roundCaps
                      sections={[{ value: (countdown / REDIRECT_COUNTDOWN) * 100, color: 'blue' }]}
                      label={
                        <Center>
                          <Text size="lg" fw={700}>{countdown}</Text>
                        </Center>
                      }
                    />
                  </Center>
                  <Text c="dimmed" ta="center" size="sm" mt="xs">
                    {t('activate.success.redirecting')}
                  </Text>
                </Box>
                <Button
                  size="lg"
                  onClick={handleGoToLogin}
                  fullWidth
                  mt="md"
                >
                  {t('activate.button.login')}
                </Button>
              </>
            )}

            {status === 'already-activated' && (
              <>
                <ThemeIcon size={100} radius={50} color="blue" variant="light">
                  <IconCheck size={60} stroke={2} />
                </ThemeIcon>
                <Title order={2} ta="center">
                  {t('activate.alreadyActive.title')}
                </Title>
                <Text ta="center" size="lg">
                  {message}
                </Text>
                <Box mt="md">
                  <Center>
                    <RingProgress
                      size={80}
                      thickness={6}
                      roundCaps
                      sections={[{ value: (countdown / REDIRECT_COUNTDOWN) * 100, color: 'blue' }]}
                      label={
                        <Center>
                          <Text size="lg" fw={700}>{countdown}</Text>
                        </Center>
                      }
                    />
                  </Center>
                  <Text c="dimmed" ta="center" size="sm" mt="xs">
                    {t('activate.success.redirecting')}
                  </Text>
                </Box>
                <Button
                  size="lg"
                  onClick={handleGoToLogin}
                  fullWidth
                  mt="md"
                >
                  {t('activate.button.login')}
                </Button>
              </>
            )}

            {status === 'expired' && (
              <>
                <ThemeIcon size={100} radius={50} color="orange" variant="light">
                  <IconAlertCircle size={60} stroke={2} />
                </ThemeIcon>
                <Title order={2} c="orange" ta="center">
                  {t('activate.expired.title')}
                </Title>
                <Text ta="center">
                  {message}
                </Text>
                <Alert color="orange" mt="md" w="100%">
                  {t('activate.expired.hint')}
                </Alert>
                <Button
                  size="lg"
                  leftSection={<IconRefresh size={20} />}
                  onClick={handleResendActivation}
                  fullWidth
                  variant="light"
                >
                  {t('activate.button.resend')}
                </Button>
                <Button
                  size="md"
                  variant="subtle"
                  onClick={handleGoToLogin}
                  fullWidth
                >
                  {t('activate.button.back')}
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <ThemeIcon size={100} radius={50} color="red" variant="light">
                  <IconX size={60} stroke={2} />
                </ThemeIcon>
                <Title order={2} c="red" ta="center">
                  {t('activate.error.title')}
                </Title>
                <Text ta="center">
                  {message}
                </Text>
                <Stack w="100%" mt="md">
                  <Button
                    size="lg"
                    leftSection={<IconRefresh size={20} />}
                    onClick={handleResendActivation}
                    variant="light"
                  >
                    {t('activate.button.resend')}
                  </Button>
                  <Button
                    size="md"
                    variant="subtle"
                    onClick={handleGoToLogin}
                  >
                    {t('activate.button.back')}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
