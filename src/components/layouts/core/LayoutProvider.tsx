/**
 * LayoutProvider
 * Ana layout context ve provider
 * Instant apply, local-first render, hibrit veri yönetimi
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { LayoutConfig, DEFAULT_LAYOUT_CONFIG, BREAKPOINTS, LayoutType } from './LayoutConfig';
import { useLayoutData } from '../hooks/useLayoutData';
import { useLayoutSync } from '../hooks/useLayoutSync';
import { LayoutResolver } from './LayoutResolver';
import { useTheme } from '@/context/ThemeContext';

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
  // LocalStorage'dan initial state oku (hydration flash'ı önlemek için)
  const [config, setConfigState] = useState<LayoutConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('omnex-layout-config-v2');
        if (cached) {
          return JSON.parse(cached) as LayoutConfig;
        }
      } catch {
        // Silently fail
      }
    }
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

  // İlk yükleme: Local-first render
  useEffect(() => {
    if (mounted) return;

    setMounted(true);

    // Background'da DB'den yükle ve çözümle
    if (userId) {
      LayoutResolver.loadAllConfigs({
        ...(userId ? { userId } : {}),
        ...(userRole ? { userRole } : {}),
        ...(companyId ? { companyId } : {}),
      }).then((configs) => {
        const resolved = LayoutResolver.resolve({
          ...(userId ? { userId } : {}),
          ...(userRole ? { userRole } : {}),
          ...(companyId ? { companyId } : {}),
          ...configs,
        });


        // Sadece localStorage boşsa DB'den yükle
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('omnex-layout-config-v2');
          if (!cached) {
            setConfigState(resolved.config);
            localStorage.setItem('omnex-layout-config-v2', JSON.stringify(resolved.config));
          }
        }
      });
    }
  }, [mounted, userId, userRole, companyId]);

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
    // Deep merge için helper - contentArea gibi nested objeleri düzgün merge et
    const deepMerge = (target: any, source: any): any => {
      if (!source) return target;
      if (typeof source !== 'object' || Array.isArray(source)) return source;

      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && key === 'contentArea') {
          // contentArea için özel deep merge
          result[key] = {
            ...target[key],
            ...source[key],
            padding: source[key].padding ? { ...target[key]?.padding, ...source[key].padding } : target[key]?.padding,
            margin: source[key].margin ? { ...target[key]?.margin, ...source[key].margin } : target[key]?.margin,
            width: source[key].width ? { ...target[key]?.width, ...source[key].width } : target[key]?.width,
            responsive: source[key].responsive ? {
              ...target[key]?.responsive,
              mobile: source[key].responsive?.mobile ? {
                ...target[key]?.responsive?.mobile,
                padding: source[key].responsive.mobile.padding ? { ...target[key]?.responsive?.mobile?.padding, ...source[key].responsive.mobile.padding } : target[key]?.responsive?.mobile?.padding,
              } : target[key]?.responsive?.mobile,
              tablet: source[key].responsive?.tablet ? {
                ...target[key]?.responsive?.tablet,
                padding: source[key].responsive.tablet.padding ? { ...target[key]?.responsive?.tablet?.padding, ...source[key].responsive.tablet.padding } : target[key]?.responsive?.tablet?.padding,
              } : target[key]?.responsive?.tablet,
            } : target[key]?.responsive,
          };
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };

    // Önce değişiklik olup olmadığını kontrol et
    const newConfig: LayoutConfig = deepMerge(config, changes) as LayoutConfig;

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
  const configKey = useMemo(() => {
    // Sadece önemli alanları karşılaştır, tüm config'i değil
    const key = `${config.layoutType}-${config.themeMode}-${config.direction}-${config.layoutSource}`;
    if (key !== configKeyRef.current) {
      configKeyRef.current = key;
    }
    return configKeyRef.current;
  }, [config.layoutType, config.themeMode, config.direction, config.layoutSource]);

  // Context value'yu memoize et - sadece gerçekten değişen değerlerde yeni referans oluştur
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
    config, // Direct reference - React will handle shallow comparison
    configKey, // Track key changes
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

