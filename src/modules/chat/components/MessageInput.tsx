'use client';

// Message Input Component (FAZ 3)

import { Group, TextInput, ActionIcon } from '@mantine/core';
import { IconSend, IconPaperclip } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface MessageInputProps {
  roomId: string;
  onSend: (content: string) => void;
  isLoading?: boolean;
}

export function MessageInput({ roomId, onSend, isLoading }: MessageInputProps) {
  const { t } = useTranslation('modules/chat');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Group gap="xs" p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      <ActionIcon variant="subtle" size="lg">
        <IconPaperclip size={18} />
      </ActionIcon>
      <TextInput
        placeholder={t('typeMessage') || 'Type a message...'}
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        onKeyDown={handleKeyPress}
        style={{ flex: 1 }}
        disabled={isLoading}
      />
      <ActionIcon
        variant="filled"
        color="blue"
        size="lg"
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
      >
        <IconSend size={18} />
      </ActionIcon>
    </Group>
  );
}






