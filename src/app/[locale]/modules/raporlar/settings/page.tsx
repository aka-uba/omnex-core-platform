'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const raporlarModule: ModuleRecord = {
  id: '1',
  slug: 'raporlar',
  name: 'Raporlar Modülü',
  version: '1.0.0',
  description: 'Sistem ve kullanıcı raporlarını oluşturma, görüntüleme ve export etme modülü',
  author: 'Omnex',
  category: 'analytics',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function RaporlarSettingsPage() {
  return <ModuleSettingsPage module={raporlarModule} />;
}






