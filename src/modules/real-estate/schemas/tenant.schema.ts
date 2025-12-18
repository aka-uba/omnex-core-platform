import { z } from 'zod';

export const tenantSchema = z.object({
  userId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  tenantNumber: z.string().optional().nullable(),
  moveInDate: z.date().optional().nullable(),
  moveOutDate: z.date().optional().nullable(),
  paymentScore: z.number().min(0).max(100).optional().nullable(),
  contactScore: z.number().min(0).max(100).optional().nullable(),
  maintenanceScore: z.number().min(0).max(100).optional().nullable(),
  overallScore: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  analysis: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

// Create and update schemas
export const tenantCreateSchema = tenantSchema.omit({ isActive: true });
export const tenantUpdateSchema = tenantSchema.partial();

