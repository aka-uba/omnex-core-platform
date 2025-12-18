import { z } from 'zod';

// Equipment Status Enum
export const EquipmentStatus = z.enum(['active', 'maintenance', 'inactive']);
export type EquipmentStatus = z.infer<typeof EquipmentStatus>;

// Equipment Category Enum (common categories)
export const EquipmentCategory = z.enum([
  'makine',
  'elektronik',
  'arac',
  'alet',
  'donanim',
  'yazilim',
  'diger',
]);
export type EquipmentCategory = z.infer<typeof EquipmentCategory>;

// Equipment Schema
export const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  code: z.string().optional(),
  category: EquipmentCategory,
  type: z.string().min(1, 'Equipment type is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  locationId: z.string().uuid().optional().nullable(),
  attributes: z.record(z.string(), z.any()).optional(),
  status: EquipmentStatus.default('active'),
  description: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  warrantyUntil: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Equipment Create Schema (for API)
export const equipmentCreateSchema = equipmentSchema;

// Equipment Update Schema (all fields optional)
export const equipmentUpdateSchema = equipmentSchema.partial();

// Equipment Query Schema (for filtering)
export const equipmentQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('10'),
  search: z.string().optional(),
  category: EquipmentCategory.optional(),
  type: z.string().optional(),
  status: EquipmentStatus.optional(),
  locationId: z.string().uuid().optional().nullable(),
  isActive: z.string().optional().transform((val) => val === 'true'),
  companyId: z.string().uuid().optional(),
});

export type EquipmentSchema = z.infer<typeof equipmentSchema>;
export type EquipmentCreateSchema = z.infer<typeof equipmentCreateSchema>;
export type EquipmentUpdateSchema = z.infer<typeof equipmentUpdateSchema>;
export type EquipmentQuerySchema = z.infer<typeof equipmentQuerySchema>;

