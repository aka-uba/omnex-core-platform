'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const notificationsModule: ModuleRecord = {
  id: '1',
  slug: 'notifications',
  name: 'Notifications',
  version: '1.0.0',
  description: 'System-wide notifications management - Create, manage and track all notifications',
  author: 'Omnex Team',
  category: 'system',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function NotificationsSettingsPage() {
  return <ModuleSettingsPage module={notificationsModule} />;
}






