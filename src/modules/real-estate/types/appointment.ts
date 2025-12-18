/**
 * Real Estate Module - Appointment Types
 */

export type AppointmentType = 'viewing' | 'delivery' | 'maintenance' | 'inspection' | 'meeting';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type InterestLevel = 'high' | 'medium' | 'low';

export interface ExternalParticipant {
  name: string;
  phone?: string;
  email?: string;
}

export interface AppointmentResult {
  notes?: string;
  outcome?: string;
  nextAction?: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  companyId: string;
  apartmentId?: string | null;
  type: AppointmentType;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  duration?: number | null;
  staffIds: string[];
  externalParticipants?: ExternalParticipant[] | null;
  status: AppointmentStatus;
  followUpRequired: boolean;
  followUpDate?: Date | null;
  followUpNotes?: string | null;
  result?: AppointmentResult | null;
  rating?: number | null;
  interestLevel?: InterestLevel | null;
  location?: string | null;
  notes?: string | null;
  calendarEventId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  apartment?: any;
}

export interface AppointmentCreateInput {
  apartmentId?: string;
  type: AppointmentType;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  duration?: number;
  staffIds?: string[];
  externalParticipants?: ExternalParticipant[];
  status?: AppointmentStatus;
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  location?: string;
  notes?: string;
  calendarEventId?: string;
}

export interface AppointmentUpdateInput extends Partial<AppointmentCreateInput> {
  result?: AppointmentResult;
  rating?: number;
  interestLevel?: InterestLevel;
}

export interface AppointmentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  apartmentId?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
}








