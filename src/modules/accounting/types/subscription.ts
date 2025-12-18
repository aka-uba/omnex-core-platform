/**
 * Accounting Module - Subscription Types
 */

export type SubscriptionType = 'rental' | 'subscription' | 'commission';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';
export type CommissionType = 'percentage' | 'fixed';

export interface Subscription {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  customerId?: string | null;
  supplierId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  renewalDate?: Date | null;
  basePrice: number;
  currency: string;
  billingCycle: BillingCycle;
  commissionRate?: number | null;
  commissionType?: CommissionType | null;
  assignedUserId?: string | null;
  description?: string | null;
  terms?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  invoices?: Invoice[];
  payments?: AccountingPayment[];
  expenses?: Expense[];
}

export interface SubscriptionCreateInput {
  name: string;
  type: SubscriptionType;
  customerId?: string;
  supplierId?: string;
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  basePrice: number;
  currency?: string;
  billingCycle: BillingCycle;
  commissionRate?: number;
  commissionType?: CommissionType;
  assignedUserId?: string;
  description?: string;
  terms?: string;
}

export interface SubscriptionUpdateInput extends Partial<SubscriptionCreateInput> {
  status?: SubscriptionStatus;
  isActive?: boolean;
}

export interface SubscriptionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: SubscriptionType;
  status?: SubscriptionStatus;
  customerId?: string;
  supplierId?: string;
  assignedUserId?: string;
  isActive?: boolean;
}

export interface Invoice {
  id: string;
  tenantId: string;
  companyId: string;
  subscriptionId?: string | null;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  customerId?: string | null;
  supplierId?: string | null;
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  paidDate?: Date | null;
  paymentMethod?: string | null;
  paymentNotes?: string | null;
  description?: string | null;
  items?: InvoiceItem[] | null;
  documents: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription | null;
  payments?: AccountingPayment[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceCreateInput {
  subscriptionId?: string;
  invoiceNumber?: string; // Otomatik oluşturulacak
  invoiceDate: Date;
  dueDate: Date;
  customerId?: string;
  supplierId?: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  description?: string;
  items?: InvoiceItem[];
  documents?: string[];
}

export interface InvoiceUpdateInput extends Partial<InvoiceCreateInput> {
  status?: InvoiceStatus;
  paidDate?: Date;
  paymentMethod?: string;
  paymentNotes?: string;
  isActive?: boolean;
}

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  subscriptionId?: string;
  customerId?: string;
  supplierId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface AccountingPayment {
  id: string;
  tenantId: string;
  companyId: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription | null;
  invoice?: Invoice | null;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface AccountingPaymentCreateInput {
  subscriptionId?: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  status?: PaymentStatus;
  notes?: string;
  receiptUrl?: string;
}

export interface AccountingPaymentUpdateInput extends Partial<AccountingPaymentCreateInput> {}

export interface AccountingPaymentListParams {
  page?: number;
  pageSize?: number;
  subscriptionId?: string;
  invoiceId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
}

export interface Expense {
  id: string;
  tenantId: string;
  companyId: string;
  locationId?: string | null;
  subscriptionId?: string | null;
  name: string;
  category: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  expenseDate: Date;
  assignedUserId?: string | null;
  status: ExpenseStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  description?: string | null;
  receiptUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription | null;
}

export type ExpenseType = 'operational' | 'subscription' | 'maintenance' | 'rent' | 'utility' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseCreateInput {
  locationId?: string;
  subscriptionId?: string;
  name: string;
  category: string;
  type: ExpenseType;
  amount: number;
  currency?: string;
  expenseDate: Date;
  assignedUserId?: string;
  description?: string;
  receiptUrl?: string;
}

export interface ExpenseUpdateInput extends Partial<ExpenseCreateInput> {
  status?: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: Date;
  isActive?: boolean;
}

export interface ExpenseListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: ExpenseType;
  locationId?: string;
  subscriptionId?: string;
  assignedUserId?: string;
  status?: ExpenseStatus;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}








