'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function HRSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('hr');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
