/**
 * MobileHeader
 * Mobil cihazlar için header
 * Hamburger menü + tüm iconlar tek satırda
 */

'use client';

import { useState, useEffect } from 'react';
import { ActionIcon, Group, Avatar, Menu, Text } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import {
  IconMenu2,
  IconSearch,
  IconSun,
  IconMoon,
  IconUser,
  IconLogout,
} from '@tabler/icons-react';
import { useLayout } from '../core/LayoutProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  searchOpened?: boolean;
  onSearchToggle?: () => void;
}

export function MobileHeader({ onMenuToggle, searchOpened, onSearchToggle }: MobileHeaderProps) {
  const { colorScheme } = useMantineColorScheme();
  const { config, applyChanges } = useLayout();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('global');
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iconSize = config.mobile?.iconSize || 24;
  const headerHeight = config.mobile?.headerHeight || 56;

  // Theme toggle - cycles through light -> dark -> auto -> light
  const handleThemeToggle = (e?: React.MouseEvent) => {
    // Event propagation'ı durdur (menü tıklamalarıyla karışmasını önle)
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const currentMode = config.themeMode || 'auto';
    let newThemeMode: 'light' | 'dark' | 'auto';
    
    // Döngü: light -> dark -> auto -> light
    if (currentMode === 'light') {
      newThemeMode = 'dark';
    } else if (currentMode === 'dark') {
      newThemeMode = 'auto';
    } else {
      newThemeMode = 'light';
    }
    
    // Config'i güncelle - LayoutProvider'daki useEffect otomatik olarak tema değişikliğini uygulayacak
    applyChanges({
      themeMode: newThemeMode,
    });
  };

  return (
    <header
      className={styles.mobileHeader}
      style={{
        height: `${headerHeight}px`,
        '--icon-size': `${iconSize}px`,
      } as React.CSSProperties}
    >
      <div className={styles.mobileHeaderContent}>
        {/* Sol: Hamburger Menu */}
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={onMenuToggle}
          {...(styles.menuButton ? { className: styles.menuButton } : {})}
          aria-label={t('layout.toggleMenu')}
        >
          <IconMenu2 size={iconSize} />
        </ActionIcon>

        {/* Orta: Logo/Marka (opsiyonel) */}
        <div className={styles.logoSection}>
          {/* Logo buraya eklenebilir */}
        </div>

        {/* Sağ: Icon Grubu */}
        <Group gap={config.mobile?.iconSpacing || 8} {...(styles.iconGroup ? { className: styles.iconGroup } : {})}>
          {/* Search */}
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onSearchToggle}
            aria-label={t('layout.search')}
            {...((searchOpened ? styles.searchButtonActive : '') ? { className: (searchOpened ? styles.searchButtonActive : '') } : {})}
          >
            <IconSearch size={iconSize} />
          </ActionIcon>

          {/* Notifications */}
          <NotificationBell />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={handleThemeToggle}
            aria-label={t('layout.toggleTheme')}
            type="button"
          >
            {mounted && (() => {
              const currentMode = config.themeMode || 'auto';
              if (currentMode === 'light') {
                return <IconSun size={iconSize} />;
              } else if (currentMode === 'dark') {
                return <IconMoon size={iconSize} />;
              } else {
                // Auto mode - show icon based on current colorScheme
                return colorScheme === 'dark' ? <IconMoon size={iconSize} /> : <IconSun size={iconSize} />;
              }
            })()}
          </ActionIcon>

          {/* User Menu */}
          <Menu
            shadow="md"
            width={200}
            opened={userMenuOpened}
            onChange={setUserMenuOpened}
            position="bottom-end"
          >
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size="lg"
                aria-label={t('layout.userMenu')}
              >
                {mounted && user?.profilePicture ? (
                  <Avatar
                    src={user.profilePicture}
                    size={iconSize}
                    radius="xl"
                  />
                ) : (
                  <IconUser size={iconSize} />
                )}
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                <Text size="sm" fw={500}>
                  {user?.name || 'User'}
                </Text>
                <Text size="xs" c="dimmed">
                  {user?.email || ''}
                </Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconUser size={16} />}
                onClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'tr';
                  router.push(`/${locale}/users/${user?.id}/edit`);
                }}
              >
                {t('layout.myProfile')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={16} />}
                color="red"
                onClick={logout}
              >
                {t('layout.logout')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </header>
  );
}

