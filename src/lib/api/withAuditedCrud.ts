/**
 * Audited CRUD Wrapper
 *
 * Tüm CRUD işlemlerini otomatik olarak audit log'a kaydeder.
 * Her API route'unda manuel audit kodu yazmak yerine bu wrapper kullanılır.
 *
 * Kullanım:
 * ```typescript
 * import { createAuditedHandlers } from '@/lib/api/withAuditedCrud';
 *
 * const handlers = createAuditedHandlers({
 *   entity: 'Apartment',
 *   model: 'apartment',
 *   module: 'real-estate',
 * });
 *
 * export const POST = handlers.create(async (prisma, data, context) => {
 *   return await prisma.apartment.create({ data: { ...data, tenantId: context.tenantId } });
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { withTenant, type TenantPrisma } from './withTenant';
import { getTenantFromRequest, type TenantContext } from './tenantContext';
import { getAuditContext, logCreate, logUpdate, logDelete, type AuditContext } from './auditHelper';
import { successResponse, errorResponse } from './errorHandler';
import type { ApiResponse } from './errorHandler';

export interface CrudContext {
  tenantContext: TenantContext;
  auditContext: AuditContext;
  tenantId: string;
  companyId: string;
  request: NextRequest;
}

export interface AuditedCrudOptions {
  entity: string;        // Entity adı (örn: 'Apartment', 'Property')
  module: string;        // Modül adı (örn: 'real-estate', 'hr')
  idKey?: string;        // ID parametresi (varsayılan: 'id')
  companyIdKey?: string; // CompanyId alanı (varsayılan: 'companyId')
}

/**
 * Audited CREATE handler oluşturur
 */
export function auditedCreate<TInput, TOutput>(
  options: AuditedCrudOptions,
  createFn: (
    prisma: TenantPrisma,
    data: TInput,
    context: CrudContext
  ) => Promise<TOutput>
) {
  return async function POST(request: NextRequest) {
    return withTenant<ApiResponse<{ data: TOutput }>>(
      request,
      async (tenantPrisma) => {
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        const auditContext = await getAuditContext(request);
        const body = await request.json();

        // İlk company'yi bul (veya body'den al)
        let companyId = body.companyId;
        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id;
        }

        if (!companyId) {
          return errorResponse('Validation error', 'No company found for tenant', 404);
        }

        const context: CrudContext = {
          tenantContext,
          auditContext,
          tenantId: tenantContext.id,
          companyId,
          request,
        };

        // Create işlemini çalıştır
        const result = await createFn(tenantPrisma, body, context);

        // Audit log kaydet (fire and forget)
        const resultId = (result as any)?.[options.idKey || 'id'] || (result as any)?.id;
        if (resultId) {
          logCreate(tenantContext, auditContext, options.entity, resultId, companyId, body);
        }

        return successResponse({ data: result });
      },
      { required: true, module: options.module }
    );
  };
}

/**
 * Audited UPDATE handler oluşturur
 */
export function auditedUpdate<TInput, TOutput>(
  options: AuditedCrudOptions,
  updateFn: (
    prisma: TenantPrisma,
    id: string,
    data: TInput,
    existing: any,
    context: CrudContext
  ) => Promise<TOutput>,
  findExistingFn?: (
    prisma: TenantPrisma,
    id: string,
    context: CrudContext
  ) => Promise<any>
) {
  return async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    return withTenant<ApiResponse<{ data: TOutput }>>(
      request,
      async (tenantPrisma) => {
        const { id } = await params;
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        const auditContext = await getAuditContext(request);
        const body = await request.json();

        const context: CrudContext = {
          tenantContext,
          auditContext,
          tenantId: tenantContext.id,
          companyId: '', // Mevcut kayıttan alınacak
          request,
        };

        // Mevcut kaydı bul
        let existing: any;
        if (findExistingFn) {
          existing = await findExistingFn(tenantPrisma, id, context);
        } else {
          // Varsayılan: model adıyla bul
          const modelName = options.entity.toLowerCase() as keyof TenantPrisma;
          existing = await (tenantPrisma[modelName] as any)?.findUnique?.({ where: { id } });
        }

        if (!existing) {
          return errorResponse('Not found', `${options.entity} not found`, 404);
        }

        // Tenant kontrolü
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', `${options.entity} belongs to different tenant`, 403);
        }

        context.companyId = existing[options.companyIdKey || 'companyId'] || '';

        // Update işlemini çalıştır
        const result = await updateFn(tenantPrisma, id, body, existing, context);

        // Audit log kaydet (fire and forget)
        logUpdate(
          tenantContext,
          auditContext,
          options.entity,
          id,
          existing,
          result as Record<string, any>,
          context.companyId
        );

        return successResponse({ data: result });
      },
      { required: true, module: options.module }
    );
  };
}

/**
 * Audited DELETE handler oluşturur
 */
export function auditedDelete(
  options: AuditedCrudOptions,
  deleteFn: (
    prisma: TenantPrisma,
    id: string,
    existing: any,
    context: CrudContext
  ) => Promise<void>,
  findExistingFn?: (
    prisma: TenantPrisma,
    id: string,
    context: CrudContext
  ) => Promise<any>,
  canDeleteFn?: (existing: any) => { canDelete: boolean; reason?: string }
) {
  return async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    return withTenant<ApiResponse<{ message: string }>>(
      request,
      async (tenantPrisma) => {
        const { id } = await params;
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        const auditContext = await getAuditContext(request);

        const context: CrudContext = {
          tenantContext,
          auditContext,
          tenantId: tenantContext.id,
          companyId: '',
          request,
        };

        // Mevcut kaydı bul
        let existing: any;
        if (findExistingFn) {
          existing = await findExistingFn(tenantPrisma, id, context);
        } else {
          const modelName = options.entity.toLowerCase() as keyof TenantPrisma;
          existing = await (tenantPrisma[modelName] as any)?.findUnique?.({ where: { id } });
        }

        if (!existing) {
          return errorResponse('Not found', `${options.entity} not found`, 404);
        }

        // Tenant kontrolü
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', `${options.entity} belongs to different tenant`, 403);
        }

        // Silinebilirlik kontrolü
        if (canDeleteFn) {
          const { canDelete, reason } = canDeleteFn(existing);
          if (!canDelete) {
            return errorResponse('Validation error', reason || `Cannot delete ${options.entity}`, 400);
          }
        }

        context.companyId = existing[options.companyIdKey || 'companyId'] || '';

        // Delete işlemini çalıştır
        await deleteFn(tenantPrisma, id, existing, context);

        // Audit log kaydet (fire and forget)
        logDelete(tenantContext, auditContext, options.entity, id, context.companyId, {
          ...existing,
          // İlişkili objeleri temizle
          property: undefined,
          contracts: undefined,
          payments: undefined,
          _count: undefined,
        });

        return successResponse({ message: `${options.entity} deleted successfully` });
      },
      { required: true, module: options.module }
    );
  };
}

/**
 * Tüm CRUD handler'ları tek seferde oluşturur
 */
export function createAuditedCrud(options: AuditedCrudOptions) {
  return {
    create: <TInput, TOutput>(
      createFn: (prisma: TenantPrisma, data: TInput, context: CrudContext) => Promise<TOutput>
    ) => auditedCreate(options, createFn),

    update: <TInput, TOutput>(
      updateFn: (prisma: TenantPrisma, id: string, data: TInput, existing: any, context: CrudContext) => Promise<TOutput>,
      findExistingFn?: (prisma: TenantPrisma, id: string, context: CrudContext) => Promise<any>
    ) => auditedUpdate(options, updateFn, findExistingFn),

    delete: (
      deleteFn: (prisma: TenantPrisma, id: string, existing: any, context: CrudContext) => Promise<void>,
      findExistingFn?: (prisma: TenantPrisma, id: string, context: CrudContext) => Promise<any>,
      canDeleteFn?: (existing: any) => { canDelete: boolean; reason?: string }
    ) => auditedDelete(options, deleteFn, findExistingFn, canDeleteFn),
  };
}
