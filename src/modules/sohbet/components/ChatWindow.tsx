'use client';

// Chat Window Component (FAZ 3)

import { useState, useEffect, useRef } from 'react';
import { Stack, Group, Text, Avatar, Paper, ActionIcon, Button, ScrollArea, Loader } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { ChatRoomList } from './ChatRoomList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useCreateChatMessage } from '@/hooks/useChatMessages';
import { useTranslation } from '@/lib/i18n/client';

interface ChatWindowProps {
  roomId?: string | null;
  onRoomSelect: (roomId: string | null) => void;
  onClose?: () => void;
}

export function ChatWindow({ roomId, onRoomSelect, onClose }: ChatWindowProps) {
  const { t } = useTranslation('modules/chat');
  const [showRoomList, setShowRoomList] = useState(!roomId);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: roomsData, isLoading: roomsLoading } = useChatRooms({ page: 1, pageSize: 20, isActive: true });
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages({
    roomId: roomId || '',
    page: 1,
    pageSize: 50,
  });
  const createMessage = useCreateChatMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const handleRoomSelect = (id: string) => {
    onRoomSelect(id);
    setShowRoomList(false);
  };

  const selectedRoom = roomsData?.rooms.find((r) => r.id === roomId);

  if (showRoomList) {
    return (
      <ChatRoomList
        rooms={roomsData?.rooms || []}
        isLoading={roomsLoading}
        onRoomSelect={handleRoomSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    );
  }

  return (
    <Stack gap={0} h="100%">
      {/* Header */}
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Button variant="subtle" size="sm" onClick={() => setShowRoomList(true)}>
              {t('back')}
            </Button>
            {selectedRoom && (
              <>
                <Avatar size="sm" radius="xl" />
                <div>
                  <Text size="sm" fw={500}>
                    {selectedRoom.name || t('directMessage')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {selectedRoom.type}
                  </Text>
                </div>
              </>
            )}
          </Group>
          {onClose && (
            <ActionIcon variant="subtle" onClick={onClose}>
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>
      </Paper>

      {/* Messages */}
      <ScrollArea style={{ flex: 1 }} p="md">
        {messagesLoading ? (
          <Loader />
        ) : (
          <MessageList
            messages={messagesData?.messages || []}
            currentUserId="current-user-id" // TODO: Get from auth context
          />
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      {roomId && (
        <MessageInput
          roomId={roomId}
          onSend={(content) => {
            createMessage.mutate({
              roomId,
              content,
              type: 'text',
            });
          }}
          isLoading={createMessage.isPending}
        />
      )}
    </Stack>
  );
}

