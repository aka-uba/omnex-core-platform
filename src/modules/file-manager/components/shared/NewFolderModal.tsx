import { useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { useFolders } from '../../hooks/useFiles';
import { IconFolder } from '@tabler/icons-react';

interface NewFolderModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (name: string, parentId: string | null) => void;
    loading?: boolean;
    currentFolderId?: string | null;
}

export function NewFolderModal({ opened, onClose, onSubmit, loading, currentFolderId }: NewFolderModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const { t: tGlobal } = useTranslation('global');
    const { data: folders = [], isLoading: foldersLoading } = useFolders();

    const form = useForm({
        initialValues: {
            name: '',
            parentId: currentFolderId || '',
        },
        validate: {
            name: (value) => {
                if (!value) return t('form.folderNameRequired');
                if (value.length < 1) return t('form.folderNameRequired');
                if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) return t('form.invalidFolderName');
                return null;
            },
        },
    });

    // Build folder options with path display
    const folderOptions = [
        { value: '', label: t('newFolder.rootFolder') },
        ...folders.map((folder) => ({
            value: folder.id,
            label: folder.path,
        })),
    ];

    const handleSubmit = () => {
        const validation = form.validate();
        if (!validation.hasErrors) {
            const parentId = form.values.parentId === '' ? null : form.values.parentId;
            onSubmit(form.values.name, parentId);
            form.reset();
            form.setFieldValue('parentId', currentFolderId || '');
        }
    };

    // Update form when modal opens or currentFolderId changes
    useEffect(() => {
        if (opened) {
            form.setFieldValue('parentId', currentFolderId || '');
        }
    }, [opened, currentFolderId]);

    // Reset form when modal opens/closes
    const handleClose = () => {
        form.reset();
        form.setFieldValue('parentId', currentFolderId || '');
        onClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title={t('newFolder.title')} size="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Select
                        label={t('newFolder.selectParent')}
                        placeholder={t('newFolder.selectParentPlaceholder')}
                        data={folderOptions}
                        leftSection={<IconFolder size={16} />}
                        {...form.getInputProps('parentId')}
                        disabled={foldersLoading}
                        searchable
                        clearable
                    />
                    <TextInput
                        label={t('form.folderName')}
                        placeholder={t('form.folderNamePlaceholder')}
                        required
                        {...form.getInputProps('name')}
                        data-autofocus
                    />
                </Stack>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={handleClose}>
                        {tGlobal('form.cancel')}
                    </Button>
                    <Button type="submit" loading={loading ?? false}>
                        {t('newFolder.create')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
