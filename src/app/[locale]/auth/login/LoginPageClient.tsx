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
} from '@mantine/core';
import { IconAlertCircle, IconUser, IconLock } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import Link from 'next/link';
import classes from './LoginPage.module.css';

const REMEMBER_ME_KEY = 'omnex-remember-credentials';

export function LoginPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/auth');
  const { t: tGlobal } = useTranslation('global');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Sayfa yüklendiğinde kaydedilmiş credentials'ı yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REMEMBER_ME_KEY);
        if (saved) {
          const { username, password } = JSON.parse(saved);
          form.setValues({
            username: username || '',
            password: password || '',
            rememberMe: true,
          });
        }
      } catch (e) {
        // localStorage erişim hatası - sessizce devam et
      }
    }
  }, []);

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
        // Başarılı giriş - session'a kaydet (ileride session yönetimi eklenebilir)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.data.user));

          // Beni Hatırla - credentials'ı kaydet veya sil
          if (values.rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
              username: values.username,
              password: values.password,
            }));
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
          }

          // User-updated event'i tetikle (useAuth hook'unun güncellenmesi için)
          window.dispatchEvent(new Event('user-updated'));

          // Token'ları da sakla
          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        }
        // Dashboard'a yönlendir - locale kontrolü ile
        // Önce ana sayfaya yönlendir, oradan dashboard'a gidebilir
        const targetPath = `/${locale}`;
        // Full page reload ile yönlendir
        window.location.href = targetPath;
      } else {
        setError(data.error?.message || data.message || t('login.errors.invalidCredentials'));
      }
    } catch (err) {
      setError(t('login.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Container size="xs" {...(classes.container ? { className: classes.container } : {})}>
        <Paper {...(classes.paper ? { className: classes.paper } : {})} p="xl" radius="md" withBorder>
          <Stack gap="lg">
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
                icon={<IconAlertCircle size={16} />}
                title={tGlobal('common.error')}
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)} id="login-form" name="login-form" autoComplete="on">
              <Stack gap="md">
                <TextInput
                  label={t('login.username')}
                  placeholder={t('login.usernamePlaceholder')}
                  leftSection={<IconUser size={16} className="tabler-icon tabler-icon-user" />}
                  required
                  name="username"
                  id="username"
                  autoComplete="username"
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  leftSection={<IconLock size={16} className="tabler-icon tabler-icon-lock" />}
                  required
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  {...form.getInputProps('password')}
                />

                <Group justify="space-between">
                  <Checkbox
                    label={t('login.rememberMe')}
                    {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Text size="sm" c="dimmed" component={Link} href={`/${locale}/forgot-password`}>
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
                href={`/${locale}/auth/register`}
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
    </div>
  );
}

