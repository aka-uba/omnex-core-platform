import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface RenameModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (newName: string) => Promise<void>;
    loading: boolean;
    currentName: string;
}

export function RenameModal({ opened, onClose, onSubmit, loading, currentName }: RenameModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const form = useForm({
        initialValues: {
            newName: '',
        },
        validate: {
            newName: (value) => (value.length < 1 ? t('form.nameRequired') : null),
        },
    });

    useEffect(() => {
        if (opened) {
            form.setValues({ newName: currentName });
        }
    }, [opened, currentName]);

    const handleSubmit = async (values: { newName: string }) => {
        await onSubmit(values.newName);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('rename.title')} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label={t('form.newName')}
                        placeholder={t('form.newNamePlaceholder')}
                        data-autofocus
                        {...form.getInputProps('newName')}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>{t('form.cancel')}</Button>
                        <Button type="submit" loading={loading}>{t('rename.button')}</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
