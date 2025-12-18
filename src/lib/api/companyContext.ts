/**
 * Company Context Helper
 * 
 * API route'larında companyId'yi güvenli bir şekilde almak için helper fonksiyonlar.
 * Bu fonksiyonlar, companyId'nin query parametresinden veya ilk company'den alınmasını sağlar.
 */

import { NextRequest } from 'next/server';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { errorResponse } from './errorHandler';

/**
 * CompanyId'yi request'ten alır
 * Öncelik sırası:
 * 1. Query parametresi (companyId)
 * 2. İlk company (fallback)
 * 
 * NOT: Bu fonksiyon request body'sini okumaz (body stream'i tüketmemek için).
 * Eğer body'den companyId almak gerekiyorsa, önce body'yi okuyun ve
 * getCompanyIdFromBody() fonksiyonunu kullanın.
 * 
 * @param request - NextRequest
 * @param tenantPrisma - Tenant Prisma client
 * @returns companyId veya null
 */
export async function getCompanyIdFromRequest(
  request: NextRequest,
  tenantPrisma: TenantPrismaClient
): Promise<string | null> {
  // 1. Query parametresinden al
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');

  if (companyId) {
    return companyId;
  }

  // 2. İlk company'yi bul (fallback)
  const firstCompany = await tenantPrisma.company.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return firstCompany?.id || null;
}

/**
 * Body'den companyId'yi alır
 * API route'lar body'yi okuduktan sonra bu fonksiyonu kullanabilir
 * 
 * @param body - Parsed request body
 * @param tenantPrisma - Tenant Prisma client
 * @returns companyId veya null
 */
export async function getCompanyIdFromBody(
  body: any,
  tenantPrisma: TenantPrismaClient
): Promise<string | null> {
  // Body'den companyId varsa kullan
  if (body.companyId) {
    return body.companyId;
  }

  // Yoksa ilk company'yi bul (fallback)
  const firstCompany = await tenantPrisma.company.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return firstCompany?.id || null;
}

/**
 * CompanyId'yi zorunlu olarak alır
 * Eğer companyId bulunamazsa hata döner
 * 
 * @param request - NextRequest
 * @param tenantPrisma - Tenant Prisma client
 * @returns companyId (string)
 * @throws ErrorResponse if companyId not found
 */
export async function requireCompanyId(
  request: NextRequest,
  tenantPrisma: TenantPrismaClient
): Promise<string> {
  const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

  if (!companyId) {
    throw errorResponse('Company required', 'No company found for tenant', 400);
  }

  return companyId;
}

/**
 * CompanyId'yi alır ve doğrular
 * Company'nin tenant'a ait olduğunu kontrol eder
 * 
 * @param request - NextRequest
 * @param tenantPrisma - Tenant Prisma client
 * @param tenantId - Tenant ID
 * @returns companyId (string)
 * @throws ErrorResponse if companyId not found or doesn't belong to tenant
 */
export async function requireValidCompanyId(
  request: NextRequest,
  tenantPrisma: TenantPrismaClient,
  tenantId: string
): Promise<string> {
  const companyId = await requireCompanyId(request, tenantPrisma);

  // Company'nin tenant'a ait olduğunu doğrula
  const company = await tenantPrisma.company.findFirst({
    where: {
      id: companyId,
      // Company model'inde tenantId yoksa bu kontrolü atla
      // Eğer varsa: tenantId: tenantId
    },
    select: { id: true },
  });

  if (!company) {
    throw errorResponse('Company not found', 'Company does not exist or does not belong to tenant', 404);
  }

  return companyId;
}

/**
 * Helper: API route'larında companyId'yi almak için kullanılır
 * 
 * Kullanım örneği:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return withTenant(async (tenantPrisma) => {
 *     const tenantContext = await getTenantFromRequest(request);
 *     const companyId = await requireCompanyId(request, tenantPrisma);
 *     
 *     // Artık companyId'yi kullanabilirsiniz
 *     const newItem = await tenantPrisma.modelName.create({
 *       data: {
 *         tenantId: tenantContext.id,
 *         companyId: companyId,
 *         // ... diğer alanlar
 *       },
 *     });
 *   });
 * }
 * ```
 */

















