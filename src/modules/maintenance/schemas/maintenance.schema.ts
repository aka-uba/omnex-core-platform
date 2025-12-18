import { z } from 'zod';

export const maintenanceTypeSchema = z.enum(['preventive', 'corrective', 'emergency']);
export const maintenanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const maintenanceRecordSchema = z.object({
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  equipmentId: z.string().uuid('Equipment ID must be a valid UUID'),
  type: maintenanceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().datetime('Scheduled date must be a valid date'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  performedBy: z.string().uuid().optional().nullable(),
  estimatedCost: z.number().min(0, 'Estimated cost must be greater than or equal to 0').optional().nullable(),
  actualCost: z.number().min(0, 'Actual cost must be greater than or equal to 0').optional().nullable(),
  notes: z.string().optional().nullable(),
  documents: z.array(z.string()).default([]),
  status: maintenanceStatusSchema.default('scheduled'),
  isActive: z.boolean().default(true),
});

export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordSchema>;

export const maintenanceRecordCreateSchema = maintenanceRecordSchema.omit({ status: true, isActive: true });
export const maintenanceRecordUpdateSchema = maintenanceRecordSchema.partial();







