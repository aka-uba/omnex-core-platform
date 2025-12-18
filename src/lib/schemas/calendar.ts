import { z } from 'zod';

// Calendar Event Schema
export const calendarEventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  date: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  client: z.string().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published', 'needs-revision', 'cancelled']).default('scheduled'),
  color: z.enum(['yellow', 'green', 'red', 'blue', 'purple', 'slate']).optional().nullable(),
  locationId: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  module: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const calendarEventCreateSchema = calendarEventSchema.omit({ id: true });

export const calendarEventUpdateSchema = calendarEventSchema.partial();

export const calendarEventQuerySchema = z.object({
  page: z.string().nullable().optional().transform(val => val || '1'),
  pageSize: z.string().nullable().optional().transform(val => val || '10'),
  search: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'needs-revision', 'cancelled']).optional(),
  client: z.string().optional(),
  module: z.string().optional(),
  locationId: z.string().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  companyId: z.string().optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarEventCreate = z.infer<typeof calendarEventCreateSchema>;
export type CalendarEventUpdate = z.infer<typeof calendarEventUpdateSchema>;
export type CalendarEventQuery = z.infer<typeof calendarEventQuerySchema>;

