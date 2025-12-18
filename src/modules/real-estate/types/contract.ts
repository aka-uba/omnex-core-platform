/**
 * Real Estate Module - Contract Types
 */

export type ContractType = 'rental' | 'sale' | 'lease';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type PaymentType = 'cash' | 'bank_transfer' | 'auto_debit';

export interface Contract {
  id: string;
  tenantId: string;
  companyId: string;
  apartmentId: string;
  tenantRecordId: string;
  templateId?: string | null;
  contractNumber: string;
  type: ContractType;
  startDate: Date;
  endDate?: Date | null;
  renewalDate?: Date | null;
  rentAmount: number;
  deposit?: number | null;
  currency: string;
  paymentType?: PaymentType | null;
  paymentDay?: number | null;
  autoRenewal: boolean;
  renewalNoticeDays?: number | null;
  increaseRate?: number | null;
  status: ContractStatus;
  documents: string[];
  terms?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  apartment?: any;
  tenantRecord?: any;
  payments?: any[];
}

export interface ContractCreateInput {
  apartmentId: string;
  tenantRecordId: string;
  templateId?: string;
  contractNumber: string;
  type: ContractType;
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  rentAmount: number;
  deposit?: number;
  currency?: string;
  paymentType?: PaymentType;
  paymentDay?: number;
  autoRenewal?: boolean;
  renewalNoticeDays?: number;
  increaseRate?: number;
  status?: ContractStatus;
  documents?: string[];
  terms?: string;
  notes?: string;
}

export interface ContractUpdateInput {
  apartmentId?: string;
  tenantRecordId?: string;
  templateId?: string | null;
  contractNumber?: string;
  type?: ContractType;
  startDate?: Date;
  endDate?: Date | null;
  renewalDate?: Date | null;
  rentAmount?: number;
  deposit?: number | null;
  currency?: string;
  paymentType?: PaymentType | null;
  paymentDay?: number | null;
  autoRenewal?: boolean;
  renewalNoticeDays?: number | null;
  increaseRate?: number | null;
  status?: ContractStatus;
  documents?: string[];
  terms?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface ContractListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  apartmentId?: string;
  tenantRecordId?: string;
  type?: ContractType;
  status?: ContractStatus;
  isActive?: boolean;
}

