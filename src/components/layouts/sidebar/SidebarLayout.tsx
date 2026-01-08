/**
 * SidebarLayout v2
 * Sidebar layout - yeni yapılandırma sistemi ile
 */

'use client';

import { useState, useEffect } from 'react';
import { useMantineColorScheme, Menu, Avatar, Text, Image } from '@mantine/core';
import { IconSun, IconMoon, IconSearch, IconChevronLeft, IconChevronRight, IconUser, IconLogout, IconLayoutNavbar, IconMaximize, IconMinimize } from '@tabler/icons-react';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/context/CompanyContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLayout } from '../core/LayoutProvider';
import { ThemeConfigurator } from '../configurator/ThemeConfigurator';
import { Sidebar } from './Sidebar';
import { Footer } from '../shared/Footer';
import { ContentArea } from '../shared/ContentArea';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import { useTranslation } from '@/lib/i18n/client';
import styles from './SidebarLayout.module.css';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { t } = useTranslation('global');
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { config, applyChanges, isMobile } = useLayout();
  const { user, logout, refreshUser } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'tr';
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(config.sidebar?.collapsed || false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fullscreen state tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (user?.id && mounted) {
      refreshUser();
    }
  }, [user?.id, mounted]);

  // Get company name from CompanyContext - no fallback
  const companyName = company?.name || '';

  // Sidebar collapse değişikliğini config'e kaydet
  useEffect(() => {
    if (config.sidebar && config.sidebar.collapsed !== sidebarCollapsed) {
      applyChanges({
        sidebar: {
          ...config.sidebar,
          collapsed: sidebarCollapsed,
        },
      });
    }
  }, [sidebarCollapsed]);

  // Theme toggle
  const handleThemeToggle = () => {
    const currentIsDark = colorScheme === 'dark';
    const newThemeMode = currentIsDark ? 'light' : 'dark';

    // Hem config'i güncelle hem de direkt Mantine'e ve HTML'e uygula (instant)
    applyChanges({
      themeMode: newThemeMode,
    });

    // Direkt Mantine'e uygula (instant feedback)
    setColorScheme(newThemeMode);

    // HTML'e direkt uygula (CSS'lerin çalışması için)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-mantine-color-scheme', newThemeMode);
    }
  };

  // Fullscreen toggle
  const handleFullscreenToggle = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const sidebarConfig = config.sidebar;
  // Sidebar.tsx'teki genişlikle uyumlu: collapsed durumunda 4rem (64px), normal durumda config'den gelen genişlik
  const sidebarWidth = sidebarCollapsed ? 64 : sidebarConfig?.width || 260;

  return (
    <div className={styles.sidebarLayout}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className={styles.mainContent}
        style={sidebarConfig?.position === 'right'
          ? { marginRight: `${sidebarWidth}px`, marginLeft: 0 }
          : { marginLeft: `${sidebarWidth}px`, marginRight: 0 }
        }
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className={styles.expandSidebarButton}
                aria-label={t('layout.expandSidebar')}
              >
                {mounted && <IconChevronRight size={20} className={styles.expandSidebarIcon} />}
              </button>
            ) : (
              <button
                type="button"
                className={styles.expandSidebarButton}
                aria-label={t('layout.collapseSidebar')}
                onClick={() => setSidebarCollapsed(true)}
              >
                {mounted && <IconChevronLeft size={20} className={styles.expandSidebarIcon} />}
              </button>
            )}
            {/* Geniş logo göster - Dark mode'da logo-dark.png, light mode'da logo-light.png - Dashboard'a link */}
            {mounted && (
              <Link href={`/${locale}/dashboard`} style={{ textDecoration: 'none', marginLeft: '8px' }}>
                <Image
                  src={colorScheme === 'dark' ? BRANDING_PATHS.logoDark : BRANDING_PATHS.logoLight}
                  alt={companyName || 'Logo'}
                  fit="contain"
                  h={36}
                  maw={180}
                  style={{ cursor: 'pointer' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Fallback to default logo if variant not found
                    const target = e.currentTarget;
                    if (target.src.includes('logo-')) {
                      target.src = BRANDING_PATHS.logo;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              </Link>
            )}
          </div>
          <div className={styles.headerRight}>
            <label className={styles.searchInput}>
              {mounted && <IconSearch size={20} className={styles.searchIcon} />}
              <input
                type="text"
                placeholder={t('layout.searchPlaceholder')}
                className={styles.searchInputField}
              />
            </label>
            <NotificationBell />
            <LanguageSelector />
            {/* Layout Switch Button */}
            {!isMobile && (
              <button
                type="button"
                onClick={() => applyChanges({ layoutType: 'top' })}
                title={t('layout.switchToTop')}
                className={styles.layoutSwitchButton}
                aria-label={t('layout.switchToTop')}
              >
                {mounted && <IconLayoutNavbar size={20} className={styles.layoutSwitchIcon} />}
              </button>
            )}
            <button
              onClick={handleThemeToggle}
              className={styles.actionButton}
              aria-label={t('layout.toggleTheme')}
            >
              {mounted && (colorScheme === 'dark' ? (
                <IconSun size={20} className={styles.actionButtonIcon} />
              ) : (
                <IconMoon size={20} className={styles.actionButtonIcon} />
              ))}
            </button>
            <button
              onClick={handleFullscreenToggle}
              className={styles.actionButton}
              aria-label={isFullscreen ? t('layout.exitFullscreen') : t('layout.enterFullscreen')}
              title={isFullscreen ? t('layout.exitFullscreen') : t('layout.enterFullscreen')}
            >
              {mounted && (isFullscreen ? (
                <IconMinimize size={20} className={styles.actionButtonIcon} />
              ) : (
                <IconMaximize size={20} className={styles.actionButtonIcon} />
              ))}
            </button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <div className={styles.avatarWrapper}>
                  {mounted ? (
                    <Avatar
                      size={40}
                      radius="xl"
                      {...(user?.profilePicture ? { src: user.profilePicture } : {})}
                      style={{ cursor: 'pointer' }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  ) : (
                    <Avatar
                      size={40}
                      radius="xl"
                      style={{ cursor: 'pointer' }}
                    >
                      U
                    </Avatar>
                  )}
                </div>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>{user?.name || t('layout.user')}</Text>
                  <Text size="xs" c="dimmed">{user?.email || ''}</Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconUser size={16} />}
                  onClick={() => {
                    const locale = window.location.pathname.split('/')[1] || 'tr';
                    router.push(`/${locale}/management/users/${user?.id}/edit`);
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
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.main}>
          <ContentArea>{children}</ContentArea>
        </main>

        {/* Footer */}
        {config.footerVisible && <Footer />}
      </div>
      {/* Theme Configurator */}
      <ThemeConfigurator />
    </div>
  );
}

