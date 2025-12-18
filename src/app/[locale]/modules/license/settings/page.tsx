'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const licenseModule: ModuleRecord = {
  id: '1',
  slug: 'license',
  name: 'License Service',
  version: '1.0.0',
  description: 'License package management and tenant license tracking system',
  author: 'Omnex Platform',
  category: 'system',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function LicenseSettingsPage() {
  return <ModuleSettingsPage module={licenseModule} />;
}






