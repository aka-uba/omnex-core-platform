import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface CreateFolderModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (folderName: string) => Promise<void>;
    loading: boolean;
}

export function CreateFolderModal({ opened, onClose, onSubmit, loading }: CreateFolderModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const form = useForm({
        initialValues: {
            folderName: '',
        },
        validate: {
            folderName: (value) => (value.length < 1 ? t('form.folderNameRequired') : null),
        },
    });

    useEffect(() => {
        if (opened) {
            form.reset();
        }
    }, [opened]);

    const handleSubmit = async (values: { folderName: string }) => {
        await onSubmit(values.folderName);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('newFolder.title')} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label={t('form.folderName')}
                        placeholder={t('form.folderNamePlaceholder')}
                        data-autofocus
                        {...form.getInputProps('folderName')}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>{t('form.cancel')}</Button>
                        <Button type="submit" loading={loading}>{t('newFolder.create')}</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
