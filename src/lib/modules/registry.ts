/**
 * Module Registry
 * Central registry for managing all modules in the system
 */

import type { ModuleRecord, ModuleManifest, ModuleStatus } from './types';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { logger } from '@/lib/utils/logger';

export class ModuleRegistry {
  private modules: Map<string, ModuleRecord> = new Map();
  private activeModules: Set<string> = new Set();
  private modulesPath: string;

  constructor(modulesPath: string = './src/modules') {
    this.modulesPath = resolve(modulesPath);
  }

  /**
   * Scan modules directory and register all modules
   */
  async scanModules(): Promise<ModuleRecord[]> {
    const modules: ModuleRecord[] = [];

    if (!existsSync(this.modulesPath)) {
      return modules;
    }

    try {
      const entries = await readdir(this.modulesPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = join(this.modulesPath, entry.name);
          const manifestPath = join(modulePath, 'module.json');

          if (existsSync(manifestPath)) {
            try {
              const manifestContent = await readFile(manifestPath, 'utf-8');
              const manifest: ModuleManifest = JSON.parse(manifestContent);

              const moduleRecord: ModuleRecord = {
                id: `${manifest.slug}-${manifest.version}`,
                name: manifest.name,
                slug: manifest.slug,
                version: manifest.version,
                description: manifest.description,
                ...(manifest.icon ? { icon: manifest.icon } : {}),
                ...(manifest.author ? { author: manifest.author } : {}),
                status: 'installed',
                path: modulePath,
                metadata: manifest.metadata || {},
                settings: {},
                installedAt: new Date(),
                ...(manifest.category ? { category: manifest.category } : {}),
                ...(manifest.tags ? { tags: manifest.tags } : {}),
                ...(manifest.dependencies ? { dependencies: manifest.dependencies } : {}),
              };

              modules.push(moduleRecord);
              this.modules.set(manifest.slug, moduleRecord);
            } catch (error) {
              logger.error(`Error loading module ${entry.name}`, error, 'module-registry');
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning modules directory', error, 'module-registry');
    }

    return modules;
  }

  /**
   * Register a new module
   */
  async registerModule(manifest: ModuleManifest, path: string): Promise<ModuleRecord> {
    const existing = this.modules.get(manifest.slug);

    const moduleRecord: ModuleRecord = {
      id: `${manifest.slug
}-${manifest.version}`,
      name: manifest.name,
      slug: manifest.slug,
      version: manifest.version,
      description: manifest.description,
      ...(manifest.icon ? { icon: manifest.icon } : {}),
      ...(manifest.author ? { author: manifest.author } : {}),
      status: existing?.status || 'installed',
      path,
      metadata: manifest.metadata || {},
      settings: existing?.settings || {},
      installedAt: existing?.installedAt || new Date(),
      ...(existing?.activatedAt ? { activatedAt: existing.activatedAt } : {}),
      updatedAt: new Date(),
      ...(manifest.category ? { category: manifest.category } : {}),
      ...(manifest.tags ? { tags: manifest.tags } : {}),
      ...(manifest.dependencies ? { dependencies: manifest.dependencies } : {}),
    };

    this.modules.set(manifest.slug, moduleRecord);
    return moduleRecord;
  }

  /**
   * Unregister a module
   */
  async unregisterModule(slug: string): Promise<void> {
    this.modules.delete(slug);
    this.activeModules.delete(slug);
  }

  /**
   * Activate a module
   */
  async activateModule(slug: string): Promise<void> {
    const module = this.modules.get(slug);
    if (!module) {
      throw new Error(`Module ${slug} not found`);
    }

    // Check dependencies
    const dependencyCheck = this.checkDependencies(module);
    if (!dependencyCheck.valid) {
      throw new Error(`Missing dependencies: ${dependencyCheck.missing.join(', ')}`);
    }

    module.status = 'active';
    module.activatedAt = new Date();
    this.activeModules.add(slug);
    this.modules.set(slug, module);
  }

  /**
   * Deactivate a module
   */
  async deactivateModule(slug: string): Promise<void> {
    const module = this.modules.get(slug);
    if (!module) {
      throw new Error(`Module ${slug} not found`);
    }

    module.status = 'inactive';
    this.activeModules.delete(slug);
    this.modules.set(slug, module);
  }

  /**
   * Get a module by slug
   */
  getModule(slug: string): ModuleRecord | undefined {
    return this.modules.get(slug);
  }

  /**
   * Get all modules
   */
  getAllModules(): ModuleRecord[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get active modules
   */
  getActiveModules(): ModuleRecord[] {
    return Array.from(this.modules.values()).filter((m) => m.status === 'active');
  }

  /**
   * Check module dependencies
   */
  checkDependencies(module: ModuleRecord): { valid: boolean; missing: string[] } {
    if (!module.dependencies || module.dependencies.length === 0) {
      return { valid: true, missing: [] };
    }

    const missing: string[] = [];

    for (const dep of module.dependencies) {
      const depModule = this.modules.get(dep.slug);
      
      if (!depModule) {
        if (dep.required) {
          missing.push(dep.slug);
        }
        continue;
      }

      if (dep.version) {
        // Simple version check (can be enhanced with semver)
        if (depModule.version !== dep.version) {
          if (dep.required) {
            missing.push(`${dep.slug}@${dep.version}`);
          }
        }
      }

      if (dep.required && depModule.status !== 'active') {
        missing.push(dep.slug);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Update module status
   */
  updateModuleStatus(slug: string, status: ModuleStatus, error?: string): void {
    const module = this.modules.get(slug);
    if (module) {
      module.status = status;
      if (error) {
        module.error = error;
      }
      this.modules.set(slug, module);
    }
  }
}

// Singleton instance
let registryInstance: ModuleRegistry | null = null;

export function getModuleRegistry(modulesPath?: string): ModuleRegistry {
  if (!registryInstance) {
    registryInstance = new ModuleRegistry(modulesPath);
  }
  return registryInstance;
}






