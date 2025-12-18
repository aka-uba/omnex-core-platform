// Permission Service
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { isValidFeatureKey } from './constants/features';

export interface PermissionCheckOptions {
  userId: string;
  permissionKey: string;
  resourceId?: string;
  resourceType?: string;
}

export interface UserPermissions {
  role: string;
  permissions: string[];
  customPermissions: {
    granted: string[];
    denied: string[];
  };
}

export class PermissionService {
  private tenantPrisma: TenantPrismaClient;

  constructor(tenantPrisma: TenantPrismaClient) {
    this.tenantPrisma = tenantPrisma;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(options: PermissionCheckOptions): Promise<boolean> {
    const { userId, permissionKey } = options;

    // Get user
    const user = await this.tenantPrisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // SuperAdmin has all permissions
    if (user.role === 'SuperAdmin') {
      return true;
    }

    // Check if permission key is valid
    if (!isValidFeatureKey(permissionKey)) {
      // Allow legacy permission keys
      // return false;
    }

    // Check role-based permissions
    const roleHasPermission = await this.checkRolePermission(user.role, permissionKey);
    if (roleHasPermission) {
      return true;
    }

    // Check user-specific permissions
    const userPermission = user.userPermissions.find(
      up => up.permissionKey === permissionKey && up.granted === true
    );

    if (userPermission) {
      // Check if permission is expired
      if (userPermission.expiresAt && userPermission.expiresAt < new Date()) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Check role-based permission
   */
  private async checkRolePermission(role: string, permissionKey: string): Promise<boolean> {
    // Define role-based permission mappings
    const rolePermissions: Record<string, string[]> = {
      SuperAdmin: ['*'], // All permissions
      AgencyUser: [
        // Module access
        'module.ai',
        'module.accounting',
        'module.file-manager',
        'module.notifications',
        'module.hr',
        'module.maintenance',
        // Common actions
        'ui.button.create',
        'ui.button.edit',
        'ui.button.delete',
        'ui.button.export',
        'ui.button.import',
        'ui.button.print',
        // Features
        'feature.export.csv',
        'feature.export.excel',
        'feature.export.pdf',
        'feature.file.upload',
        'feature.file.download',
      ],
      ClientUser: [
        // Limited module access
        'module.file-manager',
        'module.notifications',
        // Limited actions
        'ui.button.view',
        'feature.file.download',
      ],
    };

    const permissions = rolePermissions[role] || [];
    
    // Check wildcard
    if (permissions.includes('*')) {
      return true;
    }

    // Check exact match
    if (permissions.includes(permissionKey)) {
      return true;
    }

    // Check module-level permissions
    const moduleKey = permissionKey.split('.')[0] + '.' + permissionKey.split('.')[1];
    if (permissions.includes(moduleKey)) {
      return true;
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await this.tenantPrisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const grantedPermissions = user.userPermissions
      .filter(up => up.granted === true && (!up.expiresAt || up.expiresAt > new Date()))
      .map(up => up.permissionKey);

    const deniedPermissions = user.userPermissions
      .filter(up => up.granted === false)
      .map(up => up.permissionKey);

    return {
      role: user.role,
      permissions: grantedPermissions,
      customPermissions: {
        granted: grantedPermissions,
        denied: deniedPermissions,
      },
    };
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string,
    permissionKey: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    // Ensure permission definition exists
    await this.ensurePermissionDefinition(permissionKey);

    // Get user to retrieve tenantId and companyId
    // Note: User model doesn't have tenantId/companyId directly
    // We need to get them from a different source - for now use placeholder approach
    const user = await this.tenantPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get tenantId and companyId from tenant context or use placeholder
    // In a real implementation, these should come from the request context
    const tenantId = (this.tenantPrisma as any).$tenantId || '';
    const companyId = (this.tenantPrisma as any).$companyId || '';

    if (!tenantId || !companyId) {
      throw new Error('TenantId/CompanyId not available in Prisma context - ensure tenant context is set');
    }

    const permissionData: any = {
      tenantId,
      companyId,
      userId,
      permissionKey,
      granted: true,
      grantedBy,
      grantedAt: new Date(),
    };

    if (expiresAt !== undefined) {
      permissionData.expiresAt = expiresAt;
    }

    await this.tenantPrisma.userPermission.upsert({
      where: {
        userId_permissionKey: {
          userId,
          permissionKey,
        },
      } as any, // Type assertion needed until Prisma client regenerates
      create: permissionData,
      update: {
        granted: true,
        grantedBy,
        grantedAt: new Date(),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
      },
    });
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(userId: string, permissionKey: string): Promise<void> {
    await this.tenantPrisma.userPermission.updateMany({
      where: {
        userId,
        permissionKey,
      },
      data: {
        granted: false,
      },
    });
  }

  /**
   * Ensure permission definition exists
   */
  private async ensurePermissionDefinition(permissionKey: string): Promise<void> {
    const existing = await this.tenantPrisma.permissionDefinition.findUnique({
      where: { permissionKey },
    });

    if (!existing) {
      // Extract module and action from permission key
      const parts = permissionKey.split('.');
      const module = parts[0];
      const action = parts.slice(1).join('.');

      const permissionData: any = {
        permissionKey,
        permissionName: action || permissionKey,
        description: `Permission for ${permissionKey}`,
      };
      if (module) {
        permissionData.category = module;
        permissionData.module = module;
      }
      await this.tenantPrisma.permissionDefinition.create({
        data: permissionData,
      });
    }
  }

  /**
   * Check multiple permissions
   */
  async hasAnyPermission(userId: string, permissionKeys: string[]): Promise<boolean> {
    for (const key of permissionKeys) {
      if (await this.hasPermission({ userId, permissionKey: key })) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check all permissions
   */
  async hasAllPermissions(userId: string, permissionKeys: string[]): Promise<boolean> {
    for (const key of permissionKeys) {
      if (!(await this.hasPermission({ userId, permissionKey: key }))) {
        return false;
      }
    }
    return true;
  }
}

