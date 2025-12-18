'use client';

// Access Control Provider
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AccessContextType {
  hasAccess: (featureKey: string) => boolean;
  hasAnyAccess: (featureKeys: string[]) => boolean;
  hasAllAccess: (featureKeys: string[]) => boolean;
  isLoading: boolean;
  permissions: string[];
  role: string;
  refreshPermissions: () => void;
}

export const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within AccessProvider');
  }
  return context;
}

interface AccessProviderProps {
  children: React.ReactNode;
  userId: string;
  role: string;
}

export function AccessProvider({ children, userId, role: initialRole }: AccessProviderProps) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>(initialRole);

  // Fetch user permissions
  const { data: userPermissions, isLoading, refetch } = useQuery<{
    permissions: string[];
    role: string;
    customPermissions: {
      granted: string[];
      denied: string[];
    };
  }>({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/permissions/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (userPermissions) {
      setPermissions(userPermissions.permissions);
      setRole(userPermissions.role);
    }
  }, [userPermissions]);

  // Check if user has access to a feature
  const hasAccess = useCallback(
    (featureKey: string): boolean => {
      // SuperAdmin has all permissions
      if (role === 'SuperAdmin') {
        return true;
      }

      // Check if permission is in the list
      if (permissions.includes(featureKey)) {
        return true;
      }

      // Check module-level permissions
      const parts = featureKey.split('.');
      if (parts.length >= 2) {
        const moduleKey = `${parts[0]}.${parts[1]}`;
        if (permissions.includes(moduleKey)) {
          return true;
        }
      }

      // Check wildcard permissions
      if (permissions.includes('*')) {
        return true;
      }

      return false;
    },
    [permissions, role]
  );

  // Check if user has any of the permissions
  const hasAnyAccess = useCallback(
    (featureKeys: string[]): boolean => {
      return featureKeys.some(key => hasAccess(key));
    },
    [hasAccess]
  );

  // Check if user has all of the permissions
  const hasAllAccess = useCallback(
    (featureKeys: string[]): boolean => {
      return featureKeys.every(key => hasAccess(key));
    },
    [hasAccess]
  );

  const refreshPermissions = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: AccessContextType = {
    hasAccess,
    hasAnyAccess,
    hasAllAccess,
    isLoading,
    permissions,
    role,
    refreshPermissions,
  };

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

