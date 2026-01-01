import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productCreateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/production/products - List products
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ products: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const category = searchParams.get('category') || undefined;
      const locationId = searchParams.get('locationId') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const isProducible = searchParams.get('isProducible') === 'true' ? true : searchParams.get('isProducible') === 'false' ? false : undefined;
      const lowStock = searchParams.get('lowStock') === 'true';
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
      const where: Prisma.ProductWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(category && { category }),
        ...(locationId && { locationId }),
        ...(isActive !== undefined && { isActive }),
        ...(isProducible !== undefined && { isProducible }),
        // lowStock filter will be applied in application layer after fetching
      };

      // Get total count
      const total = await tenantPrisma.product.count({ where });

      // Get paginated products
      let products = await tenantPrisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
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

      // Apply lowStock filter if requested
      if (lowStock) {
        products = products.filter(product => {
          const stockQty = Number(product.stockQuantity);
          const minLevel = product.minStockLevel ? Number(product.minStockLevel) : null;
          return minLevel !== null && stockQty <= minLevel;
        });
      }

      return successResponse({
        products: products.map(product => ({
          ...product,
          stockQuantity: Number(product.stockQuantity),
          minStockLevel: product.minStockLevel ? Number(product.minStockLevel) : null,
          maxStockLevel: product.maxStockLevel ? Number(product.maxStockLevel) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : null,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          specifications: product.specifications || {},
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'production' }
  );
}

// POST /api/production/products - Create product
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ product: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = productCreateSchema.parse(body);

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

      // Check if code is unique
      const existingProduct = await tenantPrisma.product.findFirst({
        where: {
          tenantId: tenantContext.id,
          code: validatedData.code,
        },
      });

      if (existingProduct) {
        return errorResponse('Validation error', 'Product code already exists', 409);
      }

      // Create product
      const newProduct = await tenantPrisma.product.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          name: validatedData.name,
          code: validatedData.code,
          sku: validatedData.sku || null,
          barcode: validatedData.barcode || null,
          category: validatedData.category,
          type: validatedData.type,
          locationId: validatedData.locationId || null,
          stockQuantity: validatedData.stockQuantity || 0,
          minStockLevel: validatedData.minStockLevel || null,
          maxStockLevel: validatedData.maxStockLevel || null,
          unit: validatedData.unit,
          costPrice: validatedData.costPrice || null,
          sellingPrice: validatedData.sellingPrice || null,
          currency: validatedData.currency || 'TRY',
          isProducible: validatedData.isProducible || false,
          productionTime: validatedData.productionTime || null,
          description: validatedData.description || null,
          specifications: validatedData.specifications ? (validatedData.specifications as Prisma.InputJsonValue) : {},
          images: validatedData.images || [],
          isActive: true,
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
      logCreate(tenantContext, auditContext, 'Product', newProduct.id, companyId, {
        name: newProduct.name,
        code: newProduct.code,
        type: newProduct.type,
      });

      return successResponse({
        product: {
          ...newProduct,
          stockQuantity: Number(newProduct.stockQuantity),
          minStockLevel: newProduct.minStockLevel ? Number(newProduct.minStockLevel) : null,
          maxStockLevel: newProduct.maxStockLevel ? Number(newProduct.maxStockLevel) : null,
          costPrice: newProduct.costPrice ? Number(newProduct.costPrice) : null,
          sellingPrice: newProduct.sellingPrice ? Number(newProduct.sellingPrice) : null,
          createdAt: newProduct.createdAt.toISOString(),
          updatedAt: newProduct.updatedAt.toISOString(),
          specifications: newProduct.specifications || {},
        },
      });
    },
    { required: true, module: 'production' }
  );
}

