'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  ThemeIcon,
  Alert,
  Anchor,
  Group,
  Box,
  Select,
  ActionIcon,
  useMantineColorScheme,
} from '@mantine/core';
import { IconMail, IconCheck, IconArrowLeft, IconAlertCircle, IconLanguage, IconSun, IconMoon } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { localeNames, locales } from '@/lib/i18n/config';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

export default function ForgotPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const handleLocaleChange = (value: string | null) => {
    if (value && locales.includes(value)) {
      localStorage.setItem('preferred-locale', value);
      // Full page reload required for i18n provider to load new locale
      window.location.href = `/${value}/auth/forgot-password`;
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsActivation(false);

    if (!email) {
      setError(t('forgotPassword.errors.emailRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.message);
      } else if (data.needsActivation) {
        setNeedsActivation(true);
        setError(data.message);
      } else if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || t('common.error'));
      }
    } catch (error) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/auth/login`);
  };

  const handleResendActivation = () => {
    router.push(`/${locale}/auth/resend-activation?email=${encodeURIComponent(email)}`);
  };

  const isDark = mounted && colorScheme === 'dark';

  if (isSubmitted) {
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
        <Box style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <Group gap="xs">
            <Select
              data={languageOptions}
              value={locale}
              onChange={handleLocaleChange}
              size="xs"
              w={120}
              leftSection={mounted ? <IconLanguage size={14} /> : null}
            />
            <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
              {mounted && (isDark ? <IconSun size={18} /> : <IconMoon size={18} />)}
            </ActionIcon>
          </Group>
        </Box>

        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={40} color="green">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2}>{t('forgotPassword.success.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('forgotPassword.success.message')}
              </Text>
              <Button
                size="lg"
                leftSection={<IconArrowLeft size={20} />}
                onClick={handleGoToLogin}
                fullWidth
                variant="light"
                mt="md"
              >
                {t('forgotPassword.backToLogin')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

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
      <Box style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <Group gap="xs">
          <Select
            data={languageOptions}
            value={locale}
            onChange={handleLocaleChange}
            size="xs"
            w={120}
            leftSection={mounted ? <IconLanguage size={14} /> : null}
          />
          <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
            {mounted && (isDark ? <IconSun size={18} /> : <IconMoon size={18} />)}
          </ActionIcon>
        </Group>
      </Box>

      <Container size="xs">
        <Paper shadow="xl" radius="lg" p={40} withBorder>
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <ThemeIcon size={60} radius={30} color="blue">
                <IconMail size={32} />
              </ThemeIcon>
              <Title order={2}>{t('forgotPassword.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('forgotPassword.subtitle')}
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {error && (
                  <Alert color={needsActivation ? 'orange' : 'red'} icon={<IconAlertCircle size={18} />}>
                    {error}
                  </Alert>
                )}

                {needsActivation && (
                  <Button
                    variant="light"
                    color="orange"
                    onClick={handleResendActivation}
                    fullWidth
                  >
                    {t('resendActivation.submit')}
                  </Button>
                )}

                <TextInput
                  label={t('forgotPassword.email')}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  type="email"
                  required
                  size="md"
                />

                <Button
                  type="submit"
                  loading={isLoading}
                  fullWidth
                  size="lg"
                  mt="md"
                >
                  {t('forgotPassword.submit')}
                </Button>
              </Stack>
            </form>

            <Group justify="center" mt="md">
              <Anchor size="sm" onClick={handleGoToLogin} style={{ cursor: 'pointer' }}>
                {t('forgotPassword.backToLogin')}
              </Anchor>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
