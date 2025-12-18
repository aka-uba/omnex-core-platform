'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const maintenanceModule: ModuleRecord = {
  id: '1',
  slug: 'maintenance',
  name: 'Maintenance',
  version: '1.0.0',
  description: 'Comprehensive maintenance management module with equipment tracking, scheduled maintenance, cost management, and analytics',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function MaintenanceSettingsPage() {
  return <ModuleSettingsPage module={maintenanceModule} />;
}






