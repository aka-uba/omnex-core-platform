/**
 * Real Estate Module - Bulk Operation Types
 */

export type BulkOperationType = 
  | 'rent_increase'
  | 'fee_update'
  | 'status_update'
  | 'contract_renewal'
  | 'payment_generate'
  | 'custom';

export interface BulkOperation {
  id: string;
  tenantId: string;
  companyId: string;
  type: BulkOperationType;
  title: string;
  description?: string | null;
  affectedCount: number;
  successCount: number;
  failedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, any>; // Operation-specific parameters
  results?: Record<string, any> | null; // Operation results
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkOperationCreateInput {
  type: BulkOperationType;
  title: string;
  description?: string;
  parameters: Record<string, any>;
  entityIds?: string[]; // Optional: specific entities to process
}

export interface BulkOperationUpdateInput {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  affectedCount?: number;
  successCount?: number;
  failedCount?: number;
  results?: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BulkOperationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: BulkOperationType;
  status?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Rent Increase Parameters
export interface RentIncreaseParams {
  apartmentIds?: string[]; // If empty, applies to all active contracts
  contractIds?: string[]; // If empty, applies to all active contracts
  increaseType: 'percentage' | 'fixed';
  increaseValue: number; // Percentage (e.g., 10) or fixed amount
  effectiveDate: Date;
  notifyTenants?: boolean;
  createNewPayments?: boolean;
}

// Fee Update Parameters
export interface FeeUpdateParams {
  apartmentIds?: string[];
  feeType: 'maintenance' | 'utility' | 'other';
  newAmount: number;
  effectiveDate: Date;
  notifyTenants?: boolean;
}








