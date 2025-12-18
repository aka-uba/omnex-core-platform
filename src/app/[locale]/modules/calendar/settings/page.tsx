'use client';

import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const calendarModule: ModuleRecord = {
  id: '1',
  slug: 'calendar',
  name: 'Calendar',
  version: '1.0.0',
  description: 'Event calendar and scheduling management - Create, manage and track events and appointments',
  author: 'Omnex Team',
  category: 'business',
  status: 'active', installedAt: new Date('2025-01-28'),
  updatedAt: new Date(),

  path: '',
  metadata: {},
  settings: {},};

export default function CalendarSettingsPage() {
  return <ModuleSettingsPage module={calendarModule} />;
}






