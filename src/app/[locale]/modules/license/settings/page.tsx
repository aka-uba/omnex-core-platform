'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function LicenseSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('license');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
