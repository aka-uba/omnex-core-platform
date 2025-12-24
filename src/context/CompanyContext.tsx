'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

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
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  currency: string;
  formatCurrency: (amount: number, locale?: string) => string;
}

const DEFAULT_CURRENCY = 'TRY';

const CURRENCY_LOCALES: Record<string, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchCompanyAndSettings = useCallback(async (force = false) => {
    // Skip if already fetched and not forced
    if (initialFetchDone && !force) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch company first (critical)
      try {
        const companyResponse = await fetchWithAuth('/api/company');
        if (companyResponse.ok) {
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
        }
      } catch (companyErr) {
        console.warn('Failed to fetch company:', companyErr);
      }

      // Fetch settings separately (non-critical, don't block)
      try {
        const settingsResponse = await fetchWithAuth('/api/general-settings');
        if (settingsResponse.ok) {
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
        }
      } catch (settingsErr) {
        console.warn('Failed to fetch settings:', settingsErr);
        // Don't set error - settings are optional
      }

      setInitialFetchDone(true);
    } catch (err) {
      console.warn('Failed to fetch company/settings:', err);
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  }, [initialFetchDone]);

  useEffect(() => {
    if (!initialFetchDone) {
      fetchCompanyAndSettings();
    }
  }, []);

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

  const refetch = useCallback(() => fetchCompanyAndSettings(true), [fetchCompanyAndSettings]);

  const contextValue = useMemo(
    () => ({
      company,
      settings,
      loading,
      error,
      refetch,
      currency,
      formatCurrency,
    }),
    [company, settings, loading, error, refetch, currency, formatCurrency]
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
