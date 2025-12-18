// Chat Module Zod Schemas (FAZ 3)

import { z } from 'zod';

export const chatRoomTypeSchema = z.enum(['direct', 'group', 'channel']);
export const chatMessageTypeSchema = z.enum(['text', 'file', 'image', 'system']);

export const chatRoomCreateSchema = z.object({
  name: z.string().optional().nullable(),
  type: chatRoomTypeSchema.default('direct'),
  participants: z.array(z.string().min(1, 'Participant ID cannot be empty')).min(1, 'At least one participant is required'),
  description: z.string().optional().nullable(),
  avatarUrl: z.string().min(1).optional().nullable(), // Accept both absolute and relative URLs
});

export const chatRoomUpdateSchema = chatRoomCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const chatMessageCreateSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  senderId: z.string().min(1).optional(), // Optional, can be from header
  content: z.string().min(1, 'Content is required'),
  type: chatMessageTypeSchema.default('text'),
  fileId: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  fileType: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
}).refine((data) => {
  // If type is file/image, fileName should be provided (fileId can be null if file not uploaded yet)
  if ((data.type === 'file' || data.type === 'image') && !data.fileName) {
    return false;
  }
  return true;
}, {
  message: 'File name is required for file/image messages',
  path: ['fileName'],
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

