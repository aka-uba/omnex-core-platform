/**
 * Template Variable Replacement Utility
 * Replaces {{variableName}} placeholders in template strings with actual values
 */

export interface VariableContext {
  apartment?: {
    id?: string;
    unitNumber?: string;
    area?: number;
    roomCount?: number;
    rentPrice?: number;
    property?: {
      name?: string;
      address?: string;
    };
  };
  contract?: {
    id?: string;
    contractNumber?: string;
    startDate?: Date;
    endDate?: Date;
    rentAmount?: number;
  };
  tenant?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  report?: {
    rentAmount?: number;
    deposit?: number;
    deliveryDate?: Date;
    contractDate?: Date;
    specialTerms?: string;
    nextSteps?: string;
  };
  [key: string]: any; // Allow custom variables
}

/**
 * Replace template variables in a string
 * @param content Template string with {{variableName}} placeholders
 * @param context Variable context object
 * @returns String with variables replaced
 */
export function replaceTemplateVariables(content: string, context: VariableContext): string {
  let result = content;

  // Build variable map from context
  const variables: Record<string, any> = {};

  // Apartment variables
  if (context.apartment) {
    variables.apartmentAddress = context.apartment.property?.address
      ? `${context.apartment.property.address} ${context.apartment.unitNumber || ''}`.trim()
      : context.apartment.unitNumber || '';
    variables.apartmentUnitNumber = context.apartment.unitNumber || '';
    variables.apartmentArea = context.apartment.area ? `${context.apartment.area} m²` : '';
    variables.apartmentRoomCount = context.apartment.roomCount?.toString() || '';
    variables.apartmentRentPrice = context.apartment.rentPrice
      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.apartment.rentPrice)
      : '';
    variables.propertyName = context.apartment.property?.name || '';
  }

  // Contract variables
  if (context.contract) {
    variables.contractNumber = context.contract.contractNumber || context.contract.id || '';
    variables.contractStartDate = context.contract.startDate
      ? new Date(context.contract.startDate).toLocaleDateString('tr-TR')
      : '';
    variables.contractEndDate = context.contract.endDate
      ? new Date(context.contract.endDate).toLocaleDateString('tr-TR')
      : '';
    variables.rentAmount = context.contract.rentAmount
      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.contract.rentAmount)
      : '';
  }

  // Tenant variables
  if (context.tenant) {
    variables.tenantName = context.tenant.name || '';
    variables.tenantEmail = context.tenant.email || '';
    variables.tenantPhone = context.tenant.phone || '';
  }

  // Report variables
  if (context.report) {
    variables.reportRentAmount = context.report.rentAmount
      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.report.rentAmount)
      : '';
    variables.reportDeposit = context.report.deposit
      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.report.deposit)
      : '';
    variables.reportDeliveryDate = context.report.deliveryDate
      ? new Date(context.report.deliveryDate).toLocaleDateString('tr-TR')
      : '';
    variables.reportContractDate = context.report.contractDate
      ? new Date(context.report.contractDate).toLocaleDateString('tr-TR')
      : '';
    variables.specialTerms = context.report.specialTerms || '';
    variables.nextSteps = context.report.nextSteps || '';
  }

  // Custom variables from context
  Object.keys(context).forEach((key) => {
    if (!['apartment', 'contract', 'tenant', 'report'].includes(key)) {
      variables[key] = context[key];
    }
  });

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value !== undefined && value !== null ? value : `{{${key}}}`));
  });

  return result;
}

/**
 * Extract variable names from template content
 * @param content Template string
 * @returns Array of variable names found in template
 */
export function extractTemplateVariables(content: string): string[] {
  const regex = /{{\s*(\w+)\s*}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}








