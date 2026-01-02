'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, Badge, TextInput, Checkbox, ScrollArea } from '@mantine/core';
import { IconMessageCircle, IconX, IconSend, IconArrowLeft, IconUsers, IconMessage, IconPlus, IconSearch } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useChatRooms, useCreateChatRoom } from '@/hooks/useChatRooms';
import { useChatMessages, useCreateChatMessage } from '@/hooks/useChatMessages';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoom } from '@/modules/sohbet/types/chat';
import styles from '@/components/layouts/configurator/ThemeConfigurator.module.css';

interface FloatingChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}

export function FloatingChatWidget({ isOpen, onClose, onUnreadCountChange }: FloatingChatWidgetProps) {
    const { t } = useTranslation('modules/sohbet');
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat rooms
    const { data: roomsData, refetch: refetchRooms } = useChatRooms({
        page: 1,
        pageSize: 50,
        isActive: true
    });

    // Fetch users for display names and new chat selection
    const { data: usersData } = useUsers({ pageSize: 100 });

    // Fetch messages for selected room
    const { data: messagesData, refetch: refetchMessages } = useChatMessages({
        roomId: selectedRoom?.id || '',
        page: 1,
        pageSize: 50
    });

    // Send message mutation
    const sendMessageMutation = useCreateChatMessage();

    // Create chat room mutation
    const createRoomMutation = useCreateChatRoom();

    // Filter rooms by type
    const directRooms = roomsData?.rooms?.filter(r => r.type === 'direct') || [];
    const groupRooms = roomsData?.rooms?.filter(r => r.type === 'group' || r.type === 'channel') || [];
    const displayedRooms = activeTab === 'chats' ? directRooms : groupRooms;

    // Calculate total unread count
    const totalUnreadCount = (roomsData?.rooms || []).reduce((acc, room) => {
        const unread = room.messages?.filter(m => !m.isRead && m.senderId !== user?.id).length || 0;
        return acc + unread;
    }, 0);

    // Notify parent about unread count changes
    useEffect(() => {
        onUnreadCountChange?.(totalUnreadCount);
    }, [totalUnreadCount, onUnreadCountChange]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData?.messages]);

    // Filter users for new chat (exclude current user)
    const availableUsers = (usersData?.users || []).filter(u =>
        u.id !== user?.id &&
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

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

    // Handle user selection for new chat
    const toggleUserSelection = (odaId: string) => {
        setSelectedUsers(prev =>
            prev.includes(odaId)
                ? prev.filter(id => id !== odaId)
                : [...prev, odaId]
        );
    };

    // Handle create new chat
    const handleCreateChat = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const roomData = {
                type: newChatType,
                name: newChatType === 'group' ? groupName || undefined : undefined,
                participants: selectedUsers,
            };

            const result = await createRoomMutation.mutateAsync(roomData);

            // Reset form
            setShowNewChat(false);
            setSelectedUsers([]);
            setGroupName('');
            setUserSearchQuery('');

            // Refresh rooms and select the new room
            await refetchRooms();
            if (result?.room) {
                setSelectedRoom(result.room);
            }
        } catch {
            console.error('Failed to create chat room');
        }
    };

    // Reset new chat form
    const resetNewChatForm = () => {
        setShowNewChat(false);
        setNewChatType('direct');
        setSelectedUsers([]);
        setGroupName('');
        setUserSearchQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.chatWidgetPanel}>
            {/* Header - dynamic based on view */}
            <div className={styles.chatWidgetHeader}>
                <div className={styles.chatWidgetHeaderInfo}>
                    {showNewChat ? (
                        <>
                            <button
                                className={styles.chatWidgetBackBtn}
                                onClick={resetNewChatForm}
                            >
                                <IconArrowLeft size={20} />
                            </button>
                            <div className={styles.chatWidgetHeaderText}>
                                <h3>{newChatType === 'direct' ? t('actions.newChat') : t('actions.newGroup')}</h3>
                                <p>{t('forms.selectUser')}</p>
                            </div>
                        </>
                    ) : selectedRoom ? (
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

            {showNewChat ? (
                /* New Chat View */
                <>

                    {/* Chat Type Selection */}
                    <div className={styles.chatWidgetTabs}>
                        <button
                            className={`${styles.chatWidgetTab} ${newChatType === 'direct' ? styles.active : ''}`}
                            onClick={() => {
                                setNewChatType('direct');
                                setSelectedUsers([]);
                            }}
                        >
                            {t('menu.items.messages')}
                        </button>
                        <button
                            className={`${styles.chatWidgetTab} ${newChatType === 'group' ? styles.active : ''}`}
                            onClick={() => setNewChatType('group')}
                        >
                            {t('menu.items.groups')}
                        </button>
                    </div>

                    <div className={styles.chatWidgetContent}>
                        {/* Group Name (only for group chats) */}
                        {newChatType === 'group' && (
                            <div className={styles.chatWidgetNewChatInput}>
                                <TextInput
                                    placeholder={t('forms.groupNamePlaceholder')}
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    size="sm"
                                />
                            </div>
                        )}

                        {/* User Search */}
                        <div className={styles.chatWidgetNewChatInput}>
                            <TextInput
                                leftSection={<IconSearch size={16} />}
                                placeholder={t('actions.searchChats')}
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                size="sm"
                            />
                        </div>

                        {/* User List */}
                        <ScrollArea h={200} className={styles.chatWidgetUserList}>
                            {availableUsers.length > 0 ? (
                                availableUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className={styles.chatWidgetUserItem}
                                        onClick={() => {
                                            if (newChatType === 'direct') {
                                                setSelectedUsers([u.id]);
                                            } else {
                                                toggleUserSelection(u.id);
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.includes(u.id)}
                                            onChange={() => {}}
                                            size="sm"
                                            styles={{ input: { cursor: 'pointer' } }}
                                        />
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {u.name?.charAt(0).toUpperCase() || 'U'}
                                        </Avatar>
                                        <span className={styles.chatWidgetUserName}>
                                            {u.name || u.email}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.chatWidgetEmpty}>
                                    <p>{t('actions.noUsersFound')}</p>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Create Button */}
                        <div className={styles.chatWidgetNewChatActions}>
                            <button
                                className={styles.chatWidgetCreateBtn}
                                onClick={handleCreateChat}
                                disabled={selectedUsers.length === 0 || createRoomMutation.isPending}
                            >
                                {createRoomMutation.isPending ? t('actions.loading') : t('actions.create')}
                            </button>
                        </div>
                    </div>
                </>
            ) : selectedRoom ? (
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
                        {/* New Chat Button */}
                        <button
                            className={styles.chatWidgetNewChatBtn}
                            onClick={() => {
                                setShowNewChat(true);
                                setNewChatType(activeTab === 'chats' ? 'direct' : 'group');
                            }}
                            title={activeTab === 'chats' ? t('actions.newChat') : t('actions.newGroup')}
                        >
                            <IconPlus size={18} />
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
