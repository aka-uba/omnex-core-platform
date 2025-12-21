import { z } from 'zod';

// Expense Categories
export const expenseCategorySchema = z.enum([
  'utilities',
  'maintenance',
  'insurance',
  'taxes',
  'management',
  'cleaning',
  'heating',
  'other',
]);

// Distribution Methods
export const distributionMethodSchema = z.enum([
  'equal',
  'area_based',
  'custom',
]);

// PropertyExpense Create Schema
export const propertyExpenseCreateSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  name: z.string().min(1, 'Name is required').max(255),
  category: expenseCategorySchema,
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12).optional(),
  description: z.string().max(1000).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  invoiceNumber: z.string().max(100).optional(),
  vendorName: z.string().max(255).optional(),
});

// PropertyExpense Update Schema
export const propertyExpenseUpdateSchema = propertyExpenseCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  isDistributed: z.boolean().optional(),
  distributionMethod: distributionMethodSchema.optional(),
});

// Reconciliation Status
export const reconciliationStatusSchema = z.enum([
  'draft',
  'calculated',
  'finalized',
  'cancelled',
]);

// SideCostReconciliation Create Schema
export const reconciliationCreateSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  year: z.number().int().min(2000).max(2100),
  distributionMethod: distributionMethodSchema,
  fiscalYearStart: z.string().optional(),
  fiscalYearEnd: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

// SideCostReconciliation Update Schema
export const reconciliationUpdateSchema = z.object({
  distributionMethod: distributionMethodSchema.optional(),
  fiscalYearStart: z.string().optional(),
  fiscalYearEnd: z.string().optional(),
  notes: z.string().max(2000).optional(),
  status: reconciliationStatusSchema.optional(),
});

// Type exports
export type PropertyExpenseCreate = z.infer<typeof propertyExpenseCreateSchema>;
export type PropertyExpenseUpdate = z.infer<typeof propertyExpenseUpdateSchema>;
export type ReconciliationCreate = z.infer<typeof reconciliationCreateSchema>;
export type ReconciliationUpdate = z.infer<typeof reconciliationUpdateSchema>;
