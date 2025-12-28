'use client';

import { Container, Paper, Text } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ChatRoomList } from '@/modules/sohbet/components/ChatRoomList';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function SohbetRoomsPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/sohbet');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: roomsData, isLoading } = useChatRooms({
    page: 1,
    pageSize: 50,
    isActive: true
  });

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="rooms.title"
        description="rooms.description"
        namespace="modules/sohbet"
        icon={<IconMessageCircle size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/sohbet`, namespace: 'modules/sohbet' },
          { label: 'rooms.title', namespace: 'modules/sohbet' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder>
        {isLoading ? (
          <Text c="dimmed">{t('common.loading')}</Text>
        ) : (
          <ChatRoomList
            rooms={roomsData?.rooms || []}
            isLoading={isLoading}
            onRoomSelect={(roomId) => {
              window.location.href = `/${currentLocale}/modules/sohbet/dashboard?roomId=${roomId}`;
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </Paper>
    </Container>
  );
}

