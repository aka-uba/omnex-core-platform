import { z } from 'zod';

export const contractTemplateTypeSchema = z.enum(['rental', 'sale', 'lease', 'general']);

export const contractTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional().nullable(),
  type: contractTemplateTypeSchema,
  category: z.string().optional().nullable(),
  content: z.string().min(1, 'Template content is required'),
  variables: z.record(z.string(), z.any()).optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ContractTemplateFormValues = z.infer<typeof contractTemplateSchema>;

// Create and update schemas
export const contractTemplateCreateSchema = contractTemplateSchema.omit({ isActive: true });
export const contractTemplateUpdateSchema = contractTemplateSchema.partial();








