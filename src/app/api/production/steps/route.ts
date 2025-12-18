import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productionStepSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/production/steps - List production steps by orderId
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ steps: unknown[]; total: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const orderId = searchParams.get('orderId');
      const status = searchParams.get('status');

      if (!orderId) {
        return errorResponse('Invalid request', 'orderId is required', 400);
      }

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Build where clause
      const where: Prisma.ProductionStepWhereInput = {
        tenantId: tenantContext.id,
        orderId,
      };

      if (status) {
        where.status = status;
      }

      // Get production steps
      const steps = await tenantPrisma.productionStep.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: {
          stepNumber: 'asc',
        },
      });

      return successResponse({
        steps: steps.map((step) => ({
          ...step,
          laborHours: step.laborHours ? Number(step.laborHours) : null,
          plannedStart: step.plannedStart?.toISOString() || null,
          plannedEnd: step.plannedEnd?.toISOString() || null,
          actualStart: step.actualStart?.toISOString() || null,
          actualEnd: step.actualEnd?.toISOString() || null,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        })),
        total: steps.length,
      });
    },
    { required: true, module: 'production' }
  );
}

// POST /api/production/steps - Create production step
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ step: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = productionStepSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Verify order exists
      const order = await tenantPrisma.productionOrder.findFirst({
        where: {
          id: validatedData.orderId,
          tenantId: tenantContext.id,
        },
      });

      if (!order) {
        return errorResponse('Not found', 'Production order not found', 404);
      }

      // Get companyId
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company ID required', 'Company ID is required', 400);
      }

      // Create production step
      const stepData: any = {
        tenantId: tenantContext.id,
        companyId,
        orderId: validatedData.orderId,
        stepNumber: validatedData.stepNumber,
        name: validatedData.name,
        status: validatedData.status || 'pending',
      };
      
      if (validatedData.description !== undefined && validatedData.description !== null) {
        stepData.description = validatedData.description;
      }
      if (validatedData.plannedStart !== undefined && validatedData.plannedStart !== null) {
        stepData.plannedStart = new Date(validatedData.plannedStart);
      }
      if (validatedData.plannedEnd !== undefined && validatedData.plannedEnd !== null) {
        stepData.plannedEnd = new Date(validatedData.plannedEnd);
      }
      if (validatedData.assignedTo !== undefined && validatedData.assignedTo !== null) {
        stepData.assignedTo = validatedData.assignedTo;
      }
      if (validatedData.laborHours !== undefined && validatedData.laborHours !== null) {
        stepData.laborHours = validatedData.laborHours;
      }
      if (validatedData.notes !== undefined && validatedData.notes !== null) {
        stepData.notes = validatedData.notes;
      }
      if (validatedData.actualStart !== undefined && validatedData.actualStart !== null) {
        stepData.actualStart = new Date(validatedData.actualStart);
      }
      if (validatedData.actualEnd !== undefined && validatedData.actualEnd !== null) {
        stepData.actualEnd = new Date(validatedData.actualEnd);
      }
      
      const step = await tenantPrisma.productionStep.create({
        data: stepData,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      return successResponse({
        step: {
          ...step,
          laborHours: step.laborHours ? Number(step.laborHours) : null,
          plannedStart: step.plannedStart?.toISOString() || null,
          plannedEnd: step.plannedEnd?.toISOString() || null,
          actualStart: step.actualStart?.toISOString() || null,
          actualEnd: step.actualEnd?.toISOString() || null,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}








