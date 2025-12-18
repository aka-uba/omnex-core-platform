/**
 * Accounting Module - Widget Types (FAZ 3)
 */

export interface InvoiceWidgetConfig {
  title?: string;
  limit: number;
  status: 'all' | 'paid' | 'pending' | 'overdue';
}

export interface PaymentWidgetConfig {
  title?: string;
  limit: number;
  status?: 'all' | 'completed' | 'pending' | 'failed';
}

export interface SubscriptionWidgetConfig {
  title?: string;
  limit: number;
  status?: 'all' | 'active' | 'expired' | 'cancelled';
}







