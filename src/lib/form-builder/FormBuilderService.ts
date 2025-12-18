// Form Builder Service
// FAZ 0.5: Dinamik Form Builder

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { Prisma } from '@prisma/tenant-client';
import { FormConfig, FormConfigData, FormField } from './types';

export class FormBuilderService {
  private tenantPrisma: TenantPrismaClient;

  constructor(tenantPrisma: TenantPrismaClient) {
    this.tenantPrisma = tenantPrisma;
  }

  /**
   * Get form config by ID
   */
  async getFormConfig(formId: string): Promise<FormConfig | null> {
    const config = await this.tenantPrisma.formConfig.findUnique({
      where: { id: formId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      module: config.module,
      entityType: config.entityType,
      name: config.name,
      fields: config.fields as unknown as FormField[],
      version: config.version,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Get form config by module and entity type
   */
  async getFormConfigByEntity(
    tenantId: string,
    companyId: string,
    module: string,
    entityType: string
  ): Promise<FormConfig | null> {
    const config = await this.tenantPrisma.formConfig.findFirst({
      where: {
        tenantId,
        companyId,
        module,
        entityType,
        isActive: true,
      },
      orderBy: { version: 'desc' },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      module: config.module,
      entityType: config.entityType,
      name: config.name,
      fields: config.fields as unknown as FormField[],
      version: config.version,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Get all form configs for a module
   */
  async getFormConfigs(
    tenantId: string,
    companyId: string,
    module?: string,
    entityType?: string
  ): Promise<FormConfig[]> {
    const where: any = { tenantId, companyId };
    if (module) where.module = module;
    if (entityType) where.entityType = entityType;

    const configs = await this.tenantPrisma.formConfig.findMany({
      where,
      orderBy: [{ module: 'asc' }, { entityType: 'asc' }, { version: 'desc' }],
    });

    return configs.map(config => ({
      id: config.id,
      tenantId: config.tenantId,
      module: config.module,
      entityType: config.entityType,
      name: config.name,
      fields: config.fields as unknown as FormField[],
      version: config.version,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  /**
   * Create form config
   */
  async createFormConfig(
    tenantId: string,
    companyId: string,
    data: FormConfigData
  ): Promise<FormConfig> {
    // Validate fields
    this.validateFields(data.fields);

    const config = await this.tenantPrisma.formConfig.create({
      data: {
        tenantId,
        companyId,
        module: data.module,
        entityType: data.entityType,
        name: data.name,
        fields: data.fields as unknown as Prisma.InputJsonValue,
        version: 1,
        isActive: data.isActive ?? true,
      },
    });

    return {
      id: config.id,
      tenantId: config.tenantId,
      module: config.module,
      entityType: config.entityType,
      name: config.name,
      fields: config.fields as unknown as FormField[],
      version: config.version,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update form config (creates new version)
   */
  async updateFormConfig(
    formId: string,
    data: Partial<FormConfigData>
  ): Promise<FormConfig> {
    const existing = await this.getFormConfig(formId);
    if (!existing) {
      throw new Error('Form config not found');
    }

    // Validate fields if provided
    if (data.fields) {
      this.validateFields(data.fields);
    }

    // Get companyId from existing config
    const existingDb = await this.tenantPrisma.formConfig.findUnique({
      where: { id: formId },
      select: { companyId: true },
    });

    if (!existingDb || !existingDb.companyId) {
      throw new Error('Form config not found or missing companyId');
    }

    // Deactivate old version
    await this.tenantPrisma.formConfig.update({
      where: { id: formId },
      data: { isActive: false },
    });

    // Create new version
    const newConfig = await this.tenantPrisma.formConfig.create({
      data: {
        tenantId: existing.tenantId,
        companyId: existingDb.companyId,
        module: data.module || existing.module,
        entityType: data.entityType || existing.entityType,
        name: data.name || existing.name,
        fields: (data.fields || existing.fields) as unknown as Prisma.InputJsonValue,
        version: existing.version + 1,
        isActive: data.isActive ?? true,
      },
    });

    return {
      id: newConfig.id,
      tenantId: newConfig.tenantId,
      module: newConfig.module,
      entityType: newConfig.entityType,
      name: newConfig.name,
      fields: newConfig.fields as unknown as FormField[],
      version: newConfig.version,
      isActive: newConfig.isActive,
      createdAt: newConfig.createdAt,
      updatedAt: newConfig.updatedAt,
    };
  }

  /**
   * Delete form config
   */
  async deleteFormConfig(formId: string): Promise<void> {
    await this.tenantPrisma.formConfig.delete({
      where: { id: formId },
    });
  }

  /**
   * Validate form fields
   */
  private validateFields(fields: FormField[]): void {
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be a non-empty array');
    }

    const fieldNames = new Set<string>();
    for (const field of fields) {
      // Check required fields
      if (!field.id || !field.name || !field.type) {
        throw new Error('Field must have id, name, and type');
      }

      // Check duplicate names
      if (fieldNames.has(field.name)) {
        throw new Error(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);

      // Validate field type
      const validTypes: string[] = [
        'text',
        'textarea',
        'number',
        'email',
        'password',
        'date',
        'datetime',
        'time',
        'select',
        'multiselect',
        'checkbox',
        'radio',
        'switch',
        'file',
        'image',
        'color',
        'url',
        'tel',
        'hidden',
      ];
      if (!validTypes.includes(field.type)) {
        throw new Error(`Invalid field type: ${field.type}`);
      }

      // Validate select/radio/checkbox have options
      if (['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)) {
        if (!field.options || field.options.length === 0) {
          throw new Error(`Field ${field.name} of type ${field.type} must have options`);
        }
      }
    }
  }

  /**
   * Generate field ID
   */
  generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

