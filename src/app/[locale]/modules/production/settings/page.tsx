'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const productionModule: ModuleRecord = {
  id: '1',
  slug: 'production',
  name: 'Production & Product',
  version: '1.0.0',
  description: 'Comprehensive production and product management module with product management, BOM (Bill of Materials), production orders, and stock movement tracking',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function ProductionSettingsPage() {
  return <ModuleSettingsPage module={productionModule} />;
}






