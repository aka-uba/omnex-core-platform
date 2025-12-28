'use client';

import { useState, useEffect } from 'react';
import type { CompanySettings } from './types';

// Default fallback settings - used only when API fails or during initial load
const DEFAULT_SETTINGS: CompanySettings = {
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  registrationNumber: '',
};

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/company');
        if (!response.ok) {
          throw new Error('Failed to fetch company settings');
        }
        const result = await response.json();

        if (result.data) {
          // Map API response to CompanySettings
          setSettings({
            name: result.data.name || '',
            logo: result.data.logo || result.data.logoFile || undefined,
            address: [
              result.data.address,
              result.data.city,
              result.data.state,
              result.data.postalCode,
              result.data.country,
            ].filter(Boolean).join(', ') || '',
            phone: result.data.phone || '',
            email: result.data.email || '',
            website: result.data.website || '',
            taxId: result.data.taxNumber || '',
            registrationNumber: result.data.registrationNumber || '',
          });
        }
      } catch (err: any) {
        console.warn('Failed to fetch company settings:', err);
        setError(err.message || 'Failed to fetch company settings');
        // Keep current settings on error
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { settings, loading, error };
}


