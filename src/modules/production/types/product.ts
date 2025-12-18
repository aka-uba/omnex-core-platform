/**
 * Production Module - Product Types
 */

export type ProductType = 'hammadde' | 'yarı_mamul' | 'mamul';
export type ProductUnit = 'adet' | 'kg' | 'lt' | 'm' | 'm²' | 'm³' | 'paket' | 'kutu' | 'palet';

export interface Product {
  id: string;
  tenantId: string;
  companyId: string;
  locationId?: string | null;
  
  // Temel bilgiler
  name: string;
  code: string;
  sku?: string | null;
  barcode?: string | null;
  category: string;
  type: ProductType;
  
  // Stok bilgileri
  stockQuantity: number;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  unit: ProductUnit;
  
  // Maliyet bilgileri
  costPrice?: number | null;
  sellingPrice?: number | null;
  currency: string;
  
  // Üretim bilgileri
  isProducible: boolean;
  productionTime?: number | null;
  
  // Metadata
  description?: string | null;
  specifications?: Record<string, any> | null;
  images: string[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  location?: {
    id: string;
    name: string;
  } | null;
  bomItems?: BOMItem[];
  bomProducts?: BOMItem[];
  productionOrders?: ProductionOrder[];
  stockMovements?: StockMovement[];
}

export interface ProductCreateInput {
  name: string;
  code: string;
  sku?: string;
  barcode?: string;
  category: string;
  type: ProductType;
  locationId?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unit: ProductUnit;
  costPrice?: number;
  sellingPrice?: number;
  currency?: string;
  isProducible?: boolean;
  productionTime?: number;
  description?: string;
  specifications?: Record<string, any>;
  images?: string[];
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  isActive?: boolean;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: ProductType;
  locationId?: string;
  isActive?: boolean;
  isProducible?: boolean;
  lowStock?: boolean; // minStockLevel altında olanlar
}

export interface BOMItem {
  id: string;
  tenantId: string;
  bomId: string;
  productId: string;
  componentId?: string | null;
  quantity: number;
  unit: string;
  wasteRate: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  component?: Product | null;
}

export interface BOMItemCreateInput {
  bomId: string;
  productId: string;
  componentId?: string;
  quantity: number;
  unit: string;
  wasteRate?: number;
  order?: number;
}

export interface BOMItemUpdateInput extends Partial<BOMItemCreateInput> {}

export interface ProductionOrder {
  id: string;
  tenantId: string;
  companyId: string;
  locationId: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  unit: string;
  status: ProductionOrderStatus;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  priority: ProductionOrderPriority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    id: string;
    name: string;
  };
  product?: Product;
  productionSteps?: ProductionStep[];
}

export type ProductionOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ProductionOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ProductionOrderCreateInput {
  locationId: string;
  productId: string;
  quantity: number;
  unit: string;
  orderNumber?: string; // Otomatik oluşturulacak
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedCost?: number;
  notes?: string;
  priority?: ProductionOrderPriority;
}

export interface ProductionOrderUpdateInput extends Partial<ProductionOrderCreateInput> {
  status?: ProductionOrderStatus;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualCost?: number;
  isActive?: boolean;
}

export interface ProductionOrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProductionOrderStatus;
  locationId?: string;
  productId?: string;
  priority?: ProductionOrderPriority;
  isActive?: boolean;
}

export interface ProductionStep {
  id: string;
  tenantId: string;
  orderId: string;
  stepNumber: number;
  name: string;
  description?: string | null;
  status: ProductionStepStatus;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  assignedTo?: string | null;
  laborHours?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  order?: ProductionOrder;
}

export type ProductionStepStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ProductionStepCreateInput {
  orderId: string;
  stepNumber: number;
  name: string;
  description?: string | null;
  status?: ProductionStepStatus;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  assignedTo?: string | null;
  laborHours?: number | null;
  notes?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
}

export interface ProductionStepUpdateInput extends Partial<ProductionStepCreateInput> {
  status?: ProductionStepStatus;
  actualStart?: string | null;
  actualEnd?: string | null;
  laborHours?: number | null;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  companyId: string;
  locationId?: string | null;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  referenceType?: string | null;
  referenceId?: string | null;
  movementDate: Date;
  notes?: string | null;
  createdAt: Date;
  product?: Product;
}

export type StockMovementType = 'in' | 'out' | 'transfer' | 'adjustment';

export interface StockMovementCreateInput {
  locationId?: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  referenceType?: string;
  referenceId?: string;
  movementDate?: Date;
  notes?: string;
}

export interface StockMovementUpdateInput extends Partial<StockMovementCreateInput> {}

export interface StockMovementListParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  locationId?: string;
  type?: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  startDate?: Date;
  endDate?: Date;
}

