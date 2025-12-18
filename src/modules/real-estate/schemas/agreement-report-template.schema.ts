import { z } from 'zod';

export const reportTemplateVariableSchema = z.object({
  key: z.string().min(1, 'Variable key is required'),
  label: z.string().min(1, 'Variable label is required'),
  description: z.string().optional(),
  type: z.enum(['string', 'number', 'date', 'currency', 'boolean']),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
});

export const agreementReportTemplateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['boss', 'owner', 'tenant', 'internal']),
  description: z.string().optional(),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  variables: z.array(reportTemplateVariableSchema).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const agreementReportTemplateUpdateSchema = agreementReportTemplateCreateSchema.partial();

export type AgreementReportTemplateFormValues = z.infer<typeof agreementReportTemplateCreateSchema>;








