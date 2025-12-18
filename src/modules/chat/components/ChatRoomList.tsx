'use client';

// Chat Room List Component (FAZ 3)

import { Stack, Group, Text, Avatar, Paper, TextInput, Loader, Badge } from '@mantine/core';
import { IconSearch, IconMessageCircle, IconUsers } from '@tabler/icons-react';
import type { ChatRoom } from '@/modules/chat/types/chat';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  isLoading: boolean;
  onRoomSelect: (roomId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ChatRoomList({ rooms, isLoading, onRoomSelect, searchQuery, onSearchChange }: ChatRoomListProps) {
  const { t } = useTranslation('modules/chat');

  if (isLoading) {
    return <Loader />;
  }

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.name?.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query)
    );
  });

  return (
    <Stack gap="xs">
      {/* Search */}
      <TextInput
        placeholder={t('searchRooms') || 'Search rooms...'}
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
      />

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t('noRooms') || 'No rooms found'}
        </Text>
      ) : (
        filteredRooms.map((room) => {
          const lastMessage = room.messages?.[0];
          const unreadCount = room.messages?.filter((msg) => !msg.isRead).length || 0;

          return (
            <Paper
              key={room.id}
              p="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onRoomSelect(room.id)}
            >
              <Group justify="space-between">
                <Group>
                  <Avatar size="md" radius="xl">
                    {room.type === 'group' ? <IconUsers size={20} /> : <IconMessageCircle size={20} />}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {room.name || t('directMessage') || 'Direct Message'}
                    </Text>
                    {lastMessage && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {lastMessage.content}
                      </Text>
                    )}
                    {lastMessage && (
                      <Text size="xs" c="dimmed">
                        {dayjs(lastMessage.createdAt).format('HH:mm')}
                      </Text>
                    )}
                  </div>
                </Group>
                {unreadCount > 0 && (
                  <Badge color="blue" size="sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Group>
            </Paper>
          );
        })
      )}
    </Stack>
  );
}






