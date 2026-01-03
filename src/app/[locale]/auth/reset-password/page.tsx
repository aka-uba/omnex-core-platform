'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  ThemeIcon,
  Alert,
  Loader,
  Progress,
} from '@mantine/core';
import { IconLock, IconCheck, IconX, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';

type PageStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'success' | 'error';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const token = searchParams.get('token');

  const [status, setStatus] = useState<PageStatus>('loading');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
      setMessage('Geçersiz şifre sıfırlama bağlantısı.');
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
        setMessage(data.message || 'Şifre sıfırlama bağlantısının süresi dolmuş.');
      } else {
        setStatus('invalid');
        setMessage(data.message || 'Geçersiz şifre sıfırlama bağlantısı.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Bağlantı kontrol edilirken bir hata oluştu.');
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!password) {
      setFormError('Şifre gerekli');
      return;
    }
    if (password.length < 8) {
      setFormError('Şifre en az 8 karakter olmalıdır');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setFormError('Şifre en az bir büyük harf içermelidir');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setFormError('Şifre en az bir küçük harf içermelidir');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setFormError('Şifre en az bir rakam içermelidir');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Şifreler eşleşmiyor');
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
        setMessage(data.message || 'Şifreniz başarıyla değiştirildi.');
      } else {
        if (data.expired) {
          setStatus('expired');
          setMessage(data.message);
        } else {
          setFormError(data.message || 'Şifre sıfırlama başarısız oldu.');
        }
      }
    } catch (error) {
      setFormError('Şifre sıfırlama sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/login`);
  };

  const handleGoToForgotPassword = () => {
    router.push(`/${locale}/auth/forgot-password`);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Container size="sm" py={80}>
        <Paper shadow="md" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            <Loader size="xl" />
            <Title order={2}>Bağlantı Kontrol Ediliyor...</Title>
            <Text c="dimmed" ta="center">
              Lütfen bekleyin.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <Container size="sm" py={80}>
        <Paper shadow="md" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius={40} color="green">
              <IconCheck size={48} />
            </ThemeIcon>
            <Title order={2} c="green">Şifre Değiştirildi!</Title>
            <Text c="dimmed" ta="center">
              {message}
            </Text>
            <Button
              size="lg"
              onClick={handleGoToLogin}
              fullWidth
              mt="md"
            >
              Giriş Yap
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Invalid or expired token
  if (status === 'invalid' || status === 'expired' || status === 'error') {
    return (
      <Container size="sm" py={80}>
        <Paper shadow="md" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius={40} color={status === 'expired' ? 'orange' : 'red'}>
              {status === 'expired' ? <IconAlertCircle size={48} /> : <IconX size={48} />}
            </ThemeIcon>
            <Title order={2} c={status === 'expired' ? 'orange' : 'red'}>
              {status === 'expired' ? 'Bağlantı Süresi Dolmuş' : 'Geçersiz Bağlantı'}
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
                Yeni Şifre Sıfırlama Bağlantısı Al
              </Button>
              <Button
                size="md"
                variant="subtle"
                leftSection={<IconArrowLeft size={18} />}
                onClick={handleGoToLogin}
              >
                Giriş Sayfasına Dön
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Valid token - show password reset form
  return (
    <Container size="sm" py={80}>
      <Paper shadow="md" radius="lg" p={40} withBorder>
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius={30} color="blue">
              <IconLock size={32} />
            </ThemeIcon>
            <Title order={2}>Yeni Şifre Belirle</Title>
            {userName && (
              <Text c="dimmed" ta="center">
                Merhaba {userName}, yeni şifrenizi belirleyin.
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
                label="Yeni Şifre"
                placeholder="Yeni şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                size="md"
              />

              {password && (
                <div>
                  <Progress value={passwordStrength} color={passwordColor} size="sm" mb={4} />
                  <Text size="xs" c="dimmed">
                    Şifre güçlülüğü: {passwordStrength < 50 ? 'Zayıf' : passwordStrength < 75 ? 'Orta' : passwordStrength < 100 ? 'İyi' : 'Güçlü'}
                  </Text>
                </div>
              )}

              <PasswordInput
                label="Şifre Tekrar"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                required
                size="md"
                error={confirmPassword && password !== confirmPassword ? 'Şifreler eşleşmiyor' : undefined}
              />

              <Text size="xs" c="dimmed">
                Şifre en az 8 karakter olmalı ve büyük harf, küçük harf ve rakam içermelidir.
              </Text>

              <Button
                type="submit"
                loading={isSubmitting}
                fullWidth
                size="lg"
                mt="md"
                disabled={passwordStrength < 100 || password !== confirmPassword}
              >
                Şifremi Değiştir
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
