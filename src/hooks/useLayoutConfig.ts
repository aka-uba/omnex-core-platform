'use client';

/**
 * useLayoutConfig Hook
 * Layout özelleştirme ayarlarını okur ve uygular
 *
 * Örnek kullanım:
 * const { config, isLoading } = useLayoutConfig();
 *
 * // Sidebar genişliği
 * const sidebarWidth = config.sidebar.width;
 *
 * // Footer görünürlüğü
 * {config.footer.visible && <Footer />}
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Default layout configuration
const DEFAULT_LAYOUT_CONFIG = {
  sidebar: {
    width: 280,
    background: '#ffffff',
    collapsed: false,
    position: 'left' as 'left' | 'right',
  },
  topLayout: {
    height: 64,
    background: '#ffffff',
    sticky: true,
  },
  contentArea: {
    maxWidth: 1200,
    padding: 24,
    background: '#f8f9fa',
  },
  footer: {
    visible: true,
    height: 60,
    background: '#ffffff',
  },
};

export interface LayoutConfig {
  sidebar: {
    width: number;
    background: string;
    collapsed: boolean;
    position: 'left' | 'right';
  };
  topLayout: {
    height: number;
    background: string;
    sticky: boolean;
  };
  contentArea: {
    maxWidth: number;
    padding: number;
    background: string;
  };
  footer: {
    visible: boolean;
    height: number;
    background: string;
  };
}

interface UseLayoutConfigResult {
  config: LayoutConfig;
  isLoading: boolean;
  refresh: () => void;
}

export function useLayoutConfig(): UseLayoutConfigResult {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch layout config
  const fetchConfig = useCallback(async () => {
    if (!user || authLoading) return;

    try {
      const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
      const response = await fetchWithAuth('/api/access-control?type=layout');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          const savedConfig = data.data[0].config || {};
          // Merge saved config with defaults
          const mergedConfig: LayoutConfig = {
            sidebar: {
              ...DEFAULT_LAYOUT_CONFIG.sidebar,
              ...(savedConfig.sidebar || {}),
            },
            topLayout: {
              ...DEFAULT_LAYOUT_CONFIG.topLayout,
              ...(savedConfig.topLayout || {}),
            },
            contentArea: {
              ...DEFAULT_LAYOUT_CONFIG.contentArea,
              ...(savedConfig.contentArea || {}),
            },
            footer: {
              ...DEFAULT_LAYOUT_CONFIG.footer,
              ...(savedConfig.footer || {}),
            },
          };

          setConfig(mergedConfig);
        }
      }
    } catch (error) {
      console.error('[useLayoutConfig] Failed to fetch config:', error);
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

  // Refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    refresh,
  };
}

// Convenience hooks for specific layout sections
export function useSidebarConfig() {
  const { config, isLoading } = useLayoutConfig();

  return {
    isLoading,
    width: config.sidebar.width,
    background: config.sidebar.background,
    collapsed: config.sidebar.collapsed,
    position: config.sidebar.position,
  };
}

export function useTopLayoutConfig() {
  const { config, isLoading } = useLayoutConfig();

  return {
    isLoading,
    height: config.topLayout.height,
    background: config.topLayout.background,
    sticky: config.topLayout.sticky,
  };
}

export function useContentAreaConfig() {
  const { config, isLoading } = useLayoutConfig();

  return {
    isLoading,
    maxWidth: config.contentArea.maxWidth,
    padding: config.contentArea.padding,
    background: config.contentArea.background,
  };
}

export function useFooterConfig() {
  const { config, isLoading } = useLayoutConfig();

  return {
    isLoading,
    visible: config.footer.visible,
    height: config.footer.height,
    background: config.footer.background,
  };
}
