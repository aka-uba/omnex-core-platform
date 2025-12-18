import { z } from 'zod';

export const templateVariableSchema = z.object({
  key: z.string().min(1, 'Variable key is required'),
  label: z.string().min(1, 'Variable label is required'),
  description: z.string().optional(),
  type: z.enum(['string', 'number', 'date', 'currency', 'boolean']),
  required: z.boolean().optional().default(false),
  defaultValue: z.any().optional(),
});

export const emailTemplateCategorySchema = z.enum([
  'promotion',
  'announcement',
  'reminder',
  'welcome',
  'agreement',
]);

export const emailTemplateCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  category: emailTemplateCategorySchema,
  subject: z.string().min(1, 'Email subject is required').max(255),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  variables: z.array(templateVariableSchema).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const emailTemplateUpdateSchema = emailTemplateCreateSchema.partial();








