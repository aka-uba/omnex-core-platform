'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { zodResolver } from '@hookform/resolvers/zod';
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
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUser, IconLock, IconMail } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { registerSchema } from '@/lib/schemas/auth';
import Link from 'next/link';
import classes from './RegisterPage.module.css';

export function RegisterPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: zodResolver(registerSchema) as any,
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
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push(`/${locale}/login`);
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

  if (success) {
    return (
      <div className={classes.wrapper}>
        <Container size="xs" {...(classes.container ? { className: classes.container } : {})}>
          <Paper {...(classes.paper ? { className: classes.paper } : {})} p="xl" radius="md" withBorder>
            <Stack gap="lg" align="center">
              <div className={classes.successIcon}>
                <IconCheck size={64} stroke={2} />
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
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      <Container size="xs" {...(classes.container ? { className: classes.container } : {})}>
        <Paper {...(classes.paper ? { className: classes.paper } : {})} p="xl" radius="md" withBorder>
          <Stack gap="lg">
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
                icon={<IconAlertCircle size={16} />}
                title="Hata"
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
                  leftSection={<IconUser size={16} />}
                  description={t('register.usernameHint')}
                  required
                  {...form.getInputProps('username')}
                />

                <TextInput
                  label={t('register.email')}
                  placeholder={t('register.emailPlaceholder')}
                  leftSection={<IconMail size={16} />}
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label={t('register.password')}
                  placeholder={t('register.passwordPlaceholder')}
                  leftSection={<IconLock size={16} />}
                  description={t('register.passwordHint')}
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label={t('register.confirmPassword')}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  leftSection={<IconLock size={16} />}
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

            <Divider label="veya" labelPosition="center" />

            <Text size="sm" ta="center" c="dimmed">
              {t('register.hasAccount')}{' '}
              <Text
                component={Link}
                href={`/${locale}/auth/login`}
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
    </div>
  );
}

