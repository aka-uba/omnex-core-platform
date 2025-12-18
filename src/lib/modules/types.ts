/**
 * Module System Types
 * Comprehensive type definitions for the module system
 */

export type ModuleStatus = 'installed' | 'active' | 'inactive' | 'error';

export type ModulePermission = 'SuperAdmin' | 'AgencyUser' | 'ClientUser';

export interface ModuleDependency {
  slug: string;
  version?: string;
  required: boolean;
}

export interface ModuleMenu {
  label: string;
  icon: string;
  route: string;
  order: number;
  permissions?: ModulePermission[];
  items?: ModuleMenuItem[];
}

export interface ModuleMenuItem {
  title: string;
  path: string;
  icon?: string;
  permission?: string;
  order?: number;
  badge?: string | number;
  divider?: boolean;
}

export interface ModuleSettings {
  hasSettings: boolean;
  settingsRoute?: string;
  settingsComponent?: string;
}

export interface ModuleHooks {
  onActivate?: string;
  onDeactivate?: string;
  onUninstall?: string;
  onUpdate?: string;
}

export interface ModuleManifest {
  name: string;
  slug: string;
  version: string;
  description: string;
  icon?: string;
  author?: string;
  menu?: ModuleMenu;
  settings?: ModuleSettings;
  dependencies?: ModuleDependency[];
  hooks?: ModuleHooks;
  metadata?: Record<string, any>;
  category?: string;
  tags?: string[];
  minCoreVersion?: string;
  maxCoreVersion?: string;
}

export interface ModuleRecord {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  icon?: string;
  author?: string;
  status: ModuleStatus;
  path: string;
  metadata: Record<string, any>;
  settings: Record<string, any>;
  installedAt: Date;
  activatedAt?: Date;
  updatedAt?: Date;
  category?: string;
  tags?: string[];
  dependencies?: ModuleDependency[];
  error?: string;
  menu?: any; // Menu configuration (from manifest or custom menu)
}

export interface ModuleRegistry {
  modules: Map<string, ModuleRecord>;
  activeModules: Set<string>;
  loadModule: (slug: string) => Promise<ModuleRecord | null>;
  registerModule: (manifest: ModuleManifest, path: string) => Promise<ModuleRecord>;
  unregisterModule: (slug: string) => Promise<void>;
  activateModule: (slug: string) => Promise<void>;
  deactivateModule: (slug: string) => Promise<void>;
  getActiveModules: () => ModuleRecord[];
  getAllModules: () => ModuleRecord[];
  checkDependencies: (module: ModuleManifest) => { valid: boolean; missing: string[] };
}

export interface ModuleEvent {
  type: 'activate' | 'deactivate' | 'install' | 'uninstall' | 'update' | 'error';
  module: string;
  timestamp: Date;
  data?: any;
}

export interface ModuleContextValue {
  modules: ModuleRecord[];
  activeModules: ModuleRecord[];
  loading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
  activateModule: (slug: string) => Promise<void>;
  deactivateModule: (slug: string) => Promise<void>;
  installModule: (file: File) => Promise<ModuleRecord>;
  uninstallModule: (slug: string) => Promise<void>;
  getModule: (slug: string) => ModuleRecord | undefined;
  subscribe: (callback: (event: ModuleEvent) => void) => () => void;
}






