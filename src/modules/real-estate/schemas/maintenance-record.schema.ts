import { z } from 'zod';

export const maintenanceTypeSchema = z.enum(['preventive', 'corrective', 'emergency']);
export const maintenanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const realEstateMaintenanceRecordCreateSchema = z.object({
  apartmentId: z.string().uuid('Apartment ID is required'),
  type: maintenanceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: maintenanceStatusSchema.optional(),
  scheduledDate: z.coerce.date(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  assignedStaffId: z.string().uuid().nullable().optional(),
  performedByStaffId: z.string().uuid().nullable().optional(),
  estimatedCost: z.number().positive().nullable().optional(),
  actualCost: z.number().positive().nullable().optional(),
  documents: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
});

export const realEstateMaintenanceRecordUpdateSchema = realEstateMaintenanceRecordCreateSchema.partial();

export type RealEstateMaintenanceRecordFormValues = z.infer<typeof realEstateMaintenanceRecordCreateSchema>;








