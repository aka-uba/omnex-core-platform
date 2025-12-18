import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { agreementReportUpdateSchema } from '@/modules/real-estate/schemas/agreement-report.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/agreement-reports/[id] - Get single agreement report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get report with relations
      const report = await tenantPrisma.agreementReport.findUnique({
        where: { id },
        include: {
          apartment: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
              type: true,
              rentAmount: true,
              startDate: true,
              endDate: true,
            },
          },
          appointment: {
            select: {
              id: true,
              title: true,
              type: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      });

      if (!report) {
        return errorResponse('Report not found', 'Agreement report not found', 404);
      }

      // Check tenant access
      if (report.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      return successResponse({ report });
    }
  );
}

// PATCH /api/real-estate/agreement-reports/[id] - Update agreement report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get existing report
        const existing = await tenantPrisma.agreementReport.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Report not found', 'Agreement report not found', 404);
        }

        // Check tenant access
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Validate input
        const validatedData = agreementReportUpdateSchema.parse(body);

        // Update report
        const report = await tenantPrisma.agreementReport.update({
          where: { id },
          data: {
            ...(validatedData.type && { type: validatedData.type }),
            ...(validatedData.agreementStatus && { agreementStatus: validatedData.agreementStatus }),
            ...(validatedData.rentAmount !== undefined && {
              rentAmount: validatedData.rentAmount ? new Prisma.Decimal(validatedData.rentAmount) : null,
            }),
            ...(validatedData.deposit !== undefined && {
              deposit: validatedData.deposit ? new Prisma.Decimal(validatedData.deposit) : null,
            }),
            ...(validatedData.deliveryDate !== undefined && {
              deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
            }),
            ...(validatedData.contractDate !== undefined && {
              contractDate: validatedData.contractDate ? new Date(validatedData.contractDate) : null,
            }),
            ...(validatedData.specialTerms !== undefined && { specialTerms: validatedData.specialTerms || null }),
            ...(validatedData.nextSteps !== undefined && { nextSteps: validatedData.nextSteps || null }),
            ...(validatedData.recipients && { recipients: validatedData.recipients as any }),
            ...(validatedData.attachments !== undefined && { attachments: validatedData.attachments || [] }),
            ...(validatedData.status && { status: validatedData.status }),
          },
        });

        return successResponse({ report });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error updating agreement report:', error);
        return errorResponse(
          'Failed to update agreement report',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/agreement-reports/[id] - Delete agreement report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing report
      const existing = await tenantPrisma.agreementReport.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Report not found', 'Agreement report not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete report
      await tenantPrisma.agreementReport.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}








