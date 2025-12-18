/**
 * Real Estate Module - Agreement Report Types
 */

export type AgreementReportType = 'boss' | 'owner' | 'tenant' | 'internal';
export type AgreementReportStatus = 'draft' | 'sent' | 'viewed';
export type AgreementStatus = 'pre_agreement' | 'signed' | 'delivery_scheduled' | 'deposit_received';

export interface AgreementReportRecipient {
  email: string;
  name?: string;
  type?: 'tenant' | 'contact' | 'manual';
}

export interface AgreementReportApartment {
  id: string;
  unitNumber: string;
  property?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
}

export interface AgreementReportContract {
  id: string;
  contractNumber: string;
  type: string;
  rentAmount?: number | null;
  startDate: Date;
  endDate?: Date | null;
}

export interface AgreementReportAppointment {
  id: string;
  title: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface AgreementReport {
  id: string;
  tenantId: string;
  companyId: string;
  appointmentId?: string | null;
  type: AgreementReportType;
  apartmentId: string;
  contractId?: string | null;
  agreementStatus: AgreementStatus;
  rentAmount?: number | null;
  deposit?: number | null;
  deliveryDate?: Date | null;
  contractDate?: Date | null;
  specialTerms?: string | null;
  nextSteps?: string | null;
  recipients: AgreementReportRecipient[];
  attachments: string[];
  status: AgreementReportStatus;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional, included when fetched with relations)
  apartment?: AgreementReportApartment | null;
  contract?: AgreementReportContract | null;
  appointment?: AgreementReportAppointment | null;
}

export interface AgreementReportCreateInput {
  appointmentId?: string;
  type: AgreementReportType;
  apartmentId: string;
  contractId?: string;
  agreementStatus: AgreementStatus;
  rentAmount?: number;
  deposit?: number;
  deliveryDate?: Date;
  contractDate?: Date;
  specialTerms?: string;
  nextSteps?: string;
  recipients: AgreementReportRecipient[];
  attachments?: string[];
}

export interface AgreementReportUpdateInput {
  type?: AgreementReportType;
  agreementStatus?: AgreementStatus;
  rentAmount?: number;
  deposit?: number;
  deliveryDate?: Date;
  contractDate?: Date;
  specialTerms?: string;
  nextSteps?: string;
  recipients?: AgreementReportRecipient[];
  attachments?: string[];
  status?: AgreementReportStatus;
}

export interface AgreementReportListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: AgreementReportType;
  status?: AgreementReportStatus;
  agreementStatus?: AgreementStatus;
  apartmentId?: string;
  contractId?: string;
  appointmentId?: string;
}








