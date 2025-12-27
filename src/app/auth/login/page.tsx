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
import classes from './LoginPage.module.css';
import { BRANDING_PATHS } from '@/lib/branding/config';

// Translations
const translations: Record<string, Record<string, string>> = {
  tr: {
    'login.title': 'Giriş Yap',
    'login.subtitle': 'Hesabınıza giriş yapın',
    'login.username': 'Kullanıcı Adı',
    'login.usernamePlaceholder': 'Kullanıcı adınızı giriniz',
    'login.password': 'Şifre',
    'login.passwordPlaceholder': 'Şifrenizi giriniz',
    'login.rememberMe': 'Beni Hatırla',
    'login.forgotPassword': 'Şifremi Unuttum',
    'login.submit': 'Giriş Yap',
    'login.noAccount': 'Hesabınız yok mu?',
    'login.register': 'Kayıt Ol',
    'login.or': 'veya',
    'login.errors.invalidCredentials': 'Kullanıcı adı veya şifre hatalı',
    'login.errors.required': 'Lütfen tüm alanları doldurun',
    'common.error': 'Hata',
  },
  en: {
    'login.title': 'Sign In',
    'login.subtitle': 'Sign in to your account',
    'login.username': 'Username',
    'login.usernamePlaceholder': 'Enter your username',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter your password',
    'login.rememberMe': 'Remember Me',
    'login.forgotPassword': 'Forgot Password',
    'login.submit': 'Sign In',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Register',
    'login.or': 'or',
    'login.errors.invalidCredentials': 'Invalid username or password',
    'login.errors.required': 'Please fill in all fields',
    'common.error': 'Error',
  },
  de: {
    'login.title': 'Anmelden',
    'login.subtitle': 'Melden Sie sich bei Ihrem Konto an',
    'login.username': 'Benutzername',
    'login.usernamePlaceholder': 'Geben Sie Ihren Benutzernamen ein',
    'login.password': 'Passwort',
    'login.passwordPlaceholder': 'Geben Sie Ihr Passwort ein',
    'login.rememberMe': 'Angemeldet bleiben',
    'login.forgotPassword': 'Passwort vergessen',
    'login.submit': 'Anmelden',
    'login.noAccount': 'Noch kein Konto?',
    'login.register': 'Registrieren',
    'login.or': 'oder',
    'login.errors.invalidCredentials': 'Benutzername oder Passwort falsch',
    'login.errors.required': 'Bitte füllen Sie alle Felder aus',
    'common.error': 'Fehler',
  },
  ar: {
    'login.title': 'تسجيل الدخول',
    'login.subtitle': 'قم بتسجيل الدخول إلى حسابك',
    'login.username': 'اسم المستخدم',
    'login.usernamePlaceholder': 'أدخل اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.passwordPlaceholder': 'أدخل كلمة المرور',
    'login.rememberMe': 'تذكرني',
    'login.forgotPassword': 'نسيت كلمة المرور',
    'login.submit': 'تسجيل الدخول',
    'login.noAccount': 'ليس لديك حساب؟',
    'login.register': 'سجل الآن',
    'login.or': 'أو',
    'login.errors.invalidCredentials': 'اسم المستخدم أو كلمة المرور غير صحيحة',
    'login.errors.required': 'يرجى ملء جميع الحقول',
    'common.error': 'خطأ',
  },
};

const languageOptions = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
];

export default function LoginPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState('tr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sabit branding yollarını kullan - API çağrısı yapma
  const [logoExists, setLogoExists] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    setMounted(true);
    // Get saved locale from localStorage
    const savedLocale = localStorage.getItem('preferred-locale') || 'tr';
    setLocale(savedLocale);

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

  const t = (key: string): string => {
    return translations[locale]?.[key] ?? translations['tr']?.[key] ?? key;
  };

  const handleLocaleChange = (value: string | null) => {
    if (value) {
      setLocale(value);
      localStorage.setItem('preferred-locale', value);
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
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (typeof window !== 'undefined') {
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
      {/* Top Right Controls */}
      <Box className={classes.topControls}>
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

      <Container size="xs" className={classes.container}>
        <Paper className={classes.paper} p="xl" radius="md" withBorder>
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
                  required
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  required
                  {...form.getInputProps('password')}
                />

                <Group justify="space-between">
                  <Checkbox
                    label={t('login.rememberMe')}
                    {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Text size="sm" c="dimmed" component={Link} href="/forgot-password">
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
        <Text size="xs" c="dimmed">
          Copyright {companyName ? `${companyName} ` : ''}{new Date().getFullYear()}. All rights reserved.
        </Text>
      </Box>
    </div>
  );
}
