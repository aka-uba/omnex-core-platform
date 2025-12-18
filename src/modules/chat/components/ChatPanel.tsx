'use client';

// Chat Panel Component (FAZ 3)
// Sayfa dışı panel modal sohbet sistemi

import { useState } from 'react';
import { Drawer, ActionIcon, Badge } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import { ChatWindow } from './ChatWindow';
import { useChatRooms } from '@/hooks/useChatRooms';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { data: roomsData } = useChatRooms({ page: 1, pageSize: 10, isActive: true });

  // Count unread messages
  const unreadCount = roomsData?.rooms.reduce((total, room) => {
    const unreadMessages = room.messages?.filter((msg) => !msg.isRead && msg.senderId !== 'current-user-id') || [];
    return total + unreadMessages.length;
  }, 0) || 0;

  return (
    <>
      {/* Floating Button */}
      <ActionIcon
        variant="filled"
        color="blue"
        size="xl"
        radius="xl"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <IconMessageCircle size={24} />
        {unreadCount > 0 && (
          <Badge
            color="red"
            size="sm"
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </ActionIcon>

      {/* Chat Panel Drawer */}
      <Drawer
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        position="right"
        size="md"
        title="Chat"
        padding="md"
      >
        <ChatWindow
          roomId={selectedRoomId}
          onRoomSelect={setSelectedRoomId}
          onClose={() => setIsOpen(false)}
        />
      </Drawer>
    </>
  );
}






