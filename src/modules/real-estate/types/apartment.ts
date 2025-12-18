/**
 * Real Estate Module - Apartment Types
 */

import type { Property } from './property';

export type ApartmentStatus = 'empty' | 'rented' | 'sold' | 'maintenance';
export type OwnerType = 'person' | 'company' | 'state' | 'foundation';
export type OwnershipType = 'full' | 'shared' | 'leasehold';

export interface InventoryItem {
  name: string;
  quantity: number;
  condition?: string;
  notes?: string;
}

export interface KeyInfo {
  type: string; // 'physical', 'digital', 'code'
  location?: string;
  code?: string;
  notes?: string;
}

export interface Apartment {
  id: string;
  tenantId: string;
  companyId: string;
  propertyId: string;
  unitNumber: string;
  floor?: number | null;
  block?: string | null;
  area: number;
  roomCount: number;
  livingRoom: boolean;
  bathroomCount: number;
  balcony: boolean;
  ownerId?: string | null;
  ownerType?: OwnerType | null;
  ownershipType?: OwnershipType | null;
  status: ApartmentStatus;
  deliveryDate?: Date | null;
  rentPrice?: number | null;
  salePrice?: number | null;
  inventory?: InventoryItem[] | null;
  keys?: KeyInfo[] | null;
  description?: string | null;
  images: string[];
  coverImage?: string | null;
  documents: string[];
  metadata?: Record<string, any> | null;
  qrCode?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  contracts?: any[];
  appointments?: any[];
  payments?: any[];
  maintenance?: any[];
}

export interface ApartmentCreateInput {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  block?: string;
  area: number;
  roomCount: number;
  livingRoom?: boolean;
  bathroomCount?: number;
  balcony?: boolean;
  ownerId?: string;
  ownerType?: OwnerType;
  ownershipType?: OwnershipType;
  status?: ApartmentStatus;
  deliveryDate?: Date;
  rentPrice?: number;
  salePrice?: number;
  inventory?: InventoryItem[];
  keys?: KeyInfo[];
  description?: string;
  images?: string[];
  coverImage?: string | null;
  documents?: string[];
  metadata?: Record<string, any>;
}

export interface ApartmentUpdateInput extends Partial<ApartmentCreateInput> {
  isActive?: boolean;
}

export interface ApartmentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  propertyId?: string;
  status?: ApartmentStatus;
  floor?: number;
  block?: string;
  isActive?: boolean;
}

