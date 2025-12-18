import { Modal, Button, Group, Stack, Text, TextInput, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useState, useEffect } from 'react';

interface ShareModalProps {
    opened: boolean;
    onClose: () => void;
    itemName: string;
    itemPath: string;
}

export function ShareModal({ opened, onClose, itemName, itemPath }: ShareModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const [shareLink, setShareLink] = useState('');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Generate a mock link for now. In real app, this might generate a signed URL or public link.
            // For now, let's assume it's a direct download link if authenticated, or just a path reference.
            // Let's create a dummy public link format.
            setShareLink(`${window.location.origin}/api/file-manager/download?path=${encodeURIComponent(itemPath)}`);
        }
    }, [itemPath]);

    return (
        <Modal opened={opened} onClose={onClose} title={t('share.modalTitle')} centered>
            <Stack>
                <Text size="sm">{t('share.shareLinkFor')} <b>{itemName}</b>:</Text>
                <Group>
                    <TextInput
                        value={shareLink}
                        readOnly
                        style={{ flex: 1 }}
                    />
                    <CopyButton value={shareLink} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? t('share.copied') : t('share.copy')} withArrow position="right">
                                <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                </Group>
                <Text size="xs" c="dimmed">
                    {t('share.note')}
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>{t('toolbar.close')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
