'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function RaporlarSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('raporlar');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
