'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
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
import { IconAlertCircle, IconUser, IconLock, IconSun, IconMoon, IconLanguage, IconBuilding, IconCalendar } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import Link from 'next/link';
import classes from '@/styles/auth.module.css';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { localeNames } from '@/lib/i18n/config';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

const languageOptions = Object.entries(localeNames).map(([value, label]) => ({
  value,
  label,
}));

const REMEMBER_ME_KEY = 'omnex-remember-credentials-superadmin';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export function SuperAdminLoginPageClient({ locale }: { locale: string }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t } = useTranslation('modules/auth');
  const { t: tGlobal } = useTranslation('global');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoExists, setLogoExists] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(locale);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
      tenantId: '',
      periodId: '',
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
      tenantId: (value) => {
        if (!value || value.trim().length === 0) {
          return t('login.errors.tenantRequired') || 'Firma seçimi gereklidir';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    setMounted(true);
    // Set auth page attribute to override global styles
    document.documentElement.setAttribute('data-auth-page', 'true');
    document.body.setAttribute('data-auth-page', 'true');

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

    // Fetch tenants
    fetch('/api/tenants?pageSize=100&status=active')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.tenants) {
          setTenants(data.data.tenants);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTenants(false));

    // Load saved credentials
    try {
      const saved = localStorage.getItem(REMEMBER_ME_KEY);
      if (saved) {
        const { username, password, tenantId } = JSON.parse(saved);
        form.setValues({
          username: username || '',
          password: password || '',
          tenantId: tenantId || '',
          rememberMe: true,
          periodId: '',
        });
      }
    } catch (e) {
      // Silently ignore
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.removeAttribute('data-auth-page');
      document.body.removeAttribute('data-auth-page');
    };
  }, []);

  // Fetch periods when tenant is selected
  useEffect(() => {
    if (form.values.tenantId) {
      setLoadingPeriods(true);
      const fetchPeriods = async () => {
        try {
          const selectedTenant = tenants.find(t => t.id === form.values.tenantId);
          if (selectedTenant) {
            const response = await fetch(`/api/tenants/${selectedTenant.slug}/periods`);
            const data = await response.json();
            if (data.success && data.data?.periods) {
              setPeriods(data.data.periods);
            } else {
              const currentYear = new Date().getFullYear();
              setPeriods([
                { id: `${currentYear}`, name: `${currentYear} Yılı`, startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
                { id: `${currentYear - 1}`, name: `${currentYear - 1} Yılı`, startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
                { id: `${currentYear - 2}`, name: `${currentYear - 2} Yılı`, startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
              ]);
            }
          }
        } catch (err) {
          const currentYear = new Date().getFullYear();
          setPeriods([
            { id: `${currentYear}`, name: `${currentYear} Yılı`, startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
            { id: `${currentYear - 1}`, name: `${currentYear - 1} Yılı`, startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
            { id: `${currentYear - 2}`, name: `${currentYear - 2} Yılı`, startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
          ]);
        } finally {
          setLoadingPeriods(false);
        }
      };

      fetchPeriods();
    } else {
      setPeriods([]);
      form.setFieldValue('periodId', '');
    }
  }, [form.values.tenantId, tenants]);

  const handleLocaleChange = (value: string | null) => {
    if (value) {
      setCurrentLocale(value);
      // Full page reload required for i18n provider to load new locale
      window.location.href = `/${value}/auth/login/super-admin`;
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const selectedTenant = tenants.find(t => t.id === values.tenantId);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          rememberMe: values.rememberMe,
          tenantSlug: selectedTenant?.slug,
          periodId: values.periodId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('omnex-session-initialized');
          sessionStorage.removeItem('omnex-session-active');

          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('selectedTenant', JSON.stringify(selectedTenant));
          if (values.periodId) {
            const selectedPeriod = periods.find(p => p.id === values.periodId);
            localStorage.setItem('selectedPeriod', JSON.stringify(selectedPeriod));
          }

          if (values.rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
              username: values.username,
              password: values.password,
              tenantId: values.tenantId,
            }));
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
          }

          window.dispatchEvent(new Event('user-updated'));

          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        }
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
      {/* Mobile Header */}
      <Box className={classes.mobileHeader}>
        <Group gap="xs">
          <PWAInstallButton size="md" variant="default" locale={currentLocale} />
          <Select
            data={languageOptions}
            value={currentLocale}
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

      {/* Desktop Top Right Controls */}
      <Box className={classes.topControls}>
        <Group gap="xs">
          <PWAInstallButton size="md" variant="default" locale={currentLocale} />
          <Select
            data={languageOptions}
            value={currentLocale}
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
            {/* Logo - Dark mode'da logo-dark.png, light mode'da logo-light.png */}
            <Box className={classes.logoSection}>
              {logoExists ? (
                <Image
                  src={isDark ? BRANDING_PATHS.logoDark : BRANDING_PATHS.logoLight}
                  alt="Logo"
                  h={60}
                  w="auto"
                  fit="contain"
                  style={{ margin: '0 auto' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Fallback to default logo if variant not found
                    const target = e.currentTarget;
                    if (target.src.includes('logo-')) {
                      target.src = BRANDING_PATHS.logo;
                    }
                  }}
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
                {t('login.superAdminSubtitle') || 'Süper Admin Girişi'}
              </Text>
            </div>

            {error && (
              <Alert
                icon={mounted ? <IconAlertCircle size={16} /> : null}
                title={tGlobal('common.error')}
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <Group grow preventGrowOverflow={false} wrap="wrap" gap="md">
                  <Select
                    label={t('login.tenantLabel') || 'Firma Seçin'}
                    placeholder={t('login.tenantPlaceholder') || 'Firma seçin...'}
                    leftSection={mounted ? <IconBuilding size={16} /> : null}
                    data={tenants.map(t => ({ value: t.id, label: t.name }))}
                    required
                    disabled={loadingTenants}
                    searchable
                    styles={{
                      root: { flex: 1, minWidth: '180px' },
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      }
                    }}
                    {...form.getInputProps('tenantId')}
                  />

                  <Select
                    label={t('login.periodLabel') || 'Dönem Seçin (Opsiyonel)'}
                    placeholder={t('login.periodPlaceholder') || 'Dönem seçin...'}
                    leftSection={mounted ? <IconCalendar size={16} /> : null}
                    data={periods.map(p => ({ value: p.id, label: p.name }))}
                    value={form.values.periodId}
                    onChange={(value) => form.setFieldValue('periodId', value || '')}
                    disabled={loadingPeriods || !form.values.tenantId}
                    clearable
                    styles={{
                      root: { flex: 1, minWidth: '180px' },
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      }
                    }}
                  />
                </Group>

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
                    }
                  }}
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  autoComplete="current-password"
                  required
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }
                  }}
                  {...form.getInputProps('password')}
                />

                <Group justify="space-between">
                  <Checkbox
                    label={t('login.rememberMe')}
                    {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Text size="sm" c="dimmed" component={Link} href="/auth/forgot-password">
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
              {t('login.normalUserLink') || 'Normal kullanıcı girişi için'}{' '}
              <Text
                component={Link}
                href={`/${locale}/auth/login`}
                c="blue"
                fw={500}
                td="underline"
              >
                {t('login.clickHere') || 'buraya tıklayın'}
              </Text>
            </Text>
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
