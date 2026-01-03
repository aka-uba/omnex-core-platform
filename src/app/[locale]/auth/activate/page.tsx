'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Loader,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle, IconRefresh } from '@tabler/icons-react';

type ActivationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already-activated';

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const token = searchParams.get('token');

  const [status, setStatus] = useState<ActivationStatus>('loading');
  const [message, setMessage] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const activateAccount = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setMessage('Aktivasyon bağlantısı geçersiz.');
      return;
    }

    setIsActivating(true);

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyActivated) {
          setStatus('already-activated');
          setMessage('Hesabınız zaten aktif. Giriş yapabilirsiniz.');
        } else {
          setStatus('success');
          setMessage(data.message || 'Hesabınız başarıyla aktifleştirildi.');
        }
      } else {
        if (data.expired) {
          setStatus('expired');
          setMessage(data.message || 'Aktivasyon bağlantısının süresi dolmuş.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Aktivasyon başarısız oldu.');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Aktivasyon sırasında bir hata oluştu.');
    } finally {
      setIsActivating(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      activateAccount();
    } else {
      setStatus('error');
      setMessage('Aktivasyon bağlantısı geçersiz.');
    }
  }, [token, activateAccount]);

  const handleResendActivation = () => {
    router.push(`/${locale}/auth/resend-activation`);
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/login`);
  };

  return (
    <Container size="sm" py={80}>
      <Paper shadow="md" radius="lg" p={40} withBorder>
        <Stack align="center" gap="lg">
          {status === 'loading' && (
            <>
              <Loader size="xl" />
              <Title order={2}>Hesap Aktifleştiriliyor...</Title>
              <Text c="dimmed" ta="center">
                Lütfen bekleyin, hesabınız aktifleştiriliyor.
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <ThemeIcon size={80} radius={40} color="green">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2} c="green">Hesap Aktifleştirildi!</Title>
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
            </>
          )}

          {status === 'already-activated' && (
            <>
              <ThemeIcon size={80} radius={40} color="blue">
                <IconCheck size={48} />
              </ThemeIcon>
              <Title order={2}>Hesap Zaten Aktif</Title>
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
            </>
          )}

          {status === 'expired' && (
            <>
              <ThemeIcon size={80} radius={40} color="orange">
                <IconAlertCircle size={48} />
              </ThemeIcon>
              <Title order={2} c="orange">Bağlantı Süresi Dolmuş</Title>
              <Text c="dimmed" ta="center">
                {message}
              </Text>
              <Alert color="orange" mt="md" w="100%">
                Yeni bir aktivasyon bağlantısı almak için aşağıdaki butona tıklayın.
              </Alert>
              <Button
                size="lg"
                leftSection={<IconRefresh size={20} />}
                onClick={handleResendActivation}
                fullWidth
                variant="light"
              >
                Yeni Aktivasyon Bağlantısı Al
              </Button>
              <Button
                size="md"
                variant="subtle"
                onClick={handleGoToLogin}
                fullWidth
              >
                Giriş Sayfasına Dön
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ThemeIcon size={80} radius={40} color="red">
                <IconX size={48} />
              </ThemeIcon>
              <Title order={2} c="red">Aktivasyon Başarısız</Title>
              <Text c="dimmed" ta="center">
                {message}
              </Text>
              <Stack w="100%" mt="md">
                <Button
                  size="lg"
                  leftSection={<IconRefresh size={20} />}
                  onClick={handleResendActivation}
                  variant="light"
                >
                  Yeni Aktivasyon Bağlantısı Al
                </Button>
                <Button
                  size="md"
                  variant="subtle"
                  onClick={handleGoToLogin}
                >
                  Giriş Sayfasına Dön
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
