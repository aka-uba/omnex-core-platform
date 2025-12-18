/**
 * Audit Log Service
 * 
 * Aktivite timeline ve audit logging için service layer
 */

import { getTenantPrisma } from '@/lib/dbSwitcher';
import type { TenantContext } from '@/lib/api/tenantContext';

export interface AuditLogInput {
  userId?: string;
  companyId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  tenantContext: TenantContext,
  input: AuditLogInput
) {
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);

  try {
    // Get companyId from input or find first company for tenant
    let companyId = input.companyId;
    if (!companyId) {
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      companyId = firstCompany?.id;
    }

    if (!companyId) {
      // Skip audit log if no company found - don't break the flow
      return;
    }

    const auditData: any = {
      tenantId: tenantContext.id,
      companyId,
      action: input.action,
      entity: input.entity,
    };

    if (input.userId !== undefined) {
      auditData.userId = input.userId || null;
    }
    if (input.entityId !== undefined) {
      auditData.entityId = input.entityId || null;
    }
    if (input.metadata !== undefined) {
      auditData.metadata = input.metadata || null;
    }
    if (input.ipAddress !== undefined) {
      auditData.ipAddress = input.ipAddress || null;
    }
    if (input.userAgent !== undefined) {
      auditData.userAgent = input.userAgent || null;
    }

    await tenantPrisma.auditLog.create({
      data: auditData,
    });
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    // Use logger but don't throw - modül bağımsızlığı için
    try {
      const { logger } = await import('@/lib/utils/logger');
      logger.error('Failed to log audit event', error, 'audit-log-service');
    } catch {
      // Logger not available - modül bağımsızlığı
    }
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  tenantContext: TenantContext,
  filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }
) {
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);

  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.entity) {
    where.entity = filters.entity;
  }
  if (filters.entityId) {
    where.entityId = filters.entityId;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    tenantPrisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    tenantPrisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
  };
}

/**
 * Get user activity timeline
 */
export async function getUserActivityTimeline(
  tenantContext: TenantContext,
  userId: string,
  limit: number = 50
) {
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);

  // Limit'i maksimum 100 ile sınırla (performans için)
  const safeLimit = Math.min(limit, 100);

  return await tenantPrisma.auditLog.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });
}

/**
 * Get entity activity history
 */
export async function getEntityActivityHistory(
  tenantContext: TenantContext,
  entity: string,
  entityId: string,
  limit: number = 50
) {
  const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);

  // Limit'i maksimum 100 ile sınırla (performans için)
  const safeLimit = Math.min(limit, 100);

  return await tenantPrisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });
}


