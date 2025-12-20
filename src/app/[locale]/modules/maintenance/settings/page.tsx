'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function MaintenanceSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('maintenance');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
