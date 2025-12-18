// Form Builder Types
// FAZ 0.5: Dinamik Form Builder

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'file'
  | 'image'
  | 'color'
  | 'url'
  | 'tel'
  | 'hidden';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string; // Custom validation function name
  };
  options?: Array<{ value: string; label: string }>; // For select, radio, checkbox
  dependencies?: {
    field: string; // Field name to depend on
    condition: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
  }[];
  layout?: {
    colSpan?: number; // Grid column span (1-12)
    order?: number; // Display order
    group?: string; // Field group
  };
  style?: {
    width?: string;
    className?: string;
  };
}

export interface FormConfig {
  id: string;
  tenantId: string;
  module: string;
  entityType: string;
  name: string;
  fields: FormField[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormConfigData {
  module: string;
  entityType: string;
  name: string;
  fields: FormField[];
  isActive?: boolean;
}

export interface FormRenderOptions {
  showLabels?: boolean;
  showDescriptions?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  submitButton?: {
    label?: string;
    variant?: string;
    color?: string;
  };
  resetButton?: {
    label?: string;
    show?: boolean;
  };
}

export interface FormSubmission {
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  submittedBy?: string;
}









