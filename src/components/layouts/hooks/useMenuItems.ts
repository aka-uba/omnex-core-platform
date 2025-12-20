/**
 * useMenuItems - Merkezi menü kaynağı
 * Sidebar ve TopNavigation için ortak menü verisi sağlar
 * 
 * v2.0 - Çift render ve modül menü sorunları düzeltildi
 */

'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useModules } from '@/context/ModuleContext';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n/client';
import {
  IconDashboard,
  IconApps,
  IconSettings,
  IconSettings2,
  IconHelp,
  IconBrain,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarTime,
  IconCalendarCheck,
  IconFolder,
  IconFileCheck,
  IconSignature,
  IconBell,
  IconUsers,
  IconUser,
  IconMapPin,
  IconMap,
  IconTable,
  IconUserCircle,
  IconMessageCircle,
  IconMessage,
  IconMail,
  IconSend,
  IconReport,
  IconUpload,
  IconDownload,
  IconShield,
  IconShieldCheck,
  IconMenu2,
  IconLock,
  IconKey,
  IconMessageChatbot,
  IconPhoto,
  IconCode,
  IconMicrophone,
  IconVideo,
  IconChartBar,
  IconChartLine,
  IconChartPie,
  IconLayout,
  IconLayoutGrid,
  IconBuilding,
  IconBuildingCommunity,
  IconDatabase,
  IconServer,
  IconHistory,
  IconFileExport,
  IconForms,
  IconCurrencyDollar,
  IconTools,
  IconTool,
  IconHammer,
  IconBuildingFactory,
  IconPackage,
  IconBox,
  IconBoxMultiple,
  IconList,
  IconClipboardList,
  IconClipboard,
  IconClipboardCheck,
  IconRepeat,
  IconFileText,
  IconCreditCard,
  IconReceipt,
  IconReceipt2,
  IconWallet,
  IconSchool,
  IconTruck,
  IconClock,
  IconCircle,
  IconTemplate,
  IconHome,
  IconDoor,
  IconPlus,
  IconEdit,
  IconEye,
  IconArchive,
  IconFile,
  IconChevronRight,
  IconShoppingCart,
  IconAlertCircle,
  IconTicket,
  IconHeadset,
  IconTrendingUp,
  IconAdjustments,
} from '@tabler/icons-react';

export interface MenuItem {
  id?: string; // Unique identifier for menu item
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  order: number;
  children?: MenuItem[];
  group?: string | undefined; // Menu group/section name
  moduleSlug?: string | undefined; // Module slug for tracking
}

// Return type with loading state
export interface UseMenuItemsResult {
  menuItems: MenuItem[];
  isLoading: boolean;
}

export function useMenuItems(location: string = 'sidebar'): MenuItem[] {
  const { activeModules, loading: modulesLoading } = useModules();
  const { user, loading } = useAuth();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');

  // Access control config for module visibility
  const [moduleAccessConfig, setModuleAccessConfig] = useState<Record<string, { enabled: boolean; features?: string[] }>>({});
  const [menuVisibilityConfig, setMenuVisibilityConfig] = useState<{ items: { id: string; visible: boolean; order: number }[] }>({ items: [] });

  // Fetch access control configs
  useEffect(() => {
    const fetchAccessConfigs = async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');

        // Fetch module access config
        const moduleRes = await fetchWithAuth('/api/access-control?type=module').catch(() => null);
        if (moduleRes?.ok) {
          const data = await moduleRes.json();
          if (data.success && data.data?.length > 0) {
            setModuleAccessConfig(data.data[0].config || {});
          }
        }

        // Fetch menu visibility config
        const menuRes = await fetchWithAuth('/api/access-control?type=menu').catch(() => null);
        if (menuRes?.ok) {
          const data = await menuRes.json();
          if (data.success && data.data?.length > 0) {
            setMenuVisibilityConfig(data.data[0].config || { items: [] });
          }
        }
      } catch (err) {
        console.error('[useMenuItems] Failed to fetch access control configs:', err);
      }
    };

    if (user && !loading) {
      fetchAccessConfigs();
    }
  }, [user, loading]);

  // Listen for access control config updates
  useEffect(() => {
    const handleConfigUpdate = () => {
      // Re-fetch configs when they're saved
      const fetchAccessConfigs = async () => {
        try {
          const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');

          const moduleRes = await fetchWithAuth('/api/access-control?type=module').catch(() => null);
          if (moduleRes?.ok) {
            const data = await moduleRes.json();
            if (data.success && data.data?.length > 0) {
              setModuleAccessConfig(data.data[0].config || {});
            }
          }

          const menuRes = await fetchWithAuth('/api/access-control?type=menu').catch(() => null);
          if (menuRes?.ok) {
            const data = await menuRes.json();
            if (data.success && data.data?.length > 0) {
              setMenuVisibilityConfig(data.data[0].config || { items: [] });
            }
          }
        } catch (err) {
          console.error('[useMenuItems] Failed to fetch access control configs:', err);
        }
      };
      fetchAccessConfigs();
    };

    window.addEventListener('access-control-saved', handleConfigUpdate);
    return () => window.removeEventListener('access-control-saved', handleConfigUpdate);
  }, []);

  // Track if initial menu load is complete to prevent flash
  const initialLoadComplete = useRef(false);

  // Helper function to get translation for module menu
  const getModuleTranslation = (moduleSlug: string, key: string, fallback: string): string => {
    try {
      const translationModule = require(`@/locales/modules/${moduleSlug}/${locale}.json`);
      const translations = translationModule.default || translationModule;

      // Helper to ensure we return a string, not an object
      const ensureString = (value: any): string => {
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null) {
          // If it's an object, try to get a title or label property
          if (value.title) return String(value.title);
          if (value.label) return String(value.label);
          // Otherwise return fallback
          return fallback;
        }
        return fallback;
      };

      // Try menu.label first, then menu.title, then title, then fallback
      if (key === 'label') {
        const label = translations.menu?.label || translations.menu?.title || translations.title || fallback;
        return ensureString(label);
      }

      // For menu items, try menu.items.{itemKey} (object format) or menu.items[] (array format)
      if (key.startsWith('item.')) {
        const itemKey = key.replace('item.', '');

        // Try object format first: menu.items.{itemKey}
        if (translations.menu?.items && typeof translations.menu.items === 'object' && !Array.isArray(translations.menu.items)) {
          if (translations.menu.items[itemKey]) {
            return ensureString(translations.menu.items[itemKey]);
          }
        }

        // Try array format: menu.items[] with path matching
        if (translations.menu?.items && Array.isArray(translations.menu.items)) {
          const item = translations.menu.items.find((i: any) => {
            const path = i.path || '';
            return path.includes(itemKey) || i.title === itemKey || i.label === itemKey;
          });
          if (item) {
            const itemLabel = item.title || item.label || fallback;
            return ensureString(itemLabel);
          }
        }

        // Try direct key lookup in menu object
        if (translations.menu?.[itemKey]) {
          return ensureString(translations.menu[itemKey]);
        }

        // Try direct key lookup in root translations - but be careful, it might be an object
        if (translations[itemKey]) {
          return ensureString(translations[itemKey]);
        }
      }

      return fallback;
    } catch {
      return fallback;
    }
  };

  // SuperAdmin kontrolü - role case-insensitive olarak kontrol et
  // User yüklenene kadar bekle
  const isSuperAdmin = !loading && user?.role && (
    user.role === 'SuperAdmin' ||
    user.role.toLowerCase() === 'superadmin'
  );


  // Custom menus are now loaded directly from module metadata (no API call needed)
  // This is handled in the activeModuleMenuItems useMemo below

  // NOT: Hardcoded menüler kaldırıldı!
  // Tüm menüler artık menu-management.json'dan (managedMenus) geliyor.
  // Bu sayede menü yönetimi sayfasındaki sıralama ile sidebar sıralaması her zaman uyumlu olur.
  // Eğer managedMenus boşsa, fallback olarak varsayılan menüler kullanılır.

  // Icon mapping for string icons - MUST be defined before usage
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    // Dashboard & Overview
    Dashboard: IconDashboard,
    ChartBar: IconChartBar,
    ChartLine: IconChartLine,
    ChartPie: IconChartPie,
    Report: IconReport,
    TrendingUp: IconTrendingUp,

    // Navigation & Apps
    Apps: IconApps,
    Layout: IconLayout,
    LayoutFooter: IconLayout, // Fallback - IconLayoutFooter doesn't exist
    LayoutGrid: IconLayoutGrid,
    Menu2: IconMenu2,
    ChevronRight: IconChevronRight,

    // Users & People
    Users: IconUsers,
    User: IconUser,
    UserCircle: IconUserCircle,
    UserCheck: IconUsers,

    // Settings & Config
    Settings: IconSettings,
    Settings2: IconSettings2,
    Adjustments: IconAdjustments,

    // Currency & Finance
    CurrencyDollar: IconCurrencyDollar,
    CreditCard: IconCreditCard,
    Receipt: IconReceipt,
    Receipt2: IconReceipt2,
    Wallet: IconWallet,
    Repeat: IconRepeat,
    ShoppingCart: IconShoppingCart,

    // Buildings & Locations
    Building: IconBuilding,
    BuildingCommunity: IconBuildingCommunity,
    BuildingFactory: IconBuildingFactory,
    Factory: IconBuildingFactory,
    Warehouse: IconBuilding,
    Home: IconHome,
    Door: IconDoor,
    MapPin: IconMapPin,
    Map: IconMap,

    // Calendar & Time
    Calendar: IconCalendar,
    CalendarEvent: IconCalendarEvent,
    CalendarTime: IconCalendarTime,
    CalendarCheck: IconCalendarCheck,
    Clock: IconClock,
    History: IconHistory,

    // Files & Documents
    File: IconFile,
    FileText: IconFileText,
    FileCheck: IconFileCheck,
    FileSignature: IconSignature,
    FileExport: IconFileExport,
    Folder: IconFolder,
    Template: IconTemplate,
    Forms: IconForms,
    Clipboard: IconClipboard,
    ClipboardList: IconClipboardList,
    ClipboardCheck: IconClipboardCheck,

    // Communication
    Message: IconMessage,
    MessageCircle: IconMessageCircle,
    MessageChatbot: IconMessageChatbot,
    Mail: IconMail,
    Send: IconSend,
    Bell: IconBell,

    // CRUD Actions
    Plus: IconPlus,
    Edit: IconEdit,
    Eye: IconEye,
    List: IconList,
    Archive: IconArchive,
    Upload: IconUpload,
    Download: IconDownload,

    // Security & Access
    Shield: IconShield,
    ShieldCheck: IconShieldCheck,
    Lock: IconLock,
    Key: IconKey,

    // Tech & Development
    Brain: IconBrain,
    Code: IconCode,
    Database: IconDatabase,
    Server: IconServer,
    Photo: IconPhoto,
    Microphone: IconMicrophone,
    Video: IconVideo,

    // Tools & Maintenance
    Tools: IconTools,
    Tool: IconTool,
    Hammer: IconHammer,
    AlertCircle: IconAlertCircle,
    Ticket: IconTicket,

    // Products & Inventory
    Package: IconPackage,
    Box: IconBox,
    BoxMultiple: IconBoxMultiple,

    // Misc
    Help: IconHelp,
    Headset: IconHeadset,
    Table: IconTable,
    Hierarchy: IconTable,
    Components: IconApps,
    Circle: IconCircle,
    School: IconSchool,
    Truck: IconTruck,
  };

  // Import default menus
  const { getDefaultMenusByRole } = useMemo(() => {
    return require('@/config/default-menus.config');
  }, []);

  // Get default menus for current user role
  const defaultMenusForRole: MenuItem[] = useMemo(() => {
    if (loading || !user?.role) {
      return [];
    }

    const userRole = user.role;
    const roleDefaultMenus = getDefaultMenusByRole(userRole);

    // Convert default menus to MenuItem format
    return roleDefaultMenus.map((menu: any) => {
      const label = typeof menu.label === 'string' ? menu.label : (menu.label[locale] || menu.label['en'] || menu.label['tr']);
      const href = menu.href.startsWith('/') ? `/${locale}${menu.href}` : `/${locale}/${menu.href}`;
      const iconComponent = iconMap[menu.icon] || IconApps;

      const menuItem: MenuItem = {
        id: menu.id,
        label,
        href,
        icon: iconComponent,
        order: menu.order,
        group: menu.group,
      };

      // Add children if exists
      if (menu.children && menu.children.length > 0) {
        menuItem.children = menu.children.map((child: any) => {
          const childLabel = typeof child.label === 'string' ? child.label : (child.label[locale] || child.label['en'] || child.label['tr']);
          const childHref = child.href.startsWith('/') ? `/${locale}${child.href}` : `/${locale}/${child.href}`;
          const childIcon = iconMap[child.icon] || IconApps;

          return {
            id: child.id,
            label: childLabel,
            href: childHref,
            icon: childIcon,
            order: child.order,
          };
        });
      }

      return menuItem;
    });
  }, [user, loading, locale, iconMap, getDefaultMenusByRole]);

  // Fetch available pages for all modules
  const [modulePages, setModulePages] = useState<Record<string, any[]>>({});
  const [pagesLoading, setPagesLoading] = useState(true);

  useEffect(() => {
    const loadModulePages = async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
        const response = await fetchWithAuth(`/api/menu-management/available-pages?locale=${locale}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.categories) {
            const pagesByModule: Record<string, any[]> = {};

            data.data.categories.forEach((category: any) => {
              if (category.id?.startsWith('module-')) {
                const moduleSlug = category.id.replace('module-', '');
                pagesByModule[moduleSlug] = category.pages || [];
              }
            });

            setModulePages(pagesByModule);
          }
        }
      } catch (error) {
        console.error('Failed to load module pages:', error);
      } finally {
        setPagesLoading(false);
      }
    };

    loadModulePages();
  }, [locale]);

  // Active modules from context - automatically generate menu items from available-pages API
  const activeModuleMenuItems: MenuItem[] = useMemo(() => {
    if (!activeModules || activeModules.length === 0 || pagesLoading) {
      return [];
    }

    // Helper to check if href contains dynamic route patterns like [id], [slug], etc.
    // Also filter out create/edit/tracking pages as they are typically form/detail pages
    const hasDynamicRoute = (href: string) => {
      // Check for dynamic route patterns like [id], [slug]
      if (/\[.*\]/.test(href)) return true;
      // Check for create/edit pages (they shouldn't be in menu)
      if (href.includes('/create') || href.includes('/edit')) return true;
      // Check for tracking pages (they shouldn't be in menu)
      if (href.includes('/tracking')) return true;
      return false;
    };

    // Build hierarchical menu structure from pages
    const buildMenuFromPages = (pages: any[], parentId?: string, level = 0): MenuItem[] => {
      const items: MenuItem[] = [];

      // First pass: Find all pages that match the current parent
      const matchingPages = pages.filter((page) => {
        const isChild = parentId ? page.parentId === parentId : !page.parentId;
        return isChild;
      });

      // Sort by order to ensure consistent ordering
      matchingPages.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 999;
        const orderB = typeof b.order === 'number' ? b.order : 999;
        return orderA - orderB;
      });

      matchingPages.forEach((page) => {
        const pageLabel = page.label || page.title || 'Untitled';
        const pageHref = page.href || page.path || '#';

        // Skip dynamic routes (they can't be used in Link components)
        // Also skip their children to prevent unwanted submenus
        if (hasDynamicRoute(pageHref)) {
          return; // Skip this dynamic route item and its children
        }

        const normalizedHref = pageHref.startsWith('/') ? `/${locale}${pageHref}` : `/${locale}/${pageHref}`;
        const pageIcon = page.icon && typeof page.icon === 'string' ? (iconMap[page.icon] || IconApps) : IconApps;

        // Recursively build children for this page
        const children = buildMenuFromPages(pages, page.id, level + 1);

        const menuItem: MenuItem = {
          label: pageLabel,
          href: normalizedHref,
          icon: pageIcon,
          order: typeof page.order === 'number' ? page.order : 0,
          moduleSlug: page.moduleSlug || '',
        };

        if (children.length > 0) {
          menuItem.children = children;
        }

        items.push(menuItem);
      });

      return items;
    };

    const menuItems = activeModules.map((module) => {
      // Get module label from translation or use module name
      const moduleLabel = getModuleTranslation(module.slug, 'label', module.name);

      // Get icon component
      let iconComponent: React.ComponentType<{ size?: number; className?: string }> = IconApps;
      if (typeof module.icon === 'string') {
        iconComponent = iconMap[module.icon] || IconApps;
      } else if (module.icon) {
        iconComponent = module.icon;
      }

      // Get menu href
      const menuHref = `/modules/${module.slug}`;
      const normalizedHref = `/${locale}${menuHref}`;

      // Get children from available-pages API
      const modulePagesData = modulePages[module.slug] || [];
      const children = buildMenuFromPages(modulePagesData);

      // Automatically add Settings item at the end of each module group
      // This is an inline setting - not managed through menu management page
      if (children.length > 0) {
        const settingsHref = `/${locale}/modules/${module.slug}/settings`;
        const settingsIndex = children.findIndex(child => child.href === settingsHref);

        // Get highest order from existing children to place Settings at the end
        const maxOrder = children.reduce((max, child) => {
          return Math.max(max, child.order || 0);
        }, 0);

        if (settingsIndex !== -1) {
          // Settings already exists - move it to the end with highest order
          const settingsItem = children.splice(settingsIndex, 1)[0];
          if (settingsItem) {
            settingsItem.order = maxOrder + 1; // Always at the end
            children.push(settingsItem);
          }
        } else {
          // Settings doesn't exist - add it at the end
          // Get Settings label from module translation or use global "Settings"
          const settingsLabel = getModuleTranslation(module.slug, 'item.settings', t('settings'));

          // Add Settings item at the end
          const settingsItem: MenuItem = {
            label: settingsLabel,
            href: settingsHref,
            icon: IconSettings,
            order: maxOrder + 1, // Always at the end
          };

          children.push(settingsItem);
        }
      }

      const menuItem: MenuItem = {
        label: moduleLabel,
        href: normalizedHref,
        icon: iconComponent,
        order: 50,
        moduleSlug: module.slug, // Add moduleSlug for tracking
      };

      if (children.length > 0) {
        menuItem.children = children;
      }

      return menuItem;
    });

    return menuItems;
  }, [activeModules, locale, modulePages, pagesLoading, iconMap, getModuleTranslation]); // Recalculate when activeModules, locale, or modulePages changes

  // Tenant Admin kontrolü - role case-insensitive olarak kontrol et
  // SuperAdmin da Tenant Admin yetkilerine sahip
  const isTenantAdmin = !loading && user?.role && (
    user.role === 'Admin' ||
    user.role.toLowerCase() === 'admin' ||
    isSuperAdmin // SuperAdmin da firma yönetimi yapabilir
  );

  // NOT: Hardcoded menüler kaldırıldı!
  // Tüm Super Admin ve Firma Yönetimi menüleri artık JSON'dan (managedMenus) geliyor.
  // Menü yönetimi sayfasında bu menüler JSON'a kaydediliyor ve buradan okunuyor.
  // Bu sayede menü yönetimi sayfasındaki değişiklikler sidebar'a da yansıyor.

  // Load managed menus from menu-management API
  const [managedMenus, setManagedMenus] = useState<MenuItem[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);

  // Raw managed menus data for comparison (kept for potential future use)

  const [, setRawManagedMenus] = useState<any[]>([]);

  // Menu refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for menu update events
  useEffect(() => {
    const handleMenuUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('menu-updated', handleMenuUpdate);
    return () => window.removeEventListener('menu-updated', handleMenuUpdate);
  }, []);

  useEffect(() => {
    const loadManagedMenus = async () => {
      try {
        // Fetch from menu-resolver API with location parameter
        const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
        const response = await fetchWithAuth(`/api/menu-resolver/${location}`);

        // If 401, silently fail (user not logged in, use default menus)
        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data && data.data.menu) {
          const menuData = data.data.menu;

          // Helper to check if href contains dynamic route patterns like [id], [slug], etc.
          // Also filter out create/edit/tracking pages as they are typically form/detail pages
          const hasDynamicRoute = (href: string) => {
            // Check for dynamic route patterns like [id], [slug]
            if (/\[.*\]/.test(href)) return true;
            // Check for create/edit pages (they shouldn't be in menu)
            if (href.includes('/create') || href.includes('/edit')) return true;
            // Check for tracking pages (they shouldn't be in menu)
            if (href.includes('/tracking')) return true;
            return false;
          };

          // Helper to get localized label
          const getLocalizedLabel = (label: any): string => {
            if (typeof label === 'string') return label;
            if (typeof label === 'object' && label !== null) {
              return label[locale] || label['en'] || Object.values(label)[0] || '';
            }
            return '';
          };

          // Convert menu items to MenuItem format
          const convertItems = (items: any[]): MenuItem[] => {
            return items
              .filter((item: any) => !hasDynamicRoute(item.href))
              .map((item: any) => {
                // Get icon component
                let iconComponent: React.ComponentType<{ size?: number; className?: string }> = IconApps;
                if (item.icon && iconMap[item.icon]) {
                  const mappedIcon = iconMap[item.icon];
                  if (mappedIcon) {
                    iconComponent = mappedIcon;
                  }
                }

                const label = getLocalizedLabel(item.label);
                const href = item.href.startsWith('/') ? `/${locale}${item.href}` : `/${locale}/${item.href}`;

                // Backfill group from default menus if missing
                let group = item.menuGroup;
                if (!group) {
                  // Try to find in default menus
                  const findInDefaults = (menus: any[]): string | undefined => {
                    for (const menu of menus) {
                      // Check exact match or localized href match
                      const menuHref = menu.href.startsWith('/') ? `/${locale}${menu.href}` : `/${locale}/${menu.href}`;
                      if (menu.href === item.href || menuHref === href) {
                        return menu.group;
                      }
                      if (menu.children) {
                        const childGroup = findInDefaults(menu.children);
                        if (childGroup) return childGroup;
                      }
                    }
                    return undefined;
                  };

                  // defaultMenus is available in scope via useMemo above
                  // We need to access the raw defaultMenus config, but it's inside useMemo
                  // So we'll use the defaultMenusForRole which is already processed but has group info
                  // Actually, defaultMenusForRole has MenuItem structure which has group

                  const findInProcessedDefaults = (menus: MenuItem[]): string | undefined => {
                    for (const menu of menus) {
                      if (menu.href === href) {
                        return menu.group;
                      }
                      if (menu.children) {
                        const childGroup = findInProcessedDefaults(menu.children);
                        if (childGroup) return childGroup;
                      }
                    }
                    return undefined;
                  };

                  group = findInProcessedDefaults(defaultMenusForRole);
                }

                const menuItem: MenuItem = {
                  label,
                  href,
                  icon: iconComponent,
                  order: typeof item.order === 'number' ? item.order : 999,
                };

                if (group) {
                  menuItem.group = group;
                }

                if (item.children && item.children.length > 0) {
                  menuItem.children = convertItems(item.children);
                }

                return menuItem;
              });
          };

          const convertedMenus = convertItems(menuData.items || []);
          setManagedMenus(convertedMenus);
          setRawManagedMenus(menuData.items || []);
        } else {
          // No menu assigned to this location, use fallback
          setManagedMenus([]);
          setRawManagedMenus([]);
        }
      } catch (error) {
        console.error('[useMenuItems] Error loading menu from resolver:', error);
        setManagedMenus([]);
        setRawManagedMenus([]);
      } finally {
        setMenusLoading(false);
        initialLoadComplete.current = true;
      }
    };

    loadManagedMenus();
  }, [locale, location, refreshTrigger]);

  // SuperAdmin-only menü kontrolü için yardımcı fonksiyon
  const isSuperAdminOnlyMenu = (menu: MenuItem & { moduleSlug?: string; group?: string }): boolean => {
    // Group bazlı kontrol - JSON'dan gelen menüler için
    if (menu.group === 'Super Admin' || menu.group === 'superadmin') {
      return true;
    }
    // Lisans modülünün admin sayfaları sadece SuperAdmin görebilir
    if (menu.moduleSlug === 'license') {
      return true; // Tüm license modülü SuperAdmin tarafından yönetilir
    }
    // /admin/ ile başlayan sayfalar
    if (menu.href.includes('/admin/')) {
      return true;
    }
    // /companies sayfası
    if (menu.href.includes('/companies')) {
      return true;
    }
    return false;
  };

  // TenantAdmin-only menü kontrolü
  const isTenantAdminOnlyMenu = (menu: MenuItem & { group?: string }): boolean => {
    if (menu.group === 'Firma Yönetimi' || menu.group === 'admin') {
      return true;
    }
    return false;
  };

  // Lisans modülü için child filtreleme (Tenant Admin için)
  const filterLicenseMenuForTenant = (menu: MenuItem & { moduleSlug?: string }): MenuItem | null => {
    if (menu.moduleSlug !== 'license') return menu;

    // SuperAdmin tüm lisans menülerini görebilir
    if (isSuperAdmin) return menu;

    // Tenant Admin için lisans modülünü tamamen gizle (Firma Yönetimi grubunda "Lisansım" zaten var)
    return null;
  };

  // Helper: Check if module is enabled in access control
  const isModuleEnabled = (moduleSlug: string | undefined): boolean => {
    if (!moduleSlug) return true;
    // If module is explicitly configured, use that setting
    if (moduleAccessConfig[moduleSlug] !== undefined) {
      return moduleAccessConfig[moduleSlug].enabled !== false;
    }
    // Default to enabled if not configured
    return true;
  };

  // Helper: Check if menu item is visible in access control
  const isMenuItemVisible = (menuId: string | undefined): boolean => {
    if (!menuId || !menuVisibilityConfig.items?.length) return true;
    const config = menuVisibilityConfig.items.find(item => item.id === menuId);
    if (config) {
      return config.visible !== false;
    }
    return true;
  };

  // Combine and sort - useMemo ile memoize et
  // IMPORTANT: Wait for managed menus to load before returning final menu to prevent flash
  const allMenuItems = useMemo(() => {
    // If still loading managed menus, return empty to prevent flash
    if (menusLoading) {
      return [];
    }

    const allMenus: MenuItem[] = [];
    const seenHrefs = new Set<string>();
    const seenModuleSlugs = new Set<string>();

    if (managedMenus.length > 0) {
      // SADECE managedMenus kullan - menü yönetimi sayfasıyla tam uyumlu
      managedMenus.forEach(menu => {
        // SuperAdmin-only menüleri filtrele
        if (!isSuperAdmin && isSuperAdminOnlyMenu(menu as any)) {
          return; // Bu menüyü atla
        }

        // TenantAdmin-only menüleri filtrele (sadece Admin ve SuperAdmin görebilir)
        if (!isTenantAdmin && isTenantAdminOnlyMenu(menu as any)) {
          return; // Bu menüyü atla
        }

        // Access Control: Modül erişim kontrolü
        const moduleSlug = (menu as any).moduleSlug;
        if (!isModuleEnabled(moduleSlug)) {
          return; // Modül erişim kontrolünde kapalı
        }

        // Access Control: Menü görünürlük kontrolü
        if (!isMenuItemVisible(menu.id)) {
          return; // Menü görünürlük kontrolünde gizli
        }

        // Lisans modülü filtreleme
        const filteredMenu = filterLicenseMenuForTenant(menu as any);
        if (!filteredMenu) return;

        if (!seenHrefs.has(filteredMenu.href)) {
          seenHrefs.add(filteredMenu.href);
          allMenus.push(filteredMenu);
          // Track module slugs from managed menus
          if ((filteredMenu as any).moduleSlug) {
            seenModuleSlugs.add((filteredMenu as any).moduleSlug);
          }
        }
      });

      // Managed menus varsa bile aktif modülleri ekle (eğer managed menus'te yoksa)
      // Aktif modüller her zaman görünmeli
      activeModuleMenuItems.forEach(menu => {
        // SuperAdmin-only menüleri filtrele
        if (!isSuperAdmin && isSuperAdminOnlyMenu(menu as any)) {
          return;
        }

        // Access Control: Modül erişim kontrolü
        const moduleSlug = (menu as any).moduleSlug || menu.href.split('/modules/')[1]?.split('/')[0];
        if (!isModuleEnabled(moduleSlug)) {
          return; // Modül erişim kontrolünde kapalı
        }

        // Access Control: Menü görünürlük kontrolü
        if (!isMenuItemVisible(menu.id)) {
          return; // Menü görünürlük kontrolünde gizli
        }

        // Eğer bu modül managed menus'te yoksa ekle
        if (moduleSlug && !seenModuleSlugs.has(moduleSlug) && !seenHrefs.has(menu.href)) {
          seenHrefs.add(menu.href);
          seenModuleSlugs.add(moduleSlug);
          allMenus.push(menu);
        }
      });
    } else {
      // No managed menus - use default menus
      // Add default menus for user role
      defaultMenusForRole.forEach((menu: MenuItem) => {
        // Access Control: Menü görünürlük kontrolü
        if (!isMenuItemVisible(menu.id)) {
          return; // Menü görünürlük kontrolünde gizli
        }

        if (!seenHrefs.has(menu.href)) {
          seenHrefs.add(menu.href);
          allMenus.push(menu);
        }
      });

      // Add active modules
      activeModuleMenuItems.forEach(menu => {
        // SuperAdmin-only menüleri filtrele
        if (!isSuperAdmin && isSuperAdminOnlyMenu(menu as any)) {
          return;
        }

        // Access Control: Modül erişim kontrolü
        const moduleSlug = (menu as any).moduleSlug || menu.href.split('/modules/')[1]?.split('/')[0];
        if (!isModuleEnabled(moduleSlug)) {
          return; // Modül erişim kontrolünde kapalı
        }

        // Access Control: Menü görünürlük kontrolü
        if (!isMenuItemVisible(menu.id)) {
          return; // Menü görünürlük kontrolünde gizli
        }

        if (!seenHrefs.has(menu.href)) {
          seenHrefs.add(menu.href);
          allMenus.push(menu);
        }
      });
    }
    // Group mapping and sorting
    const groupMapping: Record<string, string> = {
      'user': '',
      'company': 'Firma Yönetimi',
      'superadmin': 'Super Admin',
      'settings': 'Ayarlar',
      'admin': 'Firma Yönetimi',
    };

    // Apply mapping
    const processedMenus = allMenus.map(menu => {
      const groupKey = menu.group?.toLowerCase() || '';
      // If group is already localized (e.g. "Firma Yönetimi"), keep it
      // If it's a key (e.g. "company"), map it
      const mappedGroup = groupMapping[groupKey];

      return {
        ...menu,
        group: mappedGroup !== undefined ? mappedGroup : menu.group
      };
    });

    // Eğer managedMenus varsa, sıralamayı BOZMA!
    // Menü yönetiminden gelen sıralama (order) geçerlidir.
    if (managedMenus.length > 0) {
      // Sadece order'a göre sırala (grup sırasını yoksay)
      processedMenus.sort((a, b) => (a.order || 0) - (b.order || 0));
      return processedMenus;
    }

    // Managed menus yoksa (varsayılan menüler), gruplara göre sırala
    // Define sort order - Dashboard (user group with empty string) should be first
    const groupOrder: (string | undefined)[] = [
      '', // Dashboard ve user group menüleri (ilk sıra)
      undefined,
      groupMapping['company'],
      groupMapping['superadmin'],
      groupMapping['settings']
    ];

    // Sort
    processedMenus.sort((a, b) => {
      const groupA: string | undefined = a.group;
      const groupB: string | undefined = b.group;

      const indexA = groupOrder.indexOf(groupA);
      const indexB = groupOrder.indexOf(groupB);

      if (indexA !== -1 && indexB !== -1) {
        if (indexA !== indexB) return indexA - indexB;
      }
      else if (indexA !== -1) return -1;
      else if (indexB !== -1) return 1;
      else if (groupA !== groupB) {
        return (groupA || '').localeCompare(groupB || '');
      }

      return (a.order || 0) - (b.order || 0);
    });

    return processedMenus;
  }, [defaultMenusForRole, managedMenus, activeModuleMenuItems, user, loading, menusLoading, modulesLoading, isSuperAdmin, isTenantAdmin, t, locale, moduleAccessConfig, menuVisibilityConfig]);

  return allMenuItems;
}

// Hook that also returns loading state
export function useMenuItemsWithLoading(): UseMenuItemsResult {
  const { loading: modulesLoading } = useModules();
  const menuItems = useMenuItems();

  // Consider loading if menuItems is empty and we're still in loading state
  const isLoading = menuItems.length === 0 && modulesLoading;

  return { menuItems, isLoading };
}

