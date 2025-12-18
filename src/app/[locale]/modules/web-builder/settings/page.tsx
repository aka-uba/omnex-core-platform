'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const webBuilderModule: ModuleRecord = {
  id: '1',
  slug: 'web-builder',
  name: 'Web Builder',
  version: '1.0.0',
  description: 'Drag & drop website builder module - Create beautiful websites without coding',
  author: 'Omnex',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function WebBuilderSettingsPage() {
  return <ModuleSettingsPage module={webBuilderModule} />;
}






