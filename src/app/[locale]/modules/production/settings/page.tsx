'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function ProductionSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('production');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
