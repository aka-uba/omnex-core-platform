'use client';

import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function NotificationsSettingsPage() {
  const { getModule } = useModules();
  const module = getModule('notifications');

  if (!module) {
    return null;
  }

  return <ModuleSettingsPage module={module} />;
}
