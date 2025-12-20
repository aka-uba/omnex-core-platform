'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function RealEstateSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('real-estate');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
