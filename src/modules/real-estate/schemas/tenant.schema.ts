import { z } from 'zod';

export const tenantSchema = z.object({
  // System fields
  userId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  apartmentId: z.string().uuid().optional().nullable(),
  tenantNumber: z.string().optional().nullable(),

  // Type
  tenantType: z.enum(['person', 'company']).optional().nullable(),
  companyName: z.string().optional().nullable(),

  // Personal information
  salutation: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  birthPlace: z.string().optional().nullable(),

  // Address
  street: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),

  // Contact
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),

  // Additional information
  nationality: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),

  // Dates
  moveInDate: z.coerce.date().optional().nullable(),
  moveOutDate: z.coerce.date().optional().nullable(),

  // Scores
  paymentScore: z.number().min(0).max(100).optional().nullable(),
  contactScore: z.number().min(0).max(100).optional().nullable(),
  maintenanceScore: z.number().min(0).max(100).optional().nullable(),
  overallScore: z.number().min(0).max(100).optional().nullable(),

  // Notes and analysis
  notes: z.string().optional().nullable(),
  analysis: z.record(z.string(), z.any()).optional().nullable(),

  // Media - Note: These are handled by CoreFileManager, not stored in Tenant model
  images: z.array(z.string()).optional().default([]),
  documents: z.array(z.string()).optional().default([]),
  coverImage: z.string().optional().nullable(),

  isActive: z.boolean().default(true),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

// Create and update schemas
export const tenantCreateSchema = tenantSchema.omit({ isActive: true });
export const tenantUpdateSchema = tenantSchema.partial();

