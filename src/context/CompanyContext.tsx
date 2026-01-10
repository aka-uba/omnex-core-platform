'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { CURRENCY_LOCALES, DEFAULT_CURRENCY } from '@/lib/constants/currency';
import { getCompanyBrandingPaths, DEFAULT_BRANDING_DIR, BRANDING_FILENAMES } from '@/lib/branding/config';

interface CompanyData {
  id: string;
  name: string;
  logo: string | null;
  favicon: string | null;
  pwaIcon: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface BrandingUrls {
  logo: string | null;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  pwaIcon: string | null;
  isDefault: {
    logo: boolean;
    logoLight: boolean;
    logoDark: boolean;
    favicon: boolean;
    pwaIcon: boolean;
  };
}

interface GeneralSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: string;
}

interface CompanyContextType {
  company: CompanyData | null;
  settings: GeneralSettings | null;
  branding: BrandingUrls;
  brandingLoading: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchBranding: () => Promise<void>;
  currency: string;
  formatCurrency: (amount: number, locale?: string) => string;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const DEFAULT_BRANDING: BrandingUrls = {
  logo: null,
  logoLight: null,
  logoDark: null,
  favicon: null,
  pwaIcon: null,
  isDefault: {
    logo: false,
    logoLight: false,
    logoDark: false,
    favicon: false,
    pwaIcon: false,
  },
};

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [branding, setBranding] = useState<BrandingUrls>(DEFAULT_BRANDING);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const pathname = usePathname();

  // Skip fetching on auth pages (login, register, welcome)
  const isAuthPage = pathname?.includes('/login') ||
                     pathname?.includes('/register') ||
                     pathname?.includes('/welcome') ||
                     pathname?.includes('/auth/');

  const fetchCompanyAndSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch company and settings in parallel
      const [companyResponse, settingsResponse] = await Promise.all([
        fetchWithAuth('/api/company').catch(() => null),
        fetchWithAuth('/api/general-settings').catch(() => null),
      ]);

      // Process company response
      if (companyResponse?.ok) {
        try {
          const result = await companyResponse.json();
          if (result.success && result.data) {
            setCompany({
              id: result.data.id,
              name: result.data.name,
              logo: result.data.logo,
              favicon: result.data.favicon,
              pwaIcon: result.data.pwaIcon,
              industry: result.data.industry,
              website: result.data.website,
              phone: result.data.phone,
              email: result.data.email,
              address: result.data.address,
            });
          }
        } catch (e) {
          console.warn('Failed to parse company response:', e);
        }
      }

      // Process settings response
      if (settingsResponse?.ok) {
        try {
          const result = await settingsResponse.json();
          if (result.success && result.data) {
            setSettings({
              currency: result.data.currency || DEFAULT_CURRENCY,
              timezone: result.data.timezone || 'Europe/Istanbul',
              dateFormat: result.data.dateFormat || 'DD/MM/YYYY',
              timeFormat: result.data.timeFormat || '24',
              defaultLanguage: result.data.defaultLanguage || 'tr',
            });
          }
        } catch (e) {
          console.warn('Failed to parse settings response:', e);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch company/settings:', err);
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if a branding file exists at the given URL
   */
  const checkFileExists = useCallback(async (url: string): Promise<boolean> => {
    try {
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
   * Fetch branding URLs with fallback to default directory
   */
  const fetchBranding = useCallback(async (companyId: string | null) => {
    setBrandingLoading(true);

    try {
      const checkWithFallback = async (
        type: 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon'
      ): Promise<{ url: string | null; isDefault: boolean }> => {
        const filename = BRANDING_FILENAMES[type];

        // Check company directory first
        if (companyId) {
          const companyUrl = `/branding/${companyId}/${filename}`;
          const exists = await checkFileExists(companyUrl);
          if (exists) {
            return { url: companyUrl, isDefault: false };
          }
        }

        // Fallback to default directory
        const defaultUrl = `${DEFAULT_BRANDING_DIR}/${filename}`;
        const defaultExists = await checkFileExists(defaultUrl);
        if (defaultExists) {
          return { url: defaultUrl, isDefault: true };
        }

        return { url: null, isDefault: false };
      };

      const [logo, logoLight, logoDark, favicon, pwaIcon] = await Promise.all([
        checkWithFallback('logo'),
        checkWithFallback('logoLight'),
        checkWithFallback('logoDark'),
        checkWithFallback('favicon'),
        checkWithFallback('pwaIcon'),
      ]);

      setBranding({
        logo: logo.url,
        logoLight: logoLight.url,
        logoDark: logoDark.url,
        favicon: favicon.url,
        pwaIcon: pwaIcon.url,
        isDefault: {
          logo: logo.isDefault,
          logoLight: logoLight.isDefault,
          logoDark: logoDark.isDefault,
          favicon: favicon.isDefault,
          pwaIcon: pwaIcon.isDefault,
        },
      });
    } catch {
      // Keep default branding on error
    } finally {
      setBrandingLoading(false);
    }
  }, [checkFileExists]);

  useEffect(() => {
    // Skip fetching on auth pages - no need for company data there
    if (isAuthPage) {
      setLoading(false);
      setBrandingLoading(false);
      return;
    }

    // Only fetch once on mount (for non-auth pages)
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCompanyAndSettings();
    }
  }, [fetchCompanyAndSettings, isAuthPage]);

  // Fetch branding when company ID is available
  useEffect(() => {
    if (!isAuthPage && company?.id) {
      fetchBranding(company.id);
    } else if (!isAuthPage && !loading && !company) {
      // No company - use default branding
      fetchBranding(null);
    }
  }, [company?.id, isAuthPage, loading, fetchBranding]);

  const currency = settings?.currency || DEFAULT_CURRENCY;

  const formatCurrency = useCallback(
    (amount: number, locale?: string) => {
      const currencyCode = settings?.currency || DEFAULT_CURRENCY;
      const defaultLocale = CURRENCY_LOCALES[currencyCode] || 'tr-TR';
      return new Intl.NumberFormat(locale || defaultLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [settings?.currency]
  );

  const refetch = useCallback(() => fetchCompanyAndSettings(), [fetchCompanyAndSettings]);

  const refetchBranding = useCallback(async () => {
    await fetchBranding(company?.id || null);
  }, [fetchBranding, company?.id]);

  const contextValue = useMemo(
    () => ({
      company,
      settings,
      branding,
      brandingLoading,
      loading,
      error,
      refetch,
      refetchBranding,
      currency,
      formatCurrency,
    }),
    [company, settings, branding, brandingLoading, loading, error, refetch, refetchBranding, currency, formatCurrency]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
