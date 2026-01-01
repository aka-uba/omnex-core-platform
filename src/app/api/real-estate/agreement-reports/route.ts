import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { agreementReportCreateSchema } from '@/modules/real-estate/schemas/agreement-report.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/agreement-reports - List agreement reports
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ reports: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const agreementStatus = searchParams.get('agreementStatus') || undefined;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const contractId = searchParams.get('contractId') || undefined;
      const appointmentId = searchParams.get('appointmentId') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context (withTenant already ensures tenant exists)
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        // This should not happen if withTenant is working correctly
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
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.AgreementReportWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(agreementStatus && { agreementStatus }),
        ...(apartmentId && { apartmentId }),
        ...(contractId && { contractId }),
        ...(appointmentId && { appointmentId }),
        ...(search && {
          OR: [
            { specialTerms: { contains: search, mode: 'insensitive' } },
            { nextSteps: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.agreementReport.count({ where });

      // Get reports with relations
      const reports = await tenantPrisma.agreementReport.findMany({
        where,
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
            },
          },
          appointment: {
            select: {
              id: true,
              title: true,
              type: true,
              startDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        reports,
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/agreement-reports - Create agreement report
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();

        // Validate input
        const validatedData = agreementReportCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId') || undefined;
        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id;
        }

        if (!companyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Create report
        const report = await tenantPrisma.agreementReport.create({
          data: {
            tenantId: tenantContext.id,
            companyId,
            appointmentId: validatedData.appointmentId || null,
            type: validatedData.type,
            apartmentId: validatedData.apartmentId,
            contractId: validatedData.contractId || null,
            agreementStatus: validatedData.agreementStatus,
            rentAmount: validatedData.rentAmount ? new Prisma.Decimal(validatedData.rentAmount) : null,
            deposit: validatedData.deposit ? new Prisma.Decimal(validatedData.deposit) : null,
            deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
            contractDate: validatedData.contractDate ? new Date(validatedData.contractDate) : null,
            specialTerms: validatedData.specialTerms || null,
            nextSteps: validatedData.nextSteps || null,
            recipients: validatedData.recipients as any,
            attachments: validatedData.attachments || [],
            status: 'draft',
          },
        });

        // Log audit event
        const auditContext = await getAuditContext(request);
        logCreate(tenantContext, auditContext, 'AgreementReport', report.id, companyId, {
          type: report.type,
          agreementStatus: report.agreementStatus,
        });

        return successResponse({ report });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error creating agreement report:', error);
        return errorResponse(
          'Failed to create agreement report',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    },
    { required: true, module: 'real-estate' }
  );
}

