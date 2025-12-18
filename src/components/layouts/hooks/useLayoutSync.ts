/**
 * useLayoutSync Hook
 * Debounced database synchronization
 * Layout config değişikliklerini debounce ederek DB'ye kaydeder
 */

import { useEffect, useRef } from 'react';
import { LayoutConfig } from '../core/LayoutConfig';

interface UseLayoutSyncOptions {
  config: LayoutConfig;
  scope: 'user' | 'role' | 'company';
  userId?: string;
  userRole?: string;
  companyId?: string;
  debounceMs?: number;
  enabled?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 500;

export function useLayoutSync(options: UseLayoutSyncOptions) {
  const {
    config,
    scope,
    userId,
    userRole,
    companyId,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enabled = true,
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !userId) return;

    // Config değişikliğini string'e çevir (TÜM config, sadece önemli alanlar değil)
    const configString = JSON.stringify(config);

    // Eğer değişiklik yoksa, kaydetme
    if (configString === lastSavedRef.current) {
      return;
    }

    // Önceki timeout'u temizle
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Yeni timeout oluştur
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/layout/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config,
            scope,
            userId,
            role: userRole,
            companyId,
          }),
        });

        if (response.ok) {
          lastSavedRef.current = configString;
        } else {
          // Silently fail - don't update lastSavedRef to allow retry on next change
        }
      } catch (error) {
        // Silently fail
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config, scope, userId, userRole, companyId, debounceMs, enabled]);

  // Component unmount olduğunda pending kayıtları temizle
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}

