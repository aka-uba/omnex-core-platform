import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { paymentCreateSchema } from '@/modules/real-estate/schemas/payment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/payments - List payments
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ payments: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const contractId = searchParams.get('contractId') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
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

      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.PaymentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(apartmentId && { apartmentId }),
        ...(contractId && { contractId }),
        ...(type && { type }),
        ...(status && { status }),
      };

      // Get total count
      const total = await tenantPrisma.payment.count({ where });

      // Get paginated payments
      const payments = await tenantPrisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { dueDate: 'desc' },
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
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      });

      return successResponse({
        payments: payments.map(payment => ({
          ...payment,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          dueDate: payment.dueDate.toISOString(),
          paidDate: payment.paidDate?.toISOString() || null,
          extraCharges: payment.extraCharges || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/payments - Create payment
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ payment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = paymentCreateSchema.parse(body);

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

      // Check if contract exists (if provided)
      if (validatedData.contractId) {
        const contract = await tenantPrisma.contract.findUnique({
          where: { id: validatedData.contractId },
        });

        if (!contract) {
          return errorResponse('Validation error', 'Contract not found', 404);
        }

        if (contract.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Contract belongs to different tenant', 403);
        }
      }

      // Calculate total amount
      const extraChargesTotal = validatedData.extraCharges
        ? validatedData.extraCharges.reduce((sum: number, charge: { amount: number }) => sum + (charge.amount || 0), 0)
        : 0;
      const totalAmount = validatedData.amount + extraChargesTotal;

      // Create payment
      const newPayment = await tenantPrisma.payment.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          apartmentId: validatedData.apartmentId,
          contractId: validatedData.contractId || null,
          type: validatedData.type,
          amount: validatedData.amount,
          currency: validatedData.currency || 'TRY',
          dueDate: validatedData.dueDate,
          paidDate: validatedData.paidDate || null,
          status: validatedData.status || 'pending',
          extraCharges: validatedData.extraCharges ? (validatedData.extraCharges as Prisma.InputJsonValue) : Prisma.JsonNull,
          totalAmount: totalAmount,
          paymentMethod: validatedData.paymentMethod || null,
          receiptNumber: validatedData.receiptNumber || null,
          notes: validatedData.notes || null,
          isAutoGenerated: validatedData.isAutoGenerated ?? false,
          reminderSent: validatedData.reminderSent ?? false,
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      });

      return successResponse({
        payment: {
          ...newPayment,
          createdAt: newPayment.createdAt.toISOString(),
          updatedAt: newPayment.updatedAt.toISOString(),
          dueDate: newPayment.dueDate.toISOString(),
          paidDate: newPayment.paidDate?.toISOString() || null,
          extraCharges: newPayment.extraCharges || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

