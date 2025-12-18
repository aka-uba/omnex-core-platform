import { z } from 'zod';

export const reminderTypeSchema = z.enum([
  'contract_renewal',
  'payment_due',
  'payment_overdue',
  'appointment_upcoming',
  'maintenance_scheduled',
  'contract_expiring',
  'document_expiring',
  'custom',
]);

export const reminderPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const reminderCreateSchema = z.object({
  type: reminderTypeSchema,
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: reminderPrioritySchema.optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().uuid('Entity ID is required'),
  scheduledDate: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const reminderUpdateSchema = reminderCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  sentAt: z.date().optional(),
});

export type ReminderFormValues = z.infer<typeof reminderCreateSchema>;








