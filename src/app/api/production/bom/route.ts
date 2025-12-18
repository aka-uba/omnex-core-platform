import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { bomItemCreateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/production/bom - List BOM items by bomId
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ bomItems: unknown[]; total: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const bomId = searchParams.get('bomId');
      const productId = searchParams.get('productId');

      if (!bomId && !productId) {
        return errorResponse('Invalid request', 'bomId or productId is required', 400);
      }

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get company context
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company context required', 'Company ID could not be determined', 400);
      }

      // Build where clause with tenant and company isolation
      const where: Prisma.BOMItemWhereInput = {
        tenantId: tenantContext.id,
        companyId: companyId,
      };

      if (bomId) {
        where.bomId = bomId;
      } else if (productId) {
        // When productId is provided, bomId should match productId (BOM belongs to a product)
        where.bomId = productId;
      }

      // Get BOM items
      const bomItems = await tenantPrisma.bOMItem.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      return successResponse({
        bomItems: bomItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          wasteRate: Number(item.wasteRate),
        })),
        total: bomItems.length,
      });
    },
    { required: true, module: 'production' }
  );
}

// POST /api/production/bom - Create BOM item
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ bomItem: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = bomItemCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // bomId should be the product that this BOM belongs to
      // If bomId is not provided but productId is, use productId as bomId
      const finalBomId = validatedData.bomId || validatedData.productId;

      // Get companyId
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company ID required', 'Company ID is required', 400);
      }

      // Create BOM item
      const bomItemData: any = {
        tenantId: tenantContext.id,
        companyId,
        bomId: finalBomId,
        productId: validatedData.productId,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        wasteRate: validatedData.wasteRate || 0,
        order: validatedData.order || 0,
      };
      
      if (validatedData.componentId !== undefined && validatedData.componentId !== null) {
        bomItemData.componentId = validatedData.componentId;
      }
      
      const bomItem = await tenantPrisma.bOMItem.create({
        data: bomItemData,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      });

      return successResponse({
        bomItem: {
          ...bomItem,
          quantity: Number(bomItem.quantity),
          wasteRate: Number(bomItem.wasteRate),
        },
      });
    },
    { required: true, module: 'production' }
  );
}


