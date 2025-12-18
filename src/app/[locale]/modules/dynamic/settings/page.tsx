'use client';

import { useParams } from 'next/navigation';
import { useModules } from '@/context/ModuleContext';
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';

export default function DynamicModuleSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { getModule } = useModules();
  
  const module = slug ? getModule(slug) : null;

  if (!module) {
    return null; // Will be handled by ModuleSettingsPage
  }

  return <ModuleSettingsPage module={module} />;
}
