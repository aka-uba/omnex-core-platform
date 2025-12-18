// useAccess Hook
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi

import { useAccess as useAccessFromProvider } from '../providers/AccessProvider';

/**
 * Hook to access permission system
 */
export function useAccess() {
  const { hasAccess, hasAnyAccess, hasAllAccess, isLoading, permissions, role, refreshPermissions } = useAccessFromProvider();

  /**
   * Render component conditionally based on access
   */
  const withAccess = <T,>(
    featureKey: string,
    component: React.ReactElement<T>,
    fallback?: React.ReactElement | null
  ): React.ReactElement | null => {
    if (hasAccess(featureKey)) {
      return component;
    }
    return fallback || null;
  };

  /**
   * Check if user can create entities
   */
  const canCreate = (entity?: string): boolean => {
    if (entity) {
      return hasAccess(`ui.button.create.${entity}`) || hasAccess('ui.button.create');
    }
    return hasAccess('ui.button.create');
  };

  /**
   * Check if user can edit entities
   */
  const canEdit = (entity?: string): boolean => {
    if (entity) {
      return hasAccess(`ui.button.edit.${entity}`) || hasAccess('ui.button.edit');
    }
    return hasAccess('ui.button.edit');
  };

  /**
   * Check if user can delete entities
   */
  const canDelete = (entity?: string): boolean => {
    if (entity) {
      return hasAccess(`ui.button.delete.${entity}`) || hasAccess('ui.button.delete');
    }
    return hasAccess('ui.button.delete');
  };

  /**
   * Check if user can export
   */
  const canExport = (format?: 'csv' | 'excel' | 'pdf' | 'word'): boolean => {
    if (format) {
      return hasAccess(`feature.export.${format}`);
    }
    return hasAnyAccess(['feature.export.csv', 'feature.export.excel', 'feature.export.pdf', 'feature.export.word']);
  };

  /**
   * Check if user can access a module
   */
  const canAccessModule = (module: string): boolean => {
    return hasAccess(`module.${module}`);
  };

  return {
    hasAccess,
    hasAnyAccess,
    hasAllAccess,
    withAccess,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canAccessModule,
    isLoading,
    permissions,
    role,
    refreshPermissions,
  };
}

