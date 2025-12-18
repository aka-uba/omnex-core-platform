'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const fileManagerModule: ModuleRecord = {
  id: '1',
  slug: 'file-manager',
  name: 'Dosya Yöneticisi',
  version: '1.0.0',
  description: 'Gelişmiş dosya ve klasör yönetimi - Upload, organize, share ve manage files',
  author: 'Omnex',
  category: 'utility',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function FileManagerSettingsPage() {
  return <ModuleSettingsPage module={fileManagerModule} />;
}






