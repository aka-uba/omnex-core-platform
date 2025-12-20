'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function SohbetSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('sohbet');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
