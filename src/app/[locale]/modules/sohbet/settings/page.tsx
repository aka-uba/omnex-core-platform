'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const sohbetModule: ModuleRecord = {
  id: '1',
  slug: 'sohbet',
  name: 'Sohbet Modülü',
  version: '1.0.0',
  description: 'Gerçek zamanlı sohbet ve mesajlaşma modülü - Chat rooms, direct messages, and group conversations',
  author: 'Omnex',
  category: 'communication',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function SohbetSettingsPage() {
  return <ModuleSettingsPage module={sohbetModule} />;
}






