'use client';

import { useState } from 'react';
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
        // Başarılı giriş - session'a kaydet (ileride session yönetimi eklenebilir)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.data.user));
          
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

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label={t('login.username')}
                  placeholder={t('login.usernamePlaceholder')}
                  leftSection={<IconUser size={16} className="tabler-icon tabler-icon-user" />}
                  required
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  leftSection={<IconLock size={16} className="tabler-icon tabler-icon-lock" />}
                  required
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

