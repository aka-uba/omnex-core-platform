'use client';

import { useState } from 'react';
import { Box, Group, Title, ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical, IconTrash, IconHistory } from '@tabler/icons-react';
import { ChatInterface } from './ChatInterface';
import { AIInput } from '../shared/AIInput';
import { ModelSelector } from '../shared/ModelSelector';
import { AIMessage, AIModel } from '../../types';
import classes from '../../AIModule.module.css';
import { useTranslation } from '@/lib/i18n/client';

const MOCK_MODELS: AIModel[] = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', type: 'text', description: 'Most capable model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', type: 'text', description: 'Fast and efficient' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', type: 'text', description: 'High intelligence' },
];

export function TextGenerator() {
    const { t } = useTranslation('modules/ai');
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string | null>('gpt-4');

    const handleSend = async (content: string) => {
        const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const assistantMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `This is a simulated response from ${selectedModel} for: "${content}"`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    return (
        <div className={classes.chatContainer}>
            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                    <Group>
                        <Title order={3}>{t('textGenerator')}</Title>
                        <Box w={250}>
                            <ModelSelector
                                value={selectedModel}
                                onChange={setSelectedModel}
                                models={MOCK_MODELS}
                            />
                        </Box>
                    </Group>
                    <Group>
                        <Menu position="bottom-end">
                            <Menu.Target>
                                <ActionIcon variant="subtle">
                                    <IconDotsVertical size={20} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item leftSection={<IconHistory size={16} />}>
                                    {t('history')}
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconTrash size={16} />}
                                    color="red"
                                    onClick={handleClearChat}
                                >
                                    {t('clearChat')}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </Box>

            <ChatInterface messages={messages} isLoading={isLoading} />

            <Box {...(classes.chatInputArea ? { className: classes.chatInputArea } : {})}>
                <AIInput onSend={handleSend} isLoading={isLoading} />
            </Box>
        </div>
    );
}
