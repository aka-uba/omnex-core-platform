import { z } from 'zod';

export const subscriptionTypeSchema = z.enum(['rental', 'subscription', 'commission']);
export const subscriptionStatusSchema = z.enum(['active', 'suspended', 'cancelled']);
export const billingCycleSchema = z.enum(['monthly', 'quarterly', 'yearly', 'one_time']);
export const commissionTypeSchema = z.enum(['percentage', 'fixed']);

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Subscription name is required'),
  type: subscriptionTypeSchema,
  customerId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  renewalDate: z.string().datetime().optional().nullable(),
  basePrice: z.number().min(0, 'Base price must be greater than or equal to 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  billingCycle: billingCycleSchema,
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  commissionType: commissionTypeSchema.optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  status: subscriptionStatusSchema.default('active'),
  isActive: z.boolean().default(true),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

export const subscriptionCreateSchema = subscriptionSchema.omit({ status: true, isActive: true });
export const subscriptionUpdateSchema = subscriptionSchema.partial();

export const invoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const invoiceItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be greater than or equal to 0'),
  total: z.number().min(0, 'Total must be greater than or equal to 0'),
});

export const invoiceSchema = z.object({
  subscriptionId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  customerId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  subtotal: z.number().min(0, 'Subtotal must be greater than or equal to 0'),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  taxAmount: z.number().min(0).optional().nullable(),
  totalAmount: z.number().min(0, 'Total amount must be greater than or equal to 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  status: invoiceStatusSchema.default('draft'),
  paidDate: z.string().datetime().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  paymentNotes: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).optional().nullable(),
  documents: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const invoiceCreateSchema = invoiceSchema.omit({ status: true, paidDate: true, isActive: true });
export const invoiceUpdateSchema = invoiceSchema.partial();

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'card', 'check', 'other']);
export const paymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'cancelled']);

export const accountingPaymentSchema = z.object({
  subscriptionId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  paymentDate: z.string().datetime(),
  paymentMethod: paymentMethodSchema,
  paymentReference: z.string().optional().nullable(),
  status: paymentStatusSchema.default('completed'),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
});

export type AccountingPaymentFormValues = z.infer<typeof accountingPaymentSchema>;

export const accountingPaymentCreateSchema = accountingPaymentSchema;
export const accountingPaymentUpdateSchema = accountingPaymentSchema.partial();

export const expenseTypeSchema = z.enum(['operational', 'subscription', 'maintenance', 'rent', 'utility', 'other']);
export const expenseStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const expenseSchema = z.object({
  locationId: z.string().uuid().optional().nullable(),
  subscriptionId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Expense name is required'),
  category: z.string().min(1, 'Category is required'),
  type: expenseTypeSchema,
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  expenseDate: z.string().datetime(),
  assignedUserId: z.string().uuid().optional().nullable(),
  status: expenseStatusSchema.default('pending'),
  approvedBy: z.string().uuid().optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const expenseCreateSchema = expenseSchema.omit({ status: true, approvedBy: true, approvedAt: true, isActive: true });
export const expenseUpdateSchema = expenseSchema.partial();








