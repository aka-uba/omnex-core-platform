import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { ModuleManifest, ModuleRecord } from './types';
import { YamlLoader } from './yaml-loader';
import { DependencyManager } from './dependency-manager';
// import { ModuleStatusMonitor } from './status-monitor'; // removed - unused
import { corePrisma } from '@/lib/corePrisma';

export class ModuleLoader {
  private modulesPath: string;
  private yamlLoader: YamlLoader;
  private dependencyManager: DependencyManager;
  // private statusMonitor: ModuleStatusMonitor; // removed - unused
  private loadedModules: Map<string, ModuleManifest> = new Map();

  constructor() {
    this.modulesPath = path.join(process.cwd(), 'src', 'modules');
    this.yamlLoader = new YamlLoader();
    // this.statusMonitor = new ModuleStatusMonitor(); // removed - unused
    this.dependencyManager = new DependencyManager(this.loadedModules);
  }

  async loadAllModules(): Promise<ModuleRecord[]> {
    try {
      const entries = await fs.readdir(this.modulesPath, { withFileTypes: true });
      const moduleDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

      const records: ModuleRecord[] = [];

      // First pass: Load all manifests
      for (const slug of moduleDirs) {
        try {
          const manifest = await this.loadModuleManifest(slug);
          if (manifest) {
            this.loadedModules.set(slug, manifest);
          }
        } catch (error) {
          // Silently fail - module manifest loading error
        }
      }

      // Second pass: Validate dependencies and create records
      for (const [slug, manifest] of this.loadedModules) {
        try {
          const record = await this.createModuleRecord(slug, manifest);
          records.push(record);
        } catch (error) {
          records.push({
            id: slug,
            name: slug,
            slug,
            version: '0.0.0',
            description: 'Failed to load',
            status: 'error',
            path: `/modules/${slug}`,
            metadata: {},
            settings: {},
            installedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return records;
    } catch (error) {
      return [];
    }
  }

  async loadModuleManifest(slug: string): Promise<ModuleManifest | null> {
    const configPath = path.join(this.modulesPath, slug, 'module.config.yaml');

    try {
      await fs.access(configPath);
      const manifest = await this.yamlLoader.load(configPath);
      
      
      return manifest;
    } catch (error) {
      // Fallback to json for backward compatibility
      const jsonPath = path.join(this.modulesPath, slug, 'module.json');
      try {
        await fs.access(jsonPath);
        const content = await fs.readFile(jsonPath, 'utf8');
        return JSON.parse(content) as ModuleManifest;
      } catch {
        return null;
      }
    }
  }

  private async createModuleRecord(slug: string, manifest: ModuleManifest): Promise<ModuleRecord> {
    const depCheck = this.dependencyManager.resolveDependencies(manifest);

    // Try to get status from Core database first
    let status: 'active' | 'inactive' | 'error' | 'installed' = 'installed';
    let error: string | undefined;

    try {
      const dbModule = await corePrisma.module.findUnique({
        where: { slug },
        select: { status: true },
      });
      
      if (dbModule && (dbModule.status === 'active' || dbModule.status === 'inactive' || dbModule.status === 'error' || dbModule.status === 'installed')) {
        status = dbModule.status as 'active' | 'inactive' | 'error' | 'installed';
      } else {
        // Module doesn't exist in Core DB yet, sync it with 'installed' status
        try {
          await corePrisma.module.upsert({
            where: { slug },
            update: {}, // Don't update if it exists
            create: {
              slug,
              name: manifest.name,
              version: manifest.version,
              description: manifest.description || null,
              icon: typeof manifest.icon === 'string' ? manifest.icon : null,
              author: manifest.author || null,
              path: `/modules/${slug}`,
              status: 'installed',
              metadata: manifest.metadata || {},
              settings: {},
              installedAt: new Date(),
            },
          });
        } catch (syncError) {
          // Silently fail - module will still work with default status
          console.warn(`Failed to sync module ${slug} to Core DB:`, syncError);
        }
      }
    } catch (dbError) {
      // If Core DB lookup fails, fall back to default logic
      console.warn(`Failed to load module status from Core DB for ${slug}:`, dbError);
    }

    // Override with error status if dependencies are invalid
    if (!depCheck.valid) {
      status = 'error';
      error = `Missing dependencies: ${depCheck.missing.join(', ')}. Incompatible: ${depCheck.incompatible.join(', ')}`;
    }

    const cycle = this.dependencyManager.checkCircularDependencies(slug);
    if (cycle) {
      status = 'error';
      error = `Circular dependency detected: ${cycle.join(' -> ')}`;
    }

    // Load custom menu if exists (synchronously for better performance)
    let customMenu = null;
    try {
      const savedMenuPath = path.join(process.cwd(), 'data', 'module-menus', `${slug}.json`);
      if (fsSync.existsSync(savedMenuPath)) {
        const savedMenuContent = fsSync.readFileSync(savedMenuPath, 'utf-8');
        customMenu = JSON.parse(savedMenuContent);
      }
    } catch {
      // No custom menu, use default from manifest
    }

    // Get menu from custom menu or manifest
    // Custom menu format: { main: { label, icon, href, items: [...] } }
    // Manifest menu format: { main: { label, icon, href, items: [...] } } or { label, icon, route, items: [...] }
    const menu = customMenu || manifest.menu;
    

    return {
      id: slug,
      name: manifest.name,
      slug: manifest.slug,
      version: manifest.version,
      description: manifest.description,
      ...(manifest.icon ? { icon: manifest.icon } : {}),
      ...(manifest.author ? { author: manifest.author } : {}),
      status,
      path: `/modules/${slug}`,
      metadata: {
        ...(manifest.metadata || {}),
        settings: manifest.settings,
        menu: menu, // Add menu to metadata
      },
      menu: menu, // Also add to root for backward compatibility
      settings: {},
      installedAt: new Date(),
      ...(manifest.category ? { category: manifest.category } : {}),
      ...(manifest.tags ? { tags: manifest.tags } : {}),
      ...(manifest.dependencies ? { dependencies: manifest.dependencies } : {}),
      ...(error ? { error } : {}),
    };
  }
}
