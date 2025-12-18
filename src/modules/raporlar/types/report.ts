export type ReportStatus = 'pending' | 'completed' | 'failed' | 'generating';

export type ReportTypeCategory = 'core' | 'module';

export type ExportFormat = 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html' | 'zip';

export interface Report {
  id: string;
  name: string;
  type: string;
  typeName?: string;
  status: ReportStatus;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  filters: Record<string, any>;
  data?: any;
  fileSize?: string;
  generatedAt?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ReportType {
  id: string;
  name: string;
  category: ReportTypeCategory;
  module?: string;
  icon: string;
  description?: string;
  filters?: FilterConfig[];
  visualization?: VisualizationConfig;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: any;
}

export interface VisualizationConfig {
  type: 'table' | 'bar' | 'line' | 'pie' | 'area';
  options?: Record<string, any>;
}

export interface ReportCreateData {
  name: string;
  type: string;
  dateRange: {
    from: string;
    to: string;
  };
  filters: Record<string, any>;
  visualization?: VisualizationConfig;
}

