import { z } from 'zod';

export const agreementReportRecipientSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  type: z.enum(['tenant', 'contact', 'manual']).optional(),
});

export const agreementReportCreateSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  type: z.enum(['boss', 'owner', 'tenant', 'internal']),
  apartmentId: z.string().uuid('Apartment ID is required'),
  contractId: z.string().uuid().optional(),
  agreementStatus: z.enum(['pre_agreement', 'signed', 'delivery_scheduled', 'deposit_received']),
  rentAmount: z.number().positive().optional(),
  deposit: z.number().positive().optional(),
  deliveryDate: z.coerce.date().optional(),
  contractDate: z.coerce.date().optional(),
  specialTerms: z.string().optional(),
  nextSteps: z.string().optional(),
  recipients: z.array(agreementReportRecipientSchema).min(1, 'At least one recipient is required'),
  attachments: z.array(z.string()).optional(),
});

export const agreementReportUpdateSchema = agreementReportCreateSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'viewed']).optional(),
});

export type AgreementReportFormValues = z.infer<typeof agreementReportCreateSchema>;

