'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Divider,
  ActionIcon,
  Select,
  Box,
  Image,
  useMantineColorScheme,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUser, IconLock, IconMail, IconSun, IconMoon, IconLanguage } from '@tabler/icons-react';
import Link from 'next/link';
import classes from './RegisterPage.module.css';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useAuthTranslation } from '@/lib/i18n/useAuthTranslation';
import { localeNames, Locale } from '@/lib/i18n/config';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

export default function RegisterPage() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t, locale, setLocale, mounted } = useAuthTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) => {
        if (!value) return t('register.errors.nameRequired');
        if (value.length < 2) return t('register.errors.nameMinLength');
        return null;
      },
      username: (value) => {
        if (!value) return t('register.errors.usernameRequired');
        if (value.length < 3) return t('register.errors.usernameMinLength');
        if (value.length > 20) return t('register.errors.usernameMaxLength');
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return t('register.errors.usernameFormat');
        return null;
      },
      email: (value) => {
        if (!value) return t('register.errors.emailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('register.errors.emailFormat');
        return null;
      },
      password: (value) => {
        if (!value) return t('register.errors.passwordRequired');
        if (value.length < 8) return t('register.errors.passwordMinLength');
        if (!/[A-Z]/.test(value)) return t('register.errors.passwordUppercase');
        if (!/[a-z]/.test(value)) return t('register.errors.passwordLowercase');
        if (!/[0-9]/.test(value)) return t('register.errors.passwordNumber');
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return t('register.errors.confirmPasswordRequired');
        if (value !== values.password) return t('register.errors.passwordMismatch');
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          username: values.username,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(data.message || t('register.errors.required'));
      }
    } catch (err) {
      setError(t('register.errors.required'));
    } finally {
      setLoading(false);
    }
  };

  const isDark = mounted && colorScheme === 'dark';

  if (success) {
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
              comboboxProps={{ withinPortal: true, zIndex: 10001 }}
            />
            <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
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
              comboboxProps={{ withinPortal: true, zIndex: 10001 }}
            />
            <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
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
            <Stack gap="lg" align="center">
              <div className={classes.successIcon}>
                {mounted && <IconCheck size={64} stroke={2} />}
              </div>
              <Title order={2} ta="center" fw={700}>
                {t('register.success.title')}
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                {t('register.success.message')}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {t('register.success.redirecting')}
              </Text>
            </Stack>
          </Paper>
        </Container>

        <Box className={classes.footer}>
          <Text size="xs" c="dimmed">
            Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
          </Text>
        </Box>
      </div>
    );
  }

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
            comboboxProps={{ withinPortal: true, zIndex: 10001 }}
          />
          <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
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
            comboboxProps={{ withinPortal: true, zIndex: 10001 }}
          />
          <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
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
                {t('register.title')}
              </Title>
              <Text c="dimmed" size="sm" ta="center" mt="xs">
                {t('register.subtitle')}
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

            <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
              <Stack gap="md">
                <TextInput
                  label={t('register.name')}
                  placeholder={t('register.namePlaceholder')}
                  autoComplete="name"
                  required
                  {...form.getInputProps('name')}
                />

                <TextInput
                  label={t('register.username')}
                  placeholder={t('register.usernamePlaceholder')}
                  leftSection={mounted ? <IconUser size={16} /> : null}
                  description={t('register.usernameHint')}
                  autoComplete="username"
                  required
                  {...form.getInputProps('username')}
                />

                <TextInput
                  label={t('register.email')}
                  placeholder={t('register.emailPlaceholder')}
                  leftSection={mounted ? <IconMail size={16} /> : null}
                  type="email"
                  autoComplete="email"
                  required
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label={t('register.password')}
                  placeholder={t('register.passwordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  description={t('register.passwordHint')}
                  autoComplete="new-password"
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label={t('register.confirmPassword')}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  autoComplete="new-password"
                  required
                  {...form.getInputProps('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  mt="md"
                >
                  {t('register.submit')}
                </Button>
              </Stack>
            </form>

            <Divider label={t('register.or')} labelPosition="center" />

            <Text size="sm" ta="center" c="dimmed">
              {t('register.hasAccount')}{' '}
              <Text
                component={Link}
                href="/auth/login"
                c="blue"
                fw={500}
                td="underline"
              >
                {t('register.login')}
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>

      <Box className={classes.footer}>
        <Text size="xs" c="white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
        </Text>
      </Box>
    </div>
  );
}
