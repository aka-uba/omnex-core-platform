'use client';

import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import styles from './ToastNotification.module.css';

export interface ToastNotificationProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  onClose?: () => void;
}

export function ToastNotification({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
}: ToastNotificationProps) {
  const { t } = useTranslation('modules/notifications');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef(duration);

  useEffect(() => {
    if (duration === 0) return; // No auto-dismiss

    const updateProgress = () => {
      if (!isPaused && remainingTimeRef.current > 0) {
        remainingTimeRef.current -= 50; // Update every 50ms
        const newProgress = (remainingTimeRef.current / duration) * 100;
        setProgress(Math.max(0, newProgress));

        if (remainingTimeRef.current <= 0) {
          handleClose();
        }
      }
    };

    progressIntervalRef.current = setInterval(updateProgress, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [duration, isPaused]);

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    notifications.hide(id);
    onClose?.();
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconCheck size={20} />;
      case 'error':
        return <IconX size={20} />;
      case 'warning':
        return <IconAlertTriangle size={20} />;
      case 'info':
      default:
        return <IconInfoCircle size={20} />;
    }
  };

  const getColorClass = () => {
    return styles[`toast-${type}`];
  };

  return (
    <div
      className={`${styles.toast} ${getColorClass()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.toastContent}>
        <div className={styles.toastIcon}>{getIcon()}</div>
        <div className={styles.toastText}>
          <div className={styles.toastTitle}>{title}</div>
          {message && <div className={styles.toastMessage}>{message}</div>}
        </div>
        <button
          className={styles.toastClose}
          onClick={handleClose}
          aria-label={t('close')}
        >
          <IconX size={16} />
        </button>
      </div>
      {duration > 0 && (
        <div className={styles.toastProgress}>
          <div
            className={styles.toastProgressBar}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to show toast notifications
export function showToast({
  type,
  title,
  message,
  duration = 4000,
}: {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}) {
  const id = notifications.show({
    title,
    message,
    color: type === 'error' ? 'red' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'blue',
    icon: type === 'success' ? <IconCheck size={20} /> :
          type === 'error' ? <IconX size={20} /> :
          type === 'warning' ? <IconAlertTriangle size={20} /> :
          <IconInfoCircle size={20} />,
    autoClose: duration,
    withCloseButton: true,
    styles: {
      root: {
        backgroundColor: `var(--toast-${type}-bg)`,
        borderLeft: `4px solid var(--toast-${type}-border)`,
        color: `var(--toast-${type}-text)`,
      },
      title: {
        color: `var(--toast-${type}-text)`,
        fontWeight: 600,
      },
      description: {
        color: `var(--toast-${type}-text)`,
        opacity: 0.85,
      },
      icon: {
        color: `var(--toast-${type}-icon)`,
      },
      closeButton: {
        color: `var(--toast-${type}-text)`,
      },
    },
  });

  return id;
}



