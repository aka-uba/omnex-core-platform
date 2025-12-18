import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { subscriptionCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
// GET /api/accounting/subscriptions - List subscriptions
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ subscriptions: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const customerId = searchParams.get('customerId') || undefined;
      const supplierId = searchParams.get('supplierId') || undefined;
      const assignedUserId = searchParams.get('assignedUserId') || undefined;
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
      const where: Prisma.SubscriptionWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(supplierId && { supplierId }),
        ...(assignedUserId && { assignedUserId }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.subscription.count({ where });

      // Get paginated subscriptions
      const subscriptions = await tenantPrisma.subscription.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              invoices: true,
              payments: true,
              expenses: true,
            },
          },
        },
      });

      return successResponse({
        subscriptions: subscriptions.map(subscription => ({
          ...subscription,
          basePrice: Number(subscription.basePrice),
          commissionRate: subscription.commissionRate ? Number(subscription.commissionRate) : null,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate?.toISOString() || null,
          renewalDate: subscription.renewalDate?.toISOString() || null,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST /api/accounting/subscriptions - Create subscription
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ subscription: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = subscriptionCreateSchema.parse(body);

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

      // Create subscription
      const newSubscription = await tenantPrisma.subscription.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          name: validatedData.name,
          type: validatedData.type,
          status: 'active',
          customerId: validatedData.customerId || null,
          supplierId: validatedData.supplierId || null,
          startDate: new Date(validatedData.startDate),
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          renewalDate: validatedData.renewalDate ? new Date(validatedData.renewalDate) : null,
          basePrice: validatedData.basePrice,
          currency: validatedData.currency || 'TRY',
          billingCycle: validatedData.billingCycle,
          commissionRate: validatedData.commissionRate || null,
          commissionType: validatedData.commissionType || null,
          assignedUserId: validatedData.assignedUserId || null,
          description: validatedData.description || null,
          terms: validatedData.terms || null,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              invoices: true,
              payments: true,
              expenses: true,
            },
          },
        },
      });

      return successResponse({
        subscription: {
          ...newSubscription,
          basePrice: Number(newSubscription.basePrice),
          commissionRate: newSubscription.commissionRate ? Number(newSubscription.commissionRate) : null,
          startDate: newSubscription.startDate.toISOString(),
          endDate: newSubscription.endDate?.toISOString() || null,
          renewalDate: newSubscription.renewalDate?.toISOString() || null,
          createdAt: newSubscription.createdAt.toISOString(),
          updatedAt: newSubscription.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

