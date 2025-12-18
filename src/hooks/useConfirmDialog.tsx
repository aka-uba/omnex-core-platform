'use client';

import { useState, useCallback } from 'react';
import { Modal, Button, Group, Text, Stack } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirmDialog() {
  const { t } = useTranslation('global');
  const [state, setState] = useState<ConfirmDialogState>({
    opened: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        opened: true,
        ...options,
        onConfirm: () => {
          setState((prev) => ({ ...prev, opened: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((prev) => ({ ...prev, opened: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const ConfirmDialog = useCallback(() => {
    return (
      <Modal
        opened={state.opened}
        onClose={state.onCancel}
        title={state.title || t('common.confirm')}
        centered
        size="sm"
      >
        <Stack>
          <Text>{state.message}</Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={state.onCancel}>
              {state.cancelLabel || t('common.cancel')}
            </Button>
            <Button
              color={state.confirmColor || 'red'}
              onClick={state.onConfirm}
              loading={state.loading || false}
            >
              {state.confirmLabel || t('common.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    );
  }, [state, t]);

  return { confirm, ConfirmDialog };
}
