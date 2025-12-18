/**
 * useModule Hook
 * Hook for accessing individual module functionality
 */

import { useModules } from '@/context/ModuleContext';

export function useModule(slug: string) {
  const { activateModule, deactivateModule, uninstallModule, getModule } = useModules();
  
  const module = getModule(slug);
  
  return {
    module,
    isActive: module?.status === 'active',
    isInstalled: !!module,
    activate: () => activateModule(slug),
    deactivate: () => deactivateModule(slug),
    uninstall: () => uninstallModule(slug),
  };
}






