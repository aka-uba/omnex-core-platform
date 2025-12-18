/**
 * Real Estate Module - Maintenance Record Types
 */

export type MaintenanceType = 'preventive' | 'corrective' | 'emergency';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface RealEstateMaintenanceRecord {
  id: string;
  tenantId: string;
  companyId: string;
  apartmentId: string;
  type: MaintenanceType;
  title: string;
  description?: string | null;
  status: MaintenanceStatus;
  scheduledDate: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  assignedStaffId?: string | null;
  performedByStaffId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  documents: string[];
  photos: string[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealEstateMaintenanceRecordCreateInput {
  apartmentId: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  status?: MaintenanceStatus;
  scheduledDate: Date;
  startDate?: Date;
  endDate?: Date;
  assignedStaffId?: string;
  performedByStaffId?: string;
  estimatedCost?: number;
  actualCost?: number;
  documents?: string[];
  photos?: string[];
  notes?: string;
}

export interface RealEstateMaintenanceRecordUpdateInput extends Partial<Omit<RealEstateMaintenanceRecordCreateInput, 'apartmentId'>> {
  apartmentId?: string;
}

export interface RealEstateMaintenanceRecordListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  apartmentId?: string;
  assignedStaffId?: string;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
}








