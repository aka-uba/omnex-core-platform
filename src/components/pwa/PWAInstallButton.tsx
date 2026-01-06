'use client';

import { useState, useMemo } from 'react';
import { ActionIcon, Tooltip, Modal, Stack, Text, List, ThemeIcon, Group, Button, Badge } from '@mantine/core';
import {
  IconDownload,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconShare,
  IconDotsVertical,
  IconPlus,
  IconCheck,
  IconBrandChrome,
  IconBrandEdge,
  IconBrandFirefox,
  IconMenu2,
} from '@tabler/icons-react';
import { usePWAInstall, Platform, Browser } from '@/hooks/usePWAInstall';
import { defaultLocale } from '@/lib/i18n/config';

// Import translations statically for auth pages
import trGlobal from '@/locales/global/tr.json';
import enGlobal from '@/locales/global/en.json';
import deGlobal from '@/locales/global/de.json';
import arGlobal from '@/locales/global/ar.json';

const translations: Record<string, any> = {
  tr: trGlobal,
  en: enGlobal,
  de: deGlobal,
  ar: arGlobal,
};

function getTranslation(locale: string, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations[defaultLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

interface PWAInstallButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'light' | 'outline' | 'transparent' | 'subtle';
  locale?: string;
}

// Platform-specific installation instructions
function getInstallInstructions(platform: Platform, browser: Browser, hasNativePrompt: boolean, t: (key: string) => string) {
  // iOS Safari
  if (platform === 'ios') {
    return {
      title: t('pwa.install.modal.ios.title'),
      subtitle: t('pwa.install.modal.ios.subtitle'),
      description: t('pwa.install.modal.ios.description'),
      icon: <IconDeviceMobile size={24} />,
      steps: [
        {
          icon: <IconShare size={14} />,
          text: t('pwa.install.modal.ios.steps.step1'),
        },
        {
          icon: <IconPlus size={14} />,
          text: t('pwa.install.modal.ios.steps.step2'),
        },
        {
          icon: <IconCheck size={14} />,
          text: t('pwa.install.modal.ios.steps.step3'),
        },
      ],
    };
  }

  // Android without native prompt (Samsung Browser, Firefox, etc.)
  if (platform === 'android' && !hasNativePrompt) {
    if (browser === 'samsung') {
      return {
        title: t('pwa.install.modal.samsung.title'),
        subtitle: t('pwa.install.modal.samsung.subtitle'),
        description: t('pwa.install.modal.android.description'),
        icon: <IconDeviceMobile size={24} />,
        steps: [
          {
            icon: <IconMenu2 size={14} />,
            text: t('pwa.install.modal.samsung.steps.step1'),
          },
          {
            icon: <IconPlus size={14} />,
            text: t('pwa.install.modal.samsung.steps.step2'),
          },
          {
            icon: <IconCheck size={14} />,
            text: t('pwa.install.modal.samsung.steps.step3'),
          },
        ],
      };
    }

    if (browser === 'firefox') {
      return {
        title: t('pwa.install.modal.firefox.title'),
        subtitle: t('pwa.install.modal.firefox.subtitle'),
        description: t('pwa.install.modal.android.description'),
        icon: <IconBrandFirefox size={24} />,
        steps: [
          {
            icon: <IconDotsVertical size={14} />,
            text: t('pwa.install.modal.firefox.steps.step1'),
          },
          {
            icon: <IconPlus size={14} />,
            text: t('pwa.install.modal.firefox.steps.step2'),
          },
          {
            icon: <IconCheck size={14} />,
            text: t('pwa.install.modal.firefox.steps.step3'),
          },
        ],
      };
    }

    // Default Android instructions
    return {
      title: t('pwa.install.modal.android.title'),
      subtitle: t('pwa.install.modal.android.subtitle'),
      description: t('pwa.install.modal.android.description'),
      icon: <IconDeviceMobile size={24} />,
      steps: [
        {
          icon: <IconDotsVertical size={14} />,
          text: t('pwa.install.modal.android.steps.step1'),
        },
        {
          icon: <IconPlus size={14} />,
          text: t('pwa.install.modal.android.steps.step2'),
        },
        {
          icon: <IconCheck size={14} />,
          text: t('pwa.install.modal.android.steps.step3'),
        },
      ],
    };
  }

  // Windows/Mac/Linux without native prompt (Firefox, etc.)
  if (!hasNativePrompt) {
    const platformName = platform === 'windows' ? 'Windows' :
      platform === 'mac' ? 'macOS' :
        platform === 'linux' ? 'Linux' : 'Desktop';

    if (browser === 'firefox') {
      return {
        title: t('pwa.install.modal.firefox.title'),
        subtitle: `Firefox - ${platformName}`,
        description: t('pwa.install.modal.android.description'),
        icon: <IconBrandFirefox size={24} />,
        steps: [
          {
            icon: <IconMenu2 size={14} />,
            text: t('pwa.install.modal.firefox.steps.step1'),
          },
          {
            icon: <IconPlus size={14} />,
            text: t('pwa.install.modal.firefox.steps.step2'),
          },
          {
            icon: <IconCheck size={14} />,
            text: t('pwa.install.modal.firefox.desktopNote'),
          },
        ],
      };
    }

    // Edge/Chrome fallback
    const browserIcon = browser === 'edge' ? <IconBrandEdge size={24} /> :
      browser === 'chrome' ? <IconBrandChrome size={24} /> :
        <IconDeviceDesktop size={24} />;

    return {
      title: t('pwa.install.modal.desktop.title'),
      subtitle: platformName,
      description: t('pwa.install.modal.android.description'),
      icon: browserIcon,
      steps: [
        {
          icon: <IconDotsVertical size={14} />,
          text: t('pwa.install.modal.desktop.steps.step1'),
        },
        {
          icon: <IconPlus size={14} />,
          text: t('pwa.install.modal.desktop.steps.step2'),
        },
        {
          icon: <IconCheck size={14} />,
          text: t('pwa.install.modal.desktop.steps.step3'),
        },
      ],
    };
  }

  return null;
}

// Render text with **bold** markdown
function renderMarkdownText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function PWAInstallButton({ size = 'md', variant = 'default', locale = defaultLocale }: PWAInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    hasNativePrompt,
    platform,
    browser,
    isIOS,
    isAndroid,
    isDesktop,
    promptInstall,
  } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // Memoize translation function
  const t = useMemo(() => (key: string) => getTranslation(locale, key), [locale]);

  // Don't show if already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Don't show if not installable
  if (!isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (hasNativePrompt) {
      // Trigger native install prompt (Chrome/Edge on Android, Windows, Mac, Linux)
      await promptInstall();
    } else {
      // Show manual installation instructions
      setShowModal(true);
    }
  };

  // Determine tooltip label based on platform
  const tooltipLabel = isIOS
    ? t('pwa.install.tooltip.ios')
    : isAndroid
      ? t('pwa.install.tooltip.android')
      : isDesktop
        ? t('pwa.install.tooltip.desktop')
        : t('pwa.install.tooltip.default');

  const instructions = getInstallInstructions(platform, browser, hasNativePrompt, t);

  return (
    <>
      <Tooltip label={tooltipLabel} position="bottom" withArrow>
        <ActionIcon
          variant={variant}
          size={size}
          onClick={handleClick}
          aria-label={tooltipLabel}
        >
          <IconDownload size={18} />
        </ActionIcon>
      </Tooltip>

      {/* Manual Installation Instructions Modal */}
      {instructions && (
        <Modal
          opened={showModal}
          onClose={() => setShowModal(false)}
          title={
            <Group gap="xs">
              {instructions.icon}
              <div>
                <Text fw={600}>{instructions.title}</Text>
                <Badge size="xs" variant="light" color="gray">{instructions.subtitle}</Badge>
              </div>
            </Group>
          }
          centered
          size="sm"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {instructions.description}
            </Text>

            <List spacing="md" size="sm">
              {instructions.steps.map((step, index) => (
                <List.Item
                  key={index}
                  icon={
                    <ThemeIcon
                      color={index === instructions.steps.length - 1 ? 'green' : 'blue'}
                      size={24}
                      radius="xl"
                    >
                      {step.icon}
                    </ThemeIcon>
                  }
                >
                  <Text size="sm">
                    {renderMarkdownText(step.text)}
                  </Text>
                </List.Item>
              ))}
            </List>

            <Button variant="light" fullWidth onClick={() => setShowModal(false)}>
              {t('pwa.install.modal.understood')}
            </Button>
          </Stack>
        </Modal>
      )}
    </>
  );
}

// Export instructions component for standalone use
export function PWAInstallInstructions({ locale = defaultLocale }: { locale?: string }) {
  const { isInstallable, isInstalled, isStandalone, hasNativePrompt, platform, browser } = usePWAInstall();
  const t = useMemo(() => (key: string) => getTranslation(locale, key), [locale]);

  if (isInstalled || isStandalone || !isInstallable || hasNativePrompt) {
    return null;
  }

  const instructions = getInstallInstructions(platform, browser, hasNativePrompt, t);
  if (!instructions) return null;

  return (
    <Stack gap="xs">
      {instructions.steps.slice(0, 2).map((step, index) => (
        <Group key={index} gap="xs">
          {step.icon}
          <Text size="xs" c="dimmed">
            {renderMarkdownText(step.text)}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
