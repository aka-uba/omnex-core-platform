'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const hasFetched = useRef(false);

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

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCompanyAndSettings();
    }
  }, [fetchCompanyAndSettings]);

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
