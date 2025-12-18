'use client';

import { Modal, Button, Text, Group } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

export interface AlertModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  size?: string;
}

export function AlertModal({
  opened,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'info',
  size = 'md',
}: AlertModalProps) {
  const { t } = useTranslation('global');
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <IconX size={24} />;
      case 'warning':
        return <IconAlertCircle size={24} />;
      case 'info':
      default:
        return <IconCheck size={24} />;
    }
  };

  const getConfirmColor = () => {
    switch (variant) {
      case 'danger':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          {getIcon()}
          <Text fw={600}>{title}</Text>
        </Group>
      }
      size={size}
      centered
    >
      <Text size="sm" mb="xl">
        {message}
      </Text>

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={handleCancel}>
          {cancelLabel || t('modal.confirm.cancel')}
        </Button>
        <Button color={getConfirmColor()} onClick={handleConfirm}>
          {confirmLabel || t('modal.confirm.confirm')}
        </Button>
      </Group>
    </Modal>
  );
}



