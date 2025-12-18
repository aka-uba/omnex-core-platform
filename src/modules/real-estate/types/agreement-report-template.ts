/**
 * Real Estate Module - Agreement Report Template Types
 */

export type AgreementReportTemplateCategory = 'boss' | 'owner' | 'tenant' | 'internal';

export interface ReportTemplateVariable {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  required?: boolean;
  defaultValue?: any;
}

export interface AgreementReportTemplate {
  id: string;
  tenantId: string;
  companyId?: string | null;
  name: string;
  category: AgreementReportTemplateCategory;
  description?: string | null;
  
  // Template içeriği
  htmlContent: string; // HTML içerik (template variables ile)
  textContent?: string | null; // Plain text alternatifi
  
  // Dinamik alanlar
  variables?: ReportTemplateVariable[] | null;
  
  // Metadata
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgreementReportTemplateCreateInput {
  name: string;
  category: AgreementReportTemplateCategory;
  description?: string;
  htmlContent: string;
  textContent?: string;
  variables?: ReportTemplateVariable[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface AgreementReportTemplateUpdateInput extends Partial<Omit<AgreementReportTemplateCreateInput, 'name'>> {
  name?: string;
}

export interface AgreementReportTemplateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: AgreementReportTemplateCategory;
  isActive?: boolean;
}








