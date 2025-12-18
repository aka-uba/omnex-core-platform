import { z } from 'zod';

export const maintenanceTypeSchema = z.enum(['preventive', 'corrective', 'emergency']);
export const maintenanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const realEstateMaintenanceRecordCreateSchema = z.object({
  apartmentId: z.string().uuid('Apartment ID is required'),
  type: maintenanceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: maintenanceStatusSchema.optional(),
  scheduledDate: z.coerce.date(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  assignedStaffId: z.string().uuid().optional(),
  performedByStaffId: z.string().uuid().optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  documents: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const realEstateMaintenanceRecordUpdateSchema = realEstateMaintenanceRecordCreateSchema.partial();

export type RealEstateMaintenanceRecordFormValues = z.infer<typeof realEstateMaintenanceRecordCreateSchema>;








