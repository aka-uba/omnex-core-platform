'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function FileManagerSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('file-manager');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
