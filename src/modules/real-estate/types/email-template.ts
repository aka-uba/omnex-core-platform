/**
 * Real Estate Module - Email Template Types
 */

export type EmailTemplateCategory = 'promotion' | 'announcement' | 'reminder' | 'welcome' | 'agreement';

export interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  required?: boolean;
  defaultValue?: any;
}

export interface EmailTemplate {
  id: string;
  tenantId: string;
  companyId?: string | null;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  variables?: TemplateVariable[] | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateCreateInput {
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: TemplateVariable[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface EmailTemplateUpdateInput extends Partial<Omit<EmailTemplateCreateInput, 'name'>> {
  name?: string;
}

export interface EmailTemplateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: EmailTemplateCategory;
  isActive?: boolean;
}








