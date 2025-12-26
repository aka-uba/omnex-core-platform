'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ModuleContextValue, ModuleRecord, ModuleEvent } from '@/lib/modules/types';

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

// Cache duration: 5 minutes (modules rarely change)
const MODULE_CACHE_DURATION = 5 * 60 * 1000;

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventListeners, setEventListeners] = useState<Set<(event: ModuleEvent) => void>>(new Set());
  const lastFetchTime = React.useRef<number>(0);

  const emitEvent = useCallback((event: ModuleEvent) => {
    eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        // Error in module event listener - silently fail
      }
    });
  }, [eventListeners]);

  const refreshModules = useCallback(async (force = false) => {
    // Skip if cache is still valid (unless forced)
    const now = Date.now();
    if (!force && lastFetchTime.current > 0 && (now - lastFetchTime.current) < MODULE_CACHE_DURATION) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/modules');
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data = await response.json();
      setModules(data.modules || []);
      lastFetchTime.current = now;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const activateModule = useCallback(async (slug: string) => {
    let response: Response | null = null;
    try {
      response = await fetch(`/api/modules/${slug}/activate`, {
        method: 'POST',
      });
      
      // Force refresh modules after activation
      await refreshModules(true);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to activate module');
      }
      
      emitEvent({
        type: 'activate',
        module: slug,
        timestamp: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      emitEvent({
        type: 'error',
        module: slug,
        timestamp: new Date(),
        data: { error: message },
      });
      throw err;
    }
  }, [emitEvent]);

  const deactivateModule = useCallback(async (slug: string) => {
    try {
      const response = await fetch(`/api/modules/${slug}/deactivate`, {
        method: 'POST',
      });
      
      // Force refresh modules after deactivation
      await refreshModules(true);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to deactivate module');
      }
      
      emitEvent({
        type: 'deactivate',
        module: slug,
        timestamp: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      emitEvent({
        type: 'error',
        module: slug,
        timestamp: new Date(),
        data: { error: message },
      });
      throw err;
    }
  }, [emitEvent]);

  const installModule = useCallback(async (file: File): Promise<ModuleRecord> => {
    try {
      const formData = new FormData();
      formData.append('module', file);

      const response = await fetch('/api/modules/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to install module');
      }

      const data = await response.json();
      await refreshModules(true);
      emitEvent({
        type: 'install',
        module: data.module.slug,
        timestamp: new Date(),
      });
      return data.module;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  }, [refreshModules, emitEvent]);

  const uninstallModule = useCallback(async (slug: string) => {
    try {
      const response = await fetch(`/api/modules/${slug}/uninstall`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to uninstall module');
      }
      await refreshModules(true);
      emitEvent({
        type: 'uninstall',
        module: slug,
        timestamp: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  }, [refreshModules, emitEvent]);

  const getModule = useCallback((slug: string) => {
    return modules.find((m) => m.slug === slug);
  }, [modules]);

  const subscribe = useCallback((callback: (event: ModuleEvent) => void) => {
    setEventListeners((prev) => new Set([...prev, callback]));
    return () => {
      setEventListeners((prev) => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  useEffect(() => {
    refreshModules();
  }, [refreshModules]);

  // Listen for modules-updated event (e.g., when module icon changes)
  useEffect(() => {
    const handleModulesUpdated = () => {
      refreshModules(true); // Force refresh on explicit event
    };

    window.addEventListener('modules-updated', handleModulesUpdated);
    return () => window.removeEventListener('modules-updated', handleModulesUpdated);
  }, [refreshModules]);

  const value: ModuleContextValue = {
    modules,
    activeModules: modules.filter((m) => m.status === 'active'),
    loading,
    error,
    refreshModules,
    activateModule,
    deactivateModule,
    installModule,
    uninstallModule,
    getModule,
    subscribe,
  };

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules(): ModuleContextValue {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within ModuleProvider');
  }
  return context;
}






