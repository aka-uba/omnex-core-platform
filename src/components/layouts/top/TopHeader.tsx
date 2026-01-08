/**
 * TopHeader v2
 * Top navigation header
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ActionIcon, Avatar, Menu, Text, Image } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconSearch, IconSun, IconMoon, IconUser, IconLogout, IconLayoutSidebar, IconMaximize, IconMinimize } from '@tabler/icons-react';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useLayout } from '../core/LayoutProvider';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/context/CompanyContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/client';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import { TopNavigation } from './TopNavigation';
import { ClientIcon } from '@/components/common/ClientIcon';
import { 
  getBackgroundColor, 
  getContrastTextColor, 
  getContrastIconColor,
  getHoverBackgroundColor,
  getActiveBackgroundColor,
  getContrastBorderColor,
  getPlaceholderColor,
  getFocusStyles,
  isDarkBackground 
} from '../shared/colorUtils';
import styles from './TopHeader.module.css';

interface TopHeaderProps {
  searchOpened?: boolean;
  onSearchToggle?: () => void;
}

export function TopHeader({ searchOpened, onSearchToggle }: TopHeaderProps = {}) {
  const { t } = useTranslation('global');
  const { colorScheme } = useMantineColorScheme();
  const { config, applyChanges, isMobile, isTablet } = useLayout();
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'tr';
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

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

  const topConfig = config.top;
  const isDarkMode = colorScheme === 'dark';
  const scrollBehavior = topConfig?.scrollBehavior || 'fixed';

  // Scroll davranışı için scroll event listener
  useEffect(() => {
    if (scrollBehavior === 'fixed') {
      return; // Fixed modda scroll takibi gerekmez
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrollingDown(currentScrollY > lastScrollY.current && currentScrollY > 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollBehavior]);

  // Mouse pozisyonu takibi (hidden-on-hover için)
  useEffect(() => {
    if (scrollBehavior !== 'hidden-on-hover') {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Mouse üst 100px içindeyse header'ı göster
      setIsMouseNearTop(e.clientY < 100);
    };

    const handleMouseEnter = () => {
      setIsMouseNearTop(true);
    };

    const handleMouseLeave = () => {
      setIsMouseNearTop(false);
    };

    if (headerRef.current) {
      headerRef.current.addEventListener('mouseenter', handleMouseEnter);
      headerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (headerRef.current) {
        headerRef.current.removeEventListener('mouseenter', handleMouseEnter);
        headerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [scrollBehavior]);

  // Arka plan rengini hesapla (sadece light mode için)
  const backgroundColor = useMemo(() => {
    if (isDarkMode) {
      return undefined; // Dark mode'da CSS'teki varsayılan değeri kullan
    }
    return getBackgroundColor(topConfig?.background || 'light', topConfig?.customColor);
  }, [isDarkMode, topConfig?.background, topConfig?.customColor]);

  // Arka plan rengine göre otomatik renkler (sadece light mode için)
  const autoColors = useMemo(() => {
    if (isDarkMode || !backgroundColor || backgroundColor === 'transparent') {
      return null; // Dark mode veya transparent'da varsayılan stilleri kullan
    }

    const bgIsDark = isDarkBackground(backgroundColor);
    const borderColor = getContrastBorderColor(backgroundColor, bgIsDark);
    const focusStyles = getFocusStyles(borderColor);
    return {
      textColor: getContrastTextColor(backgroundColor),
      iconColor: getContrastIconColor(backgroundColor),
      hoverBg: getHoverBackgroundColor(backgroundColor, bgIsDark),
      activeBg: getActiveBackgroundColor(backgroundColor, bgIsDark),
      borderColor: borderColor,
      searchBg: bgIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
      actionButtonBg: bgIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
      placeholderColor: getPlaceholderColor(backgroundColor, bgIsDark),
      focusBoxShadow: focusStyles.boxShadow,
      focusBorderColor: focusStyles.borderColor,
    };
  }, [isDarkMode, backgroundColor]);

  // Theme toggle - toggles between light and dark based on current visual state
  const handleThemeToggle = (e?: React.MouseEvent) => {
    // Event propagation'ı durdur (menü tıklamalarıyla karışmasını önle)
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Mevcut görsel duruma göre toggle yap (colorScheme dark ise light'a, değilse dark'a)
    // Bu sayede auto modunda bile tek tıkla değişir
    const newThemeMode: 'light' | 'dark' = colorScheme === 'dark' ? 'light' : 'dark';

    // Config'i güncelle - LayoutProvider'daki useEffect otomatik olarak tema değişikliğini uygulayacak
    applyChanges({
      themeMode: newThemeMode,
    });
  };

  // Fullscreen toggle
  const handleFullscreenToggle = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

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

  // Header className based on scroll behavior
  const headerClassName = [
    styles.topHeader,
    topConfig?.sticky ? styles.sticky : '',
    scrollBehavior === 'hidden' && isScrollingDown ? styles.headerHidden : '',
    scrollBehavior === 'hidden-on-hover' && isScrollingDown && !isMouseNearTop ? styles.headerHiddenOnHover : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Border ayarları (Top header için alt çizgi)
  const borderStyle = useMemo(() => {
    const borderConfig = topConfig?.border;
    if (borderConfig?.enabled) {
      return {
        borderBottom: `${borderConfig.width}px solid ${borderConfig.color}`,
      };
    }
    return {};
  }, [topConfig?.border]);

  return (
    <header
      ref={headerRef}
      className={headerClassName}
      style={{
        ...(mounted && !isDarkMode && backgroundColor && {
          backgroundColor, // Direkt backgroundColor ekle - anlık renk değişimi için
        }),
        ...(autoColors && {
          '--top-height': `${topConfig?.height || 64}px`,
          '--top-bg-color': backgroundColor,
          '--top-text-color': autoColors.textColor,
          '--top-icon-color': autoColors.iconColor,
          '--top-hover-bg': autoColors.hoverBg,
          '--top-active-bg': autoColors.activeBg,
          '--top-border-color': autoColors.borderColor,
          '--top-search-bg': autoColors.searchBg,
          '--top-action-button-bg': autoColors.actionButtonBg,
          '--top-placeholder-color': autoColors.placeholderColor,
          '--top-focus-box-shadow': autoColors.focusBoxShadow,
          '--top-focus-border-color': autoColors.focusBorderColor,
        } as React.CSSProperties),
        ...(!autoColors && {
          '--top-height': `${topConfig?.height || 64}px`,
        } as React.CSSProperties),
        ...borderStyle,
      }}
    >
      <div {...(styles.topHeaderContent ? { className: styles.topHeaderContent } : {})}>
        {/* Logo - Dark mode'da logo-light.png (koyu arka plan için açık logo), light mode'da logo.png - Dashboard'a link */}
        <div {...(styles.logoSection ? { className: styles.logoSection } : {})} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {mounted && (
            <Link href={`/${locale}/dashboard`} style={{ textDecoration: 'none' }}>
              <Image
                src={isDarkMode ? BRANDING_PATHS.logoLight : BRANDING_PATHS.logo}
                alt={company?.name || 'Logo'}
                fit="contain"
                h={36}
                maw={180}
                style={{ flexShrink: 0, cursor: 'pointer' }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // Fallback to default logo if variant not found
                  const target = e.currentTarget;
                  if (!target.src.includes('logo.png') || target.src.includes('logo-')) {
                    target.src = BRANDING_PATHS.logo;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <TopNavigation />

        {/* Right Actions */}
        <div {...(styles.rightActions ? { className: styles.rightActions } : {})}>
          {/* Desktop: Arama alanı */}
          {!isMobile && !isTablet && (
            <label {...(styles.searchInput ? { className: styles.searchInput } : {})}>
              <ClientIcon>
                <IconSearch size={20} {...(styles.searchIcon ? { className: styles.searchIcon } : {})} />
              </ClientIcon>
              <input
                type="text"
                placeholder={t('layout.searchPlaceholder')}
                {...(styles.searchInputField ? { className: styles.searchInputField } : {})}
              />
            </label>
          )}
          {/* Mobil ve Tablet: Arama iconu */}
          {(isMobile || isTablet) && (
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={onSearchToggle}
              aria-label={t('layout.search')}
              {...((searchOpened ? styles.searchButtonActive : '') ? { className: (searchOpened ? styles.searchButtonActive : '') } : {})}
            >
              <ClientIcon>
                <IconSearch size={20} />
              </ClientIcon>
            </ActionIcon>
          )}
          <NotificationBell />
          <LanguageSelector />
          {/* Layout Switch Button */}
          {!isMobile && (
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => applyChanges({ layoutType: 'sidebar' })}
              title={t('layout.switchToSidebar')}
              {...(styles.layoutSwitchButton ? { className: styles.layoutSwitchButton } : {})}
            >
              {mounted && <IconLayoutSidebar size={20} {...(styles.layoutSwitchIcon ? { className: styles.layoutSwitchIcon } : {})} />}
            </ActionIcon>
          )}
          <button
            onClick={handleThemeToggle}
            {...(styles.actionButton ? { className: styles.actionButton } : {})}
            aria-label={t('layout.toggleTheme')}
            type="button"
          >
            {mounted && (
              // Mevcut görsel duruma göre icon göster - dark ise moon, light ise sun
              colorScheme === 'dark'
                ? <IconMoon size={20} {...(styles.actionButtonIcon ? { className: styles.actionButtonIcon } : {})} />
                : <IconSun size={20} {...(styles.actionButtonIcon ? { className: styles.actionButtonIcon } : {})} />
            )}
          </button>
          <button
            onClick={handleFullscreenToggle}
            {...(styles.actionButton ? { className: styles.actionButton } : {})}
            aria-label={isFullscreen ? t('layout.exitFullscreen') : t('layout.enterFullscreen')}
            type="button"
            title={isFullscreen ? t('layout.exitFullscreen') : t('layout.enterFullscreen')}
          >
            {mounted && (isFullscreen ? (
              <IconMinimize size={20} {...(styles.actionButtonIcon ? { className: styles.actionButtonIcon } : {})} />
            ) : (
              <IconMaximize size={20} {...(styles.actionButtonIcon ? { className: styles.actionButtonIcon } : {})} />
            ))}
          </button>
          <Menu
            shadow="md"
            width={200}
            opened={userMenuOpened}
            onChange={setUserMenuOpened}
            position="bottom-end"
          >
            <Menu.Target>
                <div {...(styles.avatarWrapper ? { className: styles.avatarWrapper } : {})}>
                {mounted ? (
                  <Avatar
                    size={40}
                    radius="xl"
                    {...(user?.profilePicture ? { src: user.profilePicture } : {})}
                    {...(styles.avatar ? { className: styles.avatar } : {})}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                ) : (
                  <Avatar
                    size={40}
                    radius="xl"
                    {...(styles.avatar ? { className: styles.avatar } : {})}
                  >
                    U
                  </Avatar>
                )}
              </div>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="sm" fw={500}>{user?.name || 'User'}</Text>
                <Text size="xs" c="dimmed">{user?.email || ''}</Text>
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
        </div>
      </div>
    </header>
  );
}

