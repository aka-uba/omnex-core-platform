'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function LocationsSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('locations');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
