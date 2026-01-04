'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
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

export default function ResendActivationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [alreadyActivated, setAlreadyActivated] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get email from URL if provided
  useEffect(() => {
    setMounted(true);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLocaleChange = (value: string | null) => {
    if (value && locales.includes(value)) {
      localStorage.setItem('preferred-locale', value);
      router.push(`/${value}/auth/resend-activation${email ? `?email=${encodeURIComponent(email)}` : ''}`);
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAlreadyActivated(false);

    if (!email) {
      setError(t('resendActivation.errors.emailRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.message);
      } else if (data.alreadyActivated) {
        setAlreadyActivated(true);
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

  const isDark = mounted && colorScheme === 'dark';

  const wrapperStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1a1b1e' : '#f8f9fa',
    padding: '20px',
    position: 'relative' as const,
  };

  const TopControls = () => (
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
  );

  if (isSubmitted) {
    return (
      <Box style={wrapperStyle}>
        <TopControls />
        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={40} color="green">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2}>{t('resendActivation.success.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('resendActivation.success.message')}
              </Text>
              <Button
                size="lg"
                leftSection={<IconArrowLeft size={20} />}
                onClick={handleGoToLogin}
                fullWidth
                variant="light"
                mt="md"
              >
                {t('resendActivation.backToLogin')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (alreadyActivated) {
    return (
      <Box style={wrapperStyle}>
        <TopControls />
        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={40} color="blue">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2}>{t('activate.alreadyActive.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('activate.alreadyActive.message')}
              </Text>
              <Button
                size="lg"
                onClick={handleGoToLogin}
                fullWidth
                mt="md"
              >
                {t('login.submit')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={wrapperStyle}>
      <TopControls />
      <Container size="xs">
        <Paper shadow="xl" radius="lg" p={40} withBorder>
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <ThemeIcon size={60} radius={30} color="blue">
                <IconMail size={32} />
              </ThemeIcon>
              <Title order={2}>{t('resendActivation.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('resendActivation.subtitle')}
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {error && (
                  <Alert color="red" icon={<IconAlertCircle size={18} />}>
                    {error}
                  </Alert>
                )}

                <TextInput
                  label={t('resendActivation.email')}
                  placeholder={t('resendActivation.emailPlaceholder')}
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
                  {t('resendActivation.submit')}
                </Button>
              </Stack>
            </form>

            <Group justify="center" mt="md">
              <Anchor size="sm" onClick={handleGoToLogin} style={{ cursor: 'pointer' }}>
                {t('resendActivation.backToLogin')}
              </Anchor>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
