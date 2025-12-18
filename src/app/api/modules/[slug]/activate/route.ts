import { NextRequest, NextResponse } from 'next/server';
import { getModuleRegistry } from '@/lib/modules/registry';
import { corePrisma } from '@/lib/corePrisma';
import fs from 'fs';
import path from 'path';
import { ModuleLoader } from '@/lib/modules/loader';

const MENU_DATA_PATH = path.join(process.cwd(), 'data', 'menu-management.json');

// Create module directories for all active tenants
async function createModuleDirectoriesForTenants(moduleSlug: string): Promise<void> {
  try {
    // Get all active tenants
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      select: { slug: true },
    });

    const basePath = path.join(process.cwd(), 'storage', 'tenants');

    for (const tenant of tenants) {
      const moduleDir = path.join(basePath, tenant.slug, 'module-files', moduleSlug);

      // Create directory if it doesn't exist
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
        console.log(`Created module directory: ${moduleDir}`);
      }
    }
  } catch (error) {
    console.warn('Failed to create module directories for tenants:', error);
    // Don't fail activation if directory creation fails
  }
}

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const registry = getModuleRegistry();

    // First, load module manifest to get module info
    const moduleLoader = new ModuleLoader();
    const manifest = await moduleLoader.loadModuleManifest(slug);
    
    if (!manifest) {
      return NextResponse.json(
        {
          success: false,
          error: `Module ${slug} not found`,
        },
        { status: 404 }
      );
    }

    // Update Core database FIRST (before activating in registry)
    try {
      // Get existing module from DB to preserve data
      // existingModule removed - unused

      await corePrisma.module.upsert({
        where: { slug },
        update: {
          status: 'active',
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          slug,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description || null,
          icon: typeof manifest.icon === 'string' ? manifest.icon : null,
          author: manifest.author || null,
          path: `/modules/${slug}`,
          status: 'active',
          metadata: manifest.metadata || {},
          settings: {},
          installedAt: new Date(),
          activatedAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to persist module status to Core database:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update module status in database',
        },
        { status: 500 }
      );
    }

    // Now activate in registry (after DB update)
    // First, ensure module is registered in registry
    try {
      const existingModuleInRegistry = registry.getModule(slug);
      if (!existingModuleInRegistry) {
        // Register module in registry first
        await registry.registerModule(manifest, `/modules/${slug}`);
      }
      
      // Now activate
      await registry.activateModule(slug);
    } catch (registryError) {
      // Registry activation failed, but DB update succeeded
      // Log error but don't fail the request - DB is the source of truth
      console.warn(`Registry activation failed for ${slug}, but DB update succeeded:`, registryError);
      // Continue - the module is active in DB, which is what matters
    }

    // Create module directories for all active tenants
    await createModuleDirectoriesForTenants(slug);

    // Automatically add module menu to menu management
    try {
      const allModulesArray = await moduleLoader.loadAllModules();
      // loadAllModules returns ModuleRecord[] directly
      const module = allModulesArray.find(m => m.slug === slug);
      
      if (module && module.status === 'active') {
        const menuData = loadMenuData();
        const menus = menuData.menus || [];
        
        // Check if module menu already exists
        const existingMenuIndex = menus.findIndex((m: any) => 
          m.moduleSlug === slug || m.id === `module-${slug}`
        );
        
        if (existingMenuIndex >= 0) {
          // Module menu exists, make it visible
          if (menus[existingMenuIndex].visible === false) {
            menus[existingMenuIndex].visible = true;
            menuData.menus = menus;
            menuData.version = (menuData.version || 1) + 1;
            menuData.updatedAt = new Date().toISOString();
            saveMenuData(menuData);
          }
        } else {
          // Module menu doesn't exist, add it
          const metadata = module.metadata as any;
          const rootMenu = (module as any).menu;
          const menuConfig = metadata?.menu?.main || metadata?.menu || rootMenu;
          
          const moduleMenu: any = {
            id: `module-${slug}`,
            label: menuConfig?.label || menuConfig?.title || module.name,
            href: menuConfig?.href || menuConfig?.route || `/modules/${slug}`,
            icon: typeof module.icon === 'string' ? module.icon : 'Apps',
            order: typeof menuConfig?.order === 'number' ? menuConfig.order : 50,
            visible: true,
            moduleSlug: slug,
            children: [],
          };
          
          // Add menu config items
          if (menuConfig?.items && Array.isArray(menuConfig.items)) {
            menuConfig.items.forEach((item: any, index: number) => {
              moduleMenu.children.push({
                id: `module-${slug}-config-${index}`,
                label: item.title || item.label,
                href: item.path || item.href,
                icon: item.icon || 'Apps',
                order: typeof item.order === 'number' ? item.order : index,
              });
            });
          }
          
          menus.push(moduleMenu);
          menus.sort((a: any, b: any) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999));
          
          menuData.menus = menus;
          menuData.version = (menuData.version || 1) + 1;
          menuData.updatedAt = new Date().toISOString();
          
          saveMenuData(menuData);
        }
      }
    } catch (menuError) {
      // Silently fail - menu addition is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Module activated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate module',
      },
      { status: 500 }
    );
  }
}






