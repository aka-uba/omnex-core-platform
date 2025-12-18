'use client';

import { useState, useEffect } from 'react';
import type { CompanySettings } from './types';

// Placeholder company settings - will be replaced with API call when settings page is ready
const PLACEHOLDER_SETTINGS: CompanySettings = {
  name: 'Omnex-Core',
  address: '123 Business Street, City, Country',
  phone: '+1 (555) 123-4567',
  email: 'info@omnex-core.com',
  website: 'www.omnex-core.com',
  taxId: 'TAX-123456',
  registrationNumber: 'REG-789012',
};

export function useCompanySettings() {
  const [settings] = useState<CompanySettings>(PLACEHOLDER_SETTINGS);
  const [loading] = useState(false);

  useEffect(() => {
    // TODO: Replace with actual API call when settings page is ready
    // const fetchSettings = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await fetch('/api/settings/company');
    //     const data = await response.json();
    //     setSettings(data);
    //   } catch (error) {
    //     setSettings(PLACEHOLDER_SETTINGS);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchSettings();
  }, []);

  return { settings, loading };
}


