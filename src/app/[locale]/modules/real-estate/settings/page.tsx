'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

// This would typically be fetched from the database or module registry
const realEstateModule: ModuleRecord = {
  id: '1',
  slug: 'real-estate',
  name: 'Real Estate',
  version: '1.0.0',
  description: 'Comprehensive real estate management module with property, apartment, tenant, contract, payment, appointment, and email automation features',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function RealEstateSettingsPage() {
  return <ModuleSettingsPage module={realEstateModule} />;
}


