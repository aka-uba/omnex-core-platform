'use client';

import { useState } from 'react';
import { Box, Grid, Title, Stack, Text, Paper } from '@mantine/core';
import { CodeEditor } from './CodeEditor';
import { AIInput } from '../shared/AIInput';
import { ModelSelector } from '../shared/ModelSelector';
import { AIModel } from '../../types';
import { useTranslation } from '@/lib/i18n/client';

const MOCK_CODE_MODELS: AIModel[] = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', type: 'code', description: 'Best for complex logic' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', type: 'code', description: 'Great for large context' },
    { id: 'codellama', name: 'Code Llama', provider: 'meta', type: 'code', description: 'Specialized for coding' },
];

export function CodeGenerator() {
    const { t } = useTranslation('modules/ai');
    const [selectedModel, setSelectedModel] = useState<string | null>('gpt-4-turbo');
    const [code, setCode] = useState('// Generated code will appear here...');
    const [language, setLanguage] = useState('typescript');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = (prompt: string) => {
        setIsGenerating(true);
        setCode('// Generating code...');

        // Simulate generation
        setTimeout(() => {
            setCode(`// Generated code for: ${prompt}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function createUser(user: Omit<User, 'id'>): User {
  return {
    id: crypto.randomUUID(),
    ...user,
  };
}

// Example usage
const newUser = createUser({
  name: "John Doe",
  email: "john@example.com",
  role: "user"
});`);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <Grid h="100%" gutter={0}>
            <Grid.Col span={{ base: 12, md: 8 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Title order={3}>{t('codeGenerator')}</Title>
                </Box>

                <Box flex={1} p="md" style={{ overflow: 'hidden' }}>
                    <CodeEditor
                        code={code}
                        language={language}
                        onChange={setCode}
                        onLanguageChange={setLanguage}
                    />
                </Box>

                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
                    <AIInput
                        onSend={handleGenerate}
                        isLoading={isGenerating}
                        placeholder={t('codePromptPlaceholder')}
                        allowVoice={false}
                        allowAttachments={false}
                    />
                </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }} style={{ borderLeft: '1px solid var(--mantine-color-default-border)' }}>
                <Paper h="100%" p="md" radius={0} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                    <Stack gap="xl">
                        <ModelSelector
                            label={t('model')}
                            value={selectedModel}
                            onChange={setSelectedModel}
                            models={MOCK_CODE_MODELS}
                        />

                        <Box>
                            <Text fw={500} mb="xs">{t('instructions')}</Text>
                            <Text size="sm" c="dimmed">
                                {t('codeGeneratorInstructions')}
                            </Text>
                        </Box>
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}
