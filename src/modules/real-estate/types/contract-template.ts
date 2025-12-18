/**
 * Real Estate Module - Contract Template Types
 */

export type ContractTemplateType = 'rental' | 'sale' | 'lease' | 'general';

export interface ContractTemplate {
  id: string;
  tenantId: string;
  companyId?: string | null;
  name: string;
  description?: string | null;
  type: 'rental' | 'sale' | 'lease' | 'general';
  category?: string | null;
  content: string;
  variables?: Record<string, any> | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contracts?: any[];
}

export interface ContractTemplateCreateInput {
  name: string;
  description?: string;
  type: 'rental' | 'sale' | 'lease' | 'general';
  category?: string;
  content: string;
  variables?: Record<string, any>;
  isDefault?: boolean;
}

export interface ContractTemplateUpdateInput extends Partial<ContractTemplateCreateInput> {
  isActive?: boolean;
}

export interface ContractTemplateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'rental' | 'sale' | 'lease' | 'general';
  category?: string;
  isActive?: boolean;
}

