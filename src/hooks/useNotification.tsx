'use client';

import { useCallback } from 'react';

import { modals } from '@mantine/modals';
import { showToast } from '@/modules/notifications/components/ToastNotification';

export function useNotification() {
  const showSuccess = useCallback((title: string, message: string) => {
    showToast({
      type: 'success',
      title,
      message,
    });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    showToast({
      type: 'error',
      title,
      message,
    });
  }, []);

  const showWarning = useCallback((title: string, message: string) => {
    showToast({
      type: 'warning',
      title,
      message,
    });
  }, []);

  const showInfo = useCallback((title: string, message: string) => {
    showToast({
      type: 'info',
      title,
      message,
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    modals.openConfirmModal({
      title,
      children: message,
      labels: { confirm: 'Onayla', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm,
      size: 'md',
      centered: true,
      zIndex: 1200,
      styles: {
        content: {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
        },
        header: {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderBottomColor: 'var(--border-color)',
        },
        body: {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
        },
        title: {
          color: 'var(--text-primary)',
          fontSize: 'var(--mantine-font-size-lg)',
          fontWeight: 600,
        },
      },
    });
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}



