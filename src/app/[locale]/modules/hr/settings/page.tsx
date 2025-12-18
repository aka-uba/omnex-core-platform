'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const hrModule: ModuleRecord = {
  id: '1',
  slug: 'hr',
  name: 'Human Resources',
  version: '1.0.0',
  description: 'Employee management, leave tracking, and payroll system',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function HRSettingsPage() {
  return <ModuleSettingsPage module={hrModule} />;
}






