import { Modal, Button, Group, Text, Stack } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';

interface DeleteConfirmModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    loading: boolean;
    itemName: string;
}

export function DeleteConfirmModal({ opened, onClose, onConfirm, loading, itemName }: DeleteConfirmModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const confirmText = t('delete.confirm').replace('{name}', itemName);
    return (
        <Modal opened={opened} onClose={onClose} title={t('delete.title')} centered>
            <Stack>
                <Text>{confirmText}</Text>
                <Text size="sm" c="dimmed">{t('delete.cannotUndo')}</Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>{t('form.cancel')}</Button>
                    <Button color="red" onClick={onConfirm} loading={loading}>{t('delete.button')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
