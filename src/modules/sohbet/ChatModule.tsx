'use client';

import { useState, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { useAuth } from '@/hooks/useAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages, useCreateChatMessage } from '@/hooks/useChatMessages';
import { useUser, useUsers } from '@/hooks/useUsers';
import { useCreateChatRoom, useUpdateChatRoom } from '@/hooks/useChatRooms';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { getTenantSlug, authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { ChatRoom } from '@/modules/sohbet/types/chat';

// Helper component for participant items
function ParticipantItem({ participantId, colorScheme }: { participantId: string; colorScheme: string }) {
    const { data: userData } = useUser(participantId);
    
    if (!userData) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-lg">
                <div className="size-10 rounded-full bg-gray-300"></div>
                <div>
                    <p className="text-sm font-medium" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>Loading...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <div className="relative">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                    style={{ 
                        backgroundImage: userData.profilePicture ? `url("${userData.profilePicture}")` : 'none',
                        backgroundColor: userData.profilePicture ? 'transparent' : 'var(--primary)'
                    }}
                >
                    {!userData.profilePicture && (
                        <span className="flex items-center justify-center h-full text-white text-sm font-semibold">
                            {userData.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
            </div>
            <div>
                <p className="text-sm font-medium" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{userData.name}</p>
                {userData.position && (
                    <p className="text-xs" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{userData.position}</p>
                )}
            </div>
        </div>
    );
}

export function ChatModule() {
    const { t } = useTranslation('modules/sohbet');
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const searchParams = useSearchParams();
    const roomIdFromUrl = searchParams.get('roomId');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomIdFromUrl);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { colorScheme } = useMantineColorScheme();
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const { user } = useAuth();
    const createChatRoom = useCreateChatRoom();
    const updateChatRoom = useUpdateChatRoom();
    
    // URL'den roomId geldiğinde otomatik olarak seç
    useEffect(() => {
        if (roomIdFromUrl && roomIdFromUrl !== selectedRoomId) {
            setSelectedRoomId(roomIdFromUrl);
        }
    }, [roomIdFromUrl]);
    
    // Fetch users for creating chats
    const { data: usersData } = useUsers({ pageSize: 100 });
    
    // State for avatar upload
    const [showAvatarUpload, setShowAvatarUpload] = useState(false);
    const [avatarUploadFile, setAvatarUploadFile] = useState<File | null>(null);
    const availableUsers = usersData?.users?.filter(u => u.id !== user?.id) || [];

    // Fetch chat rooms - show all active rooms (user can see all rooms they're part of)
    const { data: roomsData, isLoading: roomsLoading, error: roomsError } = useChatRooms({
        page: 1,
        pageSize: 50,
        ...(searchQuery ? { search: searchQuery } : {}),
        isActive: true,
        // Don't filter by participantId - show all rooms, API will filter by tenant
    });

    // Log errors for debugging
    useEffect(() => {
        // Error handling is done via toast notifications
    }, [roomsError, roomsData]);

    const rooms = roomsData?.rooms || [];

    // Set first room as active if none selected
    useEffect(() => {
        if (!selectedRoomId && rooms.length > 0) {
            const firstRoomId = rooms[0]?.id;
            if (firstRoomId) {
              setSelectedRoomId(firstRoomId);
            }
        }
    }, [selectedRoomId, rooms]);

    // Fetch messages for selected room
    const { data: messagesData, isLoading: messagesLoading } = useChatMessages({
        roomId: selectedRoomId || '',
        page: 1,
        pageSize: 100,
    });

    const messages = messagesData?.messages || [];

    // Get active room
    const activeRoom = rooms.find(r => r.id === selectedRoomId);

    // Create message mutation
    const createMessage = useCreateChatMessage();

    // Helper function to format time
    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper function to format date
    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return d.toLocaleDateString();
        }
    };

    // Get last message for a room
    const getLastMessage = (room: ChatRoom) => {
        if (room.messages && room.messages.length > 0) {
            const lastMsg = room.messages[0];
            return {
                text: lastMsg?.content || '',
                time: formatTime(lastMsg?.createdAt || new Date()),
            };
        }
        return { text: 'No messages yet', time: '' };
    };

    // Get room display name
    const getRoomName = (room: ChatRoom) => {
        if (room.name) return room.name;
        if (room.type === 'direct' && room.participants.length > 0) {
            // For direct messages, show other participant's name
            const otherParticipantId = room.participants.find(id => id !== user?.id);
            return otherParticipantId || 'Direct Message';
        }
        return 'Chat Room';
    };

    // Get room avatar - for direct messages, get participant's avatar
    const getRoomAvatar = (room: ChatRoom) => {
        if (room.avatarUrl) return room.avatarUrl;
        if (room.type === 'direct' && room.participants.length > 0) {
            const otherParticipantId = room.participants.find(id => id !== user?.id);
            if (otherParticipantId) {
                const otherUser = usersData?.users?.find(u => u.id === otherParticipantId);
                return otherUser?.profilePicture || null;
            }
        }
        return null;
    };

    // Interactive features state
    const [activeTab, setActiveTab] = useState<'details' | 'members' | 'files'>('details');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [, setUploadingFiles] = useState<Map<string, boolean>>(new Map());
    const [uploadedFileIds, setUploadedFileIds] = useState<Map<string, string>>(new Map());
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showCallModal, setShowCallModal] = useState<'video' | 'audio' | null>(null);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showCreateDirectModal, setShowCreateDirectModal] = useState(false);
    const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [selectedUserForDirect, setSelectedUserForDirect] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Get tenant slug for sohbet module directory
    const tenantSlug = getTenantSlug();
    const sohbetModulePath = tenantSlug ? `/storage/tenants/${tenantSlug}/module-files/sohbet` : null;

    // Fetch files from CoreFileService for chat room
    const { data: sohbetModuleFiles, isLoading: filesLoading } = useQuery({
        queryKey: ['sohbet-module-files', selectedRoomId],
        queryFn: async () => {
            if (!selectedRoomId) return [];
            // Fetch files from CoreFileService for this chat room
            const response = await authenticatedFetch(`/api/core-files?module=sohbet&entityType=chat-room&entityId=${encodeURIComponent(selectedRoomId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const result = await response.json();
            // Convert CoreFile format to file-manager format for compatibility
            return (result.data?.files || []).map((file: any) => ({
                id: file.id,
                name: file.originalName,
                path: file.fullPath,
                size: file.size,
                type: 'file',
                mimeType: file.mimeType,
                extension: file.originalName.split('.').pop()?.toLowerCase(),
            }));
        },
        enabled: !!selectedRoomId && activeTab === 'files',
    });

    // File preview state
    const [previewFile, setPreviewFile] = useState<{ path: string; name: string; type: string; mimeType?: string } | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string>('');
    const [loadingText, setLoadingText] = useState(false);

    // Load preview file as blob when preview file changes
    useEffect(() => {
        if (!previewFile) {
            setPreviewBlobUrl(null);
            setTextContent('');
            return;
        }

        // For text/markdown files, load as text
        if (previewFile.type === 'text' || previewFile.type === 'markdown') {
            setLoadingText(true);
            const url = previewFile.path.startsWith('/api/') 
                ? previewFile.path 
                : `/api/file-manager/download?path=${encodeURIComponent(previewFile.path)}`;
            authenticatedFetch(url)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    setLoadingText(false);
                })
                .catch(err => {
                    console.error('Error loading text file:', err);
                    setTextContent('Dosya yüklenirken hata oluştu.');
                    setLoadingText(false);
                });
            return;
        }

        // For image, video, audio, pdf - load as blob
        const url = previewFile.path.startsWith('/api/') 
            ? previewFile.path 
            : `/api/file-manager/download?path=${encodeURIComponent(previewFile.path)}&inline=true`;
        
        authenticatedFetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load file');
                return res.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                setPreviewBlobUrl(blobUrl);
            })
            .catch(err => {
                console.error('Error loading preview file:', err);
                setPreviewBlobUrl(null);
            });

        // Cleanup blob URL on unmount or when previewFile changes
        return () => {
            // Cleanup will be handled by the next effect run
        };
    }, [previewFile]);

    // Cleanup blob URL when component unmounts or previewFile changes
    useEffect(() => {
        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [previewBlobUrl]);

    // Upload file to sohbet module directory
    const uploadFileMutation = useMutation({
        mutationFn: async ({ file }: { file: File }) => {
            if (!sohbetModulePath) throw new Error('Tenant context not available');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', sohbetModulePath);
            
            const response = await authenticatedFetch('/api/file-manager/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload file');
            }
            
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sohbet-module-files'] });
            showToast({
                type: 'success',
                title: t('titles.dosya.yuklendi'),
                message: t('titles.dosya.basariyla.yuklendi'),
            });
        },
        onError: (error: Error) => {
            showToast({
                type: 'error',
                title: 'Hata',
                message: error.message || t('titles.dosya.yuklenirken.hata.olustu'),
            });
        },
    });

    // Delete file from file-manager
    const deleteFileMutation = useMutation({
        mutationFn: async (filePath: string) => {
            const response = await authenticatedFetch(`/api/file-manager/delete?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete file');
            }
            
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sohbet-module-files'] });
            showToast({
                type: 'success',
                title: 'Dosya silindi',
                message: t('titles.dosya.basariyla.silindi'),
            });
        },
        onError: (error: Error) => {
            showToast({
                type: 'error',
                title: 'Hata',
                message: error.message || t('titles.dosya.silinirken.hata.olustu'),
            });
        },
    });

    // Handle file download
    const handleFileDownload = async (filePath: string, fileName: string) => {
        try {
            const response = await authenticatedFetch(`/api/file-manager/download?path=${encodeURIComponent(filePath)}`);
            if (!response.ok) throw new Error('Failed to download file');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.dosya.indirilirken.hata.olustu'),
            });
        }
    };

    // Handle create group chat
    const handleCreateGroup = async () => {
        if (!user?.id) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.kullanici.bilgisi.bulunamadi'),
            });
            return;
        }
        if (selectedUsersForGroup.length === 0) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.en.az.bir.kullanici.secmelisiniz'),
            });
            return;
        }
        try {
            const requestData = {
                type: 'group' as const,
                ...(groupName && { name: groupName }),
                participants: [user.id, ...selectedUsersForGroup],
            };
            const result = await createChatRoom.mutateAsync(requestData);
            setShowCreateGroupModal(false);
            setSelectedUsersForGroup([]);
            setGroupName('');
            setSelectedRoomId(result.room.id);
            showToast({
                type: 'success',
                title: t('titles.success'),
                message: t('titles.grup.sohbeti.olusturuldu'),
            });
        } catch (error: any) {
            console.error('Create group error:', error);
            showToast({
                type: 'error',
                title: 'Hata',
                message: error.message || t('titles.grup.sohbeti.olusturulurken.hata.olustu'),
            });
        }
    };

    // Handle create direct message
    const handleCreateDirect = async () => {
        if (!user?.id) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.kullanici.bilgisi.bulunamadi'),
            });
            return;
        }
        if (!selectedUserForDirect) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.bir.kullanici.secmelisiniz'),
            });
            return;
        }
        try {
            const requestData = {
                type: 'direct' as const,
                participants: [user.id, selectedUserForDirect],
            };
            const result = await createChatRoom.mutateAsync(requestData);
            setShowCreateDirectModal(false);
            setSelectedUserForDirect(null);
            setSelectedRoomId(result.room.id);
            showToast({
                type: 'success',
                title: t('titles.success'),
                message: t('titles.sohbet.baslatildi'),
            });
        } catch (error: any) {
            console.error('Create direct error:', error);
            showToast({
                type: 'error',
                title: 'Hata',
                message: error.message || t('titles.sohbet.olusturulurken.hata.olustu'),
            });
        }
    };

    // Core File Manager for chat file uploads (for messages)
    const { uploadFile: uploadFileForMessage } = useCoreFileManager({
        tenantId: 'temp', // Will be resolved by API
        module: 'sohbet',
        entityType: 'message',
        userId: user?.id || 'temp', // We'll manually trigger uploads
    });

    // Core File Manager for chat room files (for Files tab)
    const { uploadFile: uploadFileForRoom } = useCoreFileManager({
        tenantId: 'temp', // Will be resolved by API
        module: 'sohbet',
        entityType: 'chat-room',
        ...(selectedRoomId ? { entityId: selectedRoomId } : {}),
        userId: user?.id || 'temp', // We'll manually trigger uploads
    });

    // Update sidebar visibility based on theme
    useEffect(() => {
        const isDark = colorScheme === 'dark' || (colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setShowRightSidebar(isDark);
    }, [colorScheme]);

    const handleSendMessage = async () => {
        if (!selectedRoomId || (!messageInput.trim() && selectedFiles.length === 0)) return;
        if (!user?.id) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.kullanici.bilgisi.bulunamadi'),
            });
            return;
        }
        
        // Get file IDs for uploaded files
        const fileInfos: Array<{ name: string; size: number; type: string; fileId: string }> = [];
        
        for (const file of selectedFiles) {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            const fileId = uploadedFileIds.get(fileKey);
            if (fileId) {
                fileInfos.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    fileId,
                });
            }
        }

        // Determine message type
        const messageType = fileInfos.length > 0 
            ? (fileInfos[0]?.type.startsWith('image/') ? 'image' 
              : fileInfos[0]?.type.startsWith('audio/') ? 'file' // Audio files are sent as 'file' type
              : fileInfos[0]?.type.startsWith('video/') ? 'file' // Video files are sent as 'file' type
              : 'file')
            : 'text';

        // Create message content
        const content = messageInput.trim() || (fileInfos.length > 0 
            ? `Dosya gönderildi: ${fileInfos.map(f => f.name).join(', ')}` 
            : '');

        try {
            await createMessage.mutateAsync({
                roomId: selectedRoomId,
                content,
                type: messageType,
                fileId: fileInfos[0]?.fileId,
                fileName: fileInfos[0]?.name,
                fileSize: fileInfos[0]?.size,
                fileType: fileInfos[0]?.type,
            } as any); // senderId will be added by API from header

            // Refresh files list in Files tab
            queryClient.invalidateQueries({ queryKey: ['sohbet-module-files'] });

            setMessageInput('');
            setSelectedFiles([]);
            setUploadedFileIds(new Map());
        } catch (error) {
            console.error('Error sending message:', error);
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.mesaj.gonderilirken.hata.olustu'),
            });
        }
    };

    // File upload handler - uploads files to CoreFileService
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);

        // Upload each file to CoreFileService
        for (const file of files) {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            setUploadingFiles(prev => new Map(prev).set(fileKey, true));

            try {
                // Upload file for message (entityType: 'message')
                const uploadedFileForMessage = await uploadFileForMessage({
                    file,
                    title: file.name,
                });

                // Also upload file for chat room (entityType: 'chat-room') so it appears in Files tab
                if (selectedRoomId) {
                    try {
                        await uploadFileForRoom({
                            file,
                            title: file.name,
                        });
                    } catch (roomUploadError) {
                        console.warn('Failed to upload file to chat room:', roomUploadError);
                        // Don't fail the whole operation if room upload fails
                    }
                }

                // Store the file ID for later use when sending message
                setUploadedFileIds(prev => new Map(prev).set(fileKey, uploadedFileForMessage.id));
                showToast({
                    type: 'success',
                    title: t('titles.dosya.yuklendi'),
                    message: t('titles.filename.basariyla.yuklendi'),
                });
            } catch (error) {
                console.error('Error uploading file:', error);
                showToast({
                    type: 'error',
                    title: 'Hata',
                    message: t('titles.filename.yuklenirken.hata.olustu'),
                });
                // Remove failed file from selected files
                setSelectedFiles(prev => prev.filter(f => f !== file));
            } finally {
                setUploadingFiles(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(fileKey);
                    return newMap;
                });
            }
        }
    };

    // Emoji picker handler
    const handleEmojiSelect = (emoji: string) => {
        setMessageInput(messageInput + emoji);
        setShowEmojiPicker(false);
    };

    // Voice recording handlers
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [, setAudioChunks] = useState<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                
                // Add audio file to selected files and upload
                setSelectedFiles(prev => [...prev, audioFile]);
                
                // Upload audio file
                const fileKey = `${audioFile.name}-${audioFile.size}-${audioFile.lastModified}`;
                setUploadingFiles(prev => new Map(prev).set(fileKey, true));
                
                try {
                    // Upload file for message
                    const uploadedFileForMessage = await uploadFileForMessage({
                        file: audioFile,
                        title: `Voice message ${new Date().toLocaleTimeString()}`,
                    });

                    // Also upload file for chat room
                    if (selectedRoomId) {
                        try {
                            await uploadFileForRoom({
                                file: audioFile,
                                title: `Voice message ${new Date().toLocaleTimeString()}`,
                            });
                        } catch (roomUploadError) {
                            console.warn('Failed to upload voice message to chat room:', roomUploadError);
                        }
                    }

                    setUploadedFileIds(prev => new Map(prev).set(fileKey, uploadedFileForMessage.id));
                    showToast({
                        type: 'success',
                        title: t('titles.ses.kaydi.hazir'),
                        message: t('titles.ses.kaydini.gondermek.icin.gonder.butonu'),
                    });
                } catch (error) {
                    console.error('Error uploading voice message:', error);
                    showToast({
                        type: 'error',
                        title: 'Hata',
                        message: t('titles.ses.kaydi.yuklenirken.hata.olustu'),
                    });
                    setSelectedFiles(prev => prev.filter(f => f !== audioFile));
                } finally {
                    setUploadingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(fileKey);
                        return newMap;
                    });
                }
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                setAudioChunks([]);
            };
            
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingDuration(0);
            
            // Update recording duration
            const interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
            (window as any).recordingInterval = interval;
        } catch (error) {
            console.error('Error starting recording:', error);
            showToast({
                type: 'error',
                title: 'Hata',
                message: t('titles.mikrofon.erisimi.reddedildi'),
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        clearInterval((window as any).recordingInterval);
        setRecordingDuration(0);
    };

    const cancelRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        clearInterval((window as any).recordingInterval);
        setRecordingDuration(0);
        setAudioChunks([]);
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div 
            id="chat-root" 
            className="flex w-full font-display"
            style={{
                height: '100vh',
                maxHeight: '100vh',
                minHeight: 0,
                backgroundColor: colorScheme === 'dark' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                overflow: 'hidden'
            }}
        >
            {/* Conversation List */}
            <div 
                id="chat-list-panel" 
                className={`flex flex-col border-r ${showRightSidebar ? 'w-[360px]' : 'w-full max-w-sm'}`}
                style={{
                    height: '100%',
                    borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)',
                    backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                    overflow: 'hidden'
                }}
            >
                <div className="p-4 border-b" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}>
                    <h1 className="text-xl font-bold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>Chats</h1>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setShowCreateDirectModal(true)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '4px' }}>person_add</span>
                            Yeni Sohbet
                        </button>
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: colorScheme === 'dark' ? 'var(--bg-surface)' : 'var(--bg-secondary)',
                                color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                border: `1px solid ${colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'}`,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'var(--bg-surface)' : 'var(--bg-secondary)'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '4px' }}>group_add</span>
                            Yeni Grup
                        </button>
                    </div>
                    <div className="mt-4">
                        <label className="flex flex-col min-w-40 h-11 w-full">
                            <div className="flex w-full flex-1 items-stretch rounded-lg h-full" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)' }}>
                                <div className="flex items-center justify-center pl-3 rounded-l-lg border-r-0" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                                </div>
                                <input
                                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-0 border-none focus:border-none h-full px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)'
                                    }}
                                    placeholder={t('actions.searchChats')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {roomsLoading ? (
                        <div className="flex items-center justify-center p-4">
                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="flex items-center justify-center p-4">
                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.noChats')}</p>
                        </div>
                    ) : (
                        rooms.map(room => {
                            const lastMsg = getLastMessage(room);
                            const isActive = selectedRoomId === room.id;
                            return (
                                <div
                                    key={room.id}
                                    className={`flex gap-4 px-4 py-3 justify-between cursor-pointer transition-colors ${isActive ? 'border-l-2' : ''}`}
                                    style={{
                                        backgroundColor: isActive 
                                            ? 'rgba(13, 127, 242, 0.1)' 
                                            : 'transparent',
                                        borderLeftColor: isActive ? 'var(--primary)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                    onClick={() => setSelectedRoomId(room.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <div
                                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                                                style={{ 
                                                    backgroundImage: getRoomAvatar(room) ? `url("${getRoomAvatar(room)}")` : 'none',
                                                    backgroundColor: getRoomAvatar(room) ? 'transparent' : 'var(--primary)'
                                                }}
                                            >
                                                {!getRoomAvatar(room) && (
                                                    <span className="flex items-center justify-center h-full text-white text-lg font-semibold">
                                                        {getRoomName(room).charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center">
                                            <p className="text-sm font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{getRoomName(room)}</p>
                                            {isActive ? (
                                                <p className="text-sm font-medium truncate max-w-[180px]" style={{ color: 'var(--primary)' }}>{lastMsg.text}</p>
                                            ) : (
                                                <p className="text-sm font-normal truncate max-w-[180px]" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{lastMsg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        {lastMsg.time && (
                                            <p className="text-xs font-normal" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{lastMsg.time}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Window */}
            <div id="chat-main-area" className="flex flex-1 flex-col" style={{ height: '100%', maxHeight: '100%', minHeight: 0, backgroundColor: colorScheme === 'dark' ? 'var(--bg-primary)' : 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Chat Header */}
                {activeRoom ? (
                    <div className="flex items-center justify-between p-4 border-b chat-header flex-shrink-0" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)', backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-surface)' }}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                                    style={{ 
                                        backgroundImage: activeRoom.avatarUrl ? `url("${activeRoom.avatarUrl}")` : 'none',
                                        backgroundColor: activeRoom.avatarUrl ? 'transparent' : 'var(--primary)'
                                    }}
                                >
                                    {!activeRoom.avatarUrl && (
                                        <span className="flex items-center justify-center h-full text-white text-sm font-semibold">
                                            {getRoomName(activeRoom).charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h2 className="font-semibold text-base" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{getRoomName(activeRoom)}</h2>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{activeRoom.type === 'direct' ? 'Direct message' : activeRoom.type === 'group' ? 'Group chat' : 'Channel'}</p>
                            </div>
                        </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowCallModal('video')} 
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                        </button>
                        <button 
                            onClick={() => setShowCallModal('audio')} 
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>call</span>
                        </button>
                        <button 
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
                        </button>
                        <button
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onClick={() => setShowRightSidebar(!showRightSidebar)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>more_vert</span>
                        </button>
                    </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-1">
                        <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Bir sohbet seçin</p>
                    </div>
                )}

                {/* Message Area */}
                {activeRoom && (
                <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, flex: '1 1 0%', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', padding: '24px 24px 0 24px' }}>
                    {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Mesajlar yükleniyor...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Henüz mesaj yok</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Messages */}
                            {messages.map((msg, index) => {
                                const isOwnMessage = msg.senderId === user?.id;
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const showDateSeparator = !prevMsg || formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt);
                                
                                return (
                                    <div key={msg.id}>
                                        {showDateSeparator && (
                                            <div className="flex items-center gap-2 my-4">
                                                <hr className="flex-grow border-t" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }} />
                                                <span className="text-xs font-medium" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{formatDate(msg.createdAt)}</span>
                                                <hr className="flex-grow border-t" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }} />
                                            </div>
                                        )}
                                        <div
                                            className={`flex items-end gap-3 max-w-xl ${isOwnMessage ? 'self-end ml-auto' : ''}`}
                                        >
                                            {!isOwnMessage && (() => {
                                                const senderUser = usersData?.users?.find(u => u.id === msg.senderId);
                                                return (
                                                <div
                                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0"
                                                    style={{ 
                                                            backgroundImage: senderUser?.profilePicture ? `url("${senderUser.profilePicture}")` : 'none',
                                                            backgroundColor: senderUser?.profilePicture ? 'transparent' : 'var(--primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        fontWeight: 'semibold'
                                                    }}
                                                >
                                                        {!senderUser?.profilePicture && (
                                                            <span>{senderUser?.name?.charAt(0).toUpperCase() || msg.senderId.charAt(0).toUpperCase()}</span>
                                            )}
                                                    </div>
                                                );
                                            })()}
                                            <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : ''}`}>
                                                <div
                                                    className={`p-3 rounded-xl message-bubble ${isOwnMessage ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                                                    style={{
                                                        backgroundColor: isOwnMessage 
                                                            ? 'var(--primary)' 
                                                            : (colorScheme === 'dark' ? 'var(--bg-surface)' : 'var(--bg-surface)'),
                                                        color: isOwnMessage 
                                                            ? 'white' 
                                                            : (colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)')
                                                    }}
                                                >
                                                    {msg.type === 'image' && msg.fileId ? (
                                                        <img 
                                                            src={`/api/core-files/${msg.fileId}/download?inline=true`}
                                                            crossOrigin="anonymous" 
                                                            alt={msg.fileName || 'Image'} 
                                                            className="max-w-xs rounded-lg cursor-pointer"
                                                            onClick={() => {
                                                                const fileName = msg.fileName || 'image';
                                                                const fileType = msg.fileType || 'image/jpeg';
                                                                const isImage = fileType.startsWith('image/');
                                                                const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
                                                                const fileNameLower = fileName.toLowerCase();
                                                                const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(fileNameLower);
                                                                const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileNameLower);
                                                                const isText = /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(fileNameLower);
                                                                const isMarkdown = /\.(md|markdown)$/i.test(fileNameLower);
                                                                const isWord = /\.(doc|docx)$/i.test(fileNameLower);
                                                                const isExcel = /\.(xls|xlsx)$/i.test(fileNameLower);
                                                                const canPreview = isImage || isPdf || isVideo || isAudio || isText || isMarkdown || isWord || isExcel;
                                                                
                                                                if (canPreview) {
                                                                    const getFileType = () => {
                                                                        if (isImage) return 'image';
                                                                        if (isPdf) return 'pdf';
                                                                        if (isVideo) return 'video';
                                                                        if (isAudio) return 'audio';
                                                                        if (isText) return 'text';
                                                                        if (isMarkdown) return 'markdown';
                                                                        if (isWord) return 'word';
                                                                        if (isExcel) return 'excel';
                                                                        return 'unknown';
                                                                    };
                                                                    
                                                                    // Use core-files API directly for preview
                                                                    setPreviewFile({ 
                                                                        path: `/api/core-files/${msg.fileId}/download?inline=true`, 
                                                                        name: fileName, 
                                                                        type: getFileType(), 
                                                                        mimeType: fileType 
                                                                    });
                                                                } else {
                                                                    // Download file
                                                                    window.open(`/api/core-files/${msg.fileId}/download`, '_blank');
                                                                }
                                                            }}
                                                        />
                                                    ) : msg.type === 'file' && msg.fileId ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined">description</span>
                                                            <button
                                                                onClick={() => {
                                                                    const fileName = msg.fileName || 'file';
                                                                    const fileType = msg.fileType || 'application/octet-stream';
                                                                    const fileNameLower = fileName.toLowerCase();
                                                                    const isImage = fileType.startsWith('image/');
                                                                    const isPdf = fileType === 'application/pdf' || fileNameLower.endsWith('.pdf');
                                                                    const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(fileNameLower);
                                                                    const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileNameLower);
                                                                    const isText = /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(fileNameLower);
                                                                    const isMarkdown = /\.(md|markdown)$/i.test(fileNameLower);
                                                                    const isWord = /\.(doc|docx)$/i.test(fileNameLower);
                                                                    const isExcel = /\.(xls|xlsx)$/i.test(fileNameLower);
                                                                    const canPreview = isImage || isPdf || isVideo || isAudio || isText || isMarkdown || isWord || isExcel;
                                                                    
                                                                    if (canPreview) {
                                                                        const getFileType = () => {
                                                                            if (isImage) return 'image';
                                                                            if (isPdf) return 'pdf';
                                                                            if (isVideo) return 'video';
                                                                            if (isAudio) return 'audio';
                                                                            if (isText) return 'text';
                                                                            if (isMarkdown) return 'markdown';
                                                                            if (isWord) return 'word';
                                                                            if (isExcel) return 'excel';
                                                                            return 'unknown';
                                                                        };
                                                                        
                                                                        // Use core-files API directly for preview
                                                                        setPreviewFile({ 
                                                                            path: `/api/core-files/${msg.fileId}/download?inline=true`, 
                                                                            name: fileName, 
                                                                            type: getFileType(), 
                                                                            mimeType: fileType 
                                                                        });
                                                                    } else {
                                                                        // Download file
                                                                        window.open(`/api/core-files/${msg.fileId}/download`, '_blank');
                                                                    }
                                                                }}
                                                                className="underline cursor-pointer text-sm"
                                                                style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}
                                                            >
                                                                {msg.fileName || 'File'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm">{msg.content}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs px-2" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{formatTime(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* Message Input */}
                {activeRoom ? (
                    <div className="p-4 border-t message-input-area flex-shrink-0" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)', backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-surface)' }}>
                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {selectedFiles.map((file, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center gap-2 px-3 py-1 rounded-lg"
                                    style={{ backgroundColor: 'rgba(13, 127, 242, 0.1)' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>description</span>
                                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                                    <button 
                                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} 
                                        className="transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div 
                            className="mb-2 p-3 rounded-lg border"
                            style={{
                                backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'
                            }}
                        >
                            <div className="grid grid-cols-8 gap-2">
                                {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞'].map(emoji => (
                                    <button 
                                        key={emoji} 
                                        onClick={() => handleEmojiSelect(emoji)} 
                                        className="text-2xl p-1 rounded transition-colors"
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(13, 127, 242, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="mb-2 flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-red-500">Recording {recordingDuration}s</span>
                            </div>
                            <div className="flex gap-2 ml-auto">
                                <button onClick={stopRecording} className="px-3 py-1 text-white rounded-lg text-sm transition-colors" style={{ backgroundColor: 'var(--primary)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>Send</button>
                                <button onClick={cancelRecording} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm transition-colors hover:bg-gray-600">Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)' }}>
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                            className="p-2 rounded-lg shrink-0 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_reaction</span>
                        </button>
                        <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" />
                        <button 
                            onClick={() => document.getElementById('file-upload')?.click()} 
                            className="p-2 rounded-lg shrink-0 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>attach_file</span>
                        </button>
                        {!isRecording ? (
                            <>
                                <textarea
                                    className="form-textarea w-full resize-none border-none bg-transparent focus:ring-0 text-sm chat-textarea"
                                    style={{
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder={t('chat.messagePlaceholder')}
                                    rows={1}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={startRecording} 
                                    className="p-2 rounded-lg shrink-0 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mic</span>
                                </button>
                                <button
                                    className="p-2 rounded-lg shrink-0 text-white transition-colors"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                    onClick={handleSendMessage}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>send</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Bir sohbet seçin</p>
                    </div>
                )}
            </div>

            {/* Conversation Details (Right Sidebar) */}
            {showRightSidebar && activeRoom && (
                <div 
                    id="chat-right-sidebar"
                    className="w-[320px] border-l flex flex-col"
                    style={{
                        height: '100%',
                        maxHeight: '100%',
                        minHeight: 0,
                        borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)',
                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                        overflow: 'hidden'
                    }}
                >
                    <div className="flex flex-col items-center p-6 border-b" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}>
                        <div className="relative">
                        <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20 cursor-pointer transition-opacity"
                            style={{ 
                                    backgroundImage: getRoomAvatar(activeRoom) ? `url("${getRoomAvatar(activeRoom)}")` : 'none',
                                    backgroundColor: getRoomAvatar(activeRoom) ? 'transparent' : 'var(--primary)'
                                }}
                                onClick={() => {
                                    if (activeRoom.type !== 'direct') {
                                        setShowAvatarUpload(true);
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    if (activeRoom.type !== 'direct') {
                                        e.currentTarget.style.opacity = '0.8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                            >
                                {!getRoomAvatar(activeRoom) && (
                                <span className="flex items-center justify-center h-full text-white text-2xl font-semibold">
                                    {getRoomName(activeRoom).charAt(0).toUpperCase()}
                                </span>
                                )}
                            </div>
                            {activeRoom.type !== 'direct' && (
                                <div 
                                    className="absolute bottom-0 right-0 size-6 rounded-full flex items-center justify-center cursor-pointer"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                    onClick={() => setShowAvatarUpload(true)}
                                    title={t('actions.changeAvatar')}
                                >
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>camera_alt</span>
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold mt-4" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{getRoomName(activeRoom)}</h3>
                        <p className="text-sm" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t(`roomTypes.${activeRoom.type}`)}</p>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="flex justify-around border-b" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}>
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? '' : 'border-transparent'}`}
                                style={{
                                    borderBottomColor: activeTab === 'details' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'details') {
                                        e.currentTarget.style.color = 'var(--primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'details') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                {t('tabs.details')}
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? '' : 'border-transparent'}`}
                                style={{
                                    borderBottomColor: activeTab === 'members' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'members') {
                                        e.currentTarget.style.color = 'var(--primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'members') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                {t('tabs.members')}
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files' ? '' : 'border-transparent'}`}
                                style={{
                                    borderBottomColor: activeTab === 'files' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'files' ? 'var(--primary)' : 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'files') {
                                        e.currentTarget.style.color = 'var(--primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'files') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                {t('tabs.files')}
                            </button>
                        </div>

                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="py-4 space-y-4">
                                {activeRoom.description && (
                                    <div>
                                        <h4 className="text-xs uppercase font-bold tracking-wider" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('details.description')}</h4>
                                        <p className="text-sm mt-1" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{activeRoom.description}</p>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('details.type')}</h4>
                                    <p className="text-sm mt-1" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{t(`roomTypes.${activeRoom.type}`)}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('details.participants')}</h4>
                                    <p className="text-sm mt-1" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{activeRoom.participants.length}</p>
                                </div>
                            </div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div className="py-4 space-y-3">
                                {activeRoom.participants.length === 0 ? (
                                    <p className="text-sm" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.noParticipants')}</p>
                                ) : (
                                    activeRoom.participants.map(participantId => (
                                        <ParticipantItem key={participantId} participantId={participantId} colorScheme={colorScheme} />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Files Tab */}
                        {activeTab === 'files' && (
                            <div className="py-4 space-y-2">
                                {/* Upload Button */}
                                <div className="mb-4">
                                    <input
                                        type="file"
                                        id="sohbet-module-upload"
                                        className="hidden"
                                        onChange={async (e) => {
                                            if (!e.target.files || e.target.files.length === 0) return;
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (!sohbetModulePath) {
                                                showToast({
                                                    type: 'error',
                                                    title: 'Hata',
                                                    message: t('titles.tenant.context.bulunamadi'),
                                                });
                                                return;
                                            }
                                            try {
                                                await uploadFileMutation.mutateAsync({ file });
                                            } catch (error) {
                                                // Error already handled in mutation
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                    <button
                                        onClick={() => document.getElementById('sohbet-module-upload')?.click()}
                                        className="w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                        style={{
                                            backgroundColor: 'var(--primary)',
                                            color: 'white',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                        disabled={uploadFileMutation.isPending}
                                    >
                                        {uploadFileMutation.isPending ? t('actions.uploading') : t('actions.uploadFile')}
                                    </button>
                                </div>

                                {/* Files List */}
                                {filesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <p className="text-sm" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                    </div>
                                ) : !sohbetModuleFiles || sohbetModuleFiles.length === 0 ? (
                                    <p className="text-sm text-center py-8" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.noFiles')}</p>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {sohbetModuleFiles
                                            .filter((file: any) => file.type === 'file') // Only show files, not folders
                                            .map((file: any) => {
                                                const fileName = file.name.toLowerCase();
                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(fileName);
                                                const isPdf = /\.pdf$/i.test(fileName);
                                                const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(fileName);
                                                const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileName);
                                                const isText = /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(fileName);
                                                const isMarkdown = /\.(md|markdown)$/i.test(fileName);
                                                const isWord = /\.(doc|docx)$/i.test(fileName);
                                                const isExcel = /\.(xls|xlsx)$/i.test(fileName);
                                                const canPreview = isImage || isPdf || isVideo || isAudio || isText || isMarkdown || isWord || isExcel;
                                                
                                                const getFileType = () => {
                                                    if (isImage) return 'image';
                                                    if (isPdf) return 'pdf';
                                                    if (isVideo) return 'video';
                                                    if (isAudio) return 'audio';
                                                    if (isText) return 'text';
                                                    if (isMarkdown) return 'markdown';
                                                    if (isWord) return 'word';
                                                    if (isExcel) return 'excel';
                                                    return 'unknown';
                                                };
                                                
                                                return (
                                                    <div 
                                                        key={file.id} 
                                                        className="flex items-center gap-3 p-2 rounded-lg transition-colors group"
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                        <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(13, 127, 242, 0.2)' }}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                                                                {isImage ? 'image' : isPdf ? 'picture_as_pdf' : isVideo ? 'video_library' : isAudio ? 'audio_file' : isText ? 'text_snippet' : isMarkdown ? t('table.description') : isWord ? t('table.description') : isExcel ? 'table_chart' : t('table.description')}
                                                    </span>
                                                </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p 
                                                                className="text-sm font-medium truncate cursor-pointer" 
                                                                style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (canPreview) {
                                                                        setPreviewFile({ path: file.path, name: file.name, type: getFileType(), mimeType: file.mimeType });
                                                                    } else {
                                                                        handleFileDownload(file.path, file.name);
                                                                    }
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                title={file.name}
                                                            >
                                                                {file.name}
                                                            </p>
                                                            {file.size && (
                                                        <p className="text-xs" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>
                                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    )}
                                                </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {canPreview && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewFile({ path: file.path, name: file.name, type: getFileType(), mimeType: file.mimeType });
                                                                    }}
                                                                    className="p-1 rounded"
                                                                    style={{ color: 'var(--text-secondary)' }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.color = 'var(--primary)';
                                                                        e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.1)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                    title={t('titles.onizle')}
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleFileDownload(file.path, file.name);
                                                                }}
                                                                className="p-1 rounded"
                                                                style={{ color: 'var(--text-secondary)' }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.color = 'var(--primary)';
                                                                    e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.1)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                }}
                                                                title={t('titles.download')}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const confirmed = await confirm({
                                                                        title: t('common.confirm'),
                                                                        message: t('common.bu.dosyayi.silmek.istediginizden.emin.mi'),
                                                                        confirmLabel: t('actions.delete'),
                                                                        confirmColor: 'red',
                                                                    });
                                                                    if (confirmed) {
                                                                        try {
                                                                            await deleteFileMutation.mutateAsync(file.path);
                                                                        } catch (error) {
                                                                            // Error already handled in mutation
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-1 rounded"
                                                                style={{ color: 'var(--text-secondary)' }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.color = 'var(--error)';
                                                                    e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                }}
                                                                disabled={deleteFileMutation.isPending}
                                                                title={t('actions.delete')}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewFile(null)}>
                    <div 
                        className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                {previewFile.name}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFileDownload(previewFile.path, previewFile.name)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '4px' }}>download</span>
                                    {t('actions.download')}
                                </button>
                                <button 
                                    onClick={() => setPreviewFile(null)} 
                                    className="p-2 rounded transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                            {previewFile.type === 'image' ? (
                                previewBlobUrl ? (
                                    <img 
                                        src={previewBlobUrl}
                                        alt={previewFile.name}
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                        onError={(e) => {
                                            console.error('Image load error:', e);
                                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                    </div>
                                )
                            ) : previewFile.type === 'pdf' ? (
                                previewBlobUrl ? (
                                    <iframe
                                        src={previewBlobUrl + '#toolbar=1'}
                                        className="w-full h-[70vh] rounded-lg border"
                                        style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}
                                        title={previewFile.name}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                    </div>
                                )
                            ) : previewFile.type === 'video' ? (
                                previewBlobUrl ? (
                                    <video
                                        src={previewBlobUrl}
                                        controls
                                        className="max-w-full max-h-[70vh] rounded-lg"
                                        style={{ backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLVideoElement;
                                            const error = target.error;
                                            let errorMessage = t('errors.videoLoadFailed.message');
                                            
                                            if (error) {
                                                const errorType = error.code === 1 ? 'MEDIA_ERR_ABORTED' 
                                                    : error.code === 2 ? 'MEDIA_ERR_NETWORK' 
                                                    : error.code === 3 ? 'MEDIA_ERR_DECODE' 
                                                    : error.code === 4 ? 'MEDIA_ERR_SRC_NOT_SUPPORTED' 
                                                    : 'UNKNOWN_ERROR';
                                                console.error('Video load error:', {
                                                    error,
                                                    errorCode: error.code,
                                                    errorType,
                                                    errorMessage: error.message,
                                                    src: target.src,
                                                    fileName: previewFile.name,
                                                });
                                            } else {
                                                console.error('Video load error (no error object):', {
                                                    src: target.src,
                                                    fileName: previewFile.name,
                                                });
                                            }
                                            
                                            showToast({
                                                type: 'error',
                                                title: t('errors.videoLoadFailed.title'),
                                                message: errorMessage,
                                            });
                                        }}
                                    >
                                        {t('fileTypes.browserNotSupported.video')}
                                    </video>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                    </div>
                                )
                            ) : previewFile.type === 'audio' ? (
                                <div className="w-full max-w-md p-6 rounded-lg" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)' }}>
                                    {previewBlobUrl ? (
                                        <audio
                                            src={previewBlobUrl}
                                            controls
                                            className="w-full"
                                            onError={(e) => {
                                                const target = e.target as HTMLAudioElement;
                                                const error = target.error;
                                                let errorMessage = t('errors.audioLoadFailed.message');
                                                
                                                if (error) {
                                                    const errorType = error.code === 1 ? 'MEDIA_ERR_ABORTED' 
                                                        : error.code === 2 ? 'MEDIA_ERR_NETWORK' 
                                                        : error.code === 3 ? 'MEDIA_ERR_DECODE' 
                                                        : error.code === 4 ? 'MEDIA_ERR_SRC_NOT_SUPPORTED' 
                                                        : 'UNKNOWN_ERROR';
                                                    console.error('Audio load error:', {
                                                        error,
                                                        errorCode: error.code,
                                                        errorType,
                                                        errorMessage: error.message,
                                                        src: target.src,
                                                        fileName: previewFile.name,
                                                    });
                                                } else {
                                                    console.error('Audio load error (no error object):', {
                                                        src: target.src,
                                                        fileName: previewFile.name,
                                                    });
                                                }
                                                
                                                showToast({
                                                    type: 'error',
                                                    title: t('errors.audioLoadFailed.title'),
                                                    message: errorMessage,
                                                });
                                            }}
                                        >
                                            {t('fileTypes.browserNotSupported.audio')}
                                        </audio>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                        </div>
                                    )}
                                </div>
                            ) : previewFile.type === 'text' || previewFile.type === 'markdown' ? (
                                <div className="w-full h-[70vh] overflow-auto rounded-lg border p-4" style={{ 
                                    borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)',
                                    backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                }}>
                                    {loadingText ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.loading')}</p>
                                        </div>
                                    ) : previewFile.type === 'markdown' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none" style={{ 
                                            color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' 
                                        }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {textContent}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-mono text-sm" style={{ 
                                            color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' 
                                        }}>
                                            {textContent}
                                        </pre>
                                    )}
                                </div>
                            ) : previewFile.type === 'word' || previewFile.type === 'excel' ? (
                                <div className="w-full h-[70vh] flex flex-col items-center justify-center p-8 rounded-lg border" style={{ 
                                    borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)',
                                    backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                }}>
                                    <div className="text-6xl mb-4">
                                        {previewFile.type === 'word' ? '📝' : '📊'}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                        {previewFile.type === 'word' ? t('fileTypes.wordDocument') : t('fileTypes.excelFile')}
                                    </h3>
                                    <p className="text-sm text-center mb-6 max-w-md" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>
                                        {t('fileTypes.cannotPreview')}
                                    </p>
                                    <button
                                        onClick={() => handleFileDownload(previewFile.path, previewFile.name)}
                                        className="px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: 'var(--primary)',
                                            color: 'white',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>download</span>
                                        {t('actions.downloadFile')}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateGroupModal(false)}>
                    <div 
                        className="rounded-xl p-6 max-w-md w-full mx-4" 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                {t('actions.newGroupChat')}
                            </h3>
                            <button 
                                onClick={() => setShowCreateGroupModal(false)} 
                                className="p-1 rounded transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                    {t('forms.groupName')}
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder={t('forms.groupNamePlaceholder')}
                                    className="w-full px-4 py-2 rounded-lg border text-sm"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                    Kullanıcılar
                                </label>
                                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}>
                                    {availableUsers.length === 0 ? (
                                        <p className="text-sm text-center py-4" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Kullanıcı bulunamadı</p>
                                    ) : (
                                        availableUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                                                onClick={() => {
                                                    if (selectedUsersForGroup.includes(u.id)) {
                                                        setSelectedUsersForGroup(selectedUsersForGroup.filter(id => id !== u.id));
                                                    } else {
                                                        setSelectedUsersForGroup([...selectedUsersForGroup, u.id]);
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: selectedUsersForGroup.includes(u.id)
                                                        ? 'rgba(13, 127, 242, 0.1)'
                                                        : 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedUsersForGroup.includes(u.id)) {
                                                        e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedUsersForGroup.includes(u.id)) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                                                    <span className="text-white text-sm font-semibold">
                                                        {u.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{u.name}</p>
                                                    {u.email && (
                                                        <p className="text-xs" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{u.email}</p>
                                                    )}
                                                </div>
                                                {selectedUsersForGroup.includes(u.id) && (
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>check_circle</span>
                                                )}
                                            </div>
                                        ))
                                )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowCreateGroupModal(false);
                                        setSelectedUsersForGroup([]);
                                        setGroupName('');
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                        border: `1px solid ${colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'}`,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)'}
                                >
                                    {t('actions.cancel')}
                                </button>
                                <button
                                    onClick={handleCreateGroup}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    disabled={createChatRoom.isPending || selectedUsersForGroup.length === 0}
                                >
                                    {createChatRoom.isPending ? t('actions.uploading') : t('actions.create')}
                                </button>
                            </div>
                        </div>
                    </div>
                            </div>
                        )}

            {/* Create Direct Message Modal */}
            {showCreateDirectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateDirectModal(false)}>
                    <div 
                        className="rounded-xl p-6 max-w-md w-full mx-4" 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                {t('actions.newChat')}
                            </h3>
                            <button 
                                onClick={() => setShowCreateDirectModal(false)} 
                                className="p-1 rounded transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                    </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                    {t('forms.selectUser')}
                                </label>
                                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2" style={{ borderColor: colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)' }}>
                                    {availableUsers.length === 0 ? (
                                        <p className="text-sm text-center py-4" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{t('actions.noUsersFound')}</p>
                                    ) : (
                                        availableUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                                                onClick={() => setSelectedUserForDirect(u.id)}
                                                style={{
                                                    backgroundColor: selectedUserForDirect === u.id
                                                        ? 'rgba(13, 127, 242, 0.1)'
                                                        : 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (selectedUserForDirect !== u.id) {
                                                        e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedUserForDirect !== u.id) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                                                    <span className="text-white text-sm font-semibold">
                                                        {u.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{u.name}</p>
                                                    {u.email && (
                                                        <p className="text-xs" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>{u.email}</p>
                                                    )}
                                                </div>
                                                {selectedUserForDirect === u.id && (
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>check_circle</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowCreateDirectModal(false);
                                        setSelectedUserForDirect(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                        border: `1px solid ${colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'}`,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)'}
                                >
                                    {t('actions.cancel')}
                                </button>
                                <button
                                    onClick={handleCreateDirect}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    disabled={createChatRoom.isPending || !selectedUserForDirect}
                                >
                                    {createChatRoom.isPending ? t('actions.uploading') : t('actions.create')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Call Modal */}
            {showCallModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCallModal(null)}>
                    <div 
                        className="rounded-xl p-6 max-w-md w-full mx-4" 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                {showCallModal === 'video' ? 'Video Call' : 'Voice Call'}
                            </h3>
                            <button 
                                onClick={() => setShowCallModal(null)} 
                                className="p-1 rounded transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="text-center py-8">
                            {activeRoom && (
                                <>
                                    <div className="mb-4">
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20 mx-auto"
                                            style={{ 
                                                backgroundImage: activeRoom.avatarUrl ? `url("${activeRoom.avatarUrl}")` : 'none',
                                                backgroundColor: activeRoom.avatarUrl ? 'transparent' : 'var(--primary)'
                                            }}
                                        >
                                            {!activeRoom.avatarUrl && (
                                                <span className="flex items-center justify-center h-full text-white text-3xl font-semibold">
                                                    {getRoomName(activeRoom).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-lg font-medium mb-2" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>{getRoomName(activeRoom)}</p>
                                </>
                            )}
                            <p className="text-sm mb-6" style={{ color: colorScheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary)' }}>Calling...</p>
                            <div className="flex gap-4 justify-center">
                                <button className="p-4 bg-red-500 text-white rounded-full transition-colors hover:bg-red-600">
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>call_end</span>
                                </button>
                                <button className="p-4 bg-green-500 text-white rounded-full transition-colors hover:bg-green-600">
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>call</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Upload Modal */}
            {showAvatarUpload && activeRoom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAvatarUpload(false)}>
                    <div 
                        className="rounded-xl p-6 max-w-md w-full mx-4" 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)' }}>
                                {t('actions.changeAvatar')}
                            </h3>
                            <button 
                                onClick={() => setShowAvatarUpload(false)} 
                                className="p-1 rounded transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="avatar-upload-input"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAvatarUploadFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                {avatarUploadFile ? (
                                    <img 
                                        src={URL.createObjectURL(avatarUploadFile)} 
                                        alt="Preview" 
                                        className="w-32 h-32 rounded-full object-cover mb-4"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary)' }}>
                                        <span className="text-white text-4xl font-semibold">
                                            {getRoomName(activeRoom).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => document.getElementById('avatar-upload-input')?.click()}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                        border: `1px solid ${colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'}`,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)'}
                                >
                                    {avatarUploadFile ? t('actions.change') : t('actions.selectImage')}
                                </button>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowAvatarUpload(false);
                                        setAvatarUploadFile(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: colorScheme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                        color: colorScheme === 'dark' ? 'var(--text-dark)' : 'var(--text-primary)',
                                        border: `1px solid ${colorScheme === 'dark' ? 'var(--border-dark)' : 'var(--border-color)'}`,
                                    }}
                                >
                                    {t('actions.cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!avatarUploadFile || !activeRoom) return;
                                        
                                        try {
                                            // Upload avatar image to CoreFileService
                                            const formData = new FormData();
                                            formData.append('file', avatarUploadFile);
                                            formData.append('module', 'sohbet');
                                            formData.append('entityType', 'chat-room');
                                            formData.append('entityId', activeRoom.id);
                                            formData.append('title', `Avatar for ${getRoomName(activeRoom)}`);
                                            
                                            const uploadResponse = await authenticatedFetch('/api/core-files', {
                                                method: 'POST',
                                                body: formData,
                                            });
                                            
                                            if (!uploadResponse.ok) {
                                                throw new Error('Failed to upload avatar');
                                            }
                                            
                                            const uploadResult = await uploadResponse.json();
                                            const avatarUrl = `/api/core-files/${uploadResult.data.file.id}/download?inline=true`;
                                            
                                            // Update chat room with new avatar URL
                                            await updateChatRoom.mutateAsync({
                                                id: activeRoom.id,
                                                data: { avatarUrl },
                                            });
                                            
                                            setShowAvatarUpload(false);
                                            setAvatarUploadFile(null);
                                            showToast({
                                                type: 'success',
                                                title: t('titles.success'),
                                                message: t('titles.avatar.guncellendi'),
                                            });
                                        } catch (error: any) {
                                            console.error('Error updating avatar:', error);
                                            showToast({
                                                type: 'error',
                                                title: 'Hata',
                                                message: error.message || t('titles.avatar.guncellenirken.hata.olustu'),
                                            });
                                        }
                                    }}
                                    disabled={!avatarUploadFile || updateChatRoom.isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        opacity: (!avatarUploadFile || updateChatRoom.isPending) ? 0.5 : 1,
                                    }}
                                >
                                    {updateChatRoom.isPending ? t('actions.saving') : t('actions.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog />
        </div>
    );
}
