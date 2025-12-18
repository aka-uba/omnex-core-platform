'use client';

// Chat Room List Component (FAZ 3)

import { Stack, Group, Text, Avatar, Paper, TextInput, Loader, Badge, Tooltip } from '@mantine/core';
import { IconSearch, IconMessageCircle, IconUsers, IconFile, IconClock, IconUser } from '@tabler/icons-react';
import type { ChatRoom } from '@/modules/sohbet/types/chat';
import { useTranslation } from '@/lib/i18n/client';
import { useUser } from '@/hooks/useUsers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

dayjs.extend(relativeTime);
dayjs.locale('tr');

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
        placeholder={t('searchRooms')}
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
      />

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {t('noRooms')}
        </Text>
      ) : (
        filteredRooms.map((room) => {
          const lastMessage = room.messages?.[0];
          const unreadCount = room.messages?.filter((msg) => !msg.isRead).length || 0;
          const participantsCount = room.participants?.length || 0;
          const creatorId = room.participants?.[0]; // İlk participant'ı creator olarak kabul ediyoruz
          const { data: creator } = useUser(creatorId || '');
          
          // Dosya sayısını al
          const { data: filesData } = useQuery({
            queryKey: ['room-files-count', room.id],
            queryFn: async () => {
              const response = await fetch(`/api/core-files?module=sohbet&entityType=chat-room&entityId=${encodeURIComponent(room.id)}`);
              if (!response.ok) return { count: 0 };
              const result = await response.json();
              return { count: result.data?.files?.length || 0 };
            },
            enabled: !!room.id,
          });

          const filesCount = filesData?.count || 0;

          return (
            <Paper
              key={room.id}
              p="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onRoomSelect(room.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group align="flex-start" style={{ flex: 1 }}>
                  <Avatar 
                    size="md" 
                    radius="xl"
                    {...(room.avatarUrl ? { src: room.avatarUrl } : {})}
                    style={{ 
                      backgroundColor: room.avatarUrl ? 'transparent' : 'var(--mantine-color-blue-6)'
                    }}
                  >
                    {!room.avatarUrl && (
                      room.type === 'group' ? <IconUsers size={20} /> : <IconMessageCircle size={20} />
                    )}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb={4}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {room.name || t('directMessage')}
                      </Text>
                      {!room.isActive && (
                        <Badge color="gray" size="xs" variant="light">
                          Pasif
                        </Badge>
                      )}
                    </Group>
                    
                    <Stack gap={4}>
                      {/* Creator ve Tarih */}
                      <Group gap="xs">
                        {creator && (
                          <Tooltip label={creator.name || creator.email}>
                            <Group gap={4}>
                              <IconUser size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {creator.name || creator.email}
                              </Text>
                            </Group>
                          </Tooltip>
                        )}
                        <Group gap={4}>
                          <IconClock size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                          <Text size="xs" c="dimmed">
                            {dayjs(room.createdAt).fromNow()}
                          </Text>
                        </Group>
                      </Group>

                      {/* Katılımcı ve Dosya Sayısı */}
                      <Group gap="md">
                        <Group gap={4}>
                          <IconUsers size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                          <Text size="xs" c="dimmed">
                            {participantsCount} {participantsCount === 1 ? 'kişi' : 'kişi'}
                          </Text>
                        </Group>
                        {filesCount > 0 && (
                          <Group gap={4}>
                            <IconFile size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                            <Text size="xs" c="dimmed">
                              {filesCount} {filesCount === 1 ? 'dosya' : 'dosya'}
                            </Text>
                          </Group>
                        )}
                      </Group>

                      {/* Son Mesaj */}
                      {lastMessage && (
                        <Text size="xs" c="dimmed" lineClamp={1} mt={4}>
                          {lastMessage.content}
                        </Text>
                      )}
                    </Stack>
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







