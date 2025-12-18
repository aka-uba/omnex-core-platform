import { z } from 'zod';

export const propertyTypeSchema = z.enum(['apartment', 'complex', 'building']);

export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  type: propertyTypeSchema,
  code: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  buildingNo: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('TR'),
  propertyNumber: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  totalUnits: z.number().min(0).optional().nullable(),
  managerId: z.string().optional().nullable(),
  managerUserId: z.string().optional().nullable(),
  monthlyFee: z.number().min(0).optional().nullable(),
  paymentDay: z.number().min(1).max(31).optional().nullable(),
  constructionYear: z.number().min(1800).max(2100).optional().nullable(),
  lastRenovationDate: z.coerce.date().optional().nullable(),
  landArea: z.number().min(0).optional().nullable(),
  floorCount: z.number().min(1).optional().nullable(),
  livingArea: z.number().min(0).optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  isPaidOff: z.boolean().optional().nullable(),
  financingStartDate: z.coerce.date().optional().nullable(),
  financingEndDate: z.coerce.date().optional().nullable(),
  monthlyFinancingRate: z.number().min(0).optional().nullable(),
  numberOfInstallments: z.number().min(1).optional().nullable(),
  financingPaymentDay: z.number().min(1).max(31).optional().nullable(),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  coverImage: z.string().optional().nullable(),
  documents: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

// Create and update schemas
export const propertyCreateSchema = propertySchema.omit({ isActive: true });
export const propertyUpdateSchema = propertySchema.partial();

