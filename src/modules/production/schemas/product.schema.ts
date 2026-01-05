import { z } from 'zod';

export const productTypeSchema = z.enum(['hammadde', 'yarı_mamul', 'mamul']);
export const productUnitSchema = z.enum(['adet', 'kg', 'lt', 'm', 'm²', 'm³', 'paket', 'kutu', 'palet']);

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  code: z.string().min(1, 'Product code is required'),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  type: productTypeSchema,
  locationId: z.string().uuid().optional().nullable(),
  stockQuantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).optional().nullable(),
  maxStockLevel: z.number().min(0).optional().nullable(),
  unit: productUnitSchema,
  costPrice: z.number().min(0).optional().nullable(),
  sellingPrice: z.number().min(0).optional().nullable(),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  isProducible: z.boolean().default(false),
  productionTime: z.number().int().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  specifications: z.record(z.string(), z.any()).optional().nullable(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const productCreateSchema = productSchema.omit({ isActive: true });
export const productUpdateSchema = productSchema.partial();

export const bomItemSchema = z.object({
  bomId: z.string().uuid(),
  productId: z.string().uuid(),
  componentId: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  wasteRate: z.number().min(0).max(100).default(0),
  order: z.number().int().min(0).default(0),
});

export type BOMItemFormValues = z.infer<typeof bomItemSchema>;

export const bomItemCreateSchema = bomItemSchema;
export const bomItemUpdateSchema = bomItemSchema.partial();

export const productionOrderStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const productionOrderPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const productionOrderSchema = z.object({
  locationId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  orderNumber: z.string().optional(),
  plannedStartDate: z.string().datetime().optional().nullable(),
  plannedEndDate: z.string().datetime().optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: productionOrderPrioritySchema.default('normal'),
  status: productionOrderStatusSchema.default('pending'),
  actualStartDate: z.string().datetime().optional().nullable(),
  actualEndDate: z.string().datetime().optional().nullable(),
  actualCost: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ProductionOrderFormValues = z.infer<typeof productionOrderSchema>;

export const productionOrderCreateSchema = productionOrderSchema.omit({ 
  status: true, 
  actualStartDate: true, 
  actualEndDate: true, 
  actualCost: true,
  isActive: true 
});
export const productionOrderUpdateSchema = productionOrderSchema.partial();

export const productionStepStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const productionStepSchema = z.object({
  orderId: z.string().uuid(),
  stepNumber: z.number().int().min(1),
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional().nullable(),
  status: productionStepStatusSchema.default('pending'),
  plannedStart: z.string().datetime().optional().nullable(),
  plannedEnd: z.string().datetime().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  laborHours: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  actualStart: z.string().datetime().optional().nullable(),
  actualEnd: z.string().datetime().optional().nullable(),
});

export type ProductionStepFormValues = z.infer<typeof productionStepSchema>;

export const productionStepCreateSchema = productionStepSchema.omit({ 
  status: true, 
  actualStart: true, 
  actualEnd: true 
});
export const productionStepUpdateSchema = productionStepSchema.partial();

export const stockMovementTypeSchema = z.enum(['in', 'out', 'transfer', 'adjustment']);

export const stockMovementSchema = z.object({
  locationId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid(),
  type: stockMovementTypeSchema,
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  movementDate: z.string().datetime().default(new Date().toISOString()),
  notes: z.string().optional().nullable(),
});

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

export const stockMovementCreateSchema = stockMovementSchema;
export const stockMovementUpdateSchema = stockMovementSchema.partial();








