// Chat Module Types (FAZ 3)

export type ChatRoomType = 'direct' | 'group' | 'channel';
export type ChatMessageType = 'text' | 'file' | 'image' | 'system';

export interface ChatRoom {
  id: string;
  tenantId: string;
  name?: string | null;
  type: ChatRoomType;
  participants: string[];
  description?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  roomId: string;
  senderId: string;
  content: string;
  type: ChatMessageType;
  fileId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  room?: ChatRoom;
}

export interface ChatRoomCreateInput {
  name?: string;
  type?: ChatRoomType;
  participants: string[];
  description?: string;
  avatarUrl?: string;
}

export interface ChatRoomUpdateInput {
  name?: string;
  type?: ChatRoomType;
  participants?: string[];
  description?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface ChatMessageCreateInput {
  roomId: string;
  content: string;
  type?: ChatMessageType;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessageUpdateInput {
  content?: string;
  isRead?: boolean;
  metadata?: Record<string, any>;
}

export interface ChatRoomListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ChatRoomType;
  isActive?: boolean;
  participantId?: string;
}

export interface ChatMessageListParams {
  page?: number;
  pageSize?: number;
  roomId: string;
  search?: string;
  type?: ChatMessageType;
  isRead?: boolean;
  senderId?: string;
}






