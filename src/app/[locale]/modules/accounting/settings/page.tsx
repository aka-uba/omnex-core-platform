'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function AccountingSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('accounting');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
