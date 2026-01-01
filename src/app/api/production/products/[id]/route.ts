import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productUpdateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/production/products/[id] - Get product by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ product: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get product
      const product = await tenantPrisma.product.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          bomItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              component: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          bomProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              productionOrders: true,
              stockMovements: true,
            },
          },
        },
      });

      if (!product) {
        return errorResponse('Not found', 'Product not found', 404);
      }

      return successResponse({
        product: {
          ...product,
          stockQuantity: Number(product.stockQuantity),
          minStockLevel: product.minStockLevel ? Number(product.minStockLevel) : null,
          maxStockLevel: product.maxStockLevel ? Number(product.maxStockLevel) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : null,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          specifications: product.specifications || {},
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// PATCH /api/production/products/[id] - Update product
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ product: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = productUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if product exists
      const existingProduct = await tenantPrisma.product.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingProduct) {
        return errorResponse('Not found', 'Product not found', 404);
      }

      // Check if code is unique (if being updated)
      if (validatedData.code && validatedData.code !== existingProduct.code) {
        const codeExists = await tenantPrisma.product.findFirst({
          where: {
            tenantId: tenantContext.id,
            code: validatedData.code,
            id: { not: id },
          },
        });

        if (codeExists) {
          return errorResponse('Validation error', 'Product code already exists', 409);
        }
      }

      // Update product
      const updatedProduct = await tenantPrisma.product.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.code && { code: validatedData.code }),
          ...(validatedData.sku !== undefined && { sku: validatedData.sku }),
          ...(validatedData.barcode !== undefined && { barcode: validatedData.barcode }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.locationId !== undefined && { locationId: validatedData.locationId }),
          ...(validatedData.stockQuantity !== undefined && { stockQuantity: validatedData.stockQuantity }),
          ...(validatedData.minStockLevel !== undefined && { minStockLevel: validatedData.minStockLevel }),
          ...(validatedData.maxStockLevel !== undefined && { maxStockLevel: validatedData.maxStockLevel }),
          ...(validatedData.unit && { unit: validatedData.unit }),
          ...(validatedData.costPrice !== undefined && { costPrice: validatedData.costPrice }),
          ...(validatedData.sellingPrice !== undefined && { sellingPrice: validatedData.sellingPrice }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.isProducible !== undefined && { isProducible: validatedData.isProducible }),
          ...(validatedData.productionTime !== undefined && { productionTime: validatedData.productionTime }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.specifications !== undefined && { 
            specifications: validatedData.specifications as Prisma.InputJsonValue 
          }),
          ...(validatedData.images !== undefined && { images: validatedData.images }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              productionOrders: true,
              stockMovements: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'Product', id, existingProduct, updatedProduct, existingProduct.companyId || undefined);

      return successResponse({
        product: {
          ...updatedProduct,
          stockQuantity: Number(updatedProduct.stockQuantity),
          minStockLevel: updatedProduct.minStockLevel ? Number(updatedProduct.minStockLevel) : null,
          maxStockLevel: updatedProduct.maxStockLevel ? Number(updatedProduct.maxStockLevel) : null,
          costPrice: updatedProduct.costPrice ? Number(updatedProduct.costPrice) : null,
          sellingPrice: updatedProduct.sellingPrice ? Number(updatedProduct.sellingPrice) : null,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString(),
          specifications: updatedProduct.specifications || {},
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// DELETE /api/production/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if product exists
      const existingProduct = await tenantPrisma.product.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingProduct) {
        return errorResponse('Not found', 'Product not found', 404);
      }

      // Check if product is used in production orders
      const hasProductionOrders = await tenantPrisma.productionOrder.count({
        where: {
          productId: id,
        },
      }) > 0;

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Product', id, existingProduct.companyId || undefined, {
        name: existingProduct.name,
        code: existingProduct.code,
      });

      if (hasProductionOrders) {
        // Soft delete instead
        await tenantPrisma.product.update({
          where: { id },
          data: { isActive: false },
        });
        return successResponse({ message: 'Product deactivated (has production orders)' });
      }

      // Hard delete
      await tenantPrisma.product.delete({
        where: { id },
      });

      return successResponse({ message: 'Product deleted successfully' });
    },
    { required: true, module: 'production' }
  );
}

