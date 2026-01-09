/**
 * LayoutProvider
 * Ana layout context ve provider
 * Instant apply, local-first render, hibrit veri yönetimi
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { LayoutConfig, DEFAULT_LAYOUT_CONFIG, BREAKPOINTS, LayoutType, STORAGE_KEYS } from './LayoutConfig';
import { useLayoutData } from '../hooks/useLayoutData';
import { useLayoutSync } from '../hooks/useLayoutSync';
import { useTheme } from '@/context/ThemeContext';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface LayoutContextType {
  // Mevcut layout
  currentLayout: LayoutType;

  // Yapılandırma
  config: LayoutConfig;
  setConfig: (config: LayoutConfig) => void;

  // Anlık değişiklik uygulama
  applyChanges: (changes: Partial<LayoutConfig>) => void;

  // Veri yönetimi
  loadConfig: () => Promise<void>;
  saveConfig: (scope: 'user' | 'role' | 'company') => Promise<void>;

  // Loading states
  loading: boolean;
  error: Error | null;

  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  userId?: string;
  userRole?: string;
  companyId?: string;
}

export function LayoutProvider({ children, userId, userRole, companyId }: LayoutProviderProps) {
  // Responsive breakpoints
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  const { setColorScheme } = useMantineColorScheme();
  const { setThemeMode: setOldThemeMode } = useTheme(); // Eski ThemeContext ile senkronize et

  // setOldThemeMode'u stabilize et - applyChanges'ın dependency'sinden çıkarmak için
  const setOldThemeModeRef = useRef(setOldThemeMode);
  useEffect(() => {
    setOldThemeModeRef.current = setOldThemeMode;
  }, [setOldThemeMode]);

  // Render sayacı (debug için)
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Hibrit veri yönetimi
  const {
    // config: loadedConfig, // removed - unused
    // setConfig: setLoadedConfig, // removed - unused
    loading,
    error,
    loadConfig,
    saveConfig: saveConfigToStorage,
  } = useLayoutData({
    ...(userId ? { userId } : {}),
    ...(userRole ? { userRole } : {}),
    ...(companyId ? { companyId } : {}),
  });

  // Local state (instant updates için)
  // Öncelik: 1. Kullanıcı config (localStorage) 2. Company defaults 3. Sistem varsayılanları
  const [config, setConfigState] = useState<LayoutConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Kullanıcının kendi ayarları varsa onu kullan
        const userConfig = localStorage.getItem(STORAGE_KEYS.layoutConfig);
        if (userConfig) {
          return JSON.parse(userConfig) as LayoutConfig;
        }

        // 2. Admin tarafından belirlenen firma varsayılanları
        const companyDefaultsStr = localStorage.getItem(STORAGE_KEYS.companyDefaults);
        if (companyDefaultsStr) {
          return JSON.parse(companyDefaultsStr) as LayoutConfig;
        }
      } catch {
        // Silently fail
      }
    }
    // 3. Sistem varsayılanları
    return DEFAULT_LAYOUT_CONFIG;
  });
  const [mounted, setMounted] = useState(false);

  // Debounced DB sync - only sync when config actually changes
  useLayoutSync({
    config,
    scope: (config.layoutSource === 'default' ? 'user' : config.layoutSource) || 'user',
    ...(userId ? { userId } : {}),
    ...(userRole ? { userRole } : {}),
    ...(companyId ? { companyId } : {}),
    enabled: mounted && !!userId,
    debounceMs: 2000, // Increase debounce to reduce API calls
  });

  // Mount effect - sadece bir kez çalışır
  useEffect(() => {
    setMounted(true);
  }, []);

  // Company defaults veya user config değiştiğinde dinle (başka tab'dan veya kullanıcı tercihlerinden)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // User layout config değiştiğinde güncelle (tercihler sayfasından)
      if (e.key === STORAGE_KEYS.layoutConfig && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue) as LayoutConfig;
          setConfigState(newConfig);
        } catch {
          // Silently fail
        }
      }

      // Company defaults değiştiğinde ve kullanıcının kendi config'i yoksa güncelle
      if (e.key === STORAGE_KEYS.companyDefaults && e.newValue) {
        const hasUserConfig = !!localStorage.getItem(STORAGE_KEYS.layoutConfig);
        if (!hasUserConfig) {
          try {
            const newDefaults = JSON.parse(e.newValue) as LayoutConfig;
            setConfigState(newDefaults);
          } catch {
            // Silently fail
          }
        }
      }
    };

    // Custom event dinle - aynı pencere içinde layout değişiklikleri için
    const handleLayoutConfigUpdate = () => {
      try {
        const layoutConfig = localStorage.getItem(STORAGE_KEYS.layoutConfig);
        if (layoutConfig) {
          const newConfig = JSON.parse(layoutConfig) as LayoutConfig;
          setConfigState(newConfig);
        }
      } catch {
        // Silently fail
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('layout-config-updated', handleLayoutConfigUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('layout-config-updated', handleLayoutConfigUpdate);
    };
  }, []);

  // localStorage'da company defaults yoksa DB'den çek (diğer tarayıcılar için)
  const hasLoadedCompanyDefaultsRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!companyId) return;
    if (hasLoadedCompanyDefaultsRef.current) return;

    // Kullanıcının kendi config'i varsa DB'den çekmeye gerek yok
    const hasUserConfig = !!localStorage.getItem(STORAGE_KEYS.layoutConfig);
    if (hasUserConfig) return;

    // localStorage'da company defaults varsa DB'den çekmeye gerek yok
    const hasCompanyDefaults = !!localStorage.getItem(STORAGE_KEYS.companyDefaults);
    if (hasCompanyDefaults) return;

    hasLoadedCompanyDefaultsRef.current = true;

    // DB'den company defaults'u çek
    fetchWithAuth(`/api/layout/config?scope=company&companyId=${companyId}`)
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const companyConfig = data.data?.config;
        if (companyConfig) {
          // localStorage'a kaydet ve state'i güncelle
          localStorage.setItem(STORAGE_KEYS.companyDefaults, JSON.stringify(companyConfig));
          setConfigState(companyConfig);
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [companyId]);

  // Loaded config değiştiğinde state'i güncelle - DISABLED
  // LocalStorage artık öncelikli olduğu için bu useEffect gerekli değil
  // DB'den gelen config localStorage'ı override etmesin
  /*
  const prevLoadedConfigRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedConfig) {
      const loadedKey = JSON.stringify({
        layoutType: loadedConfig.layoutType,
        themeMode: loadedConfig.themeMode,
        direction: loadedConfig.direction,
        layoutSource: loadedConfig.layoutSource,
      });

      // Önceki değerle aynıysa işlem yapma
      if (prevLoadedConfigRef.current === loadedKey) {
        return;
      }

      const currentKey = JSON.stringify({
        layoutType: config.layoutType,
        themeMode: config.themeMode,
        direction: config.direction,
        layoutSource: config.layoutSource,
      });

      // Sadece önemli alanlar değiştiyse güncelle
      if (loadedKey !== currentKey) {
        prevLoadedConfigRef.current = loadedKey;
        setConfigState(loadedConfig);
      } else {
        prevLoadedConfigRef.current = loadedKey;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedConfig]);
  */

// Direction artık sadece locale'e göre belirleniyor (layout.tsx'te)
  // Sidebar konumu ayrı bir ayar (sidebar.position)

  // Theme mode'u Mantine'e, HTML'e ve eski ThemeContext'e uygula
  // setColorScheme ve setOldThemeMode'u dependency'den çıkar - sadece config.themeMode değiştiğinde çalışsın
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (!mounted) return undefined; // Config yüklenene kadar bekle

    let actualColorScheme: 'light' | 'dark';

    if (config.themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      // Tarayıcı tercihini kontrol et - matches true ise dark, false ise light
      // ÖNEMLİ: matches true = kullanıcı dark tercih ediyor, false = light tercih ediyor
      actualColorScheme = mediaQuery.matches ? 'dark' : 'light';

      // Mevcut değerle karşılaştır, aynıysa işlem yapma
      const currentScheme = document.documentElement.getAttribute('data-mantine-color-scheme');
      const hasDarkClass = document.documentElement.classList.contains('dark');

      if (currentScheme !== actualColorScheme || (actualColorScheme === 'dark' && !hasDarkClass) || (actualColorScheme === 'light' && hasDarkClass)) {
        // Mantine'e uygula
        setColorScheme(actualColorScheme);

        // HTML'e direkt uygula (Mantine'in yapmasını beklemeden)
        document.documentElement.setAttribute('data-mantine-color-scheme', actualColorScheme);

        // Tailwind dark mode için class ekle/çıkar
        if (actualColorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Eski ThemeContext'e de senkronize et (MantineThemeWrapper için)
      setOldThemeModeRef.current('auto');

      const handler = (e: MediaQueryListEvent) => {
        // Tarayıcı tercihi değiştiğinde güncelle
        const newScheme = e.matches ? 'dark' : 'light';
        const currentScheme = document.documentElement.getAttribute('data-mantine-color-scheme');

        if (currentScheme !== newScheme) {
          setColorScheme(newScheme);
          document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);

          // Tailwind dark mode için class ekle/çıkar
          if (newScheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    } else {
      actualColorScheme = config.themeMode;

      // Mevcut değerle karşılaştır, aynıysa işlem yapma
      const currentScheme = document.documentElement.getAttribute('data-mantine-color-scheme');
      const hasDarkClass = document.documentElement.classList.contains('dark');

      if (currentScheme !== actualColorScheme || (actualColorScheme === 'dark' && !hasDarkClass) || (actualColorScheme === 'light' && hasDarkClass)) {
        // Mantine'e uygula
        setColorScheme(actualColorScheme);

        // HTML'e direkt uygula (Mantine'in yapmasını beklemeden)
        document.documentElement.setAttribute('data-mantine-color-scheme', actualColorScheme);

        // Tailwind dark mode için class ekle/çıkar
        if (actualColorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Eski ThemeContext'e de senkronize et (MantineThemeWrapper için)
      setOldThemeModeRef.current(actualColorScheme);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.themeMode, mounted]); // setColorScheme ve setOldThemeMode'u dependency'den çıkardık, mounted eklendi

  // Responsive layout belirleme
  const currentLayout: LayoutType = isMobile ? 'mobile' : config.layoutType;

  /**
   * Anlık değişiklik uygulama
   * 1. State'i güncelle → render
   * 2. localStorage'a hemen yaz
   * 3. useLayoutSync debounced DB kaydını tetikler
   * 4. Eski ThemeContext'e senkronize et (themeMode için)
   */
  const applyChanges = useCallback((changes: Partial<LayoutConfig>) => {
    // Tam config mi yoksa partial update mi kontrol et
    const isFullConfig = changes.layoutType !== undefined &&
                         changes.themeMode !== undefined &&
                         changes.sidebar !== undefined &&
                         changes.top !== undefined;

    let newConfig: LayoutConfig;

    if (isFullConfig) {
      // Tam config geçirildi (reset veya varsayılan yükleme) - direkt replace et
      newConfig = changes as LayoutConfig;
    } else {
      // Partial update - mevcut config ile merge et
      const mergedContentArea = changes.contentArea && config.contentArea ? {
        ...config.contentArea,
        ...changes.contentArea,
        padding: { ...config.contentArea.padding, ...changes.contentArea.padding },
        margin: { ...config.contentArea.margin, ...changes.contentArea.margin },
        width: { ...config.contentArea.width, ...changes.contentArea.width },
        responsive: {
          ...config.contentArea.responsive,
          ...changes.contentArea.responsive,
        },
      } : (changes.contentArea || config.contentArea);

      newConfig = {
        ...config,
        ...changes,
        // Nested objeler için shallow merge
        sidebar: changes.sidebar ? { ...config.sidebar, ...changes.sidebar } : config.sidebar,
        top: changes.top ? { ...config.top, ...changes.top } : config.top,
        mobile: changes.mobile ? { ...config.mobile, ...changes.mobile } : config.mobile,
        contentArea: mergedContentArea,
      };
    }

    // Config değişikliğini kontrol et - aynıysa güncelleme yapma
    const currentConfigStr = JSON.stringify(config);
    const newConfigStr = JSON.stringify(newConfig);

    if (currentConfigStr === newConfigStr) {
      // Değişiklik yok, işlem yapma
      return;
    }

    // 1. State'i anında güncelle → render
    setConfigState(newConfig);

    // 2. localStorage'a hemen yaz (senkron)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('omnex-layout-config-v2', JSON.stringify(newConfig));
        localStorage.setItem('omnex-layout-config-timestamp', Date.now().toString());
      } catch {
        // Silently fail
      }
    }

    // 4. Eski ThemeContext'e senkronize et (themeMode değiştiyse)
    if (changes.themeMode !== undefined) {
      setOldThemeModeRef.current(changes.themeMode);
    }

    // 3. useLayoutSync hook'u debounced DB kaydını tetikler
  }, [config]); // setOldThemeMode'u dependency'den çıkardık, useRef kullanıyoruz

  /**
   * Config setter (tam config değiştirme)
   */
  const setConfig = useCallback((newConfig: LayoutConfig) => {
    applyChanges(newConfig);
  }, [applyChanges]);

  /**
   * Config kaydetme (scope belirterek)
   */
  const saveConfig = useCallback(async (scope: 'user' | 'role' | 'company') => {
    await saveConfigToStorage(config, scope);
  }, [config, saveConfigToStorage]);

  // Config değişikliklerini track et (JSON.stringify yerine daha hafif)
  const configKeyRef = useRef<string>('');
  useMemo(() => {
    // Sadece önemli alanları karşılaştır, tüm config'i değil
    const key = `${config.layoutType}-${config.themeMode}-${config.direction}-${config.layoutSource}`;
    if (key !== configKeyRef.current) {
      configKeyRef.current = key;
    }
    return configKeyRef.current;
  }, [config.layoutType, config.themeMode, config.direction, config.layoutSource]);

  // Context value'yu memoize et - sadece gerçekten değişen değerlerde yeni referans oluştur
  // Gereksiz re-render'ları önlemek için sadece gerekli dependency'ler
  const value: LayoutContextType = useMemo(() => {
    return {
      currentLayout,
      config,
      setConfig,
      applyChanges,
      loadConfig,
      saveConfig,
      loading,
      error,
      isMobile,
      isTablet,
      isDesktop,
    };
  }, [
    currentLayout,
    config,
    setConfig,
    applyChanges,
    loadConfig,
    saveConfig,
    loading,
    error,
    isMobile,
    isTablet,
    isDesktop,
  ]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

