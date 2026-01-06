'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  ThemeIcon,
  ActionIcon,
  Select,
  Box,
  Image,
  Anchor,
  Group,
  useMantineColorScheme,
} from '@mantine/core';
import { IconMail, IconCheck, IconArrowLeft, IconAlertCircle, IconLanguage, IconSun, IconMoon } from '@tabler/icons-react';
import classes from '@/styles/auth.module.css';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useAuthTranslation } from '@/lib/i18n/useAuthTranslation';
import { localeNames, Locale } from '@/lib/i18n/config';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t, locale, setLocale, mounted } = useAuthTranslation();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [logoExists, setLogoExists] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    // Set auth page attribute to override global styles
    document.documentElement.setAttribute('data-auth-page', 'true');
    document.body.setAttribute('data-auth-page', 'true');

    // Logo dosyasinin varligini kontrol et
    const img = new window.Image();
    img.onload = () => setLogoExists(true);
    img.onerror = () => setLogoExists(false);
    img.src = BRANDING_PATHS.logo;

    // Firma adini API'den al
    fetch('/api/public/company-info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.name) {
          setCompanyName(data.data.name);
        }
      })
      .catch(() => {});

    // Cleanup on unmount
    return () => {
      document.documentElement.removeAttribute('data-auth-page');
      document.body.removeAttribute('data-auth-page');
    };
  }, []);

  const handleLocaleChange = (value: string | null) => {
    if (value) {
      setLocale(value as Locale);
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
    router.push('/auth/login');
  };

  const handleResendActivation = () => {
    router.push(`/${locale}/auth/resend-activation?email=${encodeURIComponent(email)}`);
  };

  const isDark = mounted && colorScheme === 'dark';

  // Success state
  if (isSubmitted) {
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

        <div className={classes.container}>
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
            }}
          >
            <Stack gap="lg" align="center">
              <ThemeIcon size={80} radius={40} color="green">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2} ta="center" fw={700}>
                {t('forgotPassword.success.title')}
              </Title>
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

          {/* Footer - Inside container to scroll with content on PC */}
          <Box className={classes.footer}>
            <Text size="xs" className={classes.footerText}>
              Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
            </Text>
          </Box>
        </div>
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

      <div className={classes.container}>
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
          }}
        >
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
              <ThemeIcon size={60} radius={30} color="blue" style={{ margin: '0 auto 1rem' }}>
                <IconMail size={32} />
              </ThemeIcon>
              <Title order={2} ta="center" fw={700}>
                {t('forgotPassword.title')}
              </Title>
              <Text c="dimmed" size="sm" ta="center" mt="xs">
                {t('forgotPassword.subtitle')}
              </Text>
            </div>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {error && (
                  <Alert
                    icon={mounted ? <IconAlertCircle size={16} /> : null}
                    title={t('common.error')}
                    color={needsActivation ? 'orange' : 'red'}
                    variant="light"
                  >
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
                  leftSection={mounted ? <IconMail size={16} /> : null}
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  type="email"
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
                />

                <Button
                  type="submit"
                  loading={isLoading}
                  fullWidth
                  size="md"
                  mt="md"
                >
                  {t('forgotPassword.submit')}
                </Button>
              </Stack>
            </form>

            <Group justify="center" mt="md">
              <Anchor size="sm" onClick={handleGoToLogin} style={{ cursor: 'pointer' }}>
                <Group gap={4}>
                  <IconArrowLeft size={14} />
                  {t('forgotPassword.backToLogin')}
                </Group>
              </Anchor>
            </Group>
          </Stack>
        </Paper>

        {/* Footer - Inside container to scroll with content on PC */}
        <Box className={classes.footer}>
          <Text size="xs" className={classes.footerText}>
            Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
          </Text>
        </Box>
      </div>
    </div>
  );
}
