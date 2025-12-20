'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function WebBuilderSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('web-builder');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
