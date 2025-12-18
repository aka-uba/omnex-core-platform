import { Modal, TextInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { useEffect } from 'react';

interface RenameModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (newName: string) => void;
    currentName: string;
    loading?: boolean;
}

export function RenameModal({ opened, onClose, onSubmit, currentName, loading }: RenameModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const { t: tGlobal } = useTranslation('global');

    const form = useForm({
        initialValues: {
            name: currentName,
        },
        validate: {
            name: (value) => {
                if (!value) return t('form.nameRequired');
                if (value.length < 1) return t('form.nameRequired');
                return null;
            },
        },
    });

    useEffect(() => {
        if (opened) {
            form.setFieldValue('name', currentName);
        }
    }, [opened, currentName]);

    const handleSubmit = () => {
        const validation = form.validate();
        if (!validation.hasErrors) {
            onSubmit(form.values.name);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('rename.title')} size="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label={t('form.newName')}
                    placeholder={t('form.newNamePlaceholder')}
                    required
                    {...form.getInputProps('name')}
                    data-autofocus
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>
                        {tGlobal('form.cancel')}
                    </Button>
                    <Button type="submit" loading={loading ?? false}>
                        {t('rename.button')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
