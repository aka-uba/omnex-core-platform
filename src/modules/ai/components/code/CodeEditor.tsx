'use client';

import { Textarea, Paper, Group, ActionIcon, Select, CopyButton, Tooltip } from '@mantine/core';
import { IconCopy, IconCheck, IconDownload } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface CodeEditorProps {
    code: string;
    language: string;
    onChange?: (code: string) => void;
    onLanguageChange?: (language: string) => void;
    readOnly?: boolean;
}

export function CodeEditor({
    code,
    language,
    onChange,
    onLanguageChange,
    readOnly = false
}: CodeEditorProps) {
    const { t } = useTranslation('modules/ai');

    return (
        <Paper withBorder radius="md" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Group justify="space-between" p="xs" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Select
                    value={language}
                    onChange={(val) => onLanguageChange?.(val || 'typescript')}
                    data={[
                        { value: 'typescript', label: 'TypeScript' },
                        { value: 'javascript', label: 'JavaScript' },
                        { value: 'python', label: 'Python' },
                        { value: 'html', label: 'HTML' },
                        { value: 'css', label: 'CSS' },
                        { value: 'sql', label: 'SQL' },
                        { value: 'json', label: 'JSON' },
                    ]}
                    size="xs"
                    w={150}
                    variant="filled"
                    readOnly={readOnly}
                />

                <Group gap="xs">
                    <CopyButton value={code} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? t('copied') : t('copy')}>
                                <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                    <Tooltip label={t('download')}>
                        <ActionIcon color="gray" variant="subtle">
                            <IconDownload size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Textarea
                value={code}
                onChange={(e) => onChange?.(e.currentTarget.value)}
                readOnly={readOnly}
                variant="unstyled"
                p="md"
                styles={{
                    root: { flex: 1, display: 'flex', flexDirection: 'column' },
                    wrapper: { flex: 1, display: 'flex', flexDirection: 'column' },
                    input: {
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre',
                        overflow: 'auto'
                    }
                }}
                spellCheck={false}
            />
        </Paper>
    );
}
