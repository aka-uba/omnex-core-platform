'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCompanyBrandingPaths,
  DEFAULT_BRANDING_DIR,
  BRANDING_FILENAMES,
} from '@/lib/branding/config';

interface BrandingState {
  logo: string | null;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  pwaIcon: string | null;
  logoExists: boolean;
  logoLightExists: boolean;
  logoDarkExists: boolean;
  faviconExists: boolean;
  pwaIconExists: boolean;
  loading: boolean;
  error: string | null;
  companyId: string | null;
}

interface UseBrandingOptions {
  companyId?: string | null;
}

/**
 * useBranding Hook
 *
 * Bu hook, branding dosyalarının varlığını kontrol eder ve URL'lerini sağlar.
 * Firma bazlı dizinleri kontrol eder, yoksa varsayılan dizine fallback yapar.
 *
 * @param options.companyId - Firma ID (opsiyonel, yoksa varsayılan dizin kullanılır)
 */
export function useBranding(options?: UseBrandingOptions) {
  const companyId = options?.companyId || null;

  const [state, setState] = useState<BrandingState>({
    logo: null,
    logoLight: null,
    logoDark: null,
    favicon: null,
    pwaIcon: null,
    logoExists: false,
    logoLightExists: false,
    logoDarkExists: false,
    faviconExists: false,
    pwaIconExists: false,
    loading: true,
    error: null,
    companyId: null,
  });

  const checkFileExists = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Cache-busting ile dosya kontrolü
      const response = await fetch(`${url}?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Firma dizinini kontrol et, yoksa varsayılan dizine fallback yap
   */
  const checkWithFallback = useCallback(
    async (type: 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon'): Promise<{
      exists: boolean;
      url: string | null;
      isDefault: boolean;
    }> => {
      const filename = BRANDING_FILENAMES[type];

      // Firma dizinini kontrol et
      if (companyId) {
        const companyUrl = `/branding/${companyId}/${filename}`;
        const exists = await checkFileExists(companyUrl);
        if (exists) {
          return { exists: true, url: companyUrl, isDefault: false };
        }
      }

      // Varsayılan dizini kontrol et
      const defaultUrl = `${DEFAULT_BRANDING_DIR}/${filename}`;
      const defaultExists = await checkFileExists(defaultUrl);
      if (defaultExists) {
        return { exists: true, url: defaultUrl, isDefault: true };
      }

      return { exists: false, url: null, isDefault: false };
    },
    [companyId, checkFileExists]
  );

  const checkBranding = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Tüm dosyaları paralel kontrol et
      const [logo, logoLight, logoDark, favicon, pwaIcon] = await Promise.all([
        checkWithFallback('logo'),
        checkWithFallback('logoLight'),
        checkWithFallback('logoDark'),
        checkWithFallback('favicon'),
        checkWithFallback('pwaIcon'),
      ]);

      setState({
        logo: logo.url,
        logoLight: logoLight.url,
        logoDark: logoDark.url,
        favicon: favicon.url,
        pwaIcon: pwaIcon.url,
        logoExists: logo.exists,
        logoLightExists: logoLight.exists,
        logoDarkExists: logoDark.exists,
        faviconExists: favicon.exists,
        pwaIconExists: pwaIcon.exists,
        loading: false,
        error: null,
        companyId,
      });
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to check branding files',
      }));
    }
  }, [checkWithFallback, companyId]);

  useEffect(() => {
    checkBranding();
  }, [checkBranding]);

  const refetch = useCallback(() => {
    return checkBranding();
  }, [checkBranding]);

  return {
    ...state,
    refetch,
  };
}

/**
 * useBrandingUrl Hook
 *
 * Basit hook - sadece branding URL'lerini döner, varlık kontrolü yapmaz.
 * SSR uyumlu, çift render olmaz.
 *
 * @param companyId - Firma ID (opsiyonel, yoksa varsayılan dizin kullanılır)
 */
export function useBrandingUrl(companyId?: string | null) {
  const paths = getCompanyBrandingPaths(companyId);

  return {
    logo: paths.logo,
    logoLight: paths.logoLight,
    logoDark: paths.logoDark,
    favicon: paths.favicon,
    pwaIcon: paths.pwaIcon,
    directory: paths.directory,
  };
}
