'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const locationsModule: ModuleRecord = {
  id: '1',
  slug: 'locations',
  name: 'Locations',
  version: '1.0.0',
  description: 'Core location management module for managing locations, hierarchies, and geographic data',
  author: 'Omnex Team',
  category: 'core',
  status: 'active',
  path: '/modules/locations',
  metadata: {},
  settings: {},
  installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),
};

export default function LocationsSettingsPage() {
  return <ModuleSettingsPage module={locationsModule} />;
}





