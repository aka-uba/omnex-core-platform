'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

interface CompanyContextType {
  company: CompanyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth('/api/company');
      if (response.ok) {
        const result = await response.json();
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
      } else {
        setError('Failed to fetch company data');
      }
    } catch (err) {
      console.warn('Failed to fetch company:', err);
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return (
    <CompanyContext.Provider value={{ company, loading, error, refetch: fetchCompany }}>
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
