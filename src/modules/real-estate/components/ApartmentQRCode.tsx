'use client';

import { useState, useEffect } from 'react';
import { Paper, Button, Group, Text, Stack, Loader } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams } from 'next/navigation';

interface ApartmentQRCodeProps {
  apartmentId: string;
  locale: string;
  size?: number;
  showActions?: boolean;
}

export function ApartmentQRCode({ apartmentId, locale, size = 200, showActions = true }: ApartmentQRCodeProps) {
  const { t } = useTranslation('modules/real-estate');
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/real-estate/apartments/${apartmentId}/qr-code?format=png&size=${size}&locale=${currentLocale}`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const data = await response.json();
      setQrCodeUrl(data.data.qrCodeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: err instanceof Error ? err.message : t('qrCode.generateError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (apartmentId) {
      fetchQRCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentId]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `apartment-${apartmentId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: t('messages.success'),
      message: t('qrCode.downloadSuccess'),
    });
  };

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: size + 100 }}>
        <Stack align="center" gap="md">
          <Loader />
          <Text size="sm" c="dimmed">{t('qrCode.generating')}</Text>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="xs" p="md">
        <Stack align="center" gap="md">
          <Text c="red">{error}</Text>
          <Button
            leftSection={<IconRefresh size={18} />}
            onClick={fetchQRCode}
            variant="light"
          >
            {t('actions.retry')}
          </Button>
        </Stack>
      </Paper>
    );
  }

  if (!qrCodeUrl) {
    return null;
  }

  return (
    <Paper shadow="xs" p="md">
      <Group align="flex-start" gap="xl">
        {/* Sol taraf: QR Code */}
        <Stack align="center" gap="md">
          <Text size="lg" fw={500}>
            {t('qrCode.title')}
          </Text>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'inline-block',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'block',
              }}
            />
          </div>
        </Stack>

        {/* Sağ taraf: Açıklama ve butonlar */}
        <Stack gap="md" style={{ flex: 1 }}>
          <Text size="sm" c="dimmed">
            {t('qrCode.description')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('qrCode.scanHint') || 'Scan this QR code to view the apartment details on your mobile device.'}
          </Text>
          {showActions && (
            <Group mt="md">
              <Button
                leftSection={<IconDownload size={18} />}
                onClick={handleDownload}
                variant="light"
              >
                {t('qrCode.download')}
              </Button>
              <Button
                leftSection={<IconRefresh size={18} />}
                onClick={fetchQRCode}
                variant="light"
              >
                {t('actions.refresh')}
              </Button>
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

