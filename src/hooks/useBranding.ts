'use client';

import { useState, useEffect, useCallback } from 'react';
import { BRANDING_PATHS } from '@/lib/branding/config';

interface BrandingState {
  logo: string | null;
  favicon: string | null;
  pwaIcon: string | null;
  logoExists: boolean;
  faviconExists: boolean;
  pwaIconExists: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * useBranding Hook
 *
 * Bu hook, branding dosyalarının varlığını kontrol eder ve URL'lerini sağlar.
 * API'den veri beklemek yerine dosya sisteminden okur, böylece çift render olmaz.
 */
export function useBranding() {
  const [state, setState] = useState<BrandingState>({
    logo: null,
    favicon: null,
    pwaIcon: null,
    logoExists: false,
    faviconExists: false,
    pwaIconExists: false,
    loading: true,
    error: null,
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

  const checkBranding = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Tüm dosyaları paralel kontrol et
      const [logoExists, faviconExists, pwaIconExists] = await Promise.all([
        checkFileExists(BRANDING_PATHS.logo),
        checkFileExists(BRANDING_PATHS.favicon),
        checkFileExists(BRANDING_PATHS.pwaIcon),
      ]);

      setState({
        logo: logoExists ? BRANDING_PATHS.logo : null,
        favicon: faviconExists ? BRANDING_PATHS.favicon : null,
        pwaIcon: pwaIconExists ? BRANDING_PATHS.pwaIcon : null,
        logoExists,
        faviconExists,
        pwaIconExists,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to check branding files',
      }));
    }
  }, [checkFileExists]);

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
 */
export function useBrandingUrl() {
  return {
    logo: BRANDING_PATHS.logo,
    favicon: BRANDING_PATHS.favicon,
    pwaIcon: BRANDING_PATHS.pwaIcon,
  };
}
