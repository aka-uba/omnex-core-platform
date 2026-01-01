/**
 * Audit Helper
 *
 * API route'larında audit log kaydı için yardımcı fonksiyonlar
 * Gereksiz sorgu yapmadan, mevcut context'i kullanır
 */

import type { NextRequest } from 'next/server';
import type { TenantContext } from '@/lib/api/tenantContext';
import { verifyAuth } from '@/lib/auth/jwt';
import { logAuditEvent, type AuditLogInput } from '@/lib/services/auditLogService';

export interface AuditContext {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Request'ten audit context bilgilerini çıkar
 * Sadece header'lardan okur, ekstra DB sorgusu yapmaz
 */
export async function getAuditContext(request: NextRequest): Promise<AuditContext> {
  // Get user ID from JWT token
  let userId: string | null = null;
  try {
    const authResult = await verifyAuth(request);
    if (authResult.valid && authResult.payload) {
      userId = authResult.payload.userId;
    }
  } catch {
    // Auth failed, continue without userId
  }

  // Get IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip') ||
                    null;

  // Get user agent
  const userAgent = request.headers.get('user-agent') || null;

  return {
    userId,
    ipAddress,
    userAgent,
  };
}

/**
 * Audit log kaydet - Fire and forget
 * Ana işlemi bloklamaz, hata durumunda sessizce devam eder
 */
export function logAudit(
  tenantContext: TenantContext,
  auditContext: AuditContext,
  input: Omit<AuditLogInput, 'userId' | 'ipAddress' | 'userAgent'>
): void {
  // Fire and forget - don't await
  logAuditEvent(tenantContext, {
    ...input,
    userId: auditContext.userId || undefined,
    ipAddress: auditContext.ipAddress || undefined,
    userAgent: auditContext.userAgent || undefined,
  }).catch(() => {
    // Silently ignore errors - audit log should not break main flow
  });
}

// Audit log'da gösterilmeyecek alanlar
const IGNORED_FIELDS = [
  'updatedAt', 'createdAt', 'id', 'tenantId', 'companyId',
  'property', 'contracts', 'payments', 'appointments', 'maintenance',
  '_count', 'user', 'company', 'tenant'
];

/**
 * Değişen alanları tespit et
 * Sadece değişen alanları döner, tüm objeyi değil
 */
export function getChangedFields<T extends Record<string, any>>(
  oldValue: T,
  newValue: Partial<T>
): {
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
} {
  const changedFields: string[] = [];
  const oldValues: Record<string, any> = {};
  const newValues: Record<string, any> = {};

  for (const key of Object.keys(newValue)) {
    // İlişkili objeleri ve otomatik alanları atla
    if (IGNORED_FIELDS.includes(key)) continue;

    const oldVal = oldValue[key];
    const newVal = newValue[key];

    // Skip undefined values
    if (newVal === undefined) continue;

    // İlişkili objeleri atla (nested objects with id)
    if (newVal && typeof newVal === 'object' && !Array.isArray(newVal) && 'id' in newVal) continue;

    // Compare values (handle dates, null, etc.)
    const oldCompare = oldVal && typeof oldVal === 'object' && 'toISOString' in oldVal ? (oldVal as Date).toISOString() : oldVal;
    const newCompare = newVal && typeof newVal === 'object' && 'toISOString' in newVal ? (newVal as Date).toISOString() : newVal;

    if (JSON.stringify(oldCompare) !== JSON.stringify(newCompare)) {
      changedFields.push(key);
      oldValues[key] = oldCompare;
      newValues[key] = newCompare;
    }
  }

  return { changedFields, oldValues, newValues };
}

/**
 * CREATE için audit log kaydet
 */
export function logCreate(
  tenantContext: TenantContext,
  auditContext: AuditContext,
  entity: string,
  entityId: string,
  companyId?: string,
  newValue?: Record<string, any>
): void {
  logAudit(tenantContext, auditContext, {
    action: 'create',
    entity,
    entityId,
    companyId,
    metadata: newValue ? { newValue } : undefined,
  });
}

/**
 * UPDATE için audit log kaydet
 */
export function logUpdate(
  tenantContext: TenantContext,
  auditContext: AuditContext,
  entity: string,
  entityId: string,
  oldValue: Record<string, any>,
  newValue: Record<string, any>,
  companyId?: string
): void {
  const { changedFields, oldValues, newValues } = getChangedFields(oldValue, newValue);

  // Değişiklik yoksa log tutma
  if (changedFields.length === 0) return;

  logAudit(tenantContext, auditContext, {
    action: 'update',
    entity,
    entityId,
    companyId,
    metadata: {
      changedFields,
      oldValue: oldValues,
      newValue: newValues,
    },
  });
}

/**
 * DELETE için audit log kaydet
 */
export function logDelete(
  tenantContext: TenantContext,
  auditContext: AuditContext,
  entity: string,
  entityId: string,
  companyId?: string,
  deletedValue?: Record<string, any>
): void {
  logAudit(tenantContext, auditContext, {
    action: 'delete',
    entity,
    entityId,
    companyId,
    metadata: deletedValue ? { oldValue: deletedValue } : undefined,
  });
}
