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
  }).catch((error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuditHelper] Failed to log audit event:', error);
    }
  });
}

// Audit log'da gösterilmeyecek alanlar
const IGNORED_FIELDS = [
  'updatedAt', 'createdAt', 'id', 'tenantId', 'companyId',
  'property', 'contracts', 'payments', 'appointments', 'maintenance',
  '_count', 'user', 'company', 'tenant'
];

/**
 * Değeri karşılaştırma için normalize et
 */
function normalizeValue(val: any): any {
  if (val === null || val === undefined) return null;

  // Date nesneleri
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object' && val !== null && 'toISOString' in val && typeof val.toISOString === 'function') {
    return val.toISOString();
  }

  // Prisma Decimal
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof val.toNumber === 'function') {
    return val.toNumber();
  }

  // BigInt
  if (typeof val === 'bigint') return Number(val);

  // Array karşılaştırması
  if (Array.isArray(val)) {
    return JSON.stringify(val.map(normalizeValue));
  }

  // Nested object with id (relation) - atla
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return undefined; // Skip relations
  }

  return val;
}

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

  // newValue'daki tüm key'leri kontrol et
  for (const key of Object.keys(newValue)) {
    // İlişkili objeleri ve otomatik alanları atla
    if (IGNORED_FIELDS.includes(key)) continue;

    const oldVal = oldValue[key];
    const newVal = newValue[key];

    // Skip undefined values
    if (newVal === undefined) continue;

    // Normalize values for comparison
    const oldNorm = normalizeValue(oldVal);
    const newNorm = normalizeValue(newVal);

    // Skip relations (normalized to undefined)
    if (oldNorm === undefined && newNorm === undefined) continue;

    // Compare normalized values
    const oldStr = JSON.stringify(oldNorm);
    const newStr = JSON.stringify(newNorm);

    if (oldStr !== newStr) {
      changedFields.push(key);
      oldValues[key] = oldNorm;
      newValues[key] = newNorm;
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
  if (changedFields.length === 0) {
    return;
  }

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
