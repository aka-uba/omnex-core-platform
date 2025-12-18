'use client';

/**
 * useUIFeatures Hook
 * UI özelliklerinin erişim kontrolü ayarlarını okur ve uygular
 *
 * Örnek kullanım:
 * const { isFeatureEnabled, isLoading } = useUIFeatures();
 *
 * // Buton görünürlüğü
 * {isFeatureEnabled('buttons', 'create') && <CreateButton />}
 *
 * // Export seçenekleri
 * {isFeatureEnabled('export', 'excel') && <ExcelExportButton />}
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// UI grupları ve varsayılan değerleri
const UI_DEFAULTS: Record<string, Record<string, boolean>> = {
  buttons: {
    create: true,
    edit: true,
    delete: false,
    export: true,
    import: false,
  },
  datatable: {
    'bulk-actions': true,
    'column-visibility': true,
    'density-toggle': true,
    fullscreen: true,
  },
  filters: {
    'advanced-filters': false,
    'saved-views': false,
    'global-search': true,
  },
  export: {
    excel: true,
    pdf: true,
    csv: true,
    print: true,
  },
};

interface UIFeaturesConfig {
  [groupId: string]: {
    [featureId: string]: boolean;
  };
}

interface UseUIFeaturesResult {
  config: UIFeaturesConfig;
  isLoading: boolean;
  isFeatureEnabled: (groupId: string, featureId: string) => boolean;
  isGroupEnabled: (groupId: string) => boolean;
  getGroupFeatures: (groupId: string) => Record<string, boolean>;
  refresh: () => void;
}

export function useUIFeatures(): UseUIFeaturesResult {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<UIFeaturesConfig>(UI_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch UI features config
  const fetchConfig = useCallback(async () => {
    if (!user || authLoading) return;

    try {
      const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
      const response = await fetchWithAuth('/api/access-control?type=ui');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          const savedConfig = data.data[0].config || {};
          // Merge saved config with defaults
          const mergedConfig: UIFeaturesConfig = { ...UI_DEFAULTS };

          Object.keys(savedConfig).forEach(groupId => {
            if (mergedConfig[groupId]) {
              mergedConfig[groupId] = {
                ...mergedConfig[groupId],
                ...savedConfig[groupId],
              };
            } else {
              mergedConfig[groupId] = savedConfig[groupId];
            }
          });

          setConfig(mergedConfig);
        }
      }
    } catch (error) {
      console.error('[useUIFeatures] Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Listen for config updates
  useEffect(() => {
    const handleConfigUpdate = () => {
      fetchConfig();
    };

    window.addEventListener('access-control-saved', handleConfigUpdate);
    return () => window.removeEventListener('access-control-saved', handleConfigUpdate);
  }, [fetchConfig]);

  // Check if a specific feature is enabled
  const isFeatureEnabled = useCallback(
    (groupId: string, featureId: string): boolean => {
      const groupConfig = config[groupId];
      if (!groupConfig) {
        // Group not found, check defaults
        return UI_DEFAULTS[groupId]?.[featureId] ?? true;
      }

      const value = groupConfig[featureId];
      if (value === undefined) {
        // Feature not found in config, check defaults
        return UI_DEFAULTS[groupId]?.[featureId] ?? true;
      }

      return value;
    },
    [config]
  );

  // Check if all features in a group are enabled
  const isGroupEnabled = useCallback(
    (groupId: string): boolean => {
      const groupConfig = config[groupId];
      if (!groupConfig) return true;

      return Object.values(groupConfig).some(value => value === true);
    },
    [config]
  );

  // Get all features in a group
  const getGroupFeatures = useCallback(
    (groupId: string): Record<string, boolean> => {
      return config[groupId] || UI_DEFAULTS[groupId] || {};
    },
    [config]
  );

  // Refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    isFeatureEnabled,
    isGroupEnabled,
    getGroupFeatures,
    refresh,
  };
}

// Convenience hooks for specific feature groups
export function useButtonFeatures() {
  const { isFeatureEnabled, isLoading } = useUIFeatures();

  return {
    isLoading,
    canCreate: isFeatureEnabled('buttons', 'create'),
    canEdit: isFeatureEnabled('buttons', 'edit'),
    canDelete: isFeatureEnabled('buttons', 'delete'),
    canExport: isFeatureEnabled('buttons', 'export'),
    canImport: isFeatureEnabled('buttons', 'import'),
  };
}

export function useDataTableFeatures() {
  const { isFeatureEnabled, isLoading } = useUIFeatures();

  return {
    isLoading,
    hasBulkActions: isFeatureEnabled('datatable', 'bulk-actions'),
    hasColumnVisibility: isFeatureEnabled('datatable', 'column-visibility'),
    hasDensityToggle: isFeatureEnabled('datatable', 'density-toggle'),
    hasFullscreen: isFeatureEnabled('datatable', 'fullscreen'),
  };
}

export function useFilterFeatures() {
  const { isFeatureEnabled, isLoading } = useUIFeatures();

  return {
    isLoading,
    hasAdvancedFilters: isFeatureEnabled('filters', 'advanced-filters'),
    hasSavedViews: isFeatureEnabled('filters', 'saved-views'),
    hasGlobalSearch: isFeatureEnabled('filters', 'global-search'),
  };
}

export function useExportFeatures() {
  const { isFeatureEnabled, isLoading } = useUIFeatures();

  return {
    isLoading,
    canExportExcel: isFeatureEnabled('export', 'excel'),
    canExportPdf: isFeatureEnabled('export', 'pdf'),
    canExportCsv: isFeatureEnabled('export', 'csv'),
    canPrint: isFeatureEnabled('export', 'print'),
  };
}
