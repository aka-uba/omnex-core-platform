/**
 * Real Estate Module - Tenant Types
 */

export interface Tenant {
  id: string;
  tenantId: string;
  companyId: string;
  userId?: string | null;
  contactId?: string | null;
  apartmentId?: string | null;
  tenantNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  moveInDate?: Date | null;
  moveOutDate?: Date | null;
  paymentScore?: number | null;
  contactScore?: number | null;
  maintenanceScore?: number | null;
  overallScore?: number | null;
  notes?: string | null;
  analysis?: Record<string, any> | null;
  images?: string[];
  coverImage?: string | null;
  documents?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contracts?: any[];
  payments?: any[];
  appointments?: any[];
  // Optional relations (when included from API)
  contact?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}

export interface TenantCreateInput {
  userId?: string;
  contactId?: string;
  apartmentId?: string;
  tenantNumber?: string;
  moveInDate?: Date;
  moveOutDate?: Date;
  notes?: string;
  analysis?: Record<string, any>;
}

export interface TenantUpdateInput extends Partial<TenantCreateInput> {
  isActive?: boolean;
}

export interface TenantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

