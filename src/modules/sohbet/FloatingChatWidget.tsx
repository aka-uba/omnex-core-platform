'use client';

import { useState } from 'react';
import {
    Affix,
    Button,
    Transition,
    Paper,
    Text,
    Group,
    ActionIcon,
    Avatar,
    TextInput,
    ScrollArea,
    Stack,
} from '@mantine/core';
import { IconMessageCircle, IconX, IconSend, IconMinus } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

export function FloatingChatWidget() {
    const { t } = useTranslation('modules/sohbet');
    const [isOpen, setIsOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hello! How can I help you today?', sender: 'agent' }
    ]);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        setMessages([...messages, { id: Date.now(), text: messageInput, sender: 'user' }]);
        setMessageInput('');

        // Simulate response
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), text: 'Thanks for your message. Someone will be with you shortly.', sender: 'agent' }]);
        }, 1000);
    };

    return (
        <>
            <Affix position={{ bottom: 20, right: 20 }}>
                <Transition transition="slide-up" mounted={!isOpen}>
                    {(transitionStyles) => (
                        <Button
                            style={transitionStyles}
                            leftSection={<IconMessageCircle size={20} />}
                            radius="xl"
                            size="lg"
                            color="blue"
                            onClick={() => setIsOpen(true)}
                            className="shadow-lg"
                        >
                            Chat
                        </Button>
                    )}
                </Transition>
            </Affix>

            <Affix position={{ bottom: 20, right: 20 }}>
                <Transition transition="slide-up" mounted={isOpen}>
                    {(transitionStyles) => (
                        <Paper
                            style={transitionStyles}
                            shadow="xl"
                            radius="lg"
                            withBorder
                            className="w-[350px] h-[500px] flex flex-col overflow-hidden bg-white dark:bg-[#15202b] border-gray-200 dark:border-gray-800"
                        >
                            {/* Header */}
                            <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
                                <Group gap="xs">
                                    <Avatar radius="xl" size="sm" color="white" variant="light">OC</Avatar>
                                    <Text size="sm" fw={600}>Omnex Support</Text>
                                </Group>
                                <Group gap={4}>
                                    <ActionIcon variant="transparent" color="white" size="sm" onClick={() => setIsOpen(false)}>
                                        <IconMinus size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="transparent" color="white" size="sm" onClick={() => setIsOpen(false)}>
                                        <IconX size={16} />
                                    </ActionIcon>
                                </Group>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-[#101922]">
                                <Stack gap="sm">
                                    {messages.map(msg => (
                                        <Group
                                            key={msg.id}
                                            justify={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                                        >
                                            <div
                                                className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white dark:bg-[#15202b] border border-gray-200 dark:border-gray-800 rounded-bl-none'
                                                    }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </Group>
                                    ))}
                                </Stack>
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#15202b]">
                                <Group gap="xs">
                                    <TextInput
                                        className="flex-1"
                                        placeholder={t('chat.messagePlaceholder')}
                                        size="sm"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.currentTarget.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <ActionIcon variant="filled" color="blue" onClick={handleSendMessage}>
                                        <IconSend size={18} />
                                    </ActionIcon>
                                </Group>
                            </div>
                        </Paper>
                    )}
                </Transition>
            </Affix>
        </>
    );
}
