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

// Translations
const translations: Record<string, Record<string, string>> = {
  tr: {
    'register.title': 'Kayıt Ol',
    'register.subtitle': 'Yeni hesap oluşturun',
    'register.name': 'Ad Soyad',
    'register.namePlaceholder': 'Adınızı ve soyadınızı giriniz',
    'register.username': 'Kullanıcı Adı',
    'register.usernamePlaceholder': 'Kullanıcı adınızı giriniz',
    'register.usernameHint': 'Sadece harf, rakam ve alt çizgi kullanabilirsiniz',
    'register.email': 'E-posta',
    'register.emailPlaceholder': 'ornek@email.com',
    'register.password': 'Şifre',
    'register.passwordPlaceholder': 'En az 8 karakter',
    'register.passwordHint': 'En az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
    'register.confirmPassword': 'Şifre Tekrar',
    'register.confirmPasswordPlaceholder': 'Şifrenizi tekrar giriniz',
    'register.submit': 'Kayıt Ol',
    'register.hasAccount': 'Zaten hesabınız var mı?',
    'register.login': 'Giriş Yap',
    'register.or': 'veya',
    'register.success.title': 'Kayıt Başarılı!',
    'register.success.message': 'Hesabınız yönetici onayı beklemektedir. Onay sonrasında giriş yapabileceksiniz.',
    'register.success.redirecting': 'Giriş sayfasına yönlendiriliyorsunuz...',
    'register.errors.required': 'Lütfen tüm alanları doldurun',
    'common.error': 'Hata',
  },
  en: {
    'register.title': 'Register',
    'register.subtitle': 'Create a new account',
    'register.name': 'Full Name',
    'register.namePlaceholder': 'Enter your full name',
    'register.username': 'Username',
    'register.usernamePlaceholder': 'Enter your username',
    'register.usernameHint': 'Only letters, numbers and underscores allowed',
    'register.email': 'Email',
    'register.emailPlaceholder': 'example@email.com',
    'register.password': 'Password',
    'register.passwordPlaceholder': 'At least 8 characters',
    'register.passwordHint': 'Must contain at least one uppercase, one lowercase and one number',
    'register.confirmPassword': 'Confirm Password',
    'register.confirmPasswordPlaceholder': 'Re-enter your password',
    'register.submit': 'Register',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign In',
    'register.or': 'or',
    'register.success.title': 'Registration Successful!',
    'register.success.message': 'Your account is awaiting admin approval. You can sign in after approval.',
    'register.success.redirecting': 'Redirecting to login page...',
    'register.errors.required': 'Please fill in all fields',
    'common.error': 'Error',
  },
  de: {
    'register.title': 'Registrieren',
    'register.subtitle': 'Erstellen Sie ein neues Konto',
    'register.name': 'Vollständiger Name',
    'register.namePlaceholder': 'Geben Sie Ihren vollständigen Namen ein',
    'register.username': 'Benutzername',
    'register.usernamePlaceholder': 'Geben Sie Ihren Benutzernamen ein',
    'register.usernameHint': 'Nur Buchstaben, Zahlen und Unterstriche erlaubt',
    'register.email': 'E-Mail',
    'register.emailPlaceholder': 'beispiel@email.com',
    'register.password': 'Passwort',
    'register.passwordPlaceholder': 'Mindestens 8 Zeichen',
    'register.passwordHint': 'Muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten',
    'register.confirmPassword': 'Passwort bestätigen',
    'register.confirmPasswordPlaceholder': 'Passwort erneut eingeben',
    'register.submit': 'Registrieren',
    'register.hasAccount': 'Haben Sie bereits ein Konto?',
    'register.login': 'Anmelden',
    'register.or': 'oder',
    'register.success.title': 'Registrierung erfolgreich!',
    'register.success.message': 'Ihr Konto wartet auf die Admin-Genehmigung. Sie können sich nach der Genehmigung anmelden.',
    'register.success.redirecting': 'Weiterleitung zur Anmeldeseite...',
    'register.errors.required': 'Bitte füllen Sie alle Felder aus',
    'common.error': 'Fehler',
  },
  ar: {
    'register.title': 'إنشاء حساب',
    'register.subtitle': 'أنشئ حسابًا جديدًا',
    'register.name': 'الاسم الكامل',
    'register.namePlaceholder': 'أدخل اسمك الكامل',
    'register.username': 'اسم المستخدم',
    'register.usernamePlaceholder': 'أدخل اسم المستخدم',
    'register.usernameHint': 'يُسمح فقط بالحروف والأرقام والشرطة السفلية',
    'register.email': 'البريد الإلكتروني',
    'register.emailPlaceholder': 'example@email.com',
    'register.password': 'كلمة المرور',
    'register.passwordPlaceholder': '8 أحرف على الأقل',
    'register.passwordHint': 'يجب أن تحتوي على حرف كبير وحرف صغير ورقم واحد على الأقل',
    'register.confirmPassword': 'تأكيد كلمة المرور',
    'register.confirmPasswordPlaceholder': 'أعد إدخال كلمة المرور',
    'register.submit': 'إنشاء حساب',
    'register.hasAccount': 'لديك حساب بالفعل؟',
    'register.login': 'تسجيل الدخول',
    'register.or': 'أو',
    'register.success.title': 'تم التسجيل بنجاح!',
    'register.success.message': 'حسابك في انتظار موافقة المسؤول. يمكنك تسجيل الدخول بعد الموافقة.',
    'register.success.redirecting': 'جاري إعادة التوجيه إلى صفحة تسجيل الدخول...',
    'register.errors.required': 'يرجى ملء جميع الحقول',
    'common.error': 'خطأ',
  },
};

const languageOptions = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState('tr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; logo: string | null }>({ name: '', logo: null });
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('preferred-locale') || 'tr';
    setLocale(savedLocale);
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    setCompanyLoading(true);
    try {
      const response = await fetch('/api/public/company-info');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCompanyInfo({
            name: data.data.name || 'Omnex Core',
            logo: data.data.logo || null,
          });
        }
      }
    } catch (err) {
      // Use default values
      setCompanyInfo({ name: 'Omnex Core', logo: null });
    } finally {
      setCompanyLoading(false);
    }
  };

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
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) => (!value ? t('register.errors.required') : null),
      username: (value) => (!value ? t('register.errors.required') : null),
      email: (value) => (!value ? t('register.errors.required') : null),
      password: (value) => (!value ? t('register.errors.required') : null),
      confirmPassword: (value, values) => {
        if (!value) return t('register.errors.required');
        if (value !== values.password) return 'Passwords do not match';
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
            <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
              {mounted && (isDark ? <IconSun size={18} /> : <IconMoon size={18} />)}
            </ActionIcon>
          </Group>
        </Box>

        <Container size="xs" className={classes.container}>
          <Paper className={classes.paper} p="xl" radius="md" withBorder>
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
            Copyright {new Date().getFullYear()} Omnex Core. All rights reserved.
          </Text>
        </Box>
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
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
          <ActionIcon variant="default" size="md" onClick={toggleColorScheme}>
            {mounted && (isDark ? <IconSun size={18} /> : <IconMoon size={18} />)}
          </ActionIcon>
        </Group>
      </Box>

      <Container size="xs" className={classes.container}>
        <Paper className={classes.paper} p="xl" radius="md" withBorder>
          <Stack gap="lg">
            {/* Logo and Company Name */}
            <Box className={classes.logoSection}>
              {companyLoading ? (
                <Box className={classes.defaultLogo} style={{ opacity: 0.5 }}>
                  <Text size="xl" fw={700} c="gray">...</Text>
                </Box>
              ) : companyInfo.logo ? (
                <Image
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  h={60}
                  w="auto"
                  fit="contain"
                  style={{ margin: '0 auto' }}
                />
              ) : (
                <Box className={classes.defaultLogo}>
                  <Text size="xl" fw={700} c="blue">
                    {companyInfo.name ? companyInfo.name.charAt(0) : 'O'}
                  </Text>
                </Box>
              )}
              <Text size="lg" fw={600} ta="center" mt="xs">
                {companyLoading ? '...' : companyInfo.name}
              </Text>
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

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label={t('register.name')}
                  placeholder={t('register.namePlaceholder')}
                  required
                  {...form.getInputProps('name')}
                />

                <TextInput
                  label={t('register.username')}
                  placeholder={t('register.usernamePlaceholder')}
                  leftSection={mounted ? <IconUser size={16} /> : null}
                  description={t('register.usernameHint')}
                  required
                  {...form.getInputProps('username')}
                />

                <TextInput
                  label={t('register.email')}
                  placeholder={t('register.emailPlaceholder')}
                  leftSection={mounted ? <IconMail size={16} /> : null}
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label={t('register.password')}
                  placeholder={t('register.passwordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
                  description={t('register.passwordHint')}
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label={t('register.confirmPassword')}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  leftSection={mounted ? <IconLock size={16} /> : null}
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
        <Text size="xs" c="dimmed">
          Copyright {new Date().getFullYear()} Omnex Core. All rights reserved.
        </Text>
      </Box>
    </div>
  );
}
