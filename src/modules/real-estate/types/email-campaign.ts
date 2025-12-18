/**
 * Real Estate Module - Email Campaign Types
 */

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface EmailRecipient {
  email: string;
  name?: string;
  type?: 'tenant' | 'contact' | 'manual';
}

export interface EmailCampaign {
  id: string;
  tenantId: string;
  companyId: string;
  templateId: string;
  apartmentId?: string | null;
  name: string;
  recipients: EmailRecipient[];
  recipientCount: number;
  customContent?: {
    subject?: string;
    htmlContent?: string;
    variables?: Record<string, any>;
  } | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  status: EmailCampaignStatus;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  conversionCount: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  template?: {
    id: string;
    name: string;
    category: string;
    subject: string;
  } | null;
}

export interface EmailCampaignCreateInput {
  templateId: string;
  apartmentId?: string;
  name: string;
  recipients: EmailRecipient[];
  customContent?: {
    subject?: string;
    htmlContent?: string;
    variables?: Record<string, any>;
  };
  scheduledAt?: Date;
  notes?: string;
}

export interface EmailCampaignUpdateInput {
  name?: string;
  recipients?: EmailRecipient[];
  customContent?: {
    subject?: string;
    htmlContent?: string;
    variables?: Record<string, any>;
  };
  scheduledAt?: Date;
  status?: EmailCampaignStatus;
  notes?: string;
}

export interface EmailCampaignListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: EmailCampaignStatus;
  templateId?: string;
  apartmentId?: string;
}

