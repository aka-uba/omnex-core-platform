import { z } from 'zod';

export const appointmentTypeSchema = z.enum(['viewing', 'delivery', 'maintenance', 'inspection', 'meeting']);
export const appointmentStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'no_show']);
export const interestLevelSchema = z.enum(['high', 'medium', 'low']);

export const externalParticipantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const appointmentResultSchema = z.object({
  notes: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
});

export const appointmentSchema = z.object({
  apartmentId: z.string().optional().nullable(),
  type: appointmentTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  duration: z.number().int().min(1).optional().nullable(),
  staffIds: z.array(z.string()).default([]),
  externalParticipants: z.array(externalParticipantSchema).optional().nullable(),
  status: appointmentStatusSchema.default('scheduled'),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.coerce.date().optional().nullable(),
  followUpNotes: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  calendarEventId: z.string().optional().nullable(),
  result: appointmentResultSchema.optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  interestLevel: interestLevelSchema.optional().nullable(),
}).refine((data) => {
  return data.endDate >= data.startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// Create and update schemas
export const appointmentCreateSchema = appointmentSchema;
export const appointmentUpdateSchema = appointmentSchema.partial();

