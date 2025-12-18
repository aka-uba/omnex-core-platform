/**
 * useLayoutData Hook
 * Hibrit veri yönetimi: DB + localStorage
 * Öncelik: DB > localStorage > default
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutConfig, DEFAULT_LAYOUT_CONFIG, STORAGE_KEYS } from '../core/LayoutConfig';

interface UseLayoutDataOptions {
  userId?: string;
  userRole?: string;
  companyId?: string;
}

export function useLayoutData(options: UseLayoutDataOptions = {}) {
  const { userId, userRole, companyId } = options;
  const [config, setConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * LocalStorage'dan yükle (hızlı, senkron)
   */
  const loadFromLocalStorage = useCallback((): LayoutConfig | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.layoutConfig);
      if (stored) {
        return JSON.parse(stored) as LayoutConfig;
      }
    } catch {
      // Silently fail
    }
    
    return null;
  }, []);

  /**
   * LocalStorage'a kaydet
   */
  const saveToLocalStorage = useCallback((config: LayoutConfig) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.layoutConfig, JSON.stringify(config));
      localStorage.setItem(STORAGE_KEYS.layoutConfigTimestamp, Date.now().toString());
    } catch {
      // Silently fail
    }
  }, []);

  /**
   * Veritabanından yükle (async)
   */
  const loadFromDatabase = useCallback(async (): Promise<LayoutConfig | null> => {
    if (!userId) return null;

    try {
      const params = new URLSearchParams();
      params.set('scope', 'user');
      if (userId) params.set('userId', userId);
      if (userRole) params.set('role', userRole);
      if (companyId) params.set('companyId', companyId);
      
      const response = await fetch(`/api/layout/config?${params.toString()}`);
      if (!response.ok) {
        // Silently fail - don't throw error
        return null;
      }
      
      const data = await response.json();
      if (data.config) {
        return data.config as LayoutConfig;
      }
    } catch {
      // Silently fail
    }
    
    return null;
  }, [userId, userRole, companyId]);

  /**
   * Veritabanına kaydet
   */
  const saveToDatabase = useCallback(async (
    config: LayoutConfig,
    scope: 'user' | 'role' | 'company'
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/layout/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          scope,
          userId,
          role: userRole,
          companyId,
        }),
      });

      if (!response.ok) {
        const status = response.status || 0;
        const statusText = response.statusText || 'Unknown';
        let errorData: { error?: string; message?: string; details?: string } = {};
        let responseText = '';
        // Headers okunmuyor (kullanılmıyor)
        
        // Response body'yi okumayı dene
        try {
          // Clone et ve text olarak oku
          const clonedResponse = response.clone();
          responseText = await clonedResponse.text();
          
          // JSON'a parse et
          if (responseText && responseText.trim()) {
            try {
              errorData = JSON.parse(responseText);
            } catch {
              // JSON değilse, text'i direkt kullan
              errorData = { error: responseText };
            }
          } else {
            // Boş response
            errorData = { error: `HTTP ${status}: ${statusText}` };
          }
        } catch {
          // Response okuma hatası
          errorData = { error: `HTTP ${status}: ${statusText}` };
        }
        
        const errorMessage = errorData.error || errorData.message || errorData.details || `Failed to save layout config (${status} ${statusText})`;
        
        throw new Error(errorMessage);
      }

      return true;
    } catch {
      return false;
    }
  }, [userId, userRole, companyId]);

  /**
   * Layout yapılandırmasını yükle
   * Öncelik: DB > localStorage > default
   */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. İlk olarak localStorage'dan hızlıca yükle (ilk render için)
      const cachedConfig = loadFromLocalStorage();
      if (cachedConfig) {
        setConfig(cachedConfig);
      }

      // 2. Background'da DB'den yükle
      const dbConfig = await loadFromDatabase();
      
      if (dbConfig) {
        // DB'de farklı bir config varsa, onu kullan
        if (!cachedConfig || JSON.stringify(dbConfig) !== JSON.stringify(cachedConfig)) {
          setConfig(dbConfig);
          saveToLocalStorage(dbConfig);
        }
      } else if (!cachedConfig) {
        // Hiçbiri yoksa default kullan
        setConfig(DEFAULT_LAYOUT_CONFIG);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load layout config'));
      // Hata durumunda localStorage'dan yükle
      const cachedConfig = loadFromLocalStorage();
      if (cachedConfig) {
        setConfig(cachedConfig);
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromLocalStorage, loadFromDatabase, saveToLocalStorage]);

  /**
   * Layout yapılandırmasını kaydet
   */
  const saveConfig = useCallback(async (
    newConfig: LayoutConfig,
    scope: 'user' | 'role' | 'company' = 'user'
  ) => {
    try {
      // 1. Hemen localStorage'a kaydet (senkron)
      saveToLocalStorage(newConfig);
      setConfig(newConfig);

      // 2. Arka planda DB'ye kaydet (async)
      await saveToDatabase(newConfig, scope);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save layout config'));
      throw err;
    }
  }, [saveToLocalStorage, saveToDatabase]);

  // İlk yükleme - userId, userRole, companyId değişmediğinde tekrar çağırma
  const prevUserIdRef = useRef<string | undefined>(userId);
  const prevUserRoleRef = useRef<string | undefined>(userRole);
  const prevCompanyIdRef = useRef<string | undefined>(companyId);
  
  useEffect(() => {
    // User parametreleri değişmediyse loadConfig'i çağırma
    if (
      prevUserIdRef.current === userId &&
      prevUserRoleRef.current === userRole &&
      prevCompanyIdRef.current === companyId
    ) {
      return;
    }
    
    // User parametrelerini güncelle
    prevUserIdRef.current = userId;
    prevUserRoleRef.current = userRole;
    prevCompanyIdRef.current = companyId;
    
    // loadConfig'i çağır
    loadConfig();
  }, [userId, userRole, companyId, loadConfig]);

  return {
    config,
    setConfig,
    loading,
    error,
    loadConfig,
    saveConfig,
    loadFromLocalStorage,
    saveToLocalStorage,
    loadFromDatabase,
    saveToDatabase,
  };
}

