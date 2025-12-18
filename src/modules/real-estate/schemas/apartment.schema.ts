import { z } from 'zod';

export const apartmentStatusSchema = z.enum(['empty', 'rented', 'sold', 'maintenance']);
export const ownerTypeSchema = z.enum(['person', 'company', 'state', 'foundation']);
export const ownershipTypeSchema = z.enum(['full', 'shared', 'leasehold']);

export const inventoryItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0),
  condition: z.string().optional(),
  notes: z.string().optional(),
});

export const keyInfoSchema = z.object({
  type: z.string().min(1),
  location: z.string().optional(),
  code: z.string().optional(),
  notes: z.string().optional(),
});

export const apartmentSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  floor: z.number().int().optional().nullable(),
  block: z.string().optional().nullable(),
  area: z.number().min(0, 'Area must be positive'),
  roomCount: z.number().int().min(0, 'Room count must be non-negative'),
  livingRoom: z.boolean().default(true),
  bathroomCount: z.number().int().min(1, 'Bathroom count must be at least 1').default(1),
  balcony: z.boolean().default(false),
  apartmentType: z.string().optional().nullable(),
  bedroomCount: z.number().int().min(0).optional().nullable(),
  basementSize: z.number().min(0).optional().nullable(),
  lastRenovationDate: z.coerce.date().optional().nullable(),
  internetSpeed: z.string().optional().nullable(),
  heatingSystems: z.any().optional().nullable(),
  coldRent: z.number().min(0).optional().nullable(),
  heatingCosts: z.number().min(0).optional().nullable(),
  additionalCosts: z.number().min(0).optional().nullable(),
  deposit: z.number().min(0).optional().nullable(),
  usageRights: z.any().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  ownerType: ownerTypeSchema.optional().nullable(),
  ownershipType: ownershipTypeSchema.optional().nullable(),
  status: apartmentStatusSchema.default('empty'),
  deliveryDate: z.coerce.date().optional().nullable(),
  rentPrice: z.number().min(0).optional().nullable(),
  salePrice: z.number().min(0).optional().nullable(),
  inventory: z.array(inventoryItemSchema).optional().nullable(),
  keys: z.array(keyInfoSchema).optional().nullable(),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  coverImage: z.string().optional().nullable(),
  documents: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  qrCode: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ApartmentFormValues = z.infer<typeof apartmentSchema>;

// Create and update schemas
export const apartmentCreateSchema = apartmentSchema.omit({ isActive: true });
export const apartmentUpdateSchema = apartmentSchema.partial();

