'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface ModuleAccessConfig {
  [moduleSlug: string]: {
    enabled: boolean;
    features?: string[];
  };
}

export interface MenuVisibilityConfig {
  items: {
    id: string;
    visible: boolean;
    order: number;
  }[];
}

export interface UIFeaturesConfig {
  buttons?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
    import?: boolean;
  };
  datatable?: {
    'bulk-actions'?: boolean;
    'column-visibility'?: boolean;
    'density-toggle'?: boolean;
    fullscreen?: boolean;
  };
  filters?: {
    'advanced-filters'?: boolean;
    'saved-views'?: boolean;
    'global-search'?: boolean;
  };
  export?: {
    excel?: boolean;
    pdf?: boolean;
    csv?: boolean;
    print?: boolean;
  };
}

export interface LayoutConfig {
  sidebar?: {
    width?: number;
    background?: string;
    collapsed?: boolean;
    position?: 'left' | 'right';
  };
  topLayout?: {
    height?: number;
    background?: string;
    sticky?: boolean;
  };
  contentArea?: {
    maxWidth?: number;
    padding?: number;
    background?: string;
  };
  footer?: {
    visible?: boolean;
    height?: number;
    background?: string;
  };
}

export interface AccessControlConfigs {
  module: ModuleAccessConfig;
  menu: MenuVisibilityConfig;
  ui: UIFeaturesConfig;
  layout: LayoutConfig;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Default configurations
const DEFAULT_MODULE_CONFIG: ModuleAccessConfig = {};
const DEFAULT_MENU_CONFIG: MenuVisibilityConfig = { items: [] };
const DEFAULT_UI_CONFIG: UIFeaturesConfig = {
  buttons: { create: true, edit: true, delete: true, export: true, import: true },
  datatable: { 'bulk-actions': true, 'column-visibility': true, 'density-toggle': true, fullscreen: true },
  filters: { 'advanced-filters': true, 'saved-views': true, 'global-search': true },
  export: { excel: true, pdf: true, csv: true, print: true },
};
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebar: { width: 280, collapsed: false, position: 'left' },
  topLayout: { height: 64, sticky: true },
  contentArea: { maxWidth: 1200, padding: 24 },
  footer: { visible: true, height: 60 },
};

// Singleton to store configs for global access
let globalConfigs: {
  module: ModuleAccessConfig;
  menu: MenuVisibilityConfig;
  ui: UIFeaturesConfig;
  layout: LayoutConfig;
} = {
  module: DEFAULT_MODULE_CONFIG,
  menu: DEFAULT_MENU_CONFIG,
  ui: DEFAULT_UI_CONFIG,
  layout: DEFAULT_LAYOUT_CONFIG,
};

// Event for config updates
const CONFIG_UPDATE_EVENT = 'access-control-config-updated';

export function useAccessControlConfig(): AccessControlConfigs {
  const { user, loading: authLoading } = useAuth();
  const [moduleConfig, setModuleConfig] = useState<ModuleAccessConfig>(DEFAULT_MODULE_CONFIG);
  const [menuConfig, setMenuConfig] = useState<MenuVisibilityConfig>(DEFAULT_MENU_CONFIG);
  const [uiConfig, setUIConfig] = useState<UIFeaturesConfig>(DEFAULT_UI_CONFIG);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');

      // Fetch all config types in parallel
      const [moduleRes, menuRes, uiRes, layoutRes] = await Promise.all([
        fetchWithAuth('/api/access-control?type=module').catch(() => null),
        fetchWithAuth('/api/access-control?type=menu').catch(() => null),
        fetchWithAuth('/api/access-control?type=ui').catch(() => null),
        fetchWithAuth('/api/access-control?type=layout').catch(() => null),
      ]);

      // Process module config
      if (moduleRes?.ok) {
        const data = await moduleRes.json();
        if (data.success && data.data?.length > 0) {
          setModuleConfig(data.data[0].config || DEFAULT_MODULE_CONFIG);
          globalConfigs.module = data.data[0].config || DEFAULT_MODULE_CONFIG;
        }
      }

      // Process menu config
      if (menuRes?.ok) {
        const data = await menuRes.json();
        if (data.success && data.data?.length > 0) {
          setMenuConfig(data.data[0].config || DEFAULT_MENU_CONFIG);
          globalConfigs.menu = data.data[0].config || DEFAULT_MENU_CONFIG;
        }
      }

      // Process UI config
      if (uiRes?.ok) {
        const data = await uiRes.json();
        if (data.success && data.data?.length > 0) {
          const config = { ...DEFAULT_UI_CONFIG, ...data.data[0].config };
          setUIConfig(config);
          globalConfigs.ui = config;
        }
      }

      // Process layout config
      if (layoutRes?.ok) {
        const data = await layoutRes.json();
        if (data.success && data.data?.length > 0) {
          const config = { ...DEFAULT_LAYOUT_CONFIG, ...data.data[0].config };
          setLayoutConfig(config);
          globalConfigs.layout = config;
        }
      }

      // Dispatch event for other components to know config is updated
      window.dispatchEvent(new CustomEvent(CONFIG_UPDATE_EVENT));

    } catch (err: any) {
      console.error('[useAccessControlConfig] Error:', err);
      setError(err.message || 'Failed to fetch access control configs');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Listen for config save events to refresh
  useEffect(() => {
    const handleConfigSaved = () => {
      fetchConfigs();
    };

    window.addEventListener('access-control-saved', handleConfigSaved);
    return () => window.removeEventListener('access-control-saved', handleConfigSaved);
  }, [fetchConfigs]);

  return {
    module: moduleConfig,
    menu: menuConfig,
    ui: uiConfig,
    layout: layoutConfig,
    loading,
    error,
    refresh: fetchConfigs,
  };
}

// Helper hooks for specific config types
export function useModuleAccess(moduleSlug: string): { enabled: boolean; features: string[]; loading: boolean } {
  const { module, loading } = useAccessControlConfig();

  return useMemo(() => {
    const config = module[moduleSlug];
    return {
      enabled: config?.enabled ?? true, // Default to enabled if not configured
      features: config?.features || [],
      loading,
    };
  }, [module, moduleSlug, loading]);
}

export function useUIFeature(group: string, feature: string): boolean {
  const { ui, loading } = useAccessControlConfig();

  return useMemo(() => {
    if (loading) return true; // Default to true while loading
    const groupConfig = ui[group as keyof UIFeaturesConfig];
    if (!groupConfig || typeof groupConfig !== 'object') return true;
    return (groupConfig as Record<string, boolean>)[feature] ?? true;
  }, [ui, group, feature, loading]);
}

export function useLayoutConfig(): LayoutConfig & { loading: boolean } {
  const { layout, loading } = useAccessControlConfig();
  return { ...layout, loading };
}

// Global accessor for non-hook contexts
export function getGlobalAccessConfig() {
  return globalConfigs;
}
