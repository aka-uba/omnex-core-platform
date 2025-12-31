/**
 * Sidebar v2
 * Yeni yapılandırma sistemi ile entegre sidebar
 */

'use client';

import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { NavLink, ScrollArea, Divider, ActionIcon, useMantineColorScheme, Skeleton, Stack, Image } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useMenuItems, type MenuItem as MenuItemType } from '../hooks/useMenuItems';
import { useModules } from '@/context/ModuleContext';
import { useCompany } from '@/context/CompanyContext';
import { BRANDING_PATHS } from '@/lib/branding/config';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayout } from '../core/LayoutProvider';
import { ClientIcon } from '@/components/common/ClientIcon';
import { useTranslation } from '@/lib/i18n/client';
import {
  getBackgroundColor,
  getContrastTextColor,
  getContrastIconColor,
  getHoverBackgroundColor,
  getActiveBackgroundColor,
  getContrastBorderColor,
  isDarkBackground
} from '../shared/colorUtils';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Memoized menu item component to prevent unnecessary re-renders
const MenuItem = memo(({
  item,
  collapsed,
  isActive,
  getHref,
  openedMenu,
  onToggleMenu,
  mounted
}: {
  item: MenuItemType;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  getHref: (href: string) => string;
  openedMenu: string | null;
  onToggleMenu: (href: string | null) => void;
  mounted: boolean;
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const parentActive = !hasChildren && isActive(item.href);
  const activeChildren = hasChildren ? item.children?.filter((child: MenuItemType) => isActive(child.href)) : [];
  const hasActiveChild = activeChildren && activeChildren.length > 0;
  const active = parentActive || hasActiveChild;
  const isOpened = openedMenu === item.href;
  const shouldBeOpened = isOpened;

  const handleMenuClick = (e: React.MouseEvent) => {
    if (hasChildren && !collapsed) {
      // Submenu aç/kapat - Link'i engelle
      e.preventDefault();
      e.stopPropagation();
      if (isOpened) {
        onToggleMenu(null);
      } else {
        onToggleMenu(item.href);
      }
    }
    // hasChildren yoksa onClick çalışmaz, Link normal çalışır (doğru davranış)
  };

  const IconComponent = item.icon;

  const navLinkProps: any = {
    component: Link,
    href: getHref(item.href),
    active: active ?? false,
    variant: 'subtle',
    onClick: handleMenuClick,
  };

  if (!collapsed && item.label) navLinkProps.label = item.label;
  if (mounted) navLinkProps.leftSection = <ClientIcon><IconComponent size={20} /></ClientIcon>;
  if (styles.navLink) navLinkProps.className = styles.navLink;
  if (!collapsed && hasChildren && shouldBeOpened !== undefined) navLinkProps.opened = shouldBeOpened;

  return (
    <NavLink {...navLinkProps}>
      {!collapsed && item.children && item.children.map((child: MenuItemType) => {
        const childActive = isActive(child.href);
        const ChildIconComponent = child.icon;
        return (
          <NavLink
            key={child.id || child.href}
            component={Link}
            href={getHref(child.href)}
            label={child.label}
            leftSection={mounted ? (
              <ClientIcon>
                <ChildIconComponent size={18} />
              </ClientIcon>
            ) : null}
            active={childActive}
            variant="subtle"
            {...(styles.navLink ? { className: styles.navLink } : {})}
            pl="xl"
          />
        );
      })}
    </NavLink>
  );
});

MenuItem.displayName = 'MenuItem';

export function Sidebar({ collapsed: externalCollapsed, onCollapsedChange }: SidebarProps) {
  const { t } = useTranslation('global');
  const pathname = usePathname();
  const { config } = useLayout();
  const { colorScheme } = useMantineColorScheme();
  const { company } = useCompany();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openedMenu, setOpenedMenu] = useState<string | null>(null);
  const [_userManuallyToggled, setUserManuallyToggled] = useState(false);

  // Ref for scrolling to active menu item
  const activeMenuRef = useRef<HTMLDivElement>(null);

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const sidebarConfig = config.sidebar;

  // Client-side mount kontrolü (hydration hatasını önlemek için)
  // useIsomorphicLayoutEffect kullanarak daha hızlı mount
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Auto mode'da tarayıcı tercihine göre dark/light mod belirleme
  // Server-side'da her zaman false (light mode) döndür, client-side'da colorScheme kullan
  const isDarkMode = useMemo(() => {
    if (!mounted) return false; // Server-side'da her zaman light mode (hydration hatasını önlemek için)
    // Client-side'da Mantine'in colorScheme'ini kullan (auto mode zaten LayoutProvider'da işleniyor)
    return colorScheme === 'dark';
  }, [mounted, colorScheme]);

  const setCollapsed = (value: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  // Arka plan rengini hesapla (sadece light mode için, client-side'da)
  const backgroundColor = useMemo(() => {
    if (!mounted || isDarkMode) {
      return undefined; // Server-side veya dark mode'da CSS'teki global dark stillerini kullan
    }
    return getBackgroundColor(sidebarConfig?.background || 'light', sidebarConfig?.customColor);
  }, [mounted, isDarkMode, sidebarConfig?.background, sidebarConfig?.customColor]);

  // Arka plan rengine göre otomatik renkler (sadece light mode için, client-side'da)
  const autoColors = useMemo(() => {
    if (!mounted || isDarkMode || !backgroundColor) {
      return null; // Server-side, dark mode veya backgroundColor yoksa varsayılan stilleri kullan
    }

    const bgIsDark = isDarkBackground(backgroundColor);
    return {
      textColor: getContrastTextColor(backgroundColor),
      iconColor: getContrastIconColor(backgroundColor),
      hoverBg: getHoverBackgroundColor(backgroundColor, bgIsDark),
      activeBg: getActiveBackgroundColor(backgroundColor, bgIsDark),
      borderColor: getContrastBorderColor(backgroundColor, bgIsDark),
      logoIconBg: bgIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
      actionButtonBg: bgIsDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    };
  }, [mounted, isDarkMode, backgroundColor]);

  // Sidebar style - sadece client-side'da uygula (hydration hatasını önlemek için)
  const sidebarStyle: React.CSSProperties = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      width: collapsed ? '4rem' : `${sidebarConfig?.width || 260}px`,
    };

    // Border ayarlarını ekle (position'a göre: left = sağ kenar, right = sol kenar)
    const borderConfig = sidebarConfig?.border;
    const isRightPosition = sidebarConfig?.position === 'right';

    if (borderConfig?.enabled) {
      const borderStyleValue = `${borderConfig.width}px solid ${borderConfig.color}`;
      if (isRightPosition) {
        baseStyle.borderLeft = borderStyleValue;
        baseStyle.borderRight = 'none';
      } else {
        baseStyle.borderRight = borderStyleValue;
        baseStyle.borderLeft = 'none';
      }
    } else {
      // Varsayılan border (1px solid)
      const defaultBorder = '1px solid var(--border-color)';
      if (isRightPosition) {
        baseStyle.borderLeft = defaultBorder;
        baseStyle.borderRight = 'none';
      } else {
        baseStyle.borderRight = defaultBorder;
        baseStyle.borderLeft = 'none';
      }
    }

    // Position ayarı (left veya right)
    if (isRightPosition) {
      baseStyle.left = 'auto';
      baseStyle.right = 0;
    } else {
      baseStyle.left = 0;
      baseStyle.right = 'auto';
    }

    // Sadece client-side'da ve light mode'da özel renkler uygula
    if (mounted && !isDarkMode && backgroundColor && autoColors) {
      return {
        ...baseStyle,
        backgroundColor,
        '--sidebar-bg-color': backgroundColor, // navScrollArea için ana sidebar ile aynı renk
        '--sidebar-text-color': autoColors.textColor,
        '--sidebar-icon-color': autoColors.iconColor,
        '--sidebar-hover-bg': autoColors.hoverBg,
        '--sidebar-active-bg': autoColors.activeBg,
        '--sidebar-border-color': autoColors.borderColor,
        '--sidebar-logo-icon-bg': autoColors.logoIconBg,
        '--sidebar-action-button-bg': autoColors.actionButtonBg,
      } as React.CSSProperties;
    }

    return baseStyle;
  }, [mounted, isDarkMode, collapsed, sidebarConfig?.width, sidebarConfig?.border, sidebarConfig?.position, backgroundColor, autoColors]);

  const locale = useMemo(() => pathname?.split('/')[1] || 'tr', [pathname]);

  // Memoize getHref function
  const getHref = useCallback((href: string) => {
    if (href.startsWith(`/${locale}/`)) return href;
    return `/${locale}${href}`;
  }, [locale]);

  // Memoize isActive function - exact match only for menu highlighting
  // Parent items get highlighted via hasActiveChild logic in MenuItem component
  const isActive = useCallback((href: string) => {
    const hrefWithLocale = `/${locale}${href}`;
    // Only exact match - no prefix matching
    // This ensures only the actual current page is highlighted, not parent paths
    return pathname === hrefWithLocale || pathname === href;
  }, [pathname, locale]);

  // Check if pathname starts with href (for parent menu auto-open)
  const isPathUnderHref = useCallback((href: string) => {
    const hrefWithLocale = `/${locale}${href}`;
    // Exact match or pathname starts with href + '/'
    if (pathname === hrefWithLocale || pathname === href) {
      return true;
    }
    if (pathname?.startsWith(hrefWithLocale + '/') || pathname?.startsWith(href + '/')) {
      return true;
    }
    return false;
  }, [pathname, locale]);

  // Menu items from central hook with sidebar location
  const menuItems = useMenuItems('sidebar');
  useModules(); // modulesLoading removed - unused

  // Menu loading state - menüler yüklenene kadar skeleton göster

  // Handler for manual menu toggle by user
  const handleToggleMenu = useCallback((href: string | null) => {
    setUserManuallyToggled(true);
    setOpenedMenu(href);
  }, []);

  // Pathname değiştiğinde aktif menüyü otomatik aç
  // Tek bir effect'te tüm mantığı birleştirerek yarış durumunu önle
  useEffect(() => {
    // Her pathname değişikliğinde manuel toggle'ı sıfırla (navigasyon tamamlandı)
    setUserManuallyToggled(false);

    if (collapsed) {
      setOpenedMenu(null);
      return;
    }

    // Use isPathUnderHref for auto-opening parent menu when navigating to child pages
    const activeMenuItem = menuItems.find(item =>
      item.children && item.children.some(child => isPathUnderHref(child.href))
    );

    if (activeMenuItem) {
      // Aktif child varsa parent menüyü otomatik aç
      setOpenedMenu(activeMenuItem.href);
    }
  }, [pathname, collapsed, menuItems]);

  // Sayfa ilk yüklendiğinde aktif menü görünür alanda değilse scroll et
  // Kullanıcı tıkladığında scroll yapmıyoruz - sadece ilk yüklemede
  const initialScrollDone = useRef(false);

  useEffect(() => {
    // Sadece ilk mount'ta ve aktif menü görünür alanda değilse scroll et
    if (mounted && activeMenuRef.current && !initialScrollDone.current) {
      const element = activeMenuRef.current;
      const scrollArea = element.closest('[data-mantine-scrollarea-viewport], .mantine-ScrollArea-viewport');

      if (scrollArea) {
        const scrollAreaRect = scrollArea.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Element görünür alanda mı kontrol et
        const isVisible =
          elementRect.top >= scrollAreaRect.top &&
          elementRect.bottom <= scrollAreaRect.bottom;

        // Sadece görünür değilse scroll et
        if (!isVisible) {
          const timeoutId = setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest', // 'center' yerine 'nearest' - minimum scroll
            });
          }, 150);
          initialScrollDone.current = true;
          return () => clearTimeout(timeoutId);
        }
      }
      initialScrollDone.current = true;
    }
    return undefined;
  }, [mounted]);

  // Pathname değişince initial scroll flag'ini sıfırla (yeni sayfaya navigasyon için)
  useEffect(() => {
    initialScrollDone.current = false;
  }, [pathname]);

  return (
    <aside
      className={`${styles.sidebar}${collapsed ? ` ${styles.collapsed}` : ''}`}
      style={sidebarStyle}
    >
      {/* Logo Section - Icon + Firma Ismi (iki satir) - Dashboard'a link */}
      <Link href={`/${locale}/dashboard`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div
          {...(styles.logoSection ? { className: styles.logoSection } : {})}
          style={mounted && !isDarkMode && backgroundColor ? {
            backgroundColor,
            cursor: 'pointer',
          } : { cursor: 'pointer' }}
        >
          <div
            {...(styles.logoIcon ? { className: styles.logoIcon } : {})}
            suppressHydrationWarning
            style={mounted && autoColors ? {
              backgroundColor: 'transparent',
              color: autoColors.iconColor,
              padding: 0,
              overflow: 'hidden',
            } : undefined}
          >
            {mounted && (
              <Image
                src={BRANDING_PATHS.pwaIcon}
                alt={company?.name || 'Logo'}
                fit="contain"
                w={collapsed ? 32 : 36}
                h={collapsed ? 32 : 36}
                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                fallbackSrc={BRANDING_PATHS.logo}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // Eğer pwaIcon yoksa logo'yu dene, o da yoksa boş bırak
                  const target = e.currentTarget;
                  if (target.src.includes('pwa-icon')) {
                    target.src = BRANDING_PATHS.logo;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            )}
          </div>
          {!collapsed && company?.name && (
            <div {...(styles.logoText ? { className: styles.logoText } : {})}>
              {/* Firma ismi iki satır olarak göster - CSS class'larını kullan */}
              {company.name.split(' ').length > 1 ? (
                <>
                  <span {...(styles.logoTitle ? { className: styles.logoTitle } : {})}>
                    {company.name.split(' ').slice(0, Math.ceil(company.name.split(' ').length / 2)).join(' ')}
                  </span>
                  <span {...(styles.logoSubtitle ? { className: styles.logoSubtitle } : {})}>
                    {company.name.split(' ').slice(Math.ceil(company.name.split(' ').length / 2)).join(' ')}
                  </span>
                </>
              ) : (
                <span {...(styles.logoTitle ? { className: styles.logoTitle } : {})}>
                  {company.name}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Collapse Toggle */}
      <div {...(styles.collapseButton ? { className: styles.collapseButton } : {})}
        style={sidebarConfig?.position === 'right' ? { right: 'auto', left: '-0.75rem' } : undefined}
      >
        <ActionIcon
          variant="subtle"
          onClick={() => setCollapsed(!collapsed)}
          {...(styles.collapseIcon ? { className: styles.collapseIcon } : {})}
          aria-label={collapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
        >
          {mounted && (
            sidebarConfig?.position === 'right'
              ? (collapsed ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />)
              : (collapsed ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />)
          )}
        </ActionIcon>
      </div>

      {/* Navigation */}
      <ScrollArea
        {...(styles.navScrollArea ? { className: styles.navScrollArea } : {})}
        style={mounted && !isDarkMode && backgroundColor ? {
          backgroundColor,
        } : undefined}
      >
        <nav {...(styles.nav ? { className: styles.nav } : {})}>
          {/* Menüler yüklenirken skeleton göster */}
          {menuItems.length === 0 ? (
            <Stack gap="xs" p="xs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  height={collapsed ? 40 : 36}
                  radius="sm"
                  animate={mounted}
                  style={{
                    backgroundColor: 'transparent',
                    opacity: 0.15,
                    border: '1px solid currentColor'
                  }}
                />
              ))}
            </Stack>
          ) : (
            menuItems.map((item, index) => {
              const prevItem = index > 0 ? menuItems[index - 1] : null;
              // Don't show divider for "page" and "module" groups
              const showGroupHeader = item.group &&
                item.group !== 'page' &&
                item.group !== 'module' &&
                (!prevItem || prevItem.group !== item.group);

              // Bu menü item'ı veya child'ı aktif mi kontrol et
              const hasActiveChild = item.children?.some(child => isActive(child.href));
              const isThisItemActive = isActive(item.href) || hasActiveChild;

              return (
                <div
                  key={item.id || item.href}
                  ref={isThisItemActive ? activeMenuRef : null}
                >
                  {showGroupHeader && (
                    <Divider
                      my="sm"
                      {...((!collapsed && item.group) ? { label: item.group } : {})}
                      labelPosition="center"
                      {...((mounted && autoColors && autoColors.borderColor) ? { color: autoColors.borderColor } : {})}
                    />
                  )}
                  <MenuItem
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive}
                    getHref={getHref}
                    openedMenu={openedMenu}
                    onToggleMenu={handleToggleMenu}
                    mounted={mounted}
                  />
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}

