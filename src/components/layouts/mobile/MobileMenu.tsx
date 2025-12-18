/**
 * MobileMenu
 * Mobil cihazlar için drawer/slide menü
 */

'use client';

import { useState } from 'react';
import { Drawer, NavLink, ScrollArea, Divider, Collapse } from '@mantine/core';
import { ModuleIcon } from '@/lib/modules/icon-loader';
import { useMenuItems } from '../hooks/useMenuItems';
import { usePathname, useRouter } from 'next/navigation';
import { useLayout } from '../core/LayoutProvider';
import { useTranslation } from '@/lib/i18n/client';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  opened: boolean;
  onClose: () => void;
}

export function MobileMenu({ opened, onClose }: MobileMenuProps) {
  const { t } = useTranslation('global');
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useLayout();
  const [openedItems, setOpenedItems] = useState<Record<string, boolean>>({});

  const menuAnimation = config.mobile?.menuAnimation || 'drawer';

  // Merkezi menü öğelerini kullan - mobile location
  const menuItems = useMenuItems('mobile');

  const locale = pathname?.split('/')[1] || 'tr';
  const getHref = (href: string) => {
    if (href.startsWith(`/${locale}/`)) return href;
    return `/${locale}${href}`;
  };

  const isActive = (href: string) => {
    const hrefWithLocale = `/${locale}${href}`;
    return pathname === hrefWithLocale || pathname?.startsWith(hrefWithLocale + '/') || pathname?.startsWith(href) || false;
  };

  const toggleItem = (href: string) => {
    setOpenedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(getHref(href));
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={t('layout.menu')}
      position="left"
      size="280px"
      overlayProps={{ opacity: 0.5, blur: 4 }}
      transitionProps={{
        transition: menuAnimation === 'slide' ? 'slide-right' : menuAnimation === 'fade' ? 'fade' : 'slide-right',
        duration: 300,
        timingFunction: 'ease',
      }}
      {...(styles.mobileMenu ? { className: styles.mobileMenu } : {})}
    >
      <ScrollArea h="calc(100vh - 60px)">
        <div className={styles.menuContent}>
          {menuItems.map((item, index) => {
            const itemIsActive = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isOpened = openedItems[item.href] || false;

            // Grup başlığı kontrolü - önceki item'dan farklı grup ise göster
            const prevItem = index > 0 ? menuItems[index - 1] : null;
            const currentGroup = (item as any).group;
            const prevGroup = prevItem ? (prevItem as any).group : null;
            // Don't show divider for "page" and "module" groups
            const showGroupHeader = currentGroup && 
              currentGroup !== 'page' && 
              currentGroup !== 'module' && 
              currentGroup !== prevGroup;

            return (
              <div key={item.id || item.href}>
                {showGroupHeader && (
                  <Divider
                    my="sm"
                    label={currentGroup}
                    labelPosition="center"
                    {...(styles.groupDivider ? { className: styles.groupDivider } : {})}
                  />
                )}
                {hasChildren ? (
                  <>
                    <NavLink
                      label={item.label}
                      leftSection={
                        typeof item.icon === 'string' ? (
                          <ModuleIcon
                            iconName={item.icon}
                            size={20}
                          />
                        ) : (
                          item.icon ? <item.icon size={20} /> : null
                        )
                      }
                      rightSection={
                        isOpened ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />
                      }
                      active={itemIsActive}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleItem(item.href);
                      }}
                      {...(styles.menuItem ? { className: styles.menuItem } : {})}
                    />
                    <Collapse in={isOpened}>
                      <div {...(styles.subMenu ? { className: styles.subMenu } : {})}>
                        {item.children?.map((child) => {
                          const childIsActive = isActive(child.href);

                          return (
                            <NavLink
                              key={child.href}
                              label={child.label}
                              leftSection={
                                typeof child.icon === 'string' ? (
                                  <ModuleIcon
                                    iconName={child.icon}
                                    size={18}
                                  />
                                ) : (
                                  child.icon ? <child.icon size={18} /> : null
                                )
                              }
                              active={childIsActive}
                              {...(styles.subMenuItem ? { className: styles.subMenuItem } : {})}
                              onClick={(e) => handleNavClick(e, child.href)}
                            />
                          );
                        })}
                      </div>
                    </Collapse>
                  </>
                ) : (
                  <NavLink
                    label={item.label}
                    leftSection={
                      typeof item.icon === 'string' ? (
                        <ModuleIcon
                          iconName={item.icon}
                          size={20}
                        />
                      ) : (
                        item.icon ? <item.icon size={20} /> : null
                      )
                    }
                    active={itemIsActive}
                    {...(styles.menuItem ? { className: styles.menuItem } : {})}
                    onClick={(e) => handleNavClick(e, item.href)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Drawer>
  );
}

