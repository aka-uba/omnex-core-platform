import { NextRequest, NextResponse } from 'next/server';
import { getModuleRegistry } from '@/lib/modules/registry';
import { corePrisma } from '@/lib/corePrisma';
import { ModuleLoader } from '@/lib/modules/loader';
import fs from 'fs';
import path from 'path';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const registry = getModuleRegistry();

    // Update Core database FIRST (before deactivating in registry)
    try {
      const updateResult = await corePrisma.module.updateMany({
        where: { slug },
        data: {
          status: 'inactive',
          updatedAt: new Date(),
        },
      });
      
      if (updateResult.count === 0) {
        // Module doesn't exist in Core DB, but that's okay - continue with registry deactivation
        console.warn(`Module ${slug} not found in Core database, but continuing with deactivation`);
      }
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

    // Now deactivate in registry (after DB update)
    // First, ensure module is registered in registry if needed
    try {
      const existingModuleInRegistry = registry.getModule(slug);
      if (!existingModuleInRegistry) {
        // Module not in registry, try to register it first
        const moduleLoader = new ModuleLoader();
        const manifest = await moduleLoader.loadModuleManifest(slug);
        if (manifest) {
          await registry.registerModule(manifest, `/modules/${slug}`);
        }
      }
      
      // Now deactivate
      await registry.deactivateModule(slug);
    } catch (registryError) {
      // Registry deactivation failed, but DB update succeeded
      // Log error but don't fail the request - DB is the source of truth
      console.warn(`Registry deactivation failed for ${slug}, but DB update succeeded:`, registryError);
      // Continue - the module is inactive in DB, which is what matters
    }

    // Hide module menu in menu management (set visible=false instead of removing)
    try {
      const menuData = loadMenuData();
      const menus = menuData.menus || [];
      
      const moduleMenuIndex = menus.findIndex((m: any) => 
        m.moduleSlug === slug || m.id === `module-${slug}`
      );
      
      if (moduleMenuIndex >= 0) {
        menus[moduleMenuIndex].visible = false;
        menuData.menus = menus;
        menuData.version = (menuData.version || 1) + 1;
        menuData.updatedAt = new Date().toISOString();
        saveMenuData(menuData);
      }
    } catch (menuError) {
      // Silently fail - menu update is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Module deactivated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate module',
      },
      { status: 500 }
    );
  }
}






