// Chat Module Zod Schemas (FAZ 3)

import { z } from 'zod';

export const chatRoomTypeSchema = z.enum(['direct', 'group', 'channel']);
export const chatMessageTypeSchema = z.enum(['text', 'file', 'image', 'system']);

export const chatRoomCreateSchema = z.object({
  name: z.string().optional(),
  type: chatRoomTypeSchema.default('direct'),
  participants: z.array(z.string().uuid()).min(1, 'At least one participant is required'),
  description: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const chatRoomUpdateSchema = chatRoomCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const chatMessageCreateSchema = z.object({
  roomId: z.string().uuid(),
  senderId: z.string().uuid().optional(), // Optional, can be from header
  content: z.string().min(1, 'Content is required'),
  type: chatMessageTypeSchema.default('text'),
  fileId: z.string().uuid().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  fileType: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
}).refine((data) => {
  // If type is file/image, fileId should be provided
  if ((data.type === 'file' || data.type === 'image') && !data.fileId) {
    return false;
  }
  return true;
}, {
  message: 'File ID is required for file/image messages',
  path: ['fileId'],
});

export const chatMessageUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  isRead: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
}).refine((data) => {
  // At least one field should be provided
  return data.content !== undefined || data.isRead !== undefined || data.metadata !== undefined;
}, {
  message: 'At least one field must be provided for update',
});

export type ChatRoomCreateInput = z.infer<typeof chatRoomCreateSchema>;
export type ChatRoomUpdateInput = z.infer<typeof chatRoomUpdateSchema>;
export type ChatMessageCreateInput = z.infer<typeof chatMessageCreateSchema>;
export type ChatMessageUpdateInput = z.infer<typeof chatMessageUpdateSchema>;

