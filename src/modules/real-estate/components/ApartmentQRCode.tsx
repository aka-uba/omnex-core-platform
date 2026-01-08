'use client';

import { useState, useEffect, useMemo } from 'react';
import { Paper, Button, Group, Text, Stack, Loader, TextInput, ActionIcon, Tooltip, Menu, Divider, CopyButton, Box } from '@mantine/core';
import { IconDownload, IconRefresh, IconCopy, IconCheck, IconShare, IconBrandWhatsapp, IconMail, IconBrandTelegram, IconBrandTwitter, IconLink, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams } from 'next/navigation';

interface ApartmentQRCodeProps {
  apartmentId: string;
  locale: string;
  size?: number;
  showActions?: boolean;
  tenantSlug?: string;
}

export function ApartmentQRCode({ apartmentId, locale, size = 200, showActions = true, tenantSlug }: ApartmentQRCodeProps) {
  const { t } = useTranslation('modules/real-estate');
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
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
      setPublicUrl(data.data.publicUrl || null);
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

  // Share handlers
  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('qrCode.linkCopied'),
      });
    }
  };

  const handleShareWhatsApp = () => {
    if (publicUrl) {
      const text = encodeURIComponent(t('qrCode.description') + '\n' + publicUrl);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleShareEmail = () => {
    if (publicUrl) {
      const subject = encodeURIComponent(t('qrCode.title'));
      const body = encodeURIComponent(t('qrCode.description') + '\n\n' + publicUrl);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleShareTelegram = () => {
    if (publicUrl) {
      const text = encodeURIComponent(t('qrCode.description'));
      window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
    }
  };

  const handleShareTwitter = () => {
    if (publicUrl) {
      const text = encodeURIComponent(t('qrCode.description'));
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(publicUrl)}`, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
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
      <Group align="stretch" gap="xl" wrap="wrap">
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

        {/* Sağ taraf: Açıklama ve butonlar - dikey ortalı */}
        <Stack gap="md" justify="center" style={{ flex: 1, minWidth: 300 }}>
          <Text size="sm" c="dimmed">
            {t('qrCode.description')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('qrCode.scanHint') || 'Scan this QR code to view the apartment details on your mobile device.'}
          </Text>

          {/* Public Link Section */}
          {publicUrl && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                <IconLink size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {t('qrCode.publicLink')}
              </Text>
              <Group gap="xs">
                <TextInput
                  value={publicUrl}
                  readOnly
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    },
                  }}
                />
                <CopyButton value={publicUrl}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t('qrCode.linkCopied') : t('qrCode.copyLink')}>
                      <ActionIcon
                        color={copied ? 'teal' : 'blue'}
                        variant="light"
                        onClick={copy}
                        size="lg"
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <Tooltip label={t('actions.openInNewTab') || 'Open in new tab'}>
                  <ActionIcon
                    color="gray"
                    variant="light"
                    onClick={handleOpenInNewTab}
                    size="lg"
                  >
                    <IconExternalLink size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Box>
          )}

          {showActions && (
            <Group>
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

              {/* Share Menu */}
              {publicUrl && (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button
                      leftSection={<IconShare size={18} />}
                      variant="light"
                      color="grape"
                    >
                      {t('qrCode.share')}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>{t('qrCode.shareVia')}</Menu.Label>
                    <Menu.Item
                      leftSection={<IconBrandWhatsapp size={18} color="green" />}
                      onClick={handleShareWhatsApp}
                    >
                      {t('qrCode.shareWhatsApp')}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconMail size={18} color="blue" />}
                      onClick={handleShareEmail}
                    >
                      {t('qrCode.shareEmail')}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBrandTelegram size={18} color="#0088cc" />}
                      onClick={handleShareTelegram}
                    >
                      {t('qrCode.shareTelegram')}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBrandTwitter size={18} color="#1DA1F2" />}
                      onClick={handleShareTwitter}
                    >
                      {t('qrCode.shareTwitter')}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconCopy size={18} />}
                      onClick={handleCopyLink}
                    >
                      {t('qrCode.copyLink')}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

