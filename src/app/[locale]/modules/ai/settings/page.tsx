'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const aiModule: ModuleRecord = {
  id: '1',
  slug: 'ai',
  name: 'AI Modülü',
  version: '1.0.0',
  description: 'Yapay zeka içerik üretim modülü - Metin, görsel, ses, video ve kod üretimi',
  author: 'Omnex Team',
  category: 'ai',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function AISettingsPage() {
  return <ModuleSettingsPage module={aiModule} />;
}






