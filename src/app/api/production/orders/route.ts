import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productionOrderCreateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${timestamp}-${random}`;
}

// GET /api/production/orders - List production orders
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ orders: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const status = searchParams.get('status') || undefined;
      const locationId = searchParams.get('locationId') || undefined;
      const productId = searchParams.get('productId') || undefined;
      const priority = searchParams.get('priority') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
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
      const where: Prisma.ProductionOrderWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && { status }),
        ...(locationId && { locationId }),
        ...(productId && { productId }),
        ...(priority && { priority }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.productionOrder.count({ where });

      // Get paginated orders

      const orders = await tenantPrisma.productionOrder.findMany({
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
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          productionSteps: {
            orderBy: { stepNumber: 'asc' },
          },
          _count: {
            select: {
              productionSteps: true,
            },
          },
        },
      });

      return successResponse({
        orders: orders.map(order => ({
          ...order,
          quantity: Number(order.quantity),
          estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
          actualCost: order.actualCost ? Number(order.actualCost) : null,
          plannedStartDate: order.plannedStartDate?.toISOString() || null,
          plannedEndDate: order.plannedEndDate?.toISOString() || null,
          actualStartDate: order.actualStartDate?.toISOString() || null,
          actualEndDate: order.actualEndDate?.toISOString() || null,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'production' }
  );
}

// POST /api/production/orders - Create production order
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ order: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = productionOrderCreateSchema.parse(body);

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

      // Generate order number if not provided
      const orderNumber = validatedData.orderNumber || generateOrderNumber();

      // Check if order number is unique
      const existingOrder = await tenantPrisma.productionOrder.findFirst({
        where: {
          tenantId: tenantContext.id,
          orderNumber,
        },
      });

      if (existingOrder) {
        return errorResponse('Validation error', 'Order number already exists', 409);
      }

      // Create production order
      const newOrder = await tenantPrisma.productionOrder.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          locationId: validatedData.locationId,
          productId: validatedData.productId,
          orderNumber,
          quantity: validatedData.quantity,
          unit: validatedData.unit,
          status: 'pending',
          plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : null,
          plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : null,
          estimatedCost: validatedData.estimatedCost || null,
          notes: validatedData.notes || null,
          priority: validatedData.priority || 'normal',
          isActive: true,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          _count: {
            select: {
              productionSteps: true,
            },
          },
        },
      });

      return successResponse({
        order: {
          ...newOrder,
          quantity: Number(newOrder.quantity),
          estimatedCost: newOrder.estimatedCost ? Number(newOrder.estimatedCost) : null,
          actualCost: newOrder.actualCost ? Number(newOrder.actualCost) : null,
          plannedStartDate: newOrder.plannedStartDate?.toISOString() || null,
          plannedEndDate: newOrder.plannedEndDate?.toISOString() || null,
          actualStartDate: newOrder.actualStartDate?.toISOString() || null,
          actualEndDate: newOrder.actualEndDate?.toISOString() || null,
          createdAt: newOrder.createdAt.toISOString(),
          updatedAt: newOrder.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

