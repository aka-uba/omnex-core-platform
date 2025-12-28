/**
 * Real Estate Module - Staff Types
 */

import type { Property } from './property';

export type StaffType = 'internal' | 'external';
export type StaffRole = 'manager' | 'agent' | 'accountant' | 'maintenance' | 'observer';

export interface LinkedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  profilePicture?: string | null;
  department?: string | null;
  position?: string | null;
  employeeId?: string | null;
  hireDate?: Date | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  defaultLanguage?: string | null;
  defaultTheme?: string | null;
  defaultLayout?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  lastActive?: Date | null;
}

export interface RealEstateStaff {
  id: string;
  tenantId: string;
  companyId: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  staffType: StaffType;
  role: StaffRole;
  permissions?: Record<string, any> | null;
  propertyIds: string[];
  apartmentIds: string[];
  assignedUnits: number;
  collectionRate?: number | null;
  averageVacancyDays?: number | null;
  customerSatisfaction?: number | null;
  notes?: string | null;
  profileImage?: string | null;
  documents?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  properties?: PropertyStaff[];
  apartments?: Array<{
    id: string;
    unitNumber: string;
    status?: string;
    property?: { id: string; name: string };
  }>;
  linkedUser?: LinkedUser | null;
}

export interface PropertyStaff {
  id: string;
  propertyId: string;
  staffId: string;
  role?: string | null;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  staff?: RealEstateStaff;
}

export interface RealEstateStaffCreateInput {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  staffType: StaffType;
  role: StaffRole;
  permissions?: Record<string, any>;
  propertyIds?: string[];
  apartmentIds?: string[];
  notes?: string;
}

export interface RealEstateStaffUpdateInput extends Partial<RealEstateStaffCreateInput> {
  isActive?: boolean;
  assignedUnits?: number;
  collectionRate?: number;
  averageVacancyDays?: number;
  customerSatisfaction?: number;
}

export interface RealEstateStaffListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  staffType?: StaffType;
  role?: StaffRole;
  isActive?: boolean;
}

