import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ModuleLoader } from '@/lib/modules/loader';
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

// Load module config - use module's already loaded menu data
function getModuleMenuConfig(module: any): any {
  // ModuleLoader already loads menu from module.config.yaml
  const metadata = module.metadata as any;
  const rootMenu = module.menu;
  return metadata?.menu?.main || metadata?.menu || rootMenu?.main || rootMenu;
}

/**
 * POST /api/menu-management/sync
 * Aktif modülleri menu-management.json ile senkronize eder
 * - Eski duplicate menüleri temizler (aynı modül için birden fazla menü varsa)
 * - Aktif modülleri ekler (yoksa)
 * - Mevcut menülere moduleSlug ekler (eşleşen href'e göre)
 * - Alt menüleri (children) modül config'inden yükler
 * - Pasif modülleri visible=false yapar
 */
export async function POST(request: NextRequest) {
  try {
    const moduleLoader = new ModuleLoader();
    const allModulesArray = await moduleLoader.loadAllModules();
    
    const menuData = loadMenuData();
    const menus = menuData.menus || [];
    
    let changesMade = false;
    const addedModules: string[] = [];
    const updatedModules: string[] = [];
    const removedMenus: string[] = [];
    
    // Get all active modules (loadAllModules returns ModuleRecord[] directly)
    const activeModules = allModulesArray.filter(m => m.status === 'active');
    const activeModuleSlugs = new Set(activeModules.map(m => m.slug));
    
    // STEP 1: Remove duplicate/old menus for same module
    // Keep track of which module slugs we've processed
    
    // First, identify and remove old menus that match module patterns but are duplicates
    for (const module of activeModules) {
      const moduleSlug = module.slug;
      
      // Find ALL menus that could belong to this module
      const matchingIndices: number[] = [];
      menus.forEach((menu: any, index: number) => {
        const isMatch = 
          menu.moduleSlug === moduleSlug ||
          menu.id === `module-${moduleSlug}` ||
          (menu.href && menu.href.includes(`/modules/${moduleSlug}`));
        
        if (isMatch) {
          matchingIndices.push(index);
        }
      });
      
      // If there are multiple menus for the same module, keep only one (prefer one with moduleSlug)
      if (matchingIndices.length > 1) {
        // Sort: prefer menus with moduleSlug, then by id starting with 'module-'
        matchingIndices.sort((a, b) => {
          const menuA = menus[a];
          const menuB = menus[b];
          if (menuA.moduleSlug && !menuB.moduleSlug) return -1;
          if (!menuA.moduleSlug && menuB.moduleSlug) return 1;
          if (menuA.id?.startsWith('module-') && !menuB.id?.startsWith('module-')) return -1;
          if (!menuA.id?.startsWith('module-') && menuB.id?.startsWith('module-')) return 1;
          return 0;
        });
        
        // Remove all except the first one
        for (let i = matchingIndices.length - 1; i > 0; i--) {
          const index = matchingIndices[i];
          if (index === undefined) continue;
          const menuToRemove = menus[index];
          if (menuToRemove) {
            removedMenus.push(menuToRemove.label || menuToRemove.id);
          }
          menus.splice(index, 1);
          changesMade = true;
        }
      }
    }
    
    // STEP 2: Process each active module - update or add
    for (const module of activeModules) {
      // Get menu config from module's already loaded data
      const menuConfig = getModuleMenuConfig(module);
      
      if (!menuConfig) continue;
      
      const moduleHref = menuConfig.href || menuConfig.route || `/modules/${module.slug}`;
      
      // Find existing menu for this module
      const existingMenuIndex = menus.findIndex((m: any) => {
        if (m.moduleSlug === module.slug) return true;
        if (m.id === `module-${module.slug}`) return true;
        if (m.href && m.href.includes(`/modules/${module.slug}`)) return true;
        return false;
      });
      
      if (existingMenuIndex >= 0) {
        const existingMenu = menus[existingMenuIndex];
        let menuUpdated = false;
        
        // Update moduleSlug
        if (!existingMenu.moduleSlug) {
          existingMenu.moduleSlug = module.slug;
          menuUpdated = true;
        }
        
        // Update id to standard format
        if (!existingMenu.id?.startsWith('module-')) {
          existingMenu.id = `module-${module.slug}`;
          menuUpdated = true;
        }
        
        // Make visible if hidden
        if (existingMenu.visible === false) {
          existingMenu.visible = true;
          menuUpdated = true;
        }
        
        // Update label from config
        const newLabel = menuConfig.label || menuConfig.title || module.name;
        if (existingMenu.label !== newLabel) {
          existingMenu.label = newLabel;
          menuUpdated = true;
        }
        
        // Update icon from config
        const newIcon = menuConfig.icon || (typeof module.icon === 'string' ? module.icon : 'Apps');
        if (existingMenu.icon !== newIcon) {
          existingMenu.icon = newIcon;
          menuUpdated = true;
        }
        
        // Update children from module config
        if (menuConfig.items && Array.isArray(menuConfig.items) && menuConfig.items.length > 0) {
          existingMenu.children = menuConfig.items.map((item: any, index: number) => ({
            id: `module-${module.slug}-item-${index}`,
            label: item.title || item.label,
            href: item.path || item.href,
            icon: item.icon || 'Apps',
            order: typeof item.order === 'number' ? item.order : index,
            visible: true,
          }));
          menuUpdated = true;
        }
        
        if (menuUpdated) {
          menus[existingMenuIndex] = existingMenu;
          updatedModules.push(module.slug);
          changesMade = true;
        }
      } else {
        // Module menu doesn't exist, add it
        const moduleMenu: any = {
          id: `module-${module.slug}`,
          label: menuConfig.label || menuConfig.title || module.name,
          href: moduleHref,
          icon: menuConfig.icon || (typeof module.icon === 'string' ? module.icon : 'Apps'),
          order: typeof menuConfig.order === 'number' ? menuConfig.order : 50,
          visible: true,
          moduleSlug: module.slug,
          children: [],
        };
        
        // Add menu config items as children
        if (menuConfig.items && Array.isArray(menuConfig.items)) {
          moduleMenu.children = menuConfig.items.map((item: any, index: number) => ({
            id: `module-${module.slug}-item-${index}`,
            label: item.title || item.label,
            href: item.path || item.href,
            icon: item.icon || 'Apps',
            order: typeof item.order === 'number' ? item.order : index,
            visible: true,
          }));
        }
        
        menus.push(moduleMenu);
        addedModules.push(module.slug);
        changesMade = true;
      }
    }
    
    // STEP 3: Hide inactive modules that are still in menus
    menus.forEach((menu: any, index: number) => {
      if (menu.moduleSlug && !activeModuleSlugs.has(menu.moduleSlug) && menu.visible !== false) {
        menus[index].visible = false;
        updatedModules.push(menu.moduleSlug);
        changesMade = true;
      }
    });
    
    if (changesMade) {
      // Sort by order - use nullish coalescing to handle order: 0 correctly
      menus.sort((a: any, b: any) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999));
      
      menuData.menus = menus;
      menuData.version = (menuData.version || 1) + 1;
      menuData.updatedAt = new Date().toISOString();
      saveMenuData(menuData);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menu sync completed',
      data: {
        addedModules,
        updatedModules,
        removedMenus,
        totalActiveModules: activeModules.length,
        totalMenus: menus.filter((m: any) => m.visible !== false).length,
      },
    });
  } catch (error) {
    console.error('Error syncing menus:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync menus',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/menu-management/sync
 * Senkronizasyon durumunu kontrol eder
 */
export async function GET(request: NextRequest) {
  try {
    const moduleLoader = new ModuleLoader();
    const allModulesArray = await moduleLoader.loadAllModules();
    
    const menuData = loadMenuData();
    const menus = menuData.menus || [];
    
    // loadAllModules returns ModuleRecord[] directly
    const activeModules = allModulesArray.filter(m => m.status === 'active');
    const activeModuleSlugs = new Set(activeModules.map(m => m.slug));
    
    // Find modules not in menus
    const missingModules = activeModules.filter(m => {
      const inMenu = menus.some((menu: any) => 
        (menu.moduleSlug === m.slug || menu.id === `module-${m.slug}`) && menu.visible !== false
      );
      return !inMenu;
    });
    
    // Find hidden modules that are active
    const hiddenActiveModules = menus.filter((menu: any) => 
      menu.moduleSlug && activeModuleSlugs.has(menu.moduleSlug) && menu.visible === false
    );
    
    return NextResponse.json({
      success: true,
      data: {
        activeModules: activeModules.map(m => ({ slug: m.slug, name: m.name })),
        missingModules: missingModules.map(m => ({ slug: m.slug, name: m.name })),
        hiddenActiveModules: hiddenActiveModules.map((m: any) => ({ slug: m.moduleSlug, label: m.label })),
        needsSync: missingModules.length > 0 || hiddenActiveModules.length > 0,
      },
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check sync status',
      },
      { status: 500 }
    );
  }
}
