'use client';

import { Box, Text, Avatar, Group, Paper, Stack } from '@mantine/core';
import { IconRobot, IconUser } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import { AIMessage } from '../../types';
import classes from '../../AIModule.module.css';

interface ChatInterfaceProps {
    messages: AIMessage[];
    isLoading?: boolean;
}

export function ChatInterface({ messages, isLoading = false }: ChatInterfaceProps) {
    const viewport = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <Box {...(classes.chatMessages ? { className: classes.chatMessages } : {})} ref={viewport}>
            {messages.length === 0 ? (
                <Stack align="center" justify="center" h="100%" c="dimmed">
                    <IconRobot size={48} stroke={1.5} />
                    <Text size="lg" fw={500}>How can I help you today?</Text>
                </Stack>
            ) : (
                <Stack gap="md">
                    {messages.map((message) => (
                        <Group
                            key={message.id}
                            align="flex-start"
                            {...((message.role === 'user' ? classes.userMessageWrapper : classes.assistantMessageWrapper) ? { className: (message.role === 'user' ? classes.userMessageWrapper : classes.assistantMessageWrapper) } : {})}
                            justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                        >
                            {message.role !== 'user' && (
                                <Avatar color="blue" radius="xl">
                                    <IconRobot size={20} />
                                </Avatar>
                            )}

                            <Paper
                                className={`${classes.message} ${message.role === 'user' ? classes.userMessage : classes.assistantMessage}`}
                            >
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                            </Paper>

                            {message.role === 'user' && (
                                <Avatar color="gray" radius="xl">
                                    <IconUser size={20} />
                                </Avatar>
                            )}
                        </Group>
                    ))}
                    {isLoading && (
                        <Group align="flex-start">
                            <Avatar color="blue" radius="xl">
                                <IconRobot size={20} />
                            </Avatar>
                            <Paper className={`${classes.message} ${classes.assistantMessage}`}>
                                <Text size="sm" c="dimmed">Thinking...</Text>
                            </Paper>
                        </Group>
                    )}
                </Stack>
            )}
        </Box>
    );
}
