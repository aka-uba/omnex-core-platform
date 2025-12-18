'use client';

import { Textarea, ActionIcon, Group, Paper, FileButton, Tooltip } from '@mantine/core';
import { IconSend, IconPaperclip, IconMicrophone } from '@tabler/icons-react';
import { useState, useRef, KeyboardEvent } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface AIInputProps {
    onSend: (message: string, attachments?: File[]) => void;
    isLoading?: boolean;
    placeholder?: string;
    allowAttachments?: boolean;
    allowVoice?: boolean;
}

export function AIInput({
    onSend,
    isLoading = false,
    placeholder,
    allowAttachments = true,
    allowVoice = true
}: AIInputProps) {
    const { t } = useTranslation('modules/ai');
    const [value, setValue] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if ((!value.trim() && files.length === 0) || isLoading) return;
        onSend(value, files);
        setValue('');
        setFiles([]);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <Paper p="sm" radius="md" withBorder>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => setValue(event.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || t('typeMessage')}
                autosize
                minRows={1}
                maxRows={5}
                variant="unstyled"
                disabled={isLoading}
                styles={{ input: { padding: 0 } }}
            />

            <Group justify="space-between" mt="xs" align="center">
                <Group gap={4}>
                    {allowAttachments && (
                        <FileButton onChange={setFiles} accept="image/png,image/jpeg" multiple>
                            {(props) => (
                                <Tooltip label={t('attachFile')}>
                                    <ActionIcon {...props} variant="subtle" color="gray" size="sm">
                                        <IconPaperclip size={18} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </FileButton>
                    )}
                    {allowVoice && (
                        <Tooltip label={t('voiceInput')}>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                                <IconMicrophone size={18} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>

                <ActionIcon
                    variant="filled"
                    color="blue"
                    onClick={handleSend}
                    disabled={(!value.trim() && files.length === 0) || isLoading}
                    loading={isLoading}
                >
                    <IconSend size={18} />
                </ActionIcon>
            </Group>
        </Paper>
    );
}
