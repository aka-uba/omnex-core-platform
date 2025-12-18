import { z } from 'zod';

// Location Type Enum
export const LocationType = z.enum(['headquarters', 'branch', 'warehouse', 'office', 'factory', 'store', 'other']);
export type LocationType = z.infer<typeof LocationType>;

// Location Schema
export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  type: LocationType,
  code: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
});

// Location Create Schema (for API)
export const locationCreateSchema = locationSchema;

// Location Update Schema (all fields optional except id)
export const locationUpdateSchema = locationSchema.partial();

// Location Query Schema (for filtering)
export const locationQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('10'),
  search: z.string().optional(),
  type: LocationType.optional(),
  parentId: z.string().optional().nullable().or(z.literal('null').transform(() => null)),
  isActive: z.string().optional().transform((val) => {
    if (val === undefined || val === '') return undefined;
    return val === 'true';
  }),
  companyId: z.string().uuid().optional(),
});

export type LocationSchema = z.infer<typeof locationSchema>;
export type LocationCreateSchema = z.infer<typeof locationCreateSchema>;
export type LocationUpdateSchema = z.infer<typeof locationUpdateSchema>;
export type LocationQuerySchema = z.infer<typeof locationQuerySchema>;

