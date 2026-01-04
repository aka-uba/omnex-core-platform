'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  PasswordInput,
  Button,
  Stack,
  ThemeIcon,
  Alert,
  Loader,
  Progress,
  Box,
  Select,
  ActionIcon,
  Group,
  useMantineColorScheme,
} from '@mantine/core';
import { IconLock, IconCheck, IconX, IconAlertCircle, IconArrowLeft, IconLanguage, IconSun, IconMoon } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { localeNames, locales } from '@/lib/i18n/config';

type PageStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'success' | 'error';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const locale = (params?.locale as string) || 'tr';
  const token = searchParams.get('token');
  const { t } = useTranslation('auth');

  const [status, setStatus] = useState<PageStatus>('loading');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (value: string | null) => {
    if (value && locales.includes(value)) {
      localStorage.setItem('preferred-locale', value);
      const newUrl = `/${value}/auth/reset-password${token ? `?token=${token}` : ''}`;
      router.push(newUrl);
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  // Password strength
  const getPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[a-z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordColor = passwordStrength < 50 ? 'red' : passwordStrength < 75 ? 'yellow' : 'green';

  const validateToken = useCallback(async () => {
    if (!token) {
      setStatus('invalid');
      setMessage(t('resetPassword.errors.invalidToken'));
      return;
    }

    try {
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (data.valid) {
        setStatus('valid');
        setUserName(data.user?.name || '');
      } else if (data.expired) {
        setStatus('expired');
        setMessage(data.message || t('resetPassword.expired.message'));
      } else {
        setStatus('invalid');
        setMessage(data.message || t('resetPassword.errors.invalidToken'));
      }
    } catch (error) {
      setStatus('error');
      setMessage(t('common.error'));
    }
  }, [token, t]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!password) {
      setFormError(t('resetPassword.errors.passwordRequired'));
      return;
    }
    if (password.length < 8) {
      setFormError(t('resetPassword.errors.passwordMinLength'));
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setFormError(t('resetPassword.errors.passwordUppercase'));
      return;
    }
    if (!/[a-z]/.test(password)) {
      setFormError(t('resetPassword.errors.passwordLowercase'));
      return;
    }
    if (!/[0-9]/.test(password)) {
      setFormError(t('resetPassword.errors.passwordNumber'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('resetPassword.errors.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || t('resetPassword.success.message'));
      } else {
        if (data.expired) {
          setStatus('expired');
          setMessage(data.message);
        } else {
          setFormError(data.message || t('common.error'));
        }
      }
    } catch (error) {
      setFormError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/auth/login`);
  };

  const handleGoToForgotPassword = () => {
    router.push(`/${locale}/auth/forgot-password`);
  };

  const isDark = mounted && colorScheme === 'dark';

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

  // Loading state
  if (status === 'loading') {
    return (
      <Box style={wrapperStyle}>
        <TopControls />
        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <Loader size="xl" />
              <Title order={2}>{t('activate.loading.title')}</Title>
              <Text c="dimmed" ta="center">
                {t('activate.loading.message')}
              </Text>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <Box style={wrapperStyle}>
        <TopControls />
        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={40} color="green">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2} c="green">{t('resetPassword.success.title')}</Title>
              <Text c="dimmed" ta="center">
                {message}
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

  // Invalid or expired token
  if (status === 'invalid' || status === 'expired' || status === 'error') {
    return (
      <Box style={wrapperStyle}>
        <TopControls />
        <Container size="xs">
          <Paper shadow="xl" radius="lg" p={40} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={40} color={status === 'expired' ? 'orange' : 'red'}>
                {status === 'expired' ? <IconAlertCircle size={48} /> : <IconX size={48} />}
              </ThemeIcon>
              <Title order={2} c={status === 'expired' ? 'orange' : 'red'}>
                {status === 'expired' ? t('resetPassword.expired.title') : t('activate.error.title')}
              </Title>
              <Text c="dimmed" ta="center">
                {message}
              </Text>
              <Stack w="100%" mt="md">
                <Button
                  size="lg"
                  onClick={handleGoToForgotPassword}
                  variant="light"
                >
                  {t('forgotPassword.submit')}
                </Button>
                <Button
                  size="md"
                  variant="subtle"
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={handleGoToLogin}
                >
                  {t('forgotPassword.backToLogin')}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Valid token - show password reset form
  return (
    <Box style={wrapperStyle}>
      <TopControls />
      <Container size="xs">
        <Paper shadow="xl" radius="lg" p={40} withBorder>
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <ThemeIcon size={60} radius={30} color="blue">
                <IconLock size={32} />
              </ThemeIcon>
              <Title order={2}>{t('resetPassword.title')}</Title>
              {userName && (
                <Text c="dimmed" ta="center">
                  {t('resetPassword.subtitle')}
                </Text>
              )}
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {formError && (
                  <Alert color="red" icon={<IconAlertCircle size={18} />}>
                    {formError}
                  </Alert>
                )}

                <PasswordInput
                  label={t('resetPassword.password')}
                  placeholder={t('resetPassword.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                  size="md"
                />

                {password && (
                  <div>
                    <Progress value={passwordStrength} color={passwordColor} size="sm" mb={4} />
                  </div>
                )}

                <PasswordInput
                  label={t('resetPassword.confirmPassword')}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  required
                  size="md"
                  error={confirmPassword && password !== confirmPassword ? t('resetPassword.errors.passwordMismatch') : undefined}
                />

                <Button
                  type="submit"
                  loading={isSubmitting}
                  fullWidth
                  size="lg"
                  mt="md"
                  disabled={passwordStrength < 100 || password !== confirmPassword}
                >
                  {t('resetPassword.submit')}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
