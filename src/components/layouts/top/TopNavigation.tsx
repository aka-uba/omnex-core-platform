/**
 * TopNavigation v2
 * Top layout için navigasyon menüsü
 */

'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Group, Tooltip, Skeleton } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useLayout } from '../core/LayoutProvider';
import { useMenuItems, MenuItem } from '../hooks/useMenuItems';
import { IconDots, IconChevronRight } from '@tabler/icons-react';
import {
  getBackgroundColor,
  isDarkBackground
} from '../shared/colorUtils';
import styles from './TopNavigation.module.css';

export function TopNavigation() {
  const { t } = useTranslation('global');
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useLayout();
  const { colorScheme } = useMantineColorScheme();
  const [visibleCount, setVisibleCount] = useState(5);
  const [dropdownWidth, setDropdownWidth] = useState<number>(200);
  const [mounted, setMounted] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Menu state for controlling open/close
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigate using router.push (soft navigation)
  const navigateTo = useCallback((href: string) => {
    setMenuOpened(false); // Close menu first
    router.push(href);
  }, [router]);

  const locale = pathname?.split('/')[1] || 'tr';
  const getHref = (href: string) => {
    if (href.startsWith(`/${locale}/`)) return href;
    return `/${locale}${href}`;
  };
  const isActive = (href: string) => {
    const hrefWithLocale = `/${locale}${href}`;
    return pathname?.startsWith(hrefWithLocale) || pathname?.startsWith(href) || false;
  };

  // Get menu items from central hook with top location
  const allMenuItems = useMenuItems('top');

  // Dinamik olarak görünen menü sayısını hesapla
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    let measureTimeout: NodeJS.Timeout;

    const calculateVisibleCount = () => {
      if (!navigationRef.current) return;

      const navigation = navigationRef.current;
      const navigationWidth = navigation.offsetWidth;
      if (navigationWidth === 0) return; // Henüz render edilmemişse bekle

      const moreButtonWidth = 48; // "..." butonunun yaklaşık genişliği
      const gap = 4; // Group gap
      let totalWidth = 0;
      let count = 0;

      // Her menü öğesinin genişliğini hesapla
      for (let i = 0; i < allMenuItems.length; i++) {
        const menuItem = allMenuItems[i];
        if (!menuItem) continue;
        const itemElement = itemsRef.current.get(menuItem.href);
        let itemWidth = 0;

        if (itemElement && itemElement.offsetWidth > 0) {
          // Gerçek genişliği ölç
          itemWidth = itemElement.offsetWidth || itemElement.scrollWidth;
        } else {
          // Eğer element henüz render edilmemişse, daha doğru tahmini genişlik kullan
          const menuItem = allMenuItems[i];
          if (!menuItem) continue;
          const labelLength = menuItem.label?.length || 0;
          // Icon için 24px, padding için 32px (left + right), her karakter için ~8px
          itemWidth = Math.max(80, labelLength * 8 + 24 + 32);
        }

        totalWidth += itemWidth + gap;

        // Eğer toplam genişlik + "..." butonu navigation genişliğini aşıyorsa dur
        // Biraz margin ekle (10px) güvenlik için
        if (totalWidth + moreButtonWidth + 10 > navigationWidth) {
          break;
        }
        count++;
      }

      // En az 1 menü öğesi göster, en fazla tüm menü öğeleri
      const newCount = Math.max(1, Math.min(count || 1, allMenuItems.length));
      if (newCount !== visibleCount) {
        setVisibleCount(newCount);
      }
    };

    // İlk hesaplama için birkaç kez dene (DOM render edildikten sonra)
    const initialTimeout = setTimeout(() => {
      calculateVisibleCount();
      // İkinci ölçüm (elementler render edildikten sonra)
      measureTimeout = setTimeout(() => {
        calculateVisibleCount();
      }, 200);
    }, 200);

    // Resize event listener (debounced)
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateVisibleCount();
        // İkinci ölçüm
        setTimeout(calculateVisibleCount, 100);
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver ile navigation container genişliğini takip et
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateVisibleCount();
        setTimeout(calculateVisibleCount, 100);
      }, 200);
    });

    if (navigationRef.current) {
      observer.observe(navigationRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(resizeTimeout);
      clearTimeout(measureTimeout);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [allMenuItems, visibleCount]);

  // Visible ve overflow items
  const visibleItems = allMenuItems.slice(0, visibleCount);
  const overflowItems = allMenuItems.slice(visibleCount);

  // Dropdown menü genişliğini hesapla (label uzunluklarına göre)
  useEffect(() => {
    if (overflowItems.length === 0) {
      setDropdownWidth(200);
      return;
    }

    // En uzun label'ı bul
    let maxLabelLength = 0;
    overflowItems.forEach((item) => {
      if (item.label.length > maxLabelLength) {
        maxLabelLength = item.label.length;
      }
    });

    // Her karakter için yaklaşık 7-8px, icon için 24px, padding için 32px
    // Minimum 200px
    const calculatedWidth = Math.max(200, maxLabelLength * 8 + 24 + 32);
    setDropdownWidth(calculatedWidth);
  }, [overflowItems]);

  // Calculate background color for dropdown menu (light mode only)
  const topConfig = config.top;
  const isDarkMode = colorScheme === 'dark';
  const backgroundColor = useMemo(() => {
    if (isDarkMode || !topConfig) {
      return undefined;
    }
    return getBackgroundColor(topConfig.background || 'light', topConfig.customColor);
  }, [isDarkMode, topConfig]);

  // Dropdown menu style with auto colors
  const dropdownStyle = useMemo(() => {
    if (isDarkMode || !backgroundColor) {
      return {};
    }
    const bgIsDark = isDarkBackground(backgroundColor);
    // Gradyan tercihinde alt menü arka planı beyaz olmalı
    const isGradient = topConfig?.background === 'gradient';
    const menuBg = isGradient ? '#ffffff' : backgroundColor;
    const menuBgIsDark = isGradient ? false : bgIsDark;
    return {
      '--menu-bg': menuBg,
      '--menu-text': menuBgIsDark ? '#ffffff' : '#000000',
      '--menu-hover-bg': menuBgIsDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      '--menu-border': menuBgIsDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    } as React.CSSProperties;
  }, [isDarkMode, backgroundColor, topConfig]);

  // Handle navigation click - prevent default and use router.push for soft navigation
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    navigateTo(href);
  }, [navigateTo]);

  // Render menu item with submenu support - SIMPLIFIED VERSION
  const renderMenuItem = (item: MenuItem, isInDropdown = false) => {
    const active = isActive(item.href) || (item.children && item.children.some(child => isActive(child.href)));
    const itemHref = getHref(item.href);

    // Top-level menu item (visible in navigation bar)
    if (!isInDropdown) {
      return (
        <Tooltip label={item.label} position="bottom" withArrow key={item.href}>
          {item.children && item.children.length > 0 ? (
            // Top-level item with children - use Menu for dropdown
            <Menu
              shadow="md"
              width={200}
              position="bottom-start"
              trigger="hover"
            >
              <Menu.Target>
                <a
                  href={itemHref}
                  onClick={(e) => handleNavClick(e, itemHref)}
                  {...((`${styles.navLink} ${active ? styles.active : ''}`) ? { className: `${styles.navLink} ${active ? styles.active : ''}` } : {})}
                  title={item.label}
                >
                  {mounted && (
                    <span {...(styles.navLinkIcon ? { className: styles.navLinkIcon } : {})}>
                      <item.icon size={18} />
                    </span>
                  )}
                  <span>{item.label}</span>
                </a>
              </Menu.Target>
              <Menu.Dropdown {...(styles.menuDropdown ? { className: styles.menuDropdown } : {})} style={dropdownStyle}>
                {item.children.map((child) => renderDropdownItem(child))}
              </Menu.Dropdown>
            </Menu>
          ) : (
            // Top-level item without children - use anchor with onClick for soft navigation
            <a
              href={itemHref}
              onClick={(e) => handleNavClick(e, itemHref)}
              className={`${styles.navLink} ${active ? styles.active : ''}`}
              title={item.label}
            >
              <span className={styles.navLinkIcon}>
                <item.icon size={18} />
              </span>
              <span>{item.label}</span>
            </a>
          )}
        </Tooltip>
      );
    }

    // Dropdown menu item (inside overflow menu)
    return renderDropdownItem(item);
  };

  // Render dropdown item (used in both top-level dropdowns and overflow menu)
  const renderDropdownItem = (item: MenuItem): React.ReactNode => {
    const active = isActive(item.href) || (item.children && item.children.some(child => isActive(child.href)));

    // Item with children - create nested menu (opens to the right)
    if (item.children && item.children.length > 0) {
      return (
        <Menu
          key={item.href}
          shadow="md"
          width={200}
          position="right-start"
          trigger="hover"
          openDelay={100}
          closeDelay={200}
        >
          <Menu.Target>
            <Menu.Item
              {...((active ? styles.menuItemActive : '') ? { className: (active ? styles.menuItemActive : '') } : {})}
              rightSection={mounted ? <IconChevronRight size={16} /> : null}
              leftSection={
                mounted ? (
                  <span {...(styles.menuItemIcon ? { className: styles.menuItemIcon } : {})}>
                    <item.icon size={16} />
                  </span>
                ) : null
              }
            >
              {item.label}
            </Menu.Item>
          </Menu.Target>
          <Menu.Dropdown {...(styles.menuDropdown ? { className: styles.menuDropdown } : {})} style={dropdownStyle}>
            {item.children.map((child) => {
              const childActive = isActive(child.href);
              const childHref = getHref(child.href);
              const ChildIcon = child.icon;
              return (
                <Menu.Item
                  key={child.href}
                  {...((childActive ? styles.menuItemActive : '') ? { className: (childActive ? styles.menuItemActive : '') } : {})}
                  leftSection={
                    mounted ? (
                      <span {...(styles.menuItemIcon ? { className: styles.menuItemIcon } : {})}>
                        <ChildIcon size={16} />
                      </span>
                    ) : null
                  }
                  onClick={() => navigateTo(childHref)}
                >
                  {child.label}
                </Menu.Item>
              );
            })}
          </Menu.Dropdown>
        </Menu>
      );
    }

    // Item without children - simple clickable item
    const IconComponent = item.icon;
    const itemHref = getHref(item.href);
    return (
      <Menu.Item
        key={item.href}
        {...((active ? styles.menuItemActive : '') ? { className: (active ? styles.menuItemActive : '') } : {})}
        leftSection={
          mounted ? (
            <span className={styles.menuItemIcon}>
              <IconComponent size={16} />
            </span>
          ) : null
        }
        onClick={() => navigateTo(itemHref)}
      >
        {item.label}
      </Menu.Item>
    );
  };

  // Helper: Grup değişimlerini tespit et
  const getGroupDividers = (items: MenuItem[]) => {
    const dividers: Record<number, string> = {};
    items.forEach((item, index) => {
      const currentGroup = (item as any).group;
      const prevGroup = index > 0 ? (items[index - 1] as any).group : null;
      // Don't show divider for "page" and "module" groups
      if (currentGroup &&
        currentGroup !== 'page' &&
        currentGroup !== 'module' &&
        currentGroup !== prevGroup) {
        dividers[index] = currentGroup;
      }
    });
    return dividers;
  };

  const visibleDividers = getGroupDividers(visibleItems);
  const overflowDividers = getGroupDividers(overflowItems);

  return (
    <nav ref={navigationRef} {...(styles.navigation ? { className: styles.navigation } : {})}>
      {!mounted || allMenuItems.length === 0 ? (
        // Skeleton loader - transparent to work with any background color
        <Group gap={4} wrap="nowrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              height={40}
              width={100}
              style={{
                backgroundColor: 'transparent',
                opacity: 0.15,
                border: '1px solid currentColor',
                borderRadius: '8px'
              }}
            />
          ))}
        </Group>
      ) : (
        <Group gap={4} wrap="nowrap">
          {visibleItems.map((item, index) => {
            const showDivider = visibleDividers[index];
            return (
              <div
                key={item.href}
                ref={(el) => {
                  if (el) {
                    // Link elementini bul ve ref'e ekle
                    const linkElement = el.querySelector('a') || el.querySelector('button') || el;
                    itemsRef.current.set(item.href, linkElement as HTMLElement);
                  } else {
                    itemsRef.current.delete(item.href);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', marginLeft: showDivider ? 12 : 0 }}
              >
                {renderMenuItem(item, false)}
              </div>
            );
          })}
          {overflowItems.length > 0 && (
            <Menu
              shadow="md"
              width={dropdownWidth}
              position="bottom-start"
              opened={menuOpened}
              onChange={setMenuOpened}
            >
              <Menu.Target>
                <button {...(styles.moreButton ? { className: styles.moreButton } : {})} aria-label={t('layout.moreMenuItems')} title={t('layout.moreMenuItems')}>
                  <IconDots size={18} />
                </button>
              </Menu.Target>
              <Menu.Dropdown {...(styles.menuDropdown ? { className: styles.menuDropdown } : {})} style={dropdownStyle}>
                {overflowItems.map((item, index) => {
                  const showLabel = overflowDividers[index];
                  return (
                    <div key={item.href}>
                      {showLabel && (
                        <Menu.Label {...(styles.groupLabel ? { className: styles.groupLabel } : {})}>{showLabel}</Menu.Label>
                      )}
                      {renderMenuItem(item, true)}
                    </div>
                  );
                })}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      )}
    </nav>
  );
}

