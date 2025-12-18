import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { contractCreateSchema } from '@/modules/real-estate/schemas/contract.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/contracts - List contracts
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ contracts: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const tenantRecordId = searchParams.get('tenantRecordId') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
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
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.ContractWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { contractNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(apartmentId && { apartmentId }),
        ...(tenantRecordId && { tenantRecordId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.contract.count({ where });

      // Get paginated contracts
      const contracts = await tenantPrisma.contract.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          tenantRecord: {
            select: {
              id: true,
              tenantNumber: true,
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      return successResponse({
        contracts: contracts.map(contract => ({
          ...contract,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate?.toISOString() || null,
          renewalDate: contract.renewalDate?.toISOString() || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/contracts - Create contract
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ contract: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = contractCreateSchema.parse(body);

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

      // Check if apartment exists
      const apartment = await tenantPrisma.apartment.findUnique({
        where: { id: validatedData.apartmentId },
      });

      if (!apartment) {
        return errorResponse('Validation error', 'Apartment not found', 404);
      }

      // Ensure apartment belongs to tenant
      if (apartment.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Apartment belongs to different tenant', 403);
      }

      // Check if tenant record exists
      const tenantRecord = await tenantPrisma.tenant.findUnique({
        where: { id: validatedData.tenantRecordId },
      });

      if (!tenantRecord) {
        return errorResponse('Validation error', 'Tenant record not found', 404);
      }

      // Ensure tenant record belongs to tenant
      if (tenantRecord.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Tenant record belongs to different tenant', 403);
      }

      // Check if contract number is unique
      const existingContract = await tenantPrisma.contract.findFirst({
        where: {
          tenantId: tenantContext.id,
          contractNumber: validatedData.contractNumber,
        },
      });

      if (existingContract) {
        return errorResponse('Validation error', 'Contract number already exists', 409);
      }

      // Check if template exists (if provided)
      if (validatedData.templateId) {
        const template = await tenantPrisma.contractTemplate.findFirst({
          where: {
            id: validatedData.templateId,
            tenantId: tenantContext.id,
          },
        });

        if (!template) {
          return errorResponse('Validation error', 'Contract template not found', 404);
        }
      }

      // Create contract
      const newContract = await tenantPrisma.contract.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          apartmentId: validatedData.apartmentId,
          tenantRecordId: validatedData.tenantRecordId,
          templateId: validatedData.templateId || null,
          contractNumber: validatedData.contractNumber,
          type: validatedData.type,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate || null,
          renewalDate: validatedData.renewalDate || null,
          rentAmount: validatedData.rentAmount,
          deposit: validatedData.deposit || null,
          currency: validatedData.currency || 'TRY',
          paymentType: validatedData.paymentType || null,
          paymentDay: validatedData.paymentDay || null,
          autoRenewal: validatedData.autoRenewal ?? false,
          renewalNoticeDays: validatedData.renewalNoticeDays || 30,
          increaseRate: validatedData.increaseRate || null,
          status: validatedData.status || 'active',
          documents: validatedData.documents || [],
          terms: validatedData.terms || null,
          notes: validatedData.notes || null,
          isActive: true,
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
          tenantRecord: {
            select: {
              id: true,
              tenantNumber: true,
            },
          },
        },
      });

      return successResponse({
        contract: {
          ...newContract,
          createdAt: newContract.createdAt.toISOString(),
          updatedAt: newContract.updatedAt.toISOString(),
          startDate: newContract.startDate.toISOString(),
          endDate: newContract.endDate?.toISOString() || null,
          renewalDate: newContract.renewalDate?.toISOString() || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

