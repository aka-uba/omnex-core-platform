import { z } from 'zod';

export const bulkOperationTypeSchema = z.enum([
  'rent_increase',
  'fee_update',
  'status_update',
  'contract_renewal',
  'payment_generate',
  'custom',
]);

export const bulkOperationStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const rentIncreaseParamsSchema = z.object({
  apartmentIds: z.array(z.string().uuid()).optional(),
  contractIds: z.array(z.string().uuid()).optional(),
  increaseType: z.enum(['percentage', 'fixed']),
  increaseValue: z.number().positive(),
  effectiveDate: z.coerce.date(),
  notifyTenants: z.boolean().optional(),
  createNewPayments: z.boolean().optional(),
});

export const feeUpdateParamsSchema = z.object({
  apartmentIds: z.array(z.string().uuid()).optional(),
  feeType: z.enum(['maintenance', 'utility', 'other']),
  newAmount: z.number().positive(),
  effectiveDate: z.coerce.date(),
  notifyTenants: z.boolean().optional(),
});

export const bulkOperationCreateSchema = z.object({
  type: bulkOperationTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.any()),
  entityIds: z.array(z.string().uuid()).optional(),
});

export const bulkOperationUpdateSchema = z.object({
  status: bulkOperationStatusSchema.optional(),
  affectedCount: z.number().int().nonnegative().optional(),
  successCount: z.number().int().nonnegative().optional(),
  failedCount: z.number().int().nonnegative().optional(),
  results: z.record(z.string(), z.any()).optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});

export type BulkOperationFormValues = z.infer<typeof bulkOperationCreateSchema>;








