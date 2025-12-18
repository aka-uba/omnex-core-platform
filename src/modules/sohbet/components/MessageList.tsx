'use client';

// Message List Component (FAZ 3)

import { Stack, Group, Text, Avatar, Paper } from '@mantine/core';
import type { ChatMessage } from '@/modules/sohbet/types/chat';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const { t } = useTranslation('modules/chat');

  if (messages.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {t('noMessages')}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        // const showDate = true; // TODO: Group messages by date // removed - unused

        return (
          <Group
            key={message.id}
            justify={isOwnMessage ? 'flex-end' : 'flex-start'}
            align="flex-start"
            gap="xs"
          >
            {!isOwnMessage && <Avatar size="sm" radius="xl" />}
            <Paper
              p="sm"
              style={{
                maxWidth: '70%',
                backgroundColor: isOwnMessage ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-1)',
                color: isOwnMessage ? 'white' : 'inherit',
              }}
            >
              <Text size="sm">{message.content}</Text>
              <Group gap="xs" mt={4}>
                <Text size="xs" c={isOwnMessage ? 'dimmed' : 'dimmed'}>
                  {dayjs(message.createdAt).format('HH:mm')}
                </Text>
                {isOwnMessage && message.isRead && (
                  <Text size="xs" c="dimmed">
                    ✓✓
                  </Text>
                )}
              </Group>
            </Paper>
            {isOwnMessage && <Avatar size="sm" radius="xl" />}
          </Group>
        );
      })}
    </Stack>
  );
}







