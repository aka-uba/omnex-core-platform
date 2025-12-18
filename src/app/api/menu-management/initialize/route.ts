import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { ModuleLoader } from '@/lib/modules/loader';
// Helper to load module translation
function getModuleTranslation(moduleSlug: string, locale: string, key: string, fallback: string): string {
  try {
    const translationPath = path.join(process.cwd(), 'src/locales/modules', moduleSlug, `${locale}.json`);
    if (!fs.existsSync(translationPath)) {
      // Try fallback to tr
      const fallbackPath = path.join(process.cwd(), 'src/locales/modules', moduleSlug, 'tr.json');
      if (fs.existsSync(fallbackPath)) {
        const content = fs.readFileSync(fallbackPath, 'utf-8');
        const translations = JSON.parse(content);
        const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], translations);
        return typeof value === 'string' ? value : fallback;
      }
      return fallback;
    }
    const content = fs.readFileSync(translationPath, 'utf-8');
    const translations = JSON.parse(content);
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], translations);
    return typeof value === 'string' ? value : fallback;
  } catch {
    return fallback;
  }
}

// Get menu config from module's already loaded data
function getModuleMenuConfig(module: any): any {
  const metadata = module.metadata as any;
  const rootMenu = module.menu;
  return metadata?.menu?.main || metadata?.menu || rootMenu?.main || rootMenu;
}

const MENU_DATA_PATH = path.join(process.cwd(), 'data', 'menu-management.json');

// Load menu data
function loadMenuData(): any {
  const dataDir = path.dirname(MENU_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(MENU_DATA_PATH)) {
    const content = fs.readFileSync(MENU_DATA_PATH, 'utf-8');
    return JSON.parse(content);
  }
  return { menus: [], version: 1 };
}

// Save menu data
function saveMenuData(data: any) {
  const dataDir = path.dirname(MENU_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(MENU_DATA_PATH, JSON.stringify(data, null, 2));
}

// Icon map removed - unused

// GET - Initialize menu structure from current menu items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const force = searchParams.get('force') === 'true';
    
    // Check if menus already exist (unless force=true)
    const existingData = loadMenuData();
    if (!force && existingData.menus && existingData.menus.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          menus: existingData.menus,
          locale,
          version: existingData.version || 1,
        },
      });
    }
    
    // Initialize menus from current structure
    let menus: any[] = [];
    let order = 0;
    
    // Core menu items - sadece gerçek core menüler (modül menüleri hariç)
    // Modül menüleri aşağıda aktif modüllerden dinamik olarak yüklenir
    const coreMenus = [
      {
        id: 'menu-dashboard',
        label: 'Genel Bakış',
        href: '/dashboard',
        icon: 'Dashboard',
        order: order++,
        visible: true,
      },
      {
        id: 'menu-users',
        label: 'Kullanıcılar',
        href: '/management/users',
        icon: 'UserCircle',
        order: order++,
        visible: true,
        children: [
          { id: 'menu-users-list', label: 'Kullanıcılar', href: '/management/users', icon: 'Users', order: 0 },
          { id: 'menu-users-roles', label: 'Roller', href: '/management/roles', icon: 'Shield', order: 1 },
          { id: 'menu-users-permissions', label: 'İzinler', href: '/management/permissions', icon: 'Shield', order: 2 },
        ],
      },
      {
        id: 'menu-locations',
        label: 'Lokasyonlar',
        href: '/settings/company/locations',
        icon: 'MapPin',
        order: order++,
        visible: true,
        children: [
          { id: 'menu-locations-list', label: 'Lokasyon Listesi', href: '/settings/company/locations', icon: 'MapPin', order: 0 },
        ],
      },
      {
        id: 'menu-core-systems',
        label: 'Merkezi Sistemler',
        href: '/admin/core-systems',
        icon: 'Settings',
        order: 80,
        visible: true,
        children: [
          { id: 'menu-core-ai', label: 'AI Servisi', href: '/admin/core-systems/ai', icon: 'Brain', order: 1 },
        ],
      },
      {
        id: 'menu-modules',
        label: 'Modül Yönetimi',
        href: '/modules',
        icon: 'Apps',
        order: 90,
        visible: true,
        children: [
          { id: 'menu-modules-list', label: 'Modüller', href: '/modules', icon: 'Apps', order: 0 },
          { id: 'menu-modules-upload', label: 'Yeni Modül Yükle', href: '/modules/upload', icon: 'Upload', order: 1 },
        ],
      },
      {
        id: 'menu-settings',
        label: 'Ayarlar ve Markalama',
        href: '/settings',
        icon: 'Settings',
        order: 95,
        visible: true,
        children: [
          { id: 'menu-settings-company', label: 'Firma Ekle', href: '/settings/add-company', icon: 'Building', order: 1 },
          { id: 'menu-settings-menu', label: 'Menü Yönetimi', href: '/settings/menu-management', icon: 'Settings', order: 2 },
        ],
      },
    ];
    
    // If force=true, merge with existing menus instead of replacing
    let existingMenus: any[] = [];
    if (force && existingData.menus && existingData.menus.length > 0) {
      existingMenus = existingData.menus;
      // Keep existing core menus and add new modules
      const existingMenuIds = new Set(existingMenus.map((m: any) => m.id));
      coreMenus.forEach((coreMenu) => {
        if (!existingMenuIds.has(coreMenu.id)) {
          existingMenus.push(coreMenu);
        }
      });
      menus = existingMenus;
    } else {
      menus.push(...coreMenus);
    }
    
    // Load active modules and add them to menus with all sub-pages
    try {
      const moduleLoader = new ModuleLoader();
      const allModulesArray = await moduleLoader.loadAllModules();
      // loadAllModules returns ModuleRecord[] directly
      const activeModules = allModulesArray.filter(m => m.status === 'active');
      
      // Get existing module menu IDs if force=true
      const existingModuleMenuIds = force ? new Set(menus.filter((m: any) => m.moduleSlug).map((m: any) => m.id)) : new Set();
      
      for (const module of activeModules) {
        // Get menu config from module's already loaded data
        const menuConfig = getModuleMenuConfig(module);
        
        // Get all pages for this module by scanning the file system
        let modulePages: any[] = [];
        try {
          const appModulesPath = path.join(process.cwd(), 'src/app/[locale]/modules', module.slug);
          
          if (fs.existsSync(appModulesPath)) {
            const scanPages = async (basePath: string, currentPath: string = ''): Promise<any[]> => {
              const pages: any[] = [];
              const fullPath = path.join(basePath, currentPath);
              
              if (!fs.existsSync(fullPath)) return pages;
              
              try {
                const entries = await fsPromises.readdir(fullPath, { withFileTypes: true });
                
                for (const entry of entries) {
                  if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                  if (entry.name.startsWith('[') && entry.name.endsWith(']')) continue; // Skip dynamic routes
                  
                  if (entry.isDirectory()) {
                    const dirPagePath = path.join(fullPath, entry.name, 'page.tsx');
                    if (fs.existsSync(dirPagePath)) {
                      const routePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                      pages.push({
                        path: `/modules/${module.slug}/${routePath}`,
                        title: entry.name.charAt(0).toUpperCase() + entry.name.slice(1).replace(/-/g, ' '),
                        order: pages.length,
                      });
                    }
                    // Recursively scan subdirectories
                    const subPages = await scanPages(basePath, currentPath ? `${currentPath}/${entry.name}` : entry.name);
                    pages.push(...subPages);
                  } else if (entry.isFile() && entry.name === 'page.tsx' && currentPath) {
                    const routePath = currentPath;
                    const pageName = routePath.split('/').pop() || '';
                    if (!['create', 'edit', 'settings', 'all'].includes(pageName.toLowerCase())) {
                      pages.push({
                        path: `/modules/${module.slug}/${routePath}`,
                        title: pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' '),
                        order: pages.length,
                      });
                    }
                  }
                }
              } catch (err) {
                // Silently fail
              }
              
              return pages;
            };
            
            modulePages = await scanPages(appModulesPath);
          }
        } catch (err) {
          // Silently fail - will use menu config items only
        }
        
        const moduleMenu: any = {
          id: `module-${module.slug}`,
          label: menuConfig?.label || menuConfig?.title || module.name,
          href: menuConfig?.href || menuConfig?.route || `/modules/${module.slug}`,
          icon: typeof module.icon === 'string' ? module.icon : 'Apps',
          order: typeof menuConfig?.order === 'number' ? menuConfig.order : order++,
          visible: true,
          moduleSlug: module.slug,
          children: [],
        };
        
        // Add menu config items first
        if (menuConfig?.items && Array.isArray(menuConfig.items) && menuConfig.items.length > 0) {
          menuConfig.items.forEach((item: any, index: number) => {
            // Try to translate title if it looks like a translation key
            let label = item.title || item.label;
            if (typeof label === 'string' && label.includes('.')) {
              const translated = getModuleTranslation(module.slug, locale || 'tr', label, label);
              label = translated;
            }
            
            moduleMenu.children.push({
              id: `module-${module.slug}-config-${index}`,
              label,
              href: item.path || item.href,
              icon: item.icon || 'Apps',
              order: typeof item.order === 'number' ? item.order : index,
            });
          });
        }
        
        // Add discovered pages that aren't already in menu config
        const existingPaths = new Set(moduleMenu.children.map((c: any) => c.href));
        modulePages.forEach((page: any, index: number) => {
          const pagePath = page.path.startsWith('/') ? page.path : `/${module.slug}${page.path}`;
          if (!existingPaths.has(pagePath)) {
            moduleMenu.children.push({
              id: `module-${module.slug}-page-${index}`,
              label: page.title || page.path.split('/').pop() || 'Page',
              href: pagePath,
              icon: page.icon || 'Apps',
              order: typeof page.order === 'number' ? page.order : (moduleMenu.children.length + index),
            });
          }
        });
        
        // Sort children by order - handle order: 0 correctly
        moduleMenu.children.sort((a: any, b: any) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999));
        
        // Ensure Settings page is always at the end of each module group
        const settingsIndex = moduleMenu.children.findIndex((child: any) => 
          child.href === `/modules/${module.slug}/settings` || 
          child.href?.endsWith('/settings')
        );

        if (settingsIndex !== -1) {
          // Get the highest order from all children
          const maxOrder = moduleMenu.children.reduce((max: number, child: any) => {
            return Math.max(max, typeof child.order === 'number' ? child.order : 0);
          }, 0);

          // Move Settings to the end with highest order
          const settingsItem = moduleMenu.children.splice(settingsIndex, 1)[0];
          settingsItem.order = maxOrder + 1; // Always at the end
          moduleMenu.children.push(settingsItem);
        }
        
        // If force=true and module menu already exists, update it instead of adding duplicate
        if (force && existingModuleMenuIds.has(moduleMenu.id)) {
          const existingIndex = menus.findIndex((m: any) => m.id === moduleMenu.id);
          if (existingIndex >= 0) {
            menus[existingIndex] = moduleMenu;
          }
        } else {
          // Check if module menu with same href already exists (avoid duplicates)
          const existingMenuIndex = menus.findIndex((m: any) => 
            m.href === moduleMenu.href || (m.moduleSlug && m.moduleSlug === module.slug)
          );
          if (existingMenuIndex >= 0) {
            // Update existing menu
            menus[existingMenuIndex] = moduleMenu;
          } else {
            // Add new menu
            menus.push(moduleMenu);
          }
        }
      }
    } catch (err) {
      // Silently fail
    }
    
    // Sort by order
    menus.sort((a, b) => a.order - b.order);
    
    // Save initialized menus
    const menuData = {
      menus,
      version: 1,
      initializedAt: new Date().toISOString(),
    };
    saveMenuData(menuData);
    
    return NextResponse.json({
      success: true,
      data: {
        menus,
        locale,
        version: 1,
      },
    });
  } catch (error) {
    console.error('Error initializing menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize menu',
      },
      { status: 500 }
    );
  }
}

