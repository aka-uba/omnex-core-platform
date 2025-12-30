import { z } from 'zod';

export const maintenanceTypeSchema = z.enum(['preventive', 'corrective', 'emergency']);
export const maintenanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

// Helper for cost fields - accepts number, string, null, or undefined
const costSchema = z.union([
  z.number().nonnegative(),
  z.string().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }),
  z.null(),
]).nullable().optional();

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
  estimatedCost: costSchema,
  actualCost: costSchema,
  documents: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
});

export const realEstateMaintenanceRecordUpdateSchema = realEstateMaintenanceRecordCreateSchema.partial();

export type RealEstateMaintenanceRecordFormValues = z.infer<typeof realEstateMaintenanceRecordCreateSchema>;








