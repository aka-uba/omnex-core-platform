/**
 * Maintenance Module - Maintenance Record Types
 */

export type MaintenanceType = 'preventive' | 'corrective' | 'emergency';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceRecord {
  id: string;
  tenantId: string;
  companyId: string;
  locationId: string;
  equipmentId: string;
  type: MaintenanceType;
  title: string;
  description?: string | null;
  status: MaintenanceStatus;
  scheduledDate: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  assignedTo?: string | null; // User ID
  performedBy?: string | null; // User ID
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  documents: string[]; // Merkezi Dosya Yönetimi'nden
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    id: string;
    name: string;
  };
  equipment?: {
    id: string;
    name: string;
    code?: string | null;
  };
}

export interface MaintenanceRecordCreateInput {
  locationId: string;
  equipmentId: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  scheduledDate: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  assignedTo?: string;
  performedBy?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  documents?: string[];
}

export interface MaintenanceRecordUpdateInput extends Partial<MaintenanceRecordCreateInput> {
  status?: MaintenanceStatus;
  isActive?: boolean;
}

export interface MaintenanceRecordListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  locationId?: string;
  equipmentId?: string;
  assignedTo?: string;
  performedBy?: string;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  isActive?: boolean;
}

