import { z } from 'zod';

export const contractTypeSchema = z.enum(['rental', 'sale', 'lease']);
export const contractStatusSchema = z.enum(['draft', 'active', 'expired', 'terminated']);
export const paymentTypeSchema = z.enum(['cash', 'bank_transfer', 'auto_debit']);

export const contractSchema = z.object({
  apartmentId: z.string().min(1, 'Apartment is required'),
  tenantRecordId: z.string().min(1, 'Tenant is required'),
  templateId: z.string().optional().nullable(),
  contractNumber: z.string().min(1, 'Contract number is required'),
  type: contractTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  rentAmount: z.number().min(0, 'Rent amount must be positive'),
  deposit: z.number().min(0).optional().nullable(),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  paymentType: paymentTypeSchema.optional().nullable(),
  paymentDay: z.number().min(1).max(31).optional().nullable(),
  autoRenewal: z.boolean().default(false),
  renewalNoticeDays: z.number().int().min(0).max(365).optional().nullable().default(30),
  increaseRate: z.number().min(0).max(1).optional().nullable(),
  status: contractStatusSchema.default('active'),
  documents: z.array(z.string()).default([]),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ContractFormValues = z.infer<typeof contractSchema>;

// Create and update schemas
export const contractCreateSchema = contractSchema.omit({ isActive: true });
export const contractUpdateSchema = contractSchema.partial();

