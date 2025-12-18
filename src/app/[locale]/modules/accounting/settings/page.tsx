'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const accountingModule: ModuleRecord = {
  id: '1',
  slug: 'accounting',
  name: 'Accounting',
  version: '1.0.0',
  description: 'Comprehensive accounting module with subscription management, invoice generation, payment tracking, and expense management with approval workflows',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},
};

export default function AccountingSettingsPage() {
  return <ModuleSettingsPage module={accountingModule} />;
}






