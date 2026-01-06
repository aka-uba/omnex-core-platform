'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Stack,
  Alert,
  Group,
  Divider,
  ActionIcon,
  Select,
  Box,
  Image,
  useMantineColorScheme,
} from '@mantine/core';
import { IconAlertCircle, IconUser, IconLock, IconSun, IconMoon, IconLanguage } from '@tabler/icons-react';
import Link from 'next/link';
import classes from '@/styles/auth.module.css';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useAuthTranslation } from '@/lib/i18n/useAuthTranslation';
import { localeNames, Locale } from '@/lib/i18n/config';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

export default function LoginPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t, locale, setLocale, mounted } = useAuthTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoExists, setLogoExists] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    // Logo dosyasının varlığını kontrol et
    const img = new window.Image();
    img.onload = () => setLogoExists(true);
    img.onerror = () => setLogoExists(false);
    img.src = BRANDING_PATHS.logo;

    // Firma adını API'den al
    fetch('/api/public/company-info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.name) {
          setCompanyName(data.data.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleLocaleChange = (value: string | null) => {
    if (value) {
      setLocale(value as Locale);
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    validate: {
      username: (value) => {
        if (!value || value.trim().length === 0) {
          return t('login.errors.required');
        }
        return null;
      },
      password: (value) => {
        if (!value || value.trim().length === 0) {
          return t('login.errors.required');
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (typeof window !== 'undefined') {
          // Clear old session markers to prevent SessionTimeoutWarning from logging out
          localStorage.removeItem('omnex-session-initialized');
          sessionStorage.removeItem('omnex-session-active');

          localStorage.setItem('user', JSON.stringify(data.data.user));
          window.dispatchEvent(new Event('user-updated'));

          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        }
        // Redirect to dashboard with selected locale
        window.location.href = `/${locale}/dashboard`;
      } else {
        setError(data.error?.message || data.message || t('login.errors.invalidCredentials'));
      }
    } catch (err) {
      setError(t('login.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const isDark = mounted && colorScheme === 'dark';

  return (
    <div className={classes.wrapper}>
      {/* Mobile Header - visible only on mobile */}
      <Box className={classes.mobileHeader}>
        <Group gap="xs">
          <PWAInstallButton size="md" variant="default" locale={locale} />
          <Select
            data={languageOptions}
            value={locale}
            onChange={handleLocaleChange}
            size="xs"
            w={120}
            leftSection={mounted ? <IconLanguage size={14} /> : null}
            comboboxProps={{ zIndex: 10001 }}
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

      {/* Desktop Top Right Controls - hidden on mobile */}
      <Box className={classes.topControls}>
        <Group gap="xs">
          <PWAInstallButton size="md" variant="default" locale={locale} />
          <Select
            data={languageOptions}
            value={locale}
            onChange={handleLocaleChange}
            size="xs"
            w={120}
            leftSection={mounted ? <IconLanguage size={14} /> : null}
            comboboxProps={{ zIndex: 10001 }}
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

      <Container size="xs" className={classes.container}>
        <Paper
          className={classes.paper}
          p="xl"
          radius="lg"
          styles={{
            root: {
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            }
          }}>
          <Stack gap="lg">
            {/* Logo - Sabit dosya yolundan */}
            <Box className={classes.logoSection}>
              {logoExists ? (
                <Image
                  src={BRANDING_PATHS.logo}
                  alt="Logo"
                  h={60}
                  w="auto"
                  fit="contain"
                  style={{ margin: '0 auto' }}
                />
              ) : (
                <Box className={classes.defaultLogo}>
                  <Text size="xl" fw={700} c="blue">
                    ?
                  </Text>
                </Box>
              )}
            </Box>

            <div className={classes.header}>
              <Title order={2} ta="center" fw={700}>
                {t('login.title')}
              </Title>
              <Text c="dimmed" size="sm" ta="center" mt="xs">
                {t('login.subtitle')}
              </Text>
            </div>

            {error && (
              <Alert
                icon={mounted ? <IconAlertCircle size={16} /> : null}
                title={t('common.error')}
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label={t('login.username')}
                  placeholder={t('login.usernamePlaceholder')}
                  leftSection={mounted ? <IconUser size={16} /> : null}
                  autoComplete="username"
                  required
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      '&:focus': {
                        borderColor: 'var(--mantine-color-blue-5)',
                      }
                    }
                  }}
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  autoComplete="current-password"
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      '&:focus': {
                        borderColor: 'var(--mantine-color-blue-5)',
                      }
                    }
                  }}
                  required
                  {...form.getInputProps('password')}
                />

                <Group justify="space-between">
                  <Checkbox
                    label={t('login.rememberMe')}
                    {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Text size="sm" c="dimmed" component={Link} href={`/${locale}/auth/forgot-password`}>
                    {t('login.forgotPassword')}
                  </Text>
                </Group>

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  mt="md"
                >
                  {t('login.submit')}
                </Button>
              </Stack>
            </form>

            <Divider label={t('login.or')} labelPosition="center" />

            <Text size="sm" ta="center" c="dimmed">
              {t('login.noAccount')}{' '}
              <Text
                component={Link}
                href="/auth/register"
                c="blue"
                fw={500}
                td="underline"
              >
                {t('login.register')}
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>

      {/* Footer */}
      <Box className={classes.footer}>
        <Text size="xs" c="white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
        </Text>
      </Box>
    </div>
  );
}
