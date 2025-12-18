/**
 * License Service Module - Types
 */

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'other';
export type PaymentApprovalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'expiring_soon' | 'expired' | 'payment_required';

export interface LicensePackage {
  id: string;
  name: string;
  description?: string | null;
  modules: string[];
  basePrice: number;
  currency: string;
  billingCycle: BillingCycle;
  maxUsers?: number | null;
  maxStorage?: number | null;
  features?: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantLicense {
  id: string;
  tenantId: string;
  packageId: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date | null;
  status: LicenseStatus;
  paymentStatus: PaymentStatus;
  lastPaymentDate?: Date | null;
  nextPaymentDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  package?: LicensePackage;
  tenant?: {
    id: string;
    slug: string;
    name: string;
  };
  payments?: LicensePayment[];
}

export interface LicensePayment {
  id: string;
  licenseId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  paymentDate: Date;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  license?: TenantLicense;
}

export interface LicenseNotification {
  id: string;
  tenantId: string;
  licenseId: string;
  type: NotificationType;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

// Input types for API
export interface LicensePackageCreateInput {
  name: string;
  description?: string | null;
  modules: string[];
  basePrice: number;
  currency?: string;
  billingCycle: BillingCycle;
  maxUsers?: number | null;
  maxStorage?: number | null;
  features?: Record<string, unknown> | null;
  isActive?: boolean;
}

export interface LicensePackageUpdateInput {
  name?: string;
  description?: string | null;
  modules?: string[];
  basePrice?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  maxUsers?: number | null;
  maxStorage?: number | null;
  features?: Record<string, unknown> | null;
  isActive?: boolean;
}

export interface TenantLicenseCreateInput {
  tenantId: string;
  packageId: string;
  startDate: Date | string;
  endDate: Date | string;
  renewalDate?: Date | string | null;
  status?: LicenseStatus;
  paymentStatus?: PaymentStatus;
  notes?: string | null;
}

export interface TenantLicenseUpdateInput {
  startDate?: Date | string;
  endDate?: Date | string;
  renewalDate?: Date | string | null;
  status?: LicenseStatus;
  paymentStatus?: PaymentStatus;
  lastPaymentDate?: Date | string | null;
  nextPaymentDate?: Date | string | null;
  notes?: string | null;
}

export interface LicensePaymentCreateInput {
  licenseId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentDate: Date | string;
  receiptUrl?: string | null;
  notes?: string | null;
}

export interface LicensePaymentUpdateInput {
  status?: PaymentApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  notes?: string | null;
}

// List/Filter parameters
export interface LicensePackageListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  billingCycle?: BillingCycle;
}

export interface TenantLicenseListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  tenantId?: string;
  packageId?: string;
  status?: LicenseStatus;
  paymentStatus?: PaymentStatus;
}

export interface LicensePaymentListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  licenseId?: string;
  status?: PaymentApprovalStatus;
  paymentDateFrom?: Date | string;
  paymentDateTo?: Date | string;
}

export interface LicenseNotificationListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  licenseId?: string;
  type?: NotificationType;
  isRead?: boolean;
}

