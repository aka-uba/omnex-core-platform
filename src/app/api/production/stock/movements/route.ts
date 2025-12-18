import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { stockMovementCreateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/production/stock/movements - List stock movements
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ movements: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const productId = searchParams.get('productId') || undefined;
      const locationId = searchParams.get('locationId') || undefined;
      const type = searchParams.get('type') || undefined;
      const referenceType = searchParams.get('referenceType') || undefined;
      const referenceId = searchParams.get('referenceId') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause
      const where: Prisma.StockMovementWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(productId && { productId }),
        ...(locationId && { locationId }),
        ...(type && { type }),
        ...(referenceType && { referenceType }),
        ...(referenceId && { referenceId }),
        ...(startDate && endDate && {
          movementDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(startDate && !endDate && {
          movementDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && !startDate && {
          movementDate: {
            lte: new Date(endDate),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.stockMovement.count({ where });

      // Get paginated movements

      const movements = await tenantPrisma.stockMovement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { movementDate: 'desc' },
        include: {
          product: {
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
        movements: movements.map(movement => ({
          ...movement,
          quantity: Number(movement.quantity),
          movementDate: movement.movementDate.toISOString(),
          createdAt: movement.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'production' }
  );
}

// POST /api/production/stock/movements - Create stock movement
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ movement: unknown; product: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = stockMovementCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      const companyId = firstCompany.id;

      // Check if product exists
      const product = await tenantPrisma.product.findFirst({
        where: {
          id: validatedData.productId,
          tenantId: tenantContext.id,
        },
      });

      if (!product) {
        return errorResponse('Validation error', 'Product not found', 404);
      }

      // Create stock movement
      const newMovement = await tenantPrisma.stockMovement.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          locationId: validatedData.locationId || null,
          productId: validatedData.productId,
          type: validatedData.type,
          quantity: validatedData.quantity,
          unit: validatedData.unit,
          referenceType: validatedData.referenceType || null,
          referenceId: validatedData.referenceId || null,
          movementDate: validatedData.movementDate ? new Date(validatedData.movementDate) : new Date(),
          notes: validatedData.notes || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      });

      // Update product stock quantity
      let newStockQuantity = Number(product.stockQuantity);
      if (validatedData.type === 'in' || validatedData.type === 'adjustment') {
        newStockQuantity += Number(validatedData.quantity);
      } else if (validatedData.type === 'out') {
        newStockQuantity -= Number(validatedData.quantity);
        if (newStockQuantity < 0) {
          newStockQuantity = 0;
        }
      }
      // 'transfer' type doesn't change total stock


      await tenantPrisma.product.update({
        where: { id: validatedData.productId },
        data: { stockQuantity: newStockQuantity },
      });

      // Get updated product
      const updatedProduct = await tenantPrisma.product.findFirst({
        where: { id: validatedData.productId },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        movement: {
          ...newMovement,
          quantity: Number(newMovement.quantity),
          movementDate: newMovement.movementDate.toISOString(),
          createdAt: newMovement.createdAt.toISOString(),
        },
        product: updatedProduct ? {
          ...updatedProduct,
          stockQuantity: Number(updatedProduct.stockQuantity),
          minStockLevel: updatedProduct.minStockLevel ? Number(updatedProduct.minStockLevel) : null,
          maxStockLevel: updatedProduct.maxStockLevel ? Number(updatedProduct.maxStockLevel) : null,
          costPrice: updatedProduct.costPrice ? Number(updatedProduct.costPrice) : null,
          sellingPrice: updatedProduct.sellingPrice ? Number(updatedProduct.sellingPrice) : null,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString(),
          specifications: updatedProduct.specifications || {},
        } : null,
      });
    },
    { required: true, module: 'production' }
  );
}

