'use client';

import { useCallback } from 'react';

import { modals } from '@mantine/modals';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';

export function useNotification() {
  const { t } = useTranslation('global');

  // Geriye uyumlu API - tek parametre verilirse mesaj, iki parametre verilirse eski title göz ardı edilir
  // Yeni kullanım: showSuccess('Mesaj')
  // Eski kullanım: showSuccess('Başlık', 'Mesaj') - hala çalışır, başlık merkezi çeviriden gelir
  const showSuccess = useCallback((messageOrTitle: string, message?: string) => {
    showToast({
      type: 'success',
      title: t('notifications.success.title'),
      message: message || messageOrTitle,
    });
  }, [t]);

  const showError = useCallback((messageOrTitle: string, message?: string) => {
    showToast({
      type: 'error',
      title: t('notifications.error.title'),
      message: message || messageOrTitle,
    });
  }, [t]);

  const showWarning = useCallback((messageOrTitle: string, message?: string) => {
    showToast({
      type: 'warning',
      title: t('notifications.warning.title'),
      message: message || messageOrTitle,
    });
  }, [t]);

  const showInfo = useCallback((messageOrTitle: string, message?: string) => {
    showToast({
      type: 'info',
      title: t('notifications.info.title'),
      message: message || messageOrTitle,
    });
  }, [t]);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    modals.openConfirmModal({
      title,
      children: message,
      labels: { confirm: t('common.actions.confirm'), cancel: t('common.actions.cancel') },
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
  }, [t]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}
