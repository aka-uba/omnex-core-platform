import { z } from 'zod';

export const billingCycleSchema = z.enum(['monthly', 'quarterly', 'yearly']);
export const licenseStatusSchema = z.enum(['active', 'expired', 'suspended', 'cancelled']);
export const paymentStatusSchema = z.enum(['pending', 'paid', 'failed']);
export const paymentMethodSchema = z.enum(['bank_transfer', 'credit_card', 'other']);
export const paymentApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const notificationTypeSchema = z.enum(['expiring_soon', 'expired', 'payment_required']);

export const licensePackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional().nullable(),
  modules: z.array(z.string()).min(1, 'At least one module is required'),
  basePrice: z.number().min(0, 'Base price must be greater than or equal to 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  billingCycle: billingCycleSchema,
  maxUsers: z.number().int().min(1).optional().nullable(),
  maxStorage: z.number().int().min(1).optional().nullable(),
  features: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type LicensePackageFormValues = z.infer<typeof licensePackageSchema>;

export const licensePackageCreateSchema = licensePackageSchema;
export const licensePackageUpdateSchema = licensePackageSchema.partial();

export const tenantLicenseSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  packageId: z.string().uuid('Package ID must be a valid UUID'),
  startDate: z.string().datetime('Start date must be a valid date'),
  endDate: z.string().datetime('End date must be a valid date'),
  renewalDate: z.string().datetime().optional().nullable(),
  status: licenseStatusSchema.default('active'),
  paymentStatus: paymentStatusSchema.default('pending'),
  lastPaymentDate: z.string().datetime().optional().nullable(),
  nextPaymentDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type TenantLicenseFormValues = z.infer<typeof tenantLicenseSchema>;

export const tenantLicenseCreateSchema = tenantLicenseSchema;
export const tenantLicenseUpdateSchema = tenantLicenseSchema.partial();

export const licensePaymentSchema = z.object({
  licenseId: z.string().uuid('License ID must be a valid UUID'),
  amount: z.number().min(0, 'Amount must be greater than or equal to 0'),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  paymentMethod: paymentMethodSchema,
  paymentDate: z.string().datetime('Payment date must be a valid date'),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type LicensePaymentFormValues = z.infer<typeof licensePaymentSchema>;

export const licensePaymentCreateSchema = licensePaymentSchema;
export const licensePaymentUpdateSchema = z.object({
  status: paymentApprovalStatusSchema.optional(),
  approvedBy: z.string().uuid().optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const licenseNotificationSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  licenseId: z.string().min(1, 'License ID is required'),
  type: notificationTypeSchema,
  message: z.string().min(1, 'Message is required'),
  actionUrl: z.string().url().optional().nullable(),
});

export type LicenseNotificationFormValues = z.infer<typeof licenseNotificationSchema>;

export const licenseNotificationCreateSchema = licenseNotificationSchema;
export const licenseNotificationUpdateSchema = z.object({
  isRead: z.boolean().optional(),
  readAt: z.string().datetime().optional().nullable(),
});

