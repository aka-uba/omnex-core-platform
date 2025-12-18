import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface ModuleMenuItem {
  title: string;
  path: string;
  icon: string;
  order: number;
  visible: boolean;
  level: number;
}

export interface ModuleMenuConfig {
  label: string;
  icon: string;
  href: string;
  order: number;
  items: ModuleMenuItem[];
}

/**
 * Get all active modules' menu configurations
 */
export async function getAllModuleMenus(): Promise<Record<string, ModuleMenuConfig>> {
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  const menus: Record<string, ModuleMenuConfig> = {};

  try {
    const moduleDirectories = fs.readdirSync(modulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const moduleSlug of moduleDirectories) {
      // Check for saved custom menu first
      const savedMenuPath = path.join(
        process.cwd(),
        'data',
        'module-menus',
        `${moduleSlug}.json`
      );

      if (fs.existsSync(savedMenuPath)) {
        const savedContent = fs.readFileSync(savedMenuPath, 'utf-8');
        const savedMenu = JSON.parse(savedContent);
        if (savedMenu.main) {
          menus[moduleSlug] = savedMenu.main;
        }
        continue;
      }

      // Load from module.config.yaml
      const configPath = path.join(modulesDir, moduleSlug, 'module.config.yaml');
      
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          const config = yaml.load(configContent) as any;
          
          if (config.menu && config.menu.main) {
            menus[moduleSlug] = {
              label: config.menu.main.label,
              icon: config.menu.main.icon,
              href: config.menu.main.href,
              order: config.menu.main.order || 0,
              items: (config.menu.main.items || []).map((item: any, index: number) => ({
                title: item.title,
                path: item.path,
                icon: item.icon,
                order: item.order || index + 1,
                visible: true,
                level: 0,
              })),
            };
          }
        } catch (error) {
          console.error(`Failed to load menu for module ${moduleSlug}:`, error);
        }
      }
    }

    return menus;
  } catch (error) {
    console.error('Failed to load module menus:', error);
    return {};
  }
}

/**
 * Build hierarchical menu structure for navigation
 * Groups all active module menus under a "Menüler" parent menu
 */
export function buildModuleMenuStructure(
  moduleMenus: Record<string, ModuleMenuConfig>
): any[] {
  const mainMenu = [];

  // Sort modules by order
  const sortedModules = Object.entries(moduleMenus).sort(
    ([, a], [, b]) => a.order - b.order
  );

  for (const [, menuConfig] of sortedModules) {
    // Add module as a menu group
    const moduleMenu = {
      label: menuConfig.label,
      icon: menuConfig.icon,
      href: menuConfig.href,
      order: menuConfig.order,
      items: menuConfig.items
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          title: item.title,
          path: item.path,
          icon: item.icon,
          level: item.level + 1, // Add one level for nesting under module
        })),
    };

    mainMenu.push(moduleMenu);
  }

  return mainMenu;
}

/**
 * Get menu structure for a specific module
 */
export async function getModuleMenu(moduleSlug: string): Promise<ModuleMenuConfig | null> {
  const allMenus = await getAllModuleMenus();
  return allMenus[moduleSlug] || null;
}

/**
 * Check if a module has custom menu settings
 */
export function hasCustomMenu(moduleSlug: string): boolean {
  const savedMenuPath = path.join(
    process.cwd(),
    'data',
    'module-menus',
    `${moduleSlug}.json`
  );
  return fs.existsSync(savedMenuPath);
}






