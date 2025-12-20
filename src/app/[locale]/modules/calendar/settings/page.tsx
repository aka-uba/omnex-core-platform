'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function CalendarSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('calendar');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
