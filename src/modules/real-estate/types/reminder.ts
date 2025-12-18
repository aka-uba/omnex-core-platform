/**
 * Real Estate Module - Reminder Types
 */

export type ReminderType = 
  | 'contract_renewal'
  | 'payment_due'
  | 'payment_overdue'
  | 'appointment_upcoming'
  | 'maintenance_scheduled'
  | 'contract_expiring'
  | 'document_expiring'
  | 'custom';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  tenantId: string;
  companyId: string;
  type: ReminderType;
  title: string;
  message: string;
  priority: ReminderPriority;
  entityType: string; // 'contract', 'payment', 'appointment', 'maintenance', etc.
  entityId: string;
  scheduledDate: Date;
  sentAt?: Date | null;
  isActive: boolean;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderCreateInput {
  type: ReminderType;
  title: string;
  message: string;
  priority?: ReminderPriority;
  entityType: string;
  entityId: string;
  scheduledDate: Date;
  metadata?: Record<string, any>;
}

export interface ReminderUpdateInput extends Partial<Omit<ReminderCreateInput, 'entityType' | 'entityId'>> {
  isActive?: boolean;
  sentAt?: Date;
}

export interface ReminderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ReminderType;
  priority?: ReminderPriority;
  entityType?: string;
  entityId?: string;
  isActive?: boolean;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  sent?: boolean; // true = sent, false = not sent, undefined = all
}








