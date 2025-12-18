// License Service API Route - Admin
// GET /api/admin/tenant-licenses/[id] - Get tenant license
// PATCH /api/admin/tenant-licenses/[id] - Update tenant license
// DELETE /api/admin/tenant-licenses/[id] - Delete tenant license

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { tenantLicenseUpdateSchema } from '@/modules/license/schemas/license.schema';

// GET /api/admin/tenant-licenses/[id] - Get tenant license
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ license: unknown }>>(
    async () => {
      const { id } = await params;
      const license = await corePrisma.tenantLicense.findUnique({
        where: { id },
        include: {
          package: true,
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!license) {
        return errorResponse('Not Found', 'Tenant license not found', 404);
      }

      return successResponse({
        license: {
          ...license,
          startDate: license.startDate.toISOString(),
          endDate: license.endDate.toISOString(),
          renewalDate: license.renewalDate?.toISOString(),
          lastPaymentDate: license.lastPaymentDate?.toISOString(),
          nextPaymentDate: license.nextPaymentDate?.toISOString(),
          createdAt: license.createdAt.toISOString(),
          updatedAt: license.updatedAt.toISOString(),
          package: {
            ...license.package,
            basePrice: license.package.basePrice.toNumber(),
            createdAt: license.package.createdAt.toISOString(),
            updatedAt: license.package.updatedAt.toISOString(),
          },
          payments: license.payments.map(payment => ({
            ...payment,
            amount: payment.amount.toNumber(),
            approvedAt: payment.approvedAt?.toISOString(),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
          })),
        },
      });
    },
    'license'
  );
}

// PATCH /api/admin/tenant-licenses/[id] - Update tenant license
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ license: unknown }>>(
    async () => {
      const { id } = await params;
      const body = await request.json();
      
      // Validate input
      const validatedData = tenantLicenseUpdateSchema.parse(body);

      // Check if license exists
      const existing = await corePrisma.tenantLicense.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Not Found', 'Tenant license not found', 404);
      }

      // Update license
      const license = await corePrisma.tenantLicense.update({
        where: { id },
        data: {
          ...(validatedData.startDate !== undefined && { startDate: new Date(validatedData.startDate) }),
          ...(validatedData.endDate !== undefined && { endDate: new Date(validatedData.endDate) }),
          ...(validatedData.renewalDate !== undefined && { renewalDate: validatedData.renewalDate ? new Date(validatedData.renewalDate) : null }),
          ...(validatedData.status !== undefined && { status: validatedData.status }),
          ...(validatedData.paymentStatus !== undefined && { paymentStatus: validatedData.paymentStatus }),
          ...(validatedData.lastPaymentDate !== undefined && { lastPaymentDate: validatedData.lastPaymentDate ? new Date(validatedData.lastPaymentDate) : null }),
          ...(validatedData.nextPaymentDate !== undefined && { nextPaymentDate: validatedData.nextPaymentDate ? new Date(validatedData.nextPaymentDate) : null }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        },
        include: {
          package: true,
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        license: {
          ...license,
          startDate: license.startDate.toISOString(),
          endDate: license.endDate.toISOString(),
          renewalDate: license.renewalDate?.toISOString(),
          lastPaymentDate: license.lastPaymentDate?.toISOString(),
          nextPaymentDate: license.nextPaymentDate?.toISOString(),
          createdAt: license.createdAt.toISOString(),
          updatedAt: license.updatedAt.toISOString(),
          package: {
            ...license.package,
            basePrice: license.package.basePrice.toNumber(),
            createdAt: license.package.createdAt.toISOString(),
            updatedAt: license.package.updatedAt.toISOString(),
          },
        },
      });
    },
    'license'
  );
}

// DELETE /api/admin/tenant-licenses/[id] - Delete tenant license
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ success: boolean }>>(
    async () => {
      const { id } = await params;
      // Check if license exists
      const existing = await corePrisma.tenantLicense.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Not Found', 'Tenant license not found', 404);
      }

      // Delete license (payments will be cascade deleted)
      await corePrisma.tenantLicense.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    'license'
  );
}

