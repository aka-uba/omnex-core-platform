'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  ThemeIcon,
  Alert,
  Anchor,
  Group,
} from '@mantine/core';
import { IconMail, IconCheck, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

export default function ResendActivationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [alreadyActivated, setAlreadyActivated] = useState(false);

  // Get email from URL if provided
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAlreadyActivated(false);

    if (!email) {
      setError('E-posta adresi gerekli');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.message);
      } else if (data.alreadyActivated) {
        setAlreadyActivated(true);
      } else if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      setError('İşlem sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(`/${locale}/login`);
  };

  if (isSubmitted) {
    return (
      <Container size="sm" py={80}>
        <Paper shadow="md" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius={40} color="green">
              <IconCheck size={48} />
            </ThemeIcon>
            <Title order={2}>E-posta Gönderildi</Title>
            <Text c="dimmed" ta="center">
              E-posta adresiniz kayıtlıysa aktivasyon bağlantısı gönderildi.
              Lütfen gelen kutunuzu kontrol edin.
            </Text>
            <Alert color="blue" mt="md" w="100%">
              E-postayı göremiyorsanız spam klasörünü kontrol edin.
            </Alert>
            <Button
              size="lg"
              leftSection={<IconArrowLeft size={20} />}
              onClick={handleGoToLogin}
              fullWidth
              variant="light"
              mt="md"
            >
              Giriş Sayfasına Dön
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (alreadyActivated) {
    return (
      <Container size="sm" py={80}>
        <Paper shadow="md" radius="lg" p={40} withBorder>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius={40} color="blue">
              <IconCheck size={48} />
            </ThemeIcon>
            <Title order={2}>Hesap Zaten Aktif</Title>
            <Text c="dimmed" ta="center">
              Hesabınız zaten aktifleştirilmiş. Giriş yapabilirsiniz.
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

  return (
    <Container size="sm" py={80}>
      <Paper shadow="md" radius="lg" p={40} withBorder>
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius={30} color="blue">
              <IconMail size={32} />
            </ThemeIcon>
            <Title order={2}>Aktivasyon Bağlantısı Gönder</Title>
            <Text c="dimmed" ta="center">
              E-posta adresinizi girin, size yeni aktivasyon bağlantısı gönderelim.
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert color="red" icon={<IconAlertCircle size={18} />}>
                  {error}
                </Alert>
              )}

              <TextInput
                label="E-posta Adresi"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                type="email"
                required
                size="md"
              />

              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
                mt="md"
              >
                Aktivasyon Bağlantısı Gönder
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              Hesabınız zaten aktif mi?
            </Text>
            <Anchor size="sm" onClick={handleGoToLogin} style={{ cursor: 'pointer' }}>
              Giriş Yap
            </Anchor>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
