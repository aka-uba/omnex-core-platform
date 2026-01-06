'use client';

import { useState, useMemo, useCallback } from 'react';
import { ActionIcon, Tooltip, Popover, Stack, Text, List, ThemeIcon, Group, Button, Badge } from '@mantine/core';
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

// Platform-specific installation instructions (only for browsers without native prompt)
function getInstallInstructions(platform: Platform, browser: Browser, t: (key: string) => string) {
  // iOS Safari
  if (platform === 'ios') {
    return {
      title: t('pwa.install.modal.ios.title'),
      subtitle: t('pwa.install.modal.ios.subtitle'),
      description: t('pwa.install.modal.ios.description'),
      icon: <IconDeviceMobile size={20} />,
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

  // Chrome on Android
  if (platform === 'android' && browser === 'chrome') {
    return {
      title: t('pwa.install.modal.chrome.title'),
      subtitle: t('pwa.install.modal.chrome.subtitle'),
      description: t('pwa.install.modal.android.description'),
      icon: <IconBrandChrome size={20} />,
      steps: [
        {
          icon: <IconDotsVertical size={14} />,
          text: t('pwa.install.modal.chrome.steps.step1'),
        },
        {
          icon: <IconPlus size={14} />,
          text: t('pwa.install.modal.chrome.steps.step2'),
        },
        {
          icon: <IconCheck size={14} />,
          text: t('pwa.install.modal.chrome.steps.step3'),
        },
      ],
    };
  }

  // Edge on Android
  if (platform === 'android' && browser === 'edge') {
    return {
      title: t('pwa.install.modal.edge.title'),
      subtitle: t('pwa.install.modal.edge.subtitle'),
      description: t('pwa.install.modal.android.description'),
      icon: <IconBrandEdge size={20} />,
      steps: [
        {
          icon: <IconDotsVertical size={14} />,
          text: t('pwa.install.modal.edge.steps.step1'),
        },
        {
          icon: <IconPlus size={14} />,
          text: t('pwa.install.modal.edge.steps.step2'),
        },
        {
          icon: <IconCheck size={14} />,
          text: t('pwa.install.modal.edge.steps.step3'),
        },
      ],
    };
  }

  // Samsung Browser on Android
  if (platform === 'android' && browser === 'samsung') {
    return {
      title: t('pwa.install.modal.samsung.title'),
      subtitle: t('pwa.install.modal.samsung.subtitle'),
      description: t('pwa.install.modal.android.description'),
      icon: <IconDeviceMobile size={20} />,
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

  // Firefox (any platform)
  if (browser === 'firefox') {
    const platformName = platform === 'windows' ? 'Windows' :
      platform === 'mac' ? 'macOS' :
        platform === 'linux' ? 'Linux' :
          platform === 'android' ? 'Android' : 'Desktop';

    return {
      title: t('pwa.install.modal.firefox.title'),
      subtitle: `Firefox - ${platformName}`,
      description: t('pwa.install.modal.android.description'),
      icon: <IconBrandFirefox size={20} />,
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
          text: platform === 'android' ? t('pwa.install.modal.firefox.steps.step3') : t('pwa.install.modal.firefox.desktopNote'),
        },
      ],
    };
  }

  // Safari on Mac (not iOS)
  if (browser === 'safari' && platform === 'mac') {
    return {
      title: t('pwa.install.modal.desktop.title'),
      subtitle: 'Safari - macOS',
      description: t('pwa.install.modal.android.description'),
      icon: <IconDeviceDesktop size={20} />,
      steps: [
        {
          icon: <IconShare size={14} />,
          text: t('pwa.install.modal.ios.steps.step1'),
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

  // Default fallback for other browsers
  const platformName = platform === 'windows' ? 'Windows' :
    platform === 'mac' ? 'macOS' :
      platform === 'linux' ? 'Linux' :
        platform === 'android' ? 'Android' : 'Desktop';

  const browserIcon = browser === 'edge' ? <IconBrandEdge size={20} /> :
    browser === 'chrome' ? <IconBrandChrome size={20} /> :
      <IconDeviceDesktop size={20} />;

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
    isReady,
    platform,
    browser,
    isIOS,
    isAndroid,
    isDesktop,
    promptInstall,
  } = usePWAInstall();
  const [popoverOpened, setPopoverOpened] = useState(false);

  // Memoize translation function
  const t = useMemo(() => (key: string) => getTranslation(locale, key), [locale]);

  // Handle click - try native prompt first, fallback to popover
  const handleClick = useCallback(async () => {
    // If we have the actual native prompt event, use it
    if (hasNativePrompt) {
      const success = await promptInstall();
      if (success) return;
    }

    // If native prompt failed or not available, show instructions
    setPopoverOpened(true);
  }, [hasNativePrompt, promptInstall]);

  // Don't show if already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Don't show until hook is ready
  if (!isReady) {
    return null;
  }

  // Don't show if not installable
  if (!isInstallable) {
    return null;
  }

  // Determine tooltip label based on platform
  const tooltipLabel = isIOS
    ? t('pwa.install.tooltip.ios')
    : isAndroid
      ? t('pwa.install.tooltip.android')
      : isDesktop
        ? t('pwa.install.tooltip.desktop')
        : t('pwa.install.tooltip.default');

  // Get install instructions for popover (shown when native prompt not available)
  const instructions = getInstallInstructions(platform, browser, t);

  return (
    <Popover
      opened={popoverOpened}
      onClose={() => setPopoverOpened(false)}
      position="bottom-end"
      withArrow
      shadow="md"
      width={300}
      zIndex={10002}
    >
      <Popover.Target>
        <Tooltip label={tooltipLabel} position="bottom" withArrow disabled={popoverOpened}>
          <ActionIcon
            variant={variant}
            size={size}
            onClick={handleClick}
            aria-label={tooltipLabel}
          >
            <IconDownload size={18} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown>
        {instructions && (
          <Stack gap="sm">
            <Group gap="xs">
              {instructions.icon}
              <div>
                <Text fw={600} size="sm">{instructions.title}</Text>
                <Badge size="xs" variant="light" color="gray">{instructions.subtitle}</Badge>
              </div>
            </Group>

            <Text size="xs" c="dimmed">
              {instructions.description}
            </Text>

            <List spacing="xs" size="xs">
              {instructions.steps.map((step, index) => (
                <List.Item
                  key={index}
                  icon={
                    <ThemeIcon
                      color={index === instructions.steps.length - 1 ? 'green' : 'blue'}
                      size={20}
                      radius="xl"
                    >
                      {step.icon}
                    </ThemeIcon>
                  }
                >
                  <Text size="xs">
                    {renderMarkdownText(step.text)}
                  </Text>
                </List.Item>
              ))}
            </List>

            <Button variant="light" size="xs" fullWidth onClick={() => setPopoverOpened(false)}>
              {t('pwa.install.modal.understood')}
            </Button>
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}

// Export instructions component for standalone use
export function PWAInstallInstructions({ locale = defaultLocale }: { locale?: string }) {
  const { isInstallable, isInstalled, isStandalone, canShowNativePrompt, platform, browser, isReady } = usePWAInstall();
  const t = useMemo(() => (key: string) => getTranslation(locale, key), [locale]);

  // Don't show for browsers with native prompt support
  if (!isReady || isInstalled || isStandalone || !isInstallable || canShowNativePrompt) {
    return null;
  }

  const instructions = getInstallInstructions(platform, browser, t);
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
