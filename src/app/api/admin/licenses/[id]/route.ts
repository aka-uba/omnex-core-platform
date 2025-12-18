// License Service API Route - Admin
// GET /api/admin/licenses/[id] - Get license package
// PATCH /api/admin/licenses/[id] - Update license package
// DELETE /api/admin/licenses/[id] - Delete license package

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { licensePackageUpdateSchema } from '@/modules/license/schemas/license.schema';

// GET /api/admin/licenses/[id] - Get license package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ package: unknown }>>(
    async () => {
      const { id } = await params;
      const pkg = await corePrisma.licensePackage.findUnique({
        where: { id },
        include: {
          subscriptions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              tenant: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!pkg) {
        return errorResponse('Not Found', 'License package not found', 404);
      }

      return successResponse({
        package: {
          ...pkg,
          basePrice: pkg.basePrice.toNumber(),
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
          subscriptions: pkg.subscriptions.map(sub => ({
            ...sub,
            startDate: sub.startDate.toISOString(),
            endDate: sub.endDate.toISOString(),
            renewalDate: sub.renewalDate?.toISOString(),
            lastPaymentDate: sub.lastPaymentDate?.toISOString(),
            nextPaymentDate: sub.nextPaymentDate?.toISOString(),
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
          })),
        },
      });
    },
    'license'
  );
}

// PATCH /api/admin/licenses/[id] - Update license package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ package: unknown }>>(
    async () => {
      const { id } = await params;
      const body = await request.json();
      
      // Validate input
      const validatedData = licensePackageUpdateSchema.parse(body);

      // Check if package exists
      const existing = await corePrisma.licensePackage.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Not Found', 'License package not found', 404);
      }

      // Update package
      const pkg = await corePrisma.licensePackage.update({
        where: { id },
        data: {
          ...(validatedData.name !== undefined && { name: validatedData.name }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.modules !== undefined && { modules: validatedData.modules }),
          ...(validatedData.basePrice !== undefined && { basePrice: validatedData.basePrice }),
          ...(validatedData.currency !== undefined && { currency: validatedData.currency }),
          ...(validatedData.billingCycle !== undefined && { billingCycle: validatedData.billingCycle }),
          ...(validatedData.maxUsers !== undefined && { maxUsers: validatedData.maxUsers }),
          ...(validatedData.maxStorage !== undefined && { maxStorage: validatedData.maxStorage }),
          ...(validatedData.features !== undefined && { features: validatedData.features ? (validatedData.features as any) : null }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      });

      return successResponse({
        package: {
          ...pkg,
          basePrice: pkg.basePrice.toNumber(),
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}

// DELETE /api/admin/licenses/[id] - Delete license package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ success: boolean }>>(
    async () => {
      const { id } = await params;
      // Check if package exists
      const existing = await corePrisma.licensePackage.findUnique({
        where: { id },
        include: {
          subscriptions: {
            take: 1,
          },
        },
      });

      if (!existing) {
        return errorResponse('Not Found', 'License package not found', 404);
      }

      // Check if package has active subscriptions
      if (existing.subscriptions.length > 0) {
        return errorResponse(
          'Bad Request',
          'Cannot delete package with active subscriptions',
          400
        );
      }

      // Delete package
      await corePrisma.licensePackage.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    'license'
  );
}

