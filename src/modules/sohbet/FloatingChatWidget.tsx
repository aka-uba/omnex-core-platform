'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, Badge } from '@mantine/core';
import { IconMessageCircle, IconX, IconSend, IconArrowLeft, IconUsers, IconMessage } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages, useCreateChatMessage } from '@/hooks/useChatMessages';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoom } from '@/modules/sohbet/types/chat';
import styles from '@/components/layouts/configurator/ThemeConfigurator.module.css';

interface FloatingChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FloatingChatWidget({ isOpen, onClose }: FloatingChatWidgetProps) {
    const { t } = useTranslation('modules/sohbet');
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat rooms
    const { data: roomsData } = useChatRooms({
        page: 1,
        pageSize: 50,
        isActive: true
    });

    // Fetch users for display names
    const { data: usersData } = useUsers({ pageSize: 100 });

    // Fetch messages for selected room
    const { data: messagesData, refetch: refetchMessages } = useChatMessages({
        roomId: selectedRoom?.id || '',
        page: 1,
        pageSize: 50
    });

    // Send message mutation
    const sendMessageMutation = useCreateChatMessage();

    // Filter rooms by type
    const directRooms = roomsData?.rooms?.filter(r => r.type === 'direct') || [];
    const groupRooms = roomsData?.rooms?.filter(r => r.type === 'group' || r.type === 'channel') || [];
    const displayedRooms = activeTab === 'chats' ? directRooms : groupRooms;

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData?.messages]);

    // Get user display name
    const getUserName = (odaId: string) => {
        const foundUser = usersData?.users?.find(u => u.id === odaId);
        return foundUser?.name || foundUser?.email || odaId;
    };

    // Get room display name
    const getRoomName = (room: ChatRoom) => {
        if (room.name) return room.name;
        if (room.type === 'direct' && room.participants.length > 0) {
            const otherParticipantId = room.participants.find(id => id !== user?.id);
            if (otherParticipantId) {
                return getUserName(otherParticipantId);
            }
        }
        return t('chat.directMessage');
    };

    // Get last message preview
    const getLastMessage = (room: ChatRoom) => {
        if (room.messages && room.messages.length > 0) {
            const content = room.messages[0]?.content || '';
            return content.substring(0, 40) + (content.length > 40 ? '...' : '');
        }
        return t('chat.noMessages');
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedRoom) return;

        try {
            await sendMessageMutation.mutateAsync({
                roomId: selectedRoom.id,
                content: messageInput.trim(),
                type: 'text'
            });
            setMessageInput('');
            refetchMessages();
        } catch {
            console.error('Failed to send message');
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.chatWidgetPanel}>
            {/* Header */}
            <div className={styles.chatWidgetHeader}>
                <div className={styles.chatWidgetHeaderInfo}>
                    {selectedRoom ? (
                        <>
                            <button
                                className={styles.chatWidgetBackBtn}
                                onClick={() => setSelectedRoom(null)}
                            >
                                <IconArrowLeft size={20} />
                            </button>
                            <Avatar
                                size="sm"
                                radius="xl"
                                color="white"
                                variant="light"
                            >
                                {selectedRoom.type === 'direct' ? (
                                    <IconMessage size={16} />
                                ) : (
                                    <IconUsers size={16} />
                                )}
                            </Avatar>
                            <div className={styles.chatWidgetHeaderText}>
                                <h3>{getRoomName(selectedRoom)}</h3>
                                <p>
                                    {selectedRoom.type === 'direct'
                                        ? t('chat.directMessage')
                                        : `${selectedRoom.participants.length} ${t('chat.members')}`}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Avatar
                                size="sm"
                                radius="xl"
                                color="white"
                                variant="light"
                            >
                                <IconMessageCircle size={16} />
                            </Avatar>
                            <div className={styles.chatWidgetHeaderText}>
                                <h3>{t('title')}</h3>
                                <p>{t('description')}</p>
                            </div>
                        </>
                    )}
                </div>
                <button
                    className={styles.chatWidgetBackBtn}
                    onClick={onClose}
                >
                    <IconX size={20} />
                </button>
            </div>

            {selectedRoom ? (
                /* Chat View */
                <>
                    <div className={styles.chatWidgetMessages}>
                        {messagesData?.messages && messagesData.messages.length > 0 ? (
                            [...messagesData.messages].reverse().map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${styles.chatWidgetMessage} ${msg.senderId === user?.id ? styles.sent : styles.received}`}
                                >
                                    {msg.content}
                                </div>
                            ))
                        ) : (
                            <div className={styles.chatWidgetEmpty}>
                                <IconMessageCircle size={48} />
                                <p>{t('chat.noMessages')}</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.chatWidgetInputArea}>
                        <input
                            type="text"
                            className={styles.chatWidgetInput}
                            placeholder={t('chat.messagePlaceholder')}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button
                            className={styles.chatWidgetSendBtn}
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        >
                            <IconSend size={18} />
                        </button>
                    </div>
                </>
            ) : (
                /* Room List View */
                <>
                    <div className={styles.chatWidgetTabs}>
                        <button
                            className={`${styles.chatWidgetTab} ${activeTab === 'chats' ? styles.active : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            {t('menu.items.messages')}
                        </button>
                        <button
                            className={`${styles.chatWidgetTab} ${activeTab === 'groups' ? styles.active : ''}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            {t('menu.items.groups')}
                        </button>
                    </div>

                    <div className={styles.chatWidgetContent}>
                        {displayedRooms.length > 0 ? (
                            displayedRooms.map((room) => (
                                <div
                                    key={room.id}
                                    className={styles.chatWidgetRoomItem}
                                    onClick={() => setSelectedRoom(room)}
                                >
                                    <Avatar
                                        size="md"
                                        radius="xl"
                                        src={room.avatarUrl}
                                        color="blue"
                                    >
                                        {!room.avatarUrl && (
                                            room.type === 'direct' ? (
                                                getRoomName(room).charAt(0).toUpperCase()
                                            ) : (
                                                <IconUsers size={18} />
                                            )
                                        )}
                                    </Avatar>
                                    <div className={styles.chatWidgetRoomInfo}>
                                        <p className={styles.chatWidgetRoomName}>
                                            {getRoomName(room)}
                                        </p>
                                        <p className={styles.chatWidgetRoomLastMsg}>
                                            {getLastMessage(room)}
                                        </p>
                                    </div>
                                    {room.messages && room.messages.filter(m => !m.isRead).length > 0 && (
                                        <Badge size="sm" circle color="blue">
                                            {room.messages.filter(m => !m.isRead).length}
                                        </Badge>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.chatWidgetEmpty}>
                                <IconMessageCircle size={48} />
                                <p>{t('actions.noChats')}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
