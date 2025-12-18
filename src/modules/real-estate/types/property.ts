/**
 * Real Estate Module - Property Types
 */

import type { Apartment } from './apartment';
import type { PropertyStaff } from './staff';

export type PropertyType = 'apartment' | 'complex' | 'building';

export interface Property {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  type: PropertyType;
  code?: string | null;
  address: string;
  city: string;
  district?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  buildingNo?: string | null;
  postalCode?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  totalUnits: number;
  managerId?: string | null;
  managerUserId?: string | null;
  monthlyFee?: number | null;
  paymentDay?: number | null;
  description?: string | null;
  images: string[];
  coverImage?: string | null;
  documents: string[];
  metadata?: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  apartments?: Apartment[];
  staff?: PropertyStaff[];
}

export interface PropertyCreateInput {
  name: string;
  type: PropertyType;
  code?: string;
  address: string;
  city: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  managerId?: string;
  managerUserId?: string;
  monthlyFee?: number;
  paymentDay?: number;
  description?: string;
  images?: string[];
  coverImage?: string | null;
  documents?: string[];
  metadata?: Record<string, any>;
}

export interface PropertyUpdateInput extends Partial<PropertyCreateInput> {
  isActive?: boolean;
}

export interface PropertyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  city?: string;
  district?: string;
  type?: PropertyType;
  isActive?: boolean;
}

