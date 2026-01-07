/**
 * Available Pages API
 * 
 * Lists all available pages in the application that can be added to the menu
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { corePrisma } from '@/lib/corePrisma';
import { verifyAuth } from '@/lib/auth/jwt';
type Locale = 'tr' | 'en' | 'de' | 'ar';

// Helper to load module translation
async function getModuleTranslation(moduleSlug: string, locale: Locale, key: string, fallback: string): Promise<string> {
  try {
    const translationPath = path.join(process.cwd(), 'src/locales/modules', moduleSlug, `${locale}.json`);
    const translationContent = await fs.readFile(translationPath, 'utf-8');
    const translations = JSON.parse(translationContent);
    
    // Try menu.label first, then menu.title, then title, then fallback
    if (key === 'label') {
      return translations.menu?.label || translations.menu?.title || translations.title || fallback;
    }
    
    // For menu items
    if (key.startsWith('menu.items.')) {
      const itemKey = key.replace('menu.items.', '');
      if (translations.menu?.items?.[itemKey]) {
        return translations.menu.items[itemKey];
      }
    }
    
    return fallback;
  } catch {
    // Fallback to default locale if current locale fails
    if (locale !== 'tr') {
      try {
        const fallbackPath = path.join(process.cwd(), 'src/locales/modules', moduleSlug, 'tr.json');
        const fallbackContent = await fs.readFile(fallbackPath, 'utf-8');
        const fallbackTranslations = JSON.parse(fallbackContent);
        
        if (key === 'label') {
          return fallbackTranslations.menu?.label || fallbackTranslations.menu?.title || fallbackTranslations.title || fallback;
        }
        
        if (key.startsWith('menu.items.')) {
          const itemKey = key.replace('menu.items.', '');
          if (fallbackTranslations.menu?.items?.[itemKey]) {
            return fallbackTranslations.menu.items[itemKey];
          }
        }
      } catch {
        // Fallback failed, return original fallback
      }
    }
    return fallback;
  }
}

// Helper to load global translation
async function getGlobalTranslation(locale: Locale, key: string, fallback: string): Promise<string> {
  try {
    const translationPath = path.join(process.cwd(), 'src/locales/global', `${locale}.json`);
    const translationContent = await fs.readFile(translationPath, 'utf-8');
    const translations = JSON.parse(translationContent);
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : fallback;
  } catch {
    // Fallback to default locale
    if (locale !== 'tr') {
      try {
        const fallbackPath = path.join(process.cwd(), 'src/locales/global', 'tr.json');
        const fallbackContent = await fs.readFile(fallbackPath, 'utf-8');
        const fallbackTranslations = JSON.parse(fallbackContent);
        
        const keys = key.split('.');
        let value: any = fallbackTranslations;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return fallback;
          }
        }
        
        return typeof value === 'string' ? value : fallback;
      } catch {
        // Fallback failed
      }
    }
    return fallback;
  }
}

// Helper to check if page has redirect (skip redirects in menu)
async function checkPageForRedirect(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // Check for Next.js redirect or permanentRedirect
    // Also check for redirect() calls with template literals
    const hasRedirect = /redirect\(['"`][^'"`]+['"`]\)/.test(content) || 
                        /permanentRedirect\(['"`][^'"`]+['"`]\)/.test(content) ||
                        /redirect\(/.test(content); // More permissive check
    return hasRedirect;
  } catch {
    return false;
  }
}

// Helper to check if a directory should be skipped (like [id], [slug] detail pages)
// function shouldSkipDirectory(dirName: string): boolean {
//   // Skip dynamic routes that are detail pages (but we'll scan their subdirectories like [id]/edit)
//   // We want to include list pages but skip detail pages
//   return dirName.startsWith('[') && dirName.endsWith(']');
// }

interface AvailablePage {
  id: string;
  label: string;
  href: string;
  icon?: string;
  category: 'core' | 'module' | 'settings' | 'custom';
  moduleSlug?: string;
  description?: string;
  parentId?: string; // For hierarchical structure
  children?: AvailablePage[]; // For hierarchical structure
  order?: number; // Order from module.config.yaml
}

interface PageCategory {
  id: string;
  label: string;
  icon: string;
  pages: AvailablePage[];
}

// Core pages template (will be translated based on locale)
const CORE_PAGES_TEMPLATE = [
  { id: 'dashboard', key: 'navigation.dashboard', href: '/dashboard', icon: 'Home', category: 'core' as const },
  { id: 'users', key: 'management.users.title', href: '/management/users', icon: 'Users', category: 'core' as const },
  { id: 'roles', key: 'management.roles.title', href: '/management/roles', icon: 'Shield', category: 'core' as const },
  { id: 'permissions', key: 'management.permissions.title', href: '/management/permissions', icon: 'Lock', category: 'core' as const },
  { id: 'companies', key: 'management.companies.title', href: '/management/companies', icon: 'Building', category: 'core' as const },
  { id: 'profile', key: 'profile.title', href: '/profile', icon: 'User', category: 'core' as const },
];

// Settings pages template (will be translated based on locale)
const SETTINGS_PAGES_TEMPLATE = [
  { id: 'settings-menu', key: 'settings.menuManagement.title', href: '/settings/menu-management', icon: 'Menu2', category: 'settings' as const },
  { id: 'settings-theme', key: 'settings.theme.title', href: '/settings/theme', icon: 'Palette', category: 'settings' as const },
  { id: 'settings-general', key: 'settings.general.title', href: '/settings/general', icon: 'Settings2', category: 'settings' as const },
  { id: 'settings-company', key: 'settings.company.title', href: '/settings/company', icon: 'Building', category: 'settings' as const },
  { id: 'settings-locations', key: 'settings.locations.title', href: '/settings/company/locations', icon: 'MapPin', category: 'settings' as const },
  { id: 'settings-export-templates', key: 'settings.exportTemplates.title', href: '/settings/export-templates', icon: 'FileText', category: 'settings' as const },
  { id: 'settings-notifications', key: 'settings.notifications.title', href: '/settings/notifications', icon: 'Bell', category: 'settings' as const },
  { id: 'settings-security', key: 'settings.security.title', href: '/settings/security', icon: 'Shield', category: 'settings' as const },
  { id: 'settings-integrations', key: 'settings.integrations.title', href: '/settings/integrations', icon: 'Plug', category: 'settings' as const },
];

// SuperAdmin-only pages template (will be translated based on locale)
const SUPERADMIN_PAGES_TEMPLATE = [
  { id: 'superadmin-companies', key: 'management.companies.title', href: '/management/companies', icon: 'Building', category: 'core' as const },
  { id: 'superadmin-companies-create', key: 'management.companies.create', href: '/management/companies/create', icon: 'BuildingPlus', category: 'core' as const },
  { id: 'superadmin-file-manager', key: 'modules.file-manager.title', href: '/modules/file-manager', icon: 'Folder', category: 'core' as const },
];

export async function scanModulePages(locale: Locale, userRole?: string): Promise<PageCategory[]> {
  const categories: PageCategory[] = [];
  const modulesPath = path.join(process.cwd(), 'src/modules');
  const appModulesPath = path.join(process.cwd(), 'src/app/[locale]/modules');

  try {
    // Read modules directory
    const modules = await fs.readdir(modulesPath);

    for (const moduleSlug of modules) {
      const modulePath = path.join(modulesPath, moduleSlug);
      const stat = await fs.stat(modulePath);

      if (!stat.isDirectory()) continue;

      // Check module status from database first (source of truth)
      let isModuleActive = true;
      try {
        const dbModule = await corePrisma.module.findUnique({
          where: { slug: moduleSlug },
          select: { status: true },
        });
        
        // Only include active modules - skip inactive, planned, error, or installed-only modules
        if (dbModule && dbModule.status !== 'active') {
          continue; // Skip this module
        }
        
        // If module doesn't exist in DB, check config file as fallback
        if (!dbModule) {
          // Try to read module config
          try {
            const configPath = path.join(modulePath, 'module.config.yaml');
            const configContent = await fs.readFile(configPath, 'utf8');
            const statusMatch = configContent.match(/status:\s*['"]?([^'"\n]+)['"]?/);
            
            if (statusMatch) {
              const moduleStatus = statusMatch[1]?.toLowerCase().trim() || '';
              if (moduleStatus === 'planned' || moduleStatus === 'inactive') {
                continue; // Skip this module
              }
            }
          } catch {
            // If config read fails, assume active (for backward compatibility)
          }
        }
      } catch (dbError) {
        // If DB check fails, fall back to config file check
        console.warn(`Failed to check module status from DB for ${moduleSlug}:`, dbError);
        try {
          const configPath = path.join(modulePath, 'module.config.yaml');
          const configContent = await fs.readFile(configPath, 'utf8');
          const statusMatch = configContent.match(/status:\s*['"]?([^'"\n]+)['"]?/);
          
          if (statusMatch) {
            const moduleStatus = statusMatch[1]?.toLowerCase().trim() || '';
            if (moduleStatus === 'planned' || moduleStatus === 'inactive') {
              continue; // Skip this module
            }
          }
        } catch {
          // If config read also fails, assume active (for backward compatibility)
        }
      }

      // Try to read module config for label and icon
      let moduleLabelFallback = moduleSlug;
      let moduleIcon = 'Box';

      try {
        const configPath = path.join(modulePath, 'module.config.yaml');
        const configContent = await fs.readFile(configPath, 'utf8');
        const nameMatch = configContent.match(/name:\s*['"]?([^'"\n]+)['"]?/);
        const iconMatch = configContent.match(/icon:\s*['"]?([^'"\n]+)['"]?/);
        
        if (nameMatch && nameMatch[1]) moduleLabelFallback = nameMatch[1];
        if (iconMatch && iconMatch[1]) moduleIcon = iconMatch[1];
      } catch {
        // Try reading module.json as fallback
        try {
          const jsonPath = path.join(modulePath, 'module.json');
          const jsonContent = await fs.readFile(jsonPath, 'utf8');
          const json = JSON.parse(jsonContent);
          if (json.name) moduleLabelFallback = json.name;
          if (json.icon) moduleIcon = json.icon;
        } catch {
          // Use slug as label
        }
      }

      // Get translated module label
      const moduleLabel = await getModuleTranslation(moduleSlug, locale, 'label', moduleLabelFallback);

      // Load config to get order values
      const configOrderMap: Record<string, number> = {};
      try {
        const configPath = path.join(modulePath, 'module.config.yaml');
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(configContent) as any;
        if (config.menu?.main?.items) {
          config.menu.main.items.forEach((item: any) => {
            if (item.path) {
              configOrderMap[item.path] = typeof item.order === 'number' ? item.order : 999;
            }
          });
        }
      } catch (error) {
        // Ignore config loading errors
      }

      // Scan pages in app/[locale]/modules/[moduleSlug]
      const moduleAppPath = path.join(appModulesPath, moduleSlug);
      const pages: AvailablePage[] = [];

      try {
        // Check if module app directory exists
        const moduleAppExists = await pageExists(path.join(moduleAppPath, 'page.tsx')) || await fs.access(moduleAppPath).then(() => true).catch(() => false);
        if (!moduleAppExists) {
          // Try to check if directory exists
          try {
            await fs.stat(moduleAppPath);
          } catch {
            // Module doesn't have app pages yet
            continue;
          }
        }
        
        // Scan all pages including dashboard
        const modulePages = await scanDirectory(moduleAppPath, moduleSlug, moduleLabel, locale, '', undefined, configOrderMap);
        
        // Flatten hierarchical structure for API response (but keep children for frontend)
        // The frontend will reconstruct the hierarchy from parentId
        pages.push(...modulePages);
        
        // Also check for root module page (page.tsx in module root)
        const rootPagePath = path.join(moduleAppPath, 'page.tsx');
        try {
          await fs.access(rootPagePath);
          const hasRedirect = await checkPageForRedirect(rootPagePath);
          if (!hasRedirect) {
            pages.push({
              id: `${moduleSlug}-root`,
              label: moduleLabel,
              href: `/modules/${moduleSlug}`,
              icon: moduleIcon,
              category: 'module',
              moduleSlug,
              description: moduleLabel,
            });
          }
        } catch {
          // No root page
        }

        // Ensure Settings page is always at the end of each module group
        // Find Settings page and move it to the end with highest order
        // BUT: Only show Settings page if user has admin or superadmin role
        const settingsPageIndex = pages.findIndex(page => 
          page.href === `/modules/${moduleSlug}/settings` || 
          page.href?.endsWith('/settings')
        );

        if (settingsPageIndex !== -1) {
          const settingsPage = pages[settingsPageIndex];
          
          // Check if user has admin or superadmin role
          const isAdmin = userRole && (
            userRole.toLowerCase() === 'admin' || 
            userRole.toLowerCase() === 'superadmin' ||
            userRole === 'Admin' ||
            userRole === 'SuperAdmin'
          );
          
          if (!isAdmin) {
            // Remove Settings page if user is not admin/superadmin
            pages.splice(settingsPageIndex, 1);
          } else {
            // Get the highest order from all pages
            const maxOrder = pages.reduce((max, page) => {
              // Check if page has order property (it might not have one)
              const pageOrder = (page as any).order;
              return Math.max(max, typeof pageOrder === 'number' ? pageOrder : 0);
            }, 0);

            // Move Settings page to the end and set highest order
            const removedPage = pages.splice(settingsPageIndex, 1)[0];
            if (removedPage) {
              (removedPage as any).order = maxOrder + 1; // Always at the end
              pages.push(removedPage);
            }
          }
        }
      } catch (error) {
        // Module doesn't have app pages yet or error scanning
        console.error(`Error scanning module ${moduleSlug}:`, error);
      }

      if (pages.length > 0) {
        categories.push({
          id: `module-${moduleSlug}`,
          label: moduleLabel,
          icon: moduleIcon,
          pages,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning modules:', error);
  }

  return categories;
}

// Helper to check if a page actually exists
async function pageExists(pagePath: string): Promise<boolean> {
  try {
    await fs.access(pagePath);
    return true;
  } catch {
    return false;
  }
}

// Helper to count all actual page.tsx files in a directory (for verification)
 
// async function countActualPages(dirPath: string, baseDir: string = dirPath, excludePatterns: string[] = []): Promise<{ count: number; pages: string[] }> { // removed - unused
//   let count = 0;
//   const pages: string[] = [];
//   
//   try {
//     const items = await fs.readdir(dirPath);
//     
//     for (const item of items) {
//       const itemPath = path.join(dirPath, item);
//       
//       // Skip special folders
//       if (item.startsWith('_') || item.startsWith('.') || item === 'components') {
//         continue;
//       }
//       
//       // Skip if matches exclude pattern
//       if (excludePatterns.some(pattern => item.includes(pattern))) {
//         continue;
//       }
//       
//       try {
//         const stat = await fs.stat(itemPath);
//         
//         if (stat.isDirectory()) {
//           // Recursively count in subdirectories
//           const subResult = await countActualPages(itemPath, baseDir, excludePatterns);
//           count += subResult.count;
//           pages.push(...subResult.pages);
//         } else if (item === 'page.tsx') {
//           // Check if it's a redirect
//           try {
//             const content = await fs.readFile(itemPath, 'utf-8');
//             const hasRedirect = /redirect\(['"`][^'"`]+['"`]\)/.test(content) || 
//                                 /permanentRedirect\(['"`][^'"`]+['"`]\)/.test(content) ||
//                                 /redirect\(/.test(content);
//             if (!hasRedirect) {
//               count++;
//               // Get relative path from base directory
//               const pageDir = path.dirname(itemPath);
//               const relativePath = path.relative(baseDir, pageDir).replace(/\\/g, '/');
//               // Normalize: empty string means root, '.' also means root
//               const normalizedPath = relativePath === '.' || relativePath === '' ? '' : relativePath;
//               pages.push(normalizedPath);
//             }
//           } catch {
//             // If can't read, count it anyway
//             count++;
//             const pageDir = path.dirname(itemPath);
//             const relativePath = path.relative(baseDir, pageDir).replace(/\\/g, '/');
//             const normalizedPath = relativePath === '.' || relativePath === '' ? '' : relativePath;
//             pages.push(normalizedPath);
//           }
//         }
//       } catch {
//         // Skip if can't stat
//         continue;
//       }
//     }
//   } catch {
//     // Directory doesn't exist
//   }
//   
//   return { count, pages };
// }

async function scanDirectory(
  dirPath: string,
  moduleSlug: string,
  moduleLabel: string,
  locale: Locale,
  basePath = '',
  parentPage?: AvailablePage,
  configOrderMap?: Record<string, number>
): Promise<AvailablePage[]> {
  const pages: AvailablePage[] = [];

  try {
    // Check if directory exists
    try {
      await fs.stat(dirPath);
    } catch {
      return pages; // Directory doesn't exist
    }

    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      let stat;
      try {
        stat = await fs.stat(itemPath);
      } catch {
        continue; // Skip if can't stat
      }

      if (stat.isDirectory()) {
        // Skip special folders but INCLUDE dynamic routes (they might have list pages)
        if (item.startsWith('_') || item.startsWith('.') || item === 'components') {
          continue;
        }

        // Skip dynamic routes like [id], [slug] - they are detail pages, not list pages
        // But scan their subdirectories (like [id]/edit, [id]/view) as these might be useful
        const isDynamicRoute = item.startsWith('[') && item.endsWith(']');
        if (isDynamicRoute) {
          // Skip dynamic routes themselves, but scan their subdirectories (like [id]/edit)
          // Use fullPath to maintain correct path structure
          const dynamicFullPath = basePath ? `${basePath}/${item}` : item;
          const subPages = await scanDirectory(itemPath, moduleSlug, moduleLabel, locale, dynamicFullPath, parentPage, configOrderMap);
          pages.push(...subPages);
          continue;
        }

        // Check if this directory has a page.tsx
        const pagePath = path.join(itemPath, 'page.tsx');
        const fullPath = basePath ? `${basePath}/${item}` : item;

        try {
          const exists = await pageExists(pagePath);
          if (!exists) {
            // No page.tsx, continue scanning subdirectories
            const subPages = await scanDirectory(itemPath, moduleSlug, moduleLabel, locale, fullPath, parentPage, configOrderMap);
            pages.push(...subPages);
            continue;
          }
          
          // Check if page has redirect - skip redirects
          const hasRedirect = await checkPageForRedirect(pagePath);
          if (hasRedirect) {
            // Skip redirect pages, but continue scanning subdirectories
            const subPages = await scanDirectory(itemPath, moduleSlug, moduleLabel, locale, fullPath, parentPage, configOrderMap);
            pages.push(...subPages);
            continue;
          }
          
          // Include ALL pages - create, edit, view are valid pages that should be in menu
          // They will be organized hierarchically with their parent pages
          
          const href = `/modules/${moduleSlug}${fullPath ? `/${fullPath}` : ''}`;
          
          // Create unique id using full path (replace / with -)
          const uniqueId = `${moduleSlug}${fullPath.replace(/\//g, '-').replace(/\[|\]/g, '')}`;
          
          // Try to get translation for this page
          // Remove brackets and slashes for translation key
          const cleanItem = item.replace(/\[|\]/g, '').replace(/\//g, '.');
          const translationKey = `menu.items.${cleanItem}`;
          const pageLabel = await getModuleTranslation(moduleSlug, locale, translationKey, formatLabel(item));

          // Get order from config if available
          const order = configOrderMap?.[href] || undefined;

          // Determine icon based on page type/name
          const pageIcon = getPageIcon(item, fullPath);

          const page: AvailablePage = {
            id: uniqueId,
            label: pageLabel,
            href,
            icon: pageIcon,
            category: 'module',
            ...(moduleSlug ? { moduleSlug } : {}),
            ...(pageLabel ? { description: pageLabel } : {}),
            ...(parentPage?.id ? { parentId: parentPage.id } : {}),
            ...(order !== undefined ? { order } : {}),
          };

          // Add the page first
          pages.push(page);
          
          // Recursively scan subdirectories to get all children (they will have this page as parent)
          const subPages = await scanDirectory(itemPath, moduleSlug, moduleLabel, locale, fullPath, page, configOrderMap);
          pages.push(...subPages);
        } catch (error) {
          // No page.tsx or error reading, continue scanning subdirectories
          const subPages = await scanDirectory(itemPath, moduleSlug, moduleLabel, locale, fullPath, parentPage, configOrderMap);
          pages.push(...subPages);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return pages;
}

function formatLabel(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to determine icon based on page name/type
function getPageIcon(pageName: string, fullPath: string): string {
  const lowerName = pageName.toLowerCase();
  const lowerPath = fullPath.toLowerCase();

  // Common page type mappings
  const iconMappings: Record<string, string> = {
    // Dashboard & Overview
    'dashboard': 'Dashboard',
    'overview': 'ChartBar',
    'analytics': 'ChartLine',
    'statistics': 'ChartPie',
    'reports': 'Report',

    // CRUD Operations
    'create': 'Plus',
    'new': 'Plus',
    'add': 'Plus',
    'edit': 'Edit',
    'update': 'Edit',
    'view': 'Eye',
    'detail': 'FileText',
    'details': 'FileText',
    'list': 'List',
    'all': 'List',

    // Settings & Config
    'settings': 'Settings',
    'config': 'Settings2',
    'preferences': 'Adjustments',

    // Users & People
    'users': 'Users',
    'user': 'User',
    'staff': 'Users',
    'employees': 'Users',
    'team': 'Users',
    'members': 'Users',
    'tenants': 'Users',
    'customers': 'Users',
    'clients': 'Users',

    // Properties & Buildings
    'properties': 'Building',
    'property': 'Building',
    'apartments': 'Home',
    'apartment': 'Home',
    'buildings': 'BuildingCommunity',
    'building': 'Building',
    'rooms': 'Door',
    'units': 'LayoutGrid',

    // Finance & Money
    'payments': 'CreditCard',
    'payment': 'CreditCard',
    'invoices': 'Receipt',
    'invoice': 'Receipt',
    'billing': 'Receipt2',
    'expenses': 'Wallet',
    'income': 'CurrencyDollar',
    'subscriptions': 'Repeat',

    // Documents & Files
    'documents': 'FileText',
    'document': 'FileText',
    'files': 'File',
    'file': 'File',
    'contracts': 'FileSignature',
    'contract': 'FileSignature',
    'templates': 'Template',
    'template': 'Template',
    'forms': 'Forms',
    'form': 'Clipboard',

    // Calendar & Time
    'calendar': 'Calendar',
    'events': 'CalendarEvent',
    'event': 'CalendarEvent',
    'appointments': 'Clock',
    'appointment': 'Clock',
    'schedule': 'CalendarTime',
    'booking': 'CalendarCheck',

    // Communication
    'messages': 'Message',
    'message': 'Message',
    'chat': 'MessageCircle',
    'email': 'Mail',
    'emails': 'Mail',
    'campaigns': 'Send',
    'notifications': 'Bell',

    // Maintenance & Operations
    'maintenance': 'Tool',
    'repairs': 'Hammer',
    'tasks': 'ClipboardList',
    'issues': 'AlertCircle',
    'tickets': 'Ticket',

    // Products & Inventory
    'products': 'Package',
    'product': 'Package',
    'inventory': 'Box',
    'stock': 'BoxMultiple',
    'orders': 'ShoppingCart',
    'order': 'ShoppingCart',
    'bom': 'List',

    // Locations
    'locations': 'MapPin',
    'location': 'MapPin',
    'map': 'Map',
    'address': 'MapPin',

    // Tracking & History
    'history': 'History',
    'tracking': 'Track',
    'logs': 'FileText',
    'audit': 'ClipboardCheck',

    // Security & Access
    'security': 'Shield',
    'permissions': 'Lock',
    'roles': 'ShieldCheck',
    'access': 'Key',

    // Export & Import
    'export': 'Download',
    'import': 'Upload',
    'exports': 'FileExport',

    // Misc
    'help': 'Help',
    'support': 'Headset',
    'archive': 'Archive',
    'archived': 'Archive',
    'performance': 'TrendingUp',
  };

  // Check exact match first
  if (iconMappings[lowerName]) {
    return iconMappings[lowerName];
  }

  // Check if name contains any of the keywords
  for (const [keyword, icon] of Object.entries(iconMappings)) {
    if (lowerName.includes(keyword) || lowerPath.includes(keyword)) {
      return icon;
    }
  }

  // Default icon based on path depth
  if (fullPath.includes('/')) {
    return 'ChevronRight'; // Nested page
  }

  return 'Circle'; // Default fallback
}

// Helper to check if a settings page exists
async function checkSettingsPageExists(pageId: string, href: string): Promise<boolean> {
  try {
    // Check if page exists in app/[locale]/settings
    const pagePath = path.join(process.cwd(), 'src/app/[locale]', href.replace(/^\//, ''), 'page.tsx');
    return await pageExists(pagePath);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get locale from query params
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale')) as Locale;
    
    // Get user role from auth
    let userRole: string | undefined = undefined;
    try {
      const authResult = await verifyAuth(request);
      if (authResult.valid && authResult.payload) {
        userRole = authResult.payload.role;
      }
    } catch (authError) {
      // If auth fails, continue without role (will show all pages except Settings)
      console.warn('Failed to get user role from auth:', authError);
    }

    // Translate and filter core pages (check if they exist)
    const corePagesPromises = CORE_PAGES_TEMPLATE.map(async (page) => {
      const pagePath = path.join(process.cwd(), 'src/app/[locale]', page.href.replace(/^\//, ''), 'page.tsx');
      const exists = await pageExists(pagePath);
      if (!exists) return null;
      
      return {
        ...page,
        label: await getGlobalTranslation(locale, page.key, formatLabel(page.id)),
      };
    });
    const corePagesResults = await Promise.all(corePagesPromises);
    const corePages: AvailablePage[] = (corePagesResults.filter((p) => p !== null && p !== undefined && typeof p === 'object' && 'id' in p) as AvailablePage[]);

    // Translate and filter settings pages (check if they exist and organize hierarchy)
    const settingsPagesPromises = SETTINGS_PAGES_TEMPLATE.map(async (page) => {
      const exists = await checkSettingsPageExists(page.id, page.href);
      if (!exists) return null;
      
      return {
        ...page,
        label: await getGlobalTranslation(locale, page.key, formatLabel(page.id)),
      };
    });
    const settingsPagesResults = await Promise.all(settingsPagesPromises);
    const settingsPagesFiltered: AvailablePage[] = (settingsPagesResults.filter((p) => p !== null && p !== undefined && typeof p === 'object' && 'id' in p) as AvailablePage[]);
    
    // Settings pages (no main settings page, only sub-pages)
    const settingsPages: AvailablePage[] = settingsPagesFiltered;

    // Translate superadmin pages
    const superadminPages: AvailablePage[] = await Promise.all(
      SUPERADMIN_PAGES_TEMPLATE.map(async (page) => ({
        ...page,
        label: await getGlobalTranslation(locale, page.key, formatLabel(page.id)),
      }))
    );

    // Scan all module pages (pass userRole for Settings page filtering)
    const moduleCategories = await scanModulePages(locale, userRole);

    // Translate category labels
    const coreCategoryLabel = await getGlobalTranslation(locale, 'navigation.corePages', 'Core Sayfalar');
    const settingsCategoryLabel = await getGlobalTranslation(locale, 'navigation.settings', 'Ayarlar');
    const superadminCategoryLabel = await getGlobalTranslation(locale, 'navigation.superadmin', 'SuperAdmin');

    // Build response
    const categories: PageCategory[] = [
      {
        id: 'core',
        label: coreCategoryLabel,
        icon: 'Layout',
        pages: corePages,
      },
      ...moduleCategories,
      {
        id: 'settings',
        label: settingsCategoryLabel,
        icon: 'Settings',
        pages: settingsPages,
      },
    ];

    // Add SuperAdmin category only for superadmin role
    if (userRole === 'superadmin') {
      categories.unshift({
        id: 'superadmin',
        label: superadminCategoryLabel,
        icon: 'Shield',
        pages: superadminPages,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        categories,
        totalPages: categories.reduce((sum, cat) => sum + cat.pages.length, 0),
      },
    });
  } catch (error) {
    console.error('Error in available-pages API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load available pages',
      },
      { status: 500 }
    );
  }
}

